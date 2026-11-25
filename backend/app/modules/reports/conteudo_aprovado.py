"""Recados e dicas aprovados para o relatório (catálogos locais revisados pela equipe).

Lê SOMENTE recados_aprovados.json e dicas_aprovadas.json. Nunca chama a Groq, nunca lê
rascunhos e nunca falha: arquivo ausente ou inválido vira lista vazia e o relatório segue igual.
"""
import json
import logging
import os
from pathlib import Path

from app.praticas.conteudo import validar_dica, validar_recado

logger = logging.getLogger("cantinho.conteudo")

_PASTA = Path(__file__).parent
_CATALOGOS = {
    "recados": ("RECADOS_APROVADOS_PATH", _PASTA / "recados_aprovados.json", validar_recado),
    "dicas": ("DICAS_APROVADAS_PATH", _PASTA / "dicas_aprovadas.json", validar_dica),
}
_cache = {}


def _carregar(nome):
    env, padrao, validar = _CATALOGOS[nome]
    caminho = Path(os.environ.get(env) or padrao)
    try:
        st = caminho.stat()
    except OSError:
        return []
    chave = (str(caminho), st.st_mtime_ns, st.st_size)
    if nome in _cache and _cache[nome][0] == chave:
        return list(_cache[nome][1])
    try:
        dados = json.loads(caminho.read_text(encoding="utf-8"))
        brutos = dados.get("itens", []) if isinstance(dados, dict) else []
        if not isinstance(brutos, list):
            brutos = []
    except (OSError, ValueError):
        logger.warning("Catálogo de %s ilegível em %s; relatórios seguem sem ele.", nome, caminho.name)
        brutos = []
    itens, vistos = [], set()
    for item in brutos:
        motivos = validar(item, exigir_aprovado=True)
        if motivos:
            if isinstance(item, dict) and item.get("status") == "aprovado":
                logger.warning("Item %s ignorado: %s", item.get("id"), "; ".join(motivos))
            continue
        if item["id"] in vistos:
            logger.warning("Item %s ignorado: id repetido", item["id"])
            continue
        vistos.add(item["id"])
        itens.append(item)
    itens.sort(key=lambda i: i["id"])
    _cache[nome] = (chave, itens)
    return list(itens)


def carregar_recados():
    return _carregar("recados")


def carregar_dicas():
    return _carregar("dicas")


def escolher_recado(situacao, nivel):
    """Primeiro recado aprovado da situação e do nível, em ordem de id."""
    try:
        for item in carregar_recados():
            if item["situacao"] == situacao and str(item["nivel"]) == str(nivel):
                return item
    except Exception:
        logger.exception("Falha ao escolher recado; relatório segue sem ele.")
    return None


def escolher_dica(jogo):
    """Primeira dica aprovada do jogo, em ordem de id."""
    try:
        for item in carregar_dicas():
            if item["jogo"] == jogo:
                return item
    except Exception:
        logger.exception("Falha ao escolher dica; relatório segue sem ela.")
    return None
