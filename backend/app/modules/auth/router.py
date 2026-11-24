from email.message import EmailMessage
import html
import logging
import smtplib
from uuid import uuid4
import sqlite3
from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response, status
from app.core.config import settings
from app.modules.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    DeleteAccountRequest,
    TokenResponse,
    UserPublic,
    MessageResponse,
)
from app.modules.auth.repository import repository, UserRecord
from app.modules.auth.security import (
    hash_password,
    verify_password,
    verify_dummy_password,
    create_access_token,
    revoke_token_jti,
    check_rate_limit,
    check_custom_rate_limit,
    consume_rate_limit,
    record_failed_attempt,
    reset_failed_attempts,
)
from app.modules.auth.dependencies import get_current_claims
from app.modules.reports.delivery import (
    _detect_resend_key_from_smtp,
    _send_via_brevo,
    _send_via_resend,
)

logger = logging.getLogger("cantinho.auth")
router = APIRouter(prefix="/api/auth", tags=["Autenticação"])


def _client_ip(request: Request) -> str:
    return request.client.host if request.client and request.client.host else "local"


def _send_reset_code_email(recipient_email: str, code: str) -> None:
    subject = "Código de recuperação de senha — Cantinho das Cores"
    text_body = (
        f"Olá!\n\n"
        f"Seu código para redefinir a senha no Cantinho das Cores é: {code}\n"
        f"Este código expira em 15 minutos e vale para um único uso.\n\n"
        f"Se você não solicitou esta alteração, ignore esta mensagem."
    )
    html_body = (
        f"<!doctype html><html lang='pt-BR'><body style='font-family:system-ui,sans-serif;color:#1E293B;padding:24px;'>"
        f"<div style='max-width:480px;margin:0 auto;border:1px solid #D5E0EE;border-radius:16px;padding:24px;'>"
        f"<h2 style='margin:0 0 12px;color:#2B3A67;'>Recuperação de senha</h2>"
        f"<p>Seu código de verificação no <strong>Cantinho das Cores</strong> é:</p>"
        f"<p style='font-size:28px;font-weight:800;letter-spacing:0.18em;color:#1D5DC4;margin:16px 0;'>{html.escape(code)}</p>"
        f"<p style='font-size:13px;color:#64748B;'>Válido por 15 minutos para um único uso.</p>"
        f"</div></body></html>"
    )
    resend_key = _detect_resend_key_from_smtp()
    if resend_key:
        _send_via_resend(recipient_email, subject, text_body, html_body, api_key=resend_key)
    elif settings.brevo_api_key.strip():
        _send_via_brevo(recipient_email, subject, text_body, html_body)
    elif settings.smtp_host.strip():
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = settings.smtp_from or "no-reply@cantinhodascores.com.br"
        msg["To"] = recipient_email
        msg.set_content(text_body)
        msg.add_alternative(html_body, subtype="html")
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            if settings.smtp_use_tls:
                server.starttls()
            if settings.smtp_user and settings.smtp_password:
                server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
    else:
        logger.info("Código de recuperação gerado (modo dev/log) para %s", recipient_email)


def public_user(user: UserRecord) -> UserPublic:
    return UserPublic(id=user.id, name=user.name, email=user.email or None, role=user.role, is_guest=user.is_guest)


def token_response(user: UserRecord) -> TokenResponse:
    token, expires = create_access_token(subject=user.id, role=user.role, is_guest=user.is_guest)
    return TokenResponse(access_token=token, expires_in=expires, user=public_user(user))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, request: Request):
    if not payload.accepted_terms:
        raise HTTPException(status_code=422, detail="É necessário aceitar os termos para criar a conta")

    ip_key = f"register:{_client_ip(request)}"
    blocked, retry_after = consume_rate_limit(
        ip_key,
        max_attempts=settings.register_rate_limit_max_attempts,
        window_seconds=settings.register_rate_limit_window_seconds,
    )
    if blocked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Muitas tentativas de cadastro. Aguarde {retry_after}s antes de tentar novamente.",
            headers={"Retry-After": str(retry_after)},
        )

    email = str(payload.email).lower().strip()
    record = UserRecord(id="", name=payload.name.strip(), email=email, password_hash=hash_password(payload.password))
    try:
        repository.add(record, accepted_terms=payload.accepted_terms)
    except sqlite3.IntegrityError as exc:
        if "UNIQUE" in str(exc).upper():
            raise HTTPException(status_code=409, detail="Este e-mail já está cadastrado")
        raise HTTPException(status_code=422, detail="Não foi possível salvar o cadastro. Verifique os dados informados.")
    return token_response(record)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request):
    email = str(payload.email).lower().strip()
    client_host = _client_ip(request)
    rate_key = f"{client_host}:{email}"
    account_key = f"acct:{email}"
    account_max = max(8, settings.auth_rate_limit_max_attempts * 2)

    blocked_ip, retry_ip = check_rate_limit(rate_key)
    blocked_acct, retry_acct = check_custom_rate_limit(
        account_key,
        max_attempts=account_max,
        window_seconds=settings.auth_rate_limit_window_seconds,
    )
    if blocked_ip or blocked_acct:
        retry_after = max(retry_ip, retry_acct)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Muitas tentativas de login. Aguarde {retry_after}s antes de tentar novamente.",
            headers={"Retry-After": str(retry_after)},
        )

    user = repository.get_by_email(email)
    if user is None:
        verify_dummy_password(payload.password)
        record_failed_attempt(rate_key)
        record_failed_attempt(account_key)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha inválidos")

    if not verify_password(payload.password, user.password_hash):
        record_failed_attempt(rate_key)
        record_failed_attempt(account_key)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha inválidos")

    reset_failed_attempts(rate_key)
    reset_failed_attempts(account_key)
    return token_response(user)


@router.post("/guest", response_model=TokenResponse)
def guest_login(request: Request):
    guest_key = f"guest:{_client_ip(request)}"
    blocked, retry_after = consume_rate_limit(
        guest_key,
        max_attempts=settings.guest_rate_limit_max_attempts,
        window_seconds=settings.guest_rate_limit_window_seconds,
    )
    if blocked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Muitas sessões de visitante criadas em sequência. Aguarde {retry_after}s.",
            headers={"Retry-After": str(retry_after)},
        )
    visitor = UserRecord(id=f"guest-{uuid4()}", name="Visitante", email="", password_hash="", role="guest", is_guest=True)
    return token_response(visitor)


@router.get("/me", response_model=UserPublic)
def me(claims: dict = Depends(get_current_claims)):
    if claims.get("guest"):
        return UserPublic(id=claims["sub"], name="Visitante", email=None, role="guest", is_guest=True)
    user = repository.get_by_id(claims.get("sub", ""))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado ou sessão inválida")
    return public_user(user)


@router.post("/change-password", response_model=MessageResponse)
def change_password(payload: ChangePasswordRequest, claims: dict = Depends(get_current_claims)):
    if claims.get("guest") or claims.get("role") != "responsible":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas responsáveis cadastrados podem alterar a senha")
    user = repository.get_by_id(claims.get("sub", ""))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado ou sessão inválida")
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A senha atual está incorreta.")
    repository.update_password(user.id, hash_password(payload.new_password))
    return MessageResponse(message="Senha atualizada com sucesso.")


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, request: Request):
    """Solicita código de recuperação sem revelar se o e-mail existe ou não."""
    forgot_key = f"forgot:{_client_ip(request)}"
    blocked, retry_after = consume_rate_limit(forgot_key, max_attempts=5, window_seconds=300)
    if blocked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Muitas solicitações de recuperação. Aguarde {retry_after}s.",
            headers={"Retry-After": str(retry_after)},
        )
    email = str(payload.email).lower().strip()
    user = repository.get_by_email(email)
    if user is not None:
        code = repository.create_password_reset_code(user.id, email)
        try:
            _send_reset_code_email(email, code)
        except Exception as exc:
            logger.warning("Falha ao enviar e-mail de recuperação: %s", type(exc).__name__)
    return MessageResponse(
        message="Se este e-mail estiver cadastrado, enviamos um código de 6 dígitos válido por 15 minutos."
    )


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, request: Request):
    email = str(payload.email).lower().strip()
    client_host = _client_ip(request)
    rate_key = f"reset:{client_host}:{email}"

    blocked, retry_after = check_rate_limit(rate_key)
    if blocked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Muitas tentativas inválidas. Aguarde {retry_after}s.",
            headers={"Retry-After": str(retry_after)},
        )

    user_id = repository.consume_password_reset_code(email, payload.code)
    if user_id is None:
        record_failed_attempt(rate_key)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Código inválido ou expirado.")

    reset_failed_attempts(rate_key)
    repository.update_password(user_id, hash_password(payload.new_password))
    return MessageResponse(message="Senha redefinida com sucesso. Você já pode entrar.")


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_account(
    payload: DeleteAccountRequest = Body(...),
    claims: dict = Depends(get_current_claims),
):
    """Exclui a própria conta e todos os dados vinculados em cascata (Direito à Eliminação — LGPD Art. 18, VI)."""
    if claims.get("guest") or claims.get("role") != "responsible":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas contas cadastradas podem ser excluídas")
    user = repository.get_by_id(claims.get("sub", ""))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado ou sessão inválida")
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Senha incorreta. A conta não foi excluída.")
    revoke_token_jti(claims.get("jti"), claims.get("exp"))
    repository.delete_by_id(user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(claims: dict = Depends(get_current_claims)):
    """Renova a sessão atual emitindo um novo JWT e revogando o token anterior."""
    revoke_token_jti(claims.get("jti"), claims.get("exp"))
    if claims.get("guest"):
        visitor = UserRecord(id=claims["sub"], name="Visitante", email="", password_hash="", role="guest", is_guest=True)
        return token_response(visitor)
    user = repository.get_by_id(claims.get("sub", ""))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado ou sessão inválida")
    return token_response(user)


@router.post("/logout", response_model=MessageResponse)
def logout(claims: dict = Depends(get_current_claims)):
    revoke_token_jti(claims.get("jti"), claims.get("exp"))
    return MessageResponse(message="Sessão encerrada e token revogado com sucesso.")
