"""Recados para a criança e dicas para a família (rascunhos e catálogos aprovados).

Mesmo caminho das práticas em casa: a Groq escreve rascunhos a partir de rótulos fixos,
uma pessoa da equipe revisa e só o que foi aprovado entra no relatório. Sem banco e sem rede.
A validação é uma barreira para erros óbvios; NÃO substitui a revisão humana.
"""
import re

from app.praticas.catalogo import JOGOS, NIVEIS
from app.praticas.validacao import ORIGENS, STATUS, _problemas_texto, fala_com_adulto, promete_item_sorteado

SITUACOES = {"facil": "está fácil", "no_ponto": "está no ponto", "dificil": "está difícil"}

RE_ID_RECADO = re.compile(r"^recado-(facil|no_ponto|dificil)-(8|9|10)-\d{2}$")
RE_ID_DICA = re.compile(r"^dica-([a-z]+)-\d{2}$")
_RE_DATA = re.compile(r"^\d{4}-\d{2}-\d{2}$")
_RE_MARCADOR_NOME = re.compile(r"([{}]|\bnome\b)", re.IGNORECASE)
_RE_FRASES = re.compile(r"[.!?]+")


def situacao_geral(situacoes):
    """Uma situação para o período: difícil se houver alguma; fácil se todas; senão no ponto."""
    if not situacoes:
        return None
    if "dificil" in situacoes:
        return "dificil"
    if all(s == "facil" for s in situacoes):
        return "facil"
    return "no_ponto"


def _comuns(item, exigir_aprovado):
    motivos = []
    status, origem = item.get("status"), item.get("origem")
    if status not in STATUS:
        motivos.append("status: deve ser rascunho ou aprovado")
    if origem not in ORIGENS:
        motivos.append("origem: deve ser manual, groq ou simulacao")
    if origem == "groq" and not (item.get("modelo") and item.get("gerado_em")):
        motivos.append("origem groq: modelo e gerado_em são obrigatórios")
    if exigir_aprovado:
        if status != "aprovado":
            motivos.append("status: só itens aprovados entram no relatório")
        if origem == "simulacao":
            motivos.append("origem: simulação nunca entra no catálogo aprovado")
        if not str(item.get("revisado_por") or "").strip():
            motivos.append("revisão: revisado_por é obrigatório")
        if not _RE_DATA.match(str(item.get("revisado_em") or "")):
            motivos.append("revisão: revisado_em no formato AAAA-MM-DD")
    return motivos


def validar_recado(item, *, exigir_aprovado=False):
    """Recado curto FALANDO COM A CRIANÇA. Lista vazia = válido."""
    if not isinstance(item, dict):
        return ["item: precisa ser um objeto"]
    motivos = _comuns(item, exigir_aprovado)
    situacao, nivel = item.get("situacao"), str(item.get("nivel"))
    if situacao not in SITUACOES:
        motivos.append("situacao: deve ser facil, no_ponto ou dificil")
    if nivel not in NIVEIS:
        motivos.append("nivel: deve ser 8, 9 ou 10")
    item_id = item.get("id")
    if not isinstance(item_id, str) or not RE_ID_RECADO.match(item_id):
        motivos.append("id: formato esperado recado-{situacao}-{nivel}-{nn}")
    elif not item_id.startswith(f"recado-{situacao}-{nivel}-"):
        motivos.append("id: deve começar com recado-{situacao}-{nivel}-")
    texto = item.get("texto")
    motivos += _problemas_texto(texto, "texto", 10, 140)
    if isinstance(texto, str):
        if len([f for f in _RE_FRASES.split(texto) if f.strip()]) > 2:
            motivos.append("texto: no máximo 2 frases")
        if fala_com_adulto(texto):
            motivos.append("texto: deve falar com a criança, não com o adulto")
        if _RE_MARCADOR_NOME.search(texto):
            motivos.append("texto: sem nome nem marcador de nome")
        if promete_item_sorteado(texto):
            motivos.append("texto: promete item que o jogo sorteia")
    return motivos


def validar_dica(item, *, exigir_aprovado=False):
    """Dica curta PARA O ADULTO, para um jogo que está difícil. Lista vazia = válido."""
    if not isinstance(item, dict):
        return ["item: precisa ser um objeto"]
    motivos = _comuns(item, exigir_aprovado)
    jogo = item.get("jogo")
    if jogo not in JOGOS:
        motivos.append(f"jogo: '{jogo}' não existe no catálogo")
    if item.get("situacao") != "dificil":
        motivos.append("situacao: dicas existem só para jogo difícil")
    item_id = item.get("id")
    if not isinstance(item_id, str) or not RE_ID_DICA.match(item_id):
        motivos.append("id: formato esperado dica-{jogo}-{nn}")
    elif not item_id.startswith(f"dica-{jogo}-"):
        motivos.append("id: deve começar com dica-{jogo}-")
    texto = item.get("texto")
    motivos += _problemas_texto(texto, "texto", 20, 180)
    if isinstance(texto, str):
        if "você vai ver" in texto.lower() or promete_item_sorteado(texto):
            motivos.append("texto: promete item que o jogo sorteia")
    return motivos
