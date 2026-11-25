"""Cliente da Groq (modelo openai/gpt-oss-20b).

Usado por dois caminhos:
- os comandos internos da equipe (scripts/), via `chamar_groq`;
- o servidor, SÓ na geração de relatório novo, via `chamar_no_servidor`, que nunca levanta
  exceção: qualquer problema devolve None e o relatório usa os textos aprovados do catálogo.

Uma chamada por pedido, sem repetição (retries=0). Depois de uma falha, o servidor fica
PAUSA_SEGUNDOS sem chamar a Groq (disjuntor) e há um teto de chamadas por dia.
"""
import logging
import threading
import time
from datetime import datetime, timezone

import httpx

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODELO_PADRAO = "openai/gpt-oss-20b"
TIMEOUT_SEGUNDOS = 20.0
PAUSA_SEGUNDOS = 600
# Só no servidor: raciocínio curto e teto de resposta, para caber mais relatórios no limite de tokens.
ESFORCO = "low"
MAX_TOKENS_RESPOSTA = 1200

logger = logging.getLogger("cantinho.ia")


class GroqIndisponivel(RuntimeError):
    """Falha da chamada externa (rede, timeout, 4xx/5xx, resposta vazia).

    `pausar` = False quando o problema é só daquele pedido (HTTP 400, por exemplo quando a
    resposta do modelo não veio em JSON): o servidor não entra em pausa por causa dele.
    """

    def __init__(self, motivo, *, pausar=True, espera=None):
        super().__init__(motivo)
        self.pausar = pausar
        self.espera = espera


def _codigo_erro(resposta):
    """Só o código do erro da Groq (ex.: json_validate_failed); nunca o corpo inteiro."""
    try:
        codigo = resposta.json()["error"].get("code")
        return str(codigo)[:40] if codigo else ""
    except Exception:  # noqa: BLE001
        return ""


def _segundos(valor):
    try:
        n = float(valor)
    except (TypeError, ValueError):
        return None
    return n if n >= 0 else None


def chamar_groq(mensagens, *, chave, modelo=MODELO_PADRAO, timeout=TIMEOUT_SEGUNDOS, modo_json=True, extras=None):
    """Faz UMA chamada e devolve o texto da resposta. Qualquer falha vira GroqIndisponivel.

    modo_json=True pede à Groq que garanta JSON (ela devolve 400 json_validate_failed se o modelo
    errar o formato). O servidor usa False e valida a resposta ele mesmo.
    """
    if not chave:
        raise GroqIndisponivel("GROQ_API_KEY ausente")
    corpo = {"model": modelo, "messages": mensagens, "temperature": 0.4}
    if modo_json:
        corpo["response_format"] = {"type": "json_object"}
    corpo.update(extras or {})
    try:
        with httpx.Client(transport=httpx.HTTPTransport(retries=0), timeout=timeout) as cliente:
            resposta = cliente.post(GROQ_URL, json=corpo, headers={"Authorization": f"Bearer {chave}"})
    except httpx.HTTPError as exc:
        raise GroqIndisponivel(f"falha de rede: {type(exc).__name__}") from None
    restantes = resposta.headers.get("x-ratelimit-remaining-tokens")
    if restantes is not None:
        logger.info("Groq: tokens restantes no minuto = %s", restantes)
    if resposta.status_code != 200:
        codigo = _codigo_erro(resposta)
        motivo = f"HTTP {resposta.status_code}" + (f" {codigo}" if codigo else "")
        espera = _segundos(resposta.headers.get("retry-after")) if resposta.status_code == 429 else None
        raise GroqIndisponivel(motivo, pausar=resposta.status_code != 400, espera=espera)
    try:
        return resposta.json()["choices"][0]["message"]["content"]
    except (ValueError, KeyError, IndexError, TypeError):
        raise GroqIndisponivel("resposta sem conteúdo") from None


class Disjuntor:
    """Pausa depois de falha e teto diário de chamadas (em memória, por processo)."""

    def __init__(self, pausa=PAUSA_SEGUNDOS):
        self.pausa = pausa
        self._lock = threading.Lock()
        self.aberto_ate = 0.0
        self.dia = None
        self.chamadas_no_dia = 0

    def reservar(self, agora, teto_diario):
        """True e conta a chamada se pode chamar agora; False se pausado ou no teto."""
        with self._lock:
            if agora < self.aberto_ate:
                return False
            dia = datetime.fromtimestamp(agora, tz=timezone.utc).date()
            if dia != self.dia:
                self.dia, self.chamadas_no_dia = dia, 0
            if self.chamadas_no_dia >= teto_diario:
                return False
            self.chamadas_no_dia += 1
            return True

    def registrar_falha(self, agora, espera=None):
        """Pausa o tempo que a Groq pediu (retry-after), no máximo `pausa`; sem pedido, `pausa`."""
        with self._lock:
            self.aberto_ate = agora + (self.pausa if espera is None else min(espera, self.pausa))

    def zerar(self):
        with self._lock:
            self.aberto_ate, self.dia, self.chamadas_no_dia = 0.0, None, 0


disjuntor = Disjuntor()


def chamar_no_servidor(mensagens, *, agora=None):
    """Chamada feita pelo servidor ao gerar relatório. Devolve o texto ou None (nunca levanta)."""
    from app.core.config import settings

    chave = (settings.groq_api_key or "").strip()
    if not settings.ia_ao_vivo or not chave:
        return None
    agora = time.time() if agora is None else agora
    if not disjuntor.reservar(agora, settings.ia_teto_diario):
        logger.info("IA ao vivo: pausada ou no teto diário; usando catálogo.")
        return None
    try:
        return chamar_groq(mensagens, chave=chave, timeout=settings.ia_timeout_segundos, modo_json=False,
                           extras={"reasoning_effort": ESFORCO, "max_completion_tokens": MAX_TOKENS_RESPOSTA})
    except GroqIndisponivel as exc:
        if not exc.pausar:
            logger.warning("IA ao vivo recusou este pedido (%s); este relatório usa o catálogo.", exc)
            return None
        disjuntor.registrar_falha(agora, exc.espera)
        logger.warning("IA ao vivo indisponível (%s); usando catálogo por %s s.", exc,
                       round(disjuntor.aberto_ate - agora))
        return None
    except Exception:  # nunca derruba o relatório
        disjuntor.registrar_falha(agora)
        logger.exception("IA ao vivo: erro inesperado; usando catálogo.")
        return None
