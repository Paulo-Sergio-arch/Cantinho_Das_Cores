"""Cliente da Groq para os comandos internos da equipe (reexporta app.ia.groq).

`ler_chave` continua aqui: lê GROQ_API_KEY do ambiente ou do backend/.env local.
"""
import os
from pathlib import Path

import httpx  # noqa: F401  (os testes simulam httpx.Client por este módulo)

from app.ia.groq import GROQ_URL, MODELO_PADRAO, TIMEOUT_SEGUNDOS, GroqIndisponivel, chamar_groq  # noqa: F401

ENV_LOCAL = Path(__file__).resolve().parents[1] / ".env"


def ler_chave():
    """Lê GROQ_API_KEY do ambiente; só se a variável não existir, procura em backend/.env.

    Variável definida como vazia (caso dos testes) significa "sem chave".
    """
    if "GROQ_API_KEY" in os.environ:
        return os.environ["GROQ_API_KEY"].strip()
    if ENV_LOCAL.exists():
        for linha in ENV_LOCAL.read_text(encoding="utf-8").splitlines():
            linha = linha.strip()
            if linha.startswith("GROQ_API_KEY="):
                return linha.split("=", 1)[1].strip().strip('"').strip("'")
    return ""
