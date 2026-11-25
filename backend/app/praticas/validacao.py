"""Validação dos itens de prática em casa (rascunhos e catálogo aprovado).

É uma barreira heurística para erros óbvios. Ela NÃO substitui a revisão humana
da equipe do projeto, que é obrigatória antes de um item entrar no catálogo aprovado.
"""
import re

from app.praticas.catalogo import JOGOS, MAPA_TEMAS, NIVEIS, TEMAS
from app.praticas.itens_sorteados import termos_proibidos_em_promessa

ORIGENS = {"manual", "groq", "simulacao"}
STATUS = {"rascunho", "aprovado"}
RE_ID = re.compile(r"^[a-z]+-(8|9|10)-\d{2}$")

_RE_URL = re.compile(r"(https?://|www\.|\.com\b|\.br\b)", re.IGNORECASE)
_RE_HTML = re.compile(r"[<>]")
_RE_REFERENCIA_JOGO = re.compile(
    r"(\b(no|nos|do|dos|dentro do|durante o)\s+jogo\b|\bvai aparecer\b|\baparece(r|rá|m)?\b|"
    r"\bo app\b|\bo aplicativo\b|\ba nuvi\b|\bna tela\b)",
    re.IGNORECASE,
)
_NOMES_JOGOS = [j["nome"].lower() for j in JOGOS.values()]
_TERMOS_ITENS = [re.compile(rf"(?<!\w){re.escape(t)}(?!\w)", re.IGNORECASE) for t in termos_proibidos_em_promessa()]
_RE_AVALIATIVO = re.compile(
    r"(diagn[oó]stic|\batras[oa]|transtorno|\bnotas?\b|reprov|defici[eê]n|\bdeveria\b|\bautis|terapi|tratamento|\bfracass)",
    re.IGNORECASE,
)


_RE_FALA_COM_ADULTO = re.compile(
    r"(\ba criança\b|\bà criança\b|\bda criança\b|\bcom a criança\b|\bpara a criança\b|"
    r"\bseu filho\b|\bsua filha\b|\bseus filhos\b|\bo responsável\b|\bresponsáveis\b|"
    r"\bpeça para\b|\bincentive\b|\bajude-a\b|\bajude-o\b)",
    re.IGNORECASE,
)


def fala_com_adulto(texto):
    """True quando a frase se dirige ao adulto em vez da criança (heurística)."""
    return bool(_RE_FALA_COM_ADULTO.search(texto or ""))


def _tem_emoji(texto):
    for ch in texto:
        o = ord(ch)
        if o >= 0x1F000 or 0x2600 <= o <= 0x27BF or o == 0xFE0F:
            return True
    return False


def _problemas_texto(texto, campo, minimo, maximo):
    if not isinstance(texto, str):
        return [f"{campo}: precisa ser texto"]
    motivos = []
    t = texto.strip()
    if not (minimo <= len(t) <= maximo):
        motivos.append(f"{campo}: tamanho fora de {minimo}-{maximo} caracteres")
    if "\n" in texto or "\r" in texto:
        motivos.append(f"{campo}: quebra de linha não permitida")
    if _RE_HTML.search(texto):
        motivos.append(f"{campo}: HTML não permitido")
    if _RE_URL.search(texto) or "@" in texto:
        motivos.append(f"{campo}: link ou e-mail não permitido")
    if _tem_emoji(texto):
        motivos.append(f"{campo}: emoji não permitido")
    if _RE_AVALIATIVO.search(texto):
        motivos.append(f"{campo}: linguagem avaliativa ou clínica")
    return motivos


def promete_item_sorteado(texto):
    """True quando uma frase cita um jogo e, na mesma frase, um item que o jogo sorteia."""
    for frase in re.split(r"[.!?;]+", texto or ""):
        baixa = frase.lower()
        cita_jogo = bool(_RE_REFERENCIA_JOGO.search(baixa)) or any(n in baixa for n in _NOMES_JOGOS)
        if cita_jogo and any(p.search(baixa) for p in _TERMOS_ITENS):
            return True
    return False


def validar_item(item, *, exigir_aprovado=False):
    """Devolve a lista de motivos de rejeição. Lista vazia = item válido."""
    if not isinstance(item, dict):
        return ["item: precisa ser um objeto"]
    motivos = []

    item_id = item.get("id")
    if not isinstance(item_id, str) or not RE_ID.match(item_id):
        motivos.append("id: formato esperado {tema}-{nivel}-{nn}")

    status = item.get("status")
    if status not in STATUS:
        motivos.append("status: deve ser rascunho ou aprovado")
    origem = item.get("origem")
    if origem not in ORIGENS:
        motivos.append("origem: deve ser manual, groq ou simulacao")
    if origem == "groq" and not (item.get("modelo") and item.get("gerado_em")):
        motivos.append("origem groq: modelo e gerado_em são obrigatórios")

    if exigir_aprovado:
        if status != "aprovado":
            motivos.append("status: só itens aprovados entram no relatório")
        if origem == "simulacao":
            motivos.append("origem: simulação nunca entra no catálogo aprovado")
        if not str(item.get("revisado_por") or "").strip() or not str(item.get("revisado_em") or "").strip():
            motivos.append("revisão: revisado_por e revisado_em são obrigatórios")

    tema, nivel = item.get("tema"), str(item.get("nivel"))
    if tema not in TEMAS:
        motivos.append("tema: fora da lista fixa")
    if nivel not in NIVEIS:
        motivos.append("nivel: deve ser 8, 9 ou 10")
    permitidos = MAPA_TEMAS.get(tema, {}).get(nivel)
    if tema in TEMAS and nivel in NIVEIS and not permitidos:
        motivos.append("combinação tema/nível sem jogo compatível")
    if isinstance(item_id, str) and RE_ID.match(item_id) and not item_id.startswith(f"{tema}-{nivel}-"):
        motivos.append("id: deve começar com {tema}-{nivel}-")

    jogos = item.get("jogos")
    if not isinstance(jogos, list) or not (1 <= len(jogos) <= 2):
        motivos.append("jogos: de 1 a 2 identificadores")
    else:
        if len(set(jogos)) != len(jogos):
            motivos.append("jogos: identificador repetido")
        for j in jogos:
            if j not in JOGOS:
                motivos.append(f"jogos: '{j}' não existe no catálogo")
            elif permitidos is not None and j not in permitidos:
                motivos.append(f"jogos: '{j}' não atende {tema}/{nivel}")

    motivos += _problemas_texto(item.get("titulo"), "titulo", 3, 60)
    instrucoes = item.get("instrucoes")
    if not isinstance(instrucoes, list) or not (1 <= len(instrucoes) <= 3):
        motivos.append("instrucoes: de 1 a 3 frases")
    else:
        for i, txt in enumerate(instrucoes, 1):
            motivos += _problemas_texto(txt, f"instrucoes[{i}]", 10, 160)
            if isinstance(txt, str) and promete_item_sorteado(txt):
                motivos.append(f"instrucoes[{i}]: promete item que o jogo sorteia")
            if isinstance(txt, str) and fala_com_adulto(txt):
                motivos.append(f"instrucoes[{i}]: deve falar com a criança, não com o adulto")
    if isinstance(item.get("titulo"), str) and promete_item_sorteado(item["titulo"]):
        motivos.append("titulo: promete item que o jogo sorteia")
    return motivos
