from datetime import date, datetime
from pydantic import BaseModel, Field, model_validator


class ReportCreate(BaseModel):
    child_id: str
    period_start: date
    period_end: date
    tz_offset_minutes: int = Field(default=0, ge=-840, le=840)

    @model_validator(mode="after")
    def check_period(self):
        if self.period_end < self.period_start:
            raise ValueError("period_end deve ser igual ou posterior a period_start")
        if (self.period_end - self.period_start).days > 365:
            raise ValueError("O período não pode passar de 366 dias")
        return self


class ReportSendRequest(BaseModel):
    channel: str | None = Field(default=None, pattern="^(email|smtp|resend|brevo|webhook|console)$")
    recipient: str | None = Field(default=None, max_length=255)
    resend: bool = False


class ReportPublic(BaseModel):
    id: str
    child_id: str
    child_name: str
    period_start: date
    period_end: date
    text: str
    destaques: dict | None = None
    generated_at: datetime
    sent_at: datetime | None
    sent: bool
    delivery_channel: str | None = None
    delivery_recipient: str | None = None


class ReportStatus(BaseModel):
    id: str
    sent: bool
    generated_at: datetime
    sent_at: datetime | None


class TextoComOrigem(BaseModel):
    texto: str
    origem: str


class Desafio(BaseModel):
    jogo: str
    nome: str


class RecadoDaSemana(BaseModel):
    """Só o que a criança vê no menu: o recado e o jogo da prática do último relatório."""
    recado: TextoComOrigem | None = None
    desafio: Desafio | None = None
    gerado_em: datetime | None = None
