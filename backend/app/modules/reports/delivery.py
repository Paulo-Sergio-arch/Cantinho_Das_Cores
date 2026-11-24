"""Canal real de envio dos relatórios pedagógicos (SMTP / E-mail, Webhook HTTP seguro ou Caixa de saída auditável)."""
from collections import deque
from datetime import datetime, timezone
from email.message import EmailMessage
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
        # Hostname simbólico: resolve DNS e garante que nenhum IP aponte para rede interna
        try:
            infos = socket.getaddrinfo(host, parsed.port or (443 if parsed.scheme == "https" else 80), proto=socket.IPPROTO_TCP)
        except socket.gaierror as dns_exc:
            raise ValueError("Não foi possível resolver o domínio do webhook configurado.") from dns_exc
        for info in infos:
            resolved_ip = info[4][0]
            if _is_forbidden_ip(resolved_ip):
                raise ValueError("Destino do webhook aponta para rede privada ou reservada.")

    return clean


def _send_via_smtp(recipient_email: str, subject: str, body: str) -> None:
    if "\r" in subject or "\n" in subject:
        raise ValueError("Assunto de e-mail inválido.")
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from or "no-reply@cantinhodascores.com.br"
    msg["To"] = recipient_email
    msg.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_user and settings.smtp_password:
            server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(msg)


def _send_via_webhook(url: str, payload: dict) -> None:
    safe_url = validate_safe_webhook_url(url)
    response = httpx.post(safe_url, json=payload, timeout=15, follow_redirects=False)
    response.raise_for_status()


def deliver_report(
    report: dict,
    *,
    owner_email: str,
    channel: str | None = None,
    recipient: str | None = None,
) -> dict:
    """Envia o relatório pelo canal configurado ou solicitado:
    - `smtp` / `email`: envia via servidor SMTP configurado (em produção exige SMTP_HOST).
    - `webhook`: envia POST JSON exclusivamente para `settings.report_webhook_url` validado contra SSRF.
    - `console`: registra na caixa de saída auditável e no log estruturado (bloqueado em produção).
    """
    mode = (channel or settings.report_delivery_mode or "console").strip().lower()
    raw_target = (recipient or owner_email or "").strip()
    subject = f"Relatório Pedagógico — {report['child_name']} ({report['period_start']} a {report['period_end']})"
    now_iso = datetime.now(timezone.utc).isoformat()

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

    if mode in {"smtp", "email"}:
        target_email = _validate_email_recipient(raw_target)
        envelope["recipient"] = target_email
        if settings.smtp_host:
            _send_via_smtp(target_email, subject, report["text"])
            envelope["provider"] = "smtp"
        elif settings.is_production:
            raise ValueError("Envio por e-mail não configurado em produção: defina SMTP_HOST no servidor ou utilize webhook.")
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
            raise ValueError("Canal 'console' não é permitido em produção. Configure SMTP ou Webhook.")
        if raw_target:
            envelope["recipient"] = _validate_email_recipient(raw_target)
        logger.info("Relatório #%s enviado para %s via canal %s", report["id"], envelope["recipient"], mode)
        envelope["provider"] = "outbox"
    else:
        raise ValueError(f"Canal de envio não suportado: {mode}")

    _delivery_outbox.append(envelope)
    return envelope
