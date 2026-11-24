"""Canal real de envio dos relatórios pedagógicos (API HTTPS Resend/Brevo, SMTP c/ HTML, Webhook seguro ou Caixa de saída)."""
from collections import deque
from datetime import datetime, timezone
from email.message import EmailMessage
import html
import ipaddress
import logging
import smtplib
import socket
from urllib.parse import urlparse
import httpx
from pydantic import EmailStr, TypeAdapter, ValidationError
from app.core.config import settings

logger = logging.getLogger("cantinho.delivery")

# Histórico limitado em memória das entregas processadas (evita vazamento de RAM em processos longos)
_delivery_outbox: deque[dict] = deque(maxlen=100)
_EMAIL_ADAPTER = TypeAdapter(EmailStr)
_BLOCKED_HOSTS = {"localhost", "localhost.localdomain", "metadata.google.internal"}


def get_outbox() -> list[dict]:
    return list(_delivery_outbox)


def clear_outbox() -> None:
    _delivery_outbox.clear()


def _validate_email_recipient(raw_email: str) -> str:
    clean = (raw_email or "").strip()
    if not clean or "\r" in clean or "\n" in clean:
        raise ValueError("E-mail de destino inválido para envio do relatório.")
    try:
        return str(_EMAIL_ADAPTER.validate_python(clean))
    except ValidationError as exc:
        raise ValueError("E-mail de destino inválido para envio do relatório.") from exc


def _is_forbidden_ip(ip_text: str) -> bool:
    ip_obj = ipaddress.ip_address(ip_text)
    return (
        ip_obj.is_private
        or ip_obj.is_loopback
        or ip_obj.is_link_local
        or ip_obj.is_multicast
        or ip_obj.is_reserved
        or ip_obj.is_unspecified
    )


def validate_safe_webhook_url(raw_url: str) -> str:
    """Valida a URL do webhook contra SSRF (bloqueia IPs internos, loopback, link-local e metadados cloud)."""
    clean = (raw_url or "").strip()
    parsed = urlparse(clean)
    allowed_schemes = {"https"} if settings.is_production else {"https", "http"}
    if parsed.scheme.lower() not in allowed_schemes or not parsed.hostname:
        raise ValueError("URL de webhook inválida ou protocolo não permitido.")

    host = parsed.hostname.strip().lower()
    if host in _BLOCKED_HOSTS or host.endswith(".internal") or host.endswith(".local"):
        raise ValueError("Host de webhook bloqueado por política de segurança.")

    try:
        if _is_forbidden_ip(host):
            raise ValueError("Endereço IP de webhook bloqueado por política de segurança.")
    except ValueError as exc:
        if "bloqueado" in str(exc):
            raise
        try:
            infos = socket.getaddrinfo(host, parsed.port or (443 if parsed.scheme == "https" else 80), proto=socket.IPPROTO_TCP)
        except socket.gaierror as dns_exc:
            raise ValueError("Não foi possível resolver o domínio do webhook configurado.") from dns_exc
        for info in infos:
            resolved_ip = info[4][0]
            if _is_forbidden_ip(resolved_ip):
                raise ValueError("Destino do webhook aponta para rede privada ou reservada.")

    return clean


def _build_html_email(report: dict, subject: str) -> str:
    escaped_title = html.escape(subject)
    escaped_body = html.escape(report["text"])
    return f"""<!doctype html>
<html lang="pt-BR">
<body style="margin:0;padding:24px;background:#F4F7FB;font-family:system-ui,-apple-system,sans-serif;color:#1E293B;">
  <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #D5E0EE;border-radius:16px;padding:24px;">
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#1D5DC4;">
      Cantinho das Cores · Acompanhamento Pedagógico
    </p>
    <h1 style="margin:0 0 16px;font-size:20px;color:#2B3A67;">{escaped_title}</h1>
    <pre style="margin:0;padding:16px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;white-space:pre-wrap;font-family:inherit;font-size:14px;line-height:1.6;">{escaped_body}</pre>
    <p style="margin:16px 0 0;font-size:12px;color:#64748B;">
      Mensagem gerada automaticamente pela plataforma educativa Cantinho das Cores.
    </p>
  </div>
</body>
</html>"""


def _send_via_smtp(recipient_email: str, subject: str, text_body: str, html_body: str) -> None:
    if "\r" in subject or "\n" in subject:
        raise ValueError("Assunto de e-mail inválido.")
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


def _extract_provider_error(response: httpx.Response, provider_name: str) -> str:
    try:
        data = response.json()
        msg = data.get("message") or data.get("error") or ""
    except Exception:
        msg = response.text or ""
    msg_lower = str(msg).lower()
    if response.status_code == 403 and ("verify a domain" in msg_lower or "testing emails" in msg_lower or "own email" in msg_lower):
        return (
            "No plano sem domínio verificado do Resend (onboarding@resend.dev), só é permitido enviar "
            "para o próprio e-mail dono da conta Resend. Verifique seu domínio no Resend ou use Brevo."
        )
    if response.status_code in {401, 403}:
        return f"Chave de API inválida ou sem permissão no provedor {provider_name} (HTTP {response.status_code})."
    return f"Provedor {provider_name} recusou o envio (HTTP {response.status_code}): {str(msg)[:180]}"


def _send_via_resend(recipient_email: str, subject: str, text_body: str, html_body: str, api_key: str | None = None) -> None:
    key = (api_key or settings.resend_api_key).strip()
    sender = (settings.resend_from or settings.smtp_from or "Cantinho das Cores <onboarding@resend.dev>").strip()
    response = httpx.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {key}"},
        json={
            "from": sender,
            "to": [recipient_email],
            "subject": subject,
            "text": text_body,
            "html": html_body,
        },
        timeout=15,
    )
    if response.status_code >= 400:
        raise ValueError(_extract_provider_error(response, "Resend"))


def _send_via_brevo(recipient_email: str, subject: str, text_body: str, html_body: str) -> None:
    sender_email = (settings.smtp_from or "no-reply@cantinhodascores.com.br").strip()
    response = httpx.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={"api-key": settings.brevo_api_key.strip(), "accept": "application/json"},
        json={
            "sender": {"name": settings.brevo_from_name or "Cantinho das Cores", "email": sender_email},
            "to": [{"email": recipient_email}],
            "subject": subject,
            "textContent": text_body,
            "htmlContent": html_body,
        },
        timeout=15,
    )
    if response.status_code >= 400:
        raise ValueError(_extract_provider_error(response, "Brevo"))


def _send_via_webhook(url: str, payload: dict) -> None:
    safe_url = validate_safe_webhook_url(url)
    response = httpx.post(safe_url, json=payload, timeout=15, follow_redirects=False)
    response.raise_for_status()


def _detect_resend_key_from_smtp() -> str:
    """Se o servidor estiver configurado com SMTP do Resend (bloqueado no Render Free na porta 587),
    reaproveita automaticamente a chave re_... de SMTP_PASSWORD para enviar via HTTPS API (porta 443)."""
    if settings.resend_api_key.strip():
        return settings.resend_api_key.strip()
    host = (settings.smtp_host or "").strip().lower()
    pwd = (settings.smtp_password or "").strip()
    if ("resend.com" in host or (settings.smtp_user or "").strip().lower() == "resend") and pwd.startswith("re_"):
        return pwd
    return ""


def deliver_report(
    report: dict,
    *,
    owner_email: str,
    channel: str | None = None,
    recipient: str | None = None,
) -> dict:
    """Envia o relatório pelo canal configurado ou solicitado:
    - `email` / `smtp` / `resend` / `brevo`: envia via Resend HTTPS, Brevo HTTPS ou SMTP (multipart texto + HTML).
    - `webhook`: envia POST JSON exclusivamente para `settings.report_webhook_url` validado contra SSRF.
    - `console`: registra na caixa de saída auditável e no log estruturado (bloqueado em produção).
    """
    mode = (channel or settings.report_delivery_mode or "console").strip().lower()
    raw_target = (recipient or owner_email or "").strip()
    subject = f"Relatório Pedagógico — {report['child_name']} ({report['period_start']} a {report['period_end']})"
    now_iso = datetime.now(timezone.utc).isoformat()
    html_body = _build_html_email(report, subject)

    envelope = {
        "report_id": report["id"],
        "child_id": report["child_id"],
        "child_name": report["child_name"],
        "recipient": raw_target,
        "channel": mode,
        "subject": subject,
        "text": report["text"],
        "delivered_at": now_iso,
    }

    if mode in {"email", "smtp", "resend", "brevo"}:
        target_email = _validate_email_recipient(raw_target)
        envelope["recipient"] = target_email
        auto_resend_key = _detect_resend_key_from_smtp()

        if mode == "resend" or (mode in {"email", "smtp"} and auto_resend_key):
            if not auto_resend_key:
                raise ValueError("RESEND_API_KEY não configurada no servidor.")
            _send_via_resend(target_email, subject, report["text"], html_body, api_key=auto_resend_key)
            envelope["provider"] = "resend"
        elif mode == "brevo" or (mode == "email" and settings.brevo_api_key.strip()):
            if not settings.brevo_api_key.strip():
                raise ValueError("BREVO_API_KEY não configurada no servidor.")
            _send_via_brevo(target_email, subject, report["text"], html_body)
            envelope["provider"] = "brevo"
        elif settings.smtp_host.strip():
            _send_via_smtp(target_email, subject, report["text"], html_body)
            envelope["provider"] = "smtp"
        elif settings.is_production:
            raise ValueError(
                "Envio por e-mail não configurado em produção: defina RESEND_API_KEY, BREVO_API_KEY ou SMTP_HOST no servidor."
            )
        else:
            logger.info("Relatório #%s registrado na caixa de saída local (dev) para %s", report["id"], target_email)
            envelope["provider"] = "outbox"
    elif mode == "webhook":
        if recipient and recipient.strip().startswith(("http://", "https://")):
            raise ValueError("Por segurança, URLs de webhook não podem ser informadas pelo cliente; configure REPORT_WEBHOOK_URL no servidor.")
        webhook_url = (settings.report_webhook_url or "").strip()
        if not webhook_url:
            raise ValueError("URL de webhook não configurada para envio do relatório.")
        _send_via_webhook(webhook_url, envelope)
        envelope["recipient"] = webhook_url
        envelope["provider"] = "webhook"
    elif mode == "console":
        if settings.is_production:
            raise ValueError("Canal 'console' não é permitido em produção. Configure Resend, Brevo, SMTP ou Webhook.")
        if raw_target:
            envelope["recipient"] = _validate_email_recipient(raw_target)
        logger.info("Relatório #%s enviado para %s via canal %s", report["id"], envelope["recipient"], mode)
        envelope["provider"] = "outbox"
    else:
        raise ValueError(f"Canal de envio não suportado: {mode}")

    _delivery_outbox.append(envelope)
    return envelope
