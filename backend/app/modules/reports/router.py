import threading
from fastapi import APIRouter, Body, Depends, HTTPException, Query, Response, status
from app.core.config import settings
from app.modules.auth.dependencies import get_current_claims
from app.modules.auth.repository import repository as users_repository
from app.modules.auth.security import consume_rate_limit
from app.modules.children.repository import repository as children_repository
from app.modules.reports import repository as repo
from app.modules.reports.delivery import deliver_report
from app.modules.reports.generator import build_text
from app.modules.reports.schemas import ReportCreate, ReportPublic, ReportSendRequest, ReportStatus

router = APIRouter(prefix="/api/reports", tags=["Relatórios pedagógicos"])

_in_flight_lock = threading.Lock()
_in_flight_reports: set[str] = set()


def responsible_id(claims: dict = Depends(get_current_claims)) -> str:
    if claims.get("guest") or claims.get("role") != "responsible":
        raise HTTPException(status_code=403, detail="Apenas responsáveis cadastrados podem gerar ou consultar relatórios")
    if users_repository.get_by_id(claims.get("sub", "")) is None:
        raise HTTPException(status_code=401, detail="Usuário não encontrado ou sessão inválida")
    return claims["sub"]


def owned_or_404(report_id, owner_id):
    report = repo.get_owned(report_id, owner_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Relatório não encontrado")
    return report


@router.post("", response_model=ReportPublic, status_code=status.HTTP_201_CREATED)
def create_report(payload: ReportCreate, owner_id: str = Depends(responsible_id)):
    child = children_repository.get_owned(payload.child_id, owner_id)
    if child is None:
        raise HTTPException(status_code=404, detail="Perfil da criança não encontrado")
    summary, games = repo.stats(
        owner_id,
        child.id,
        payload.period_start,
        payload.period_end,
        tz_offset_minutes=payload.tz_offset_minutes,
    )
    text = build_text(child.name, child.age, payload.period_start, payload.period_end, summary, games)
    return repo.create(child.id, payload.period_start, payload.period_end, text)


@router.get("", response_model=list[ReportPublic])
def list_reports(
    child_id: str | None = None,
    sent: bool | None = Query(default=None, description="true = só enviados; false = só pendentes"),
    owner_id: str = Depends(responsible_id),
):
    if child_id is not None and children_repository.get_owned(child_id, owner_id) is None:
        raise HTTPException(status_code=404, detail="Perfil da criança não encontrado")
    return repo.list_by_owner(owner_id, child_id, sent)


@router.get("/{report_id}", response_model=ReportPublic)
def read_report(report_id: str, owner_id: str = Depends(responsible_id)):
    return owned_or_404(report_id, owner_id)


@router.get("/{report_id}/status", response_model=ReportStatus)
def report_status(report_id: str, owner_id: str = Depends(responsible_id)):
    return owned_or_404(report_id, owner_id)


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(report_id: str, owner_id: str = Depends(responsible_id)):
    if not repo.delete_owned(report_id, owner_id):
        raise HTTPException(status_code=404, detail="Relatório não encontrado")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _execute_send(report_id: str, owner_id: str, payload: ReportSendRequest | None) -> dict:
    report = owned_or_404(report_id, owner_id)
    allow_resend = bool(payload and payload.resend)
    if report["sent"] and not allow_resend:
        raise HTTPException(status_code=409, detail="Relatório já marcado como enviado")

    blocked, retry_after = consume_rate_limit(
        f"report_send:{owner_id}",
        max_attempts=settings.report_send_rate_limit_max_attempts,
        window_seconds=settings.report_send_rate_limit_window_seconds,
    )
    if blocked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Limite de envios de relatório atingido. Aguarde {retry_after}s antes de enviar outro.",
            headers={"Retry-After": str(retry_after)},
        )

    # Impede envios concorrentes duplicados (TOCTOU) para o mesmo relatório
    with _in_flight_lock:
        if report["id"] in _in_flight_reports:
            raise HTTPException(status_code=409, detail="Este relatório já está sendo enviado no momento.")
        _in_flight_reports.add(report["id"])

    try:
        owner = users_repository.get_by_id(owner_id)
        owner_email = owner.email if owner else ""
        channel = payload.channel if payload else None
        recipient = payload.recipient if payload else None

        try:
            envelope = deliver_report(report, owner_email=owner_email, channel=channel, recipient=recipient)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc))
        except Exception as exc:
            raise HTTPException(status_code=502, detail="Falha ao enviar o relatório pelo canal configurado.") from exc

        try:
            marked = repo.mark_sent(report["id"], allow_resend=allow_resend)
        except TypeError:
            marked = repo.mark_sent(report["id"])
        if not marked:
            raise HTTPException(status_code=409, detail="Relatório já marcado como enviado")

        updated = owned_or_404(report_id, owner_id)
        updated["delivery_channel"] = envelope["channel"]
        updated["delivery_recipient"] = envelope["recipient"]
        return updated
    finally:
        with _in_flight_lock:
            _in_flight_reports.discard(report["id"])


@router.post("/{report_id}/sent", response_model=ReportPublic)
def mark_report_sent(
    report_id: str,
    payload: ReportSendRequest | None = Body(default=None),
    owner_id: str = Depends(responsible_id),
):
    """Envia o relatório pelo canal configurado (e-mail/SMTP, Resend, Brevo, webhook ou caixa de saída) e preenche enviado_em."""
    return _execute_send(report_id, owner_id, payload)


@router.post("/{report_id}/send", response_model=ReportPublic)
def send_report_now(
    report_id: str,
    payload: ReportSendRequest | None = Body(default=None),
    owner_id: str = Depends(responsible_id),
):
    """Rota explícita para envio ou reenvio real do relatório pedagógico."""
    return _execute_send(report_id, owner_id, payload)
