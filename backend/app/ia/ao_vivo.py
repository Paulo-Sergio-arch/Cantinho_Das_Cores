"""IA ao vivo no relatório: monta o pedido anônimo, chama a Groq uma vez e valida cada pedaço.

A Groq recebe só o nível, categorias de desempenho por jogo (agora, antes, tendência, faixa de
partidas), jogos nunca tentados e os temas permitidos. Nunca nome, idade, e-mail, ids ou números.
Cada pedaço da resposta é validado separado; o que não passar fica None e o relatório usa o
texto aprovado do catálogo no lugar.
"""
import json
import logging
import re
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.ia.groq import MODELO_PADRAO, chamar_no_servidor
from app.praticas.catalogo import JOGOS, MAPA_TEMAS, NIVEIS, TEMAS
from app.praticas.conteudo import validar_dica, validar_recado
from app.praticas.validacao import _problemas_texto, promete_item_sorteado, validar_item

logger = logging.getLogger("cantinho.ia")

REGRAS = (
    "Você ajuda famílias que usam um app de jogos educativos para crianças. Recebe um resumo ANÔNIMO "
    "do progresso de uma criança: nível, situação de cada jogo agora e no período anterior "
    "(facil, no_ponto, dificil, nao_jogou), tendência (melhorou, piorou, igual, novo, parou), faixa de "
    "partidas e jogos que ela nunca tentou. Responda SOMENTE com um objeto JSON no formato "
    '{"titulo": str, "acompanhamento": str, "recado": str, "dicas": {"<id do jogo>": str}, '
    '"pratica": {"tema": str, "titulo": str, "jogos": [str], "instrucoes": [str]}}. Regras: '
    "'titulo': um nome curto e carinhoso para o período (5 a 40 caracteres), para a família, sem nome de "
    "pessoa, sem 'você' e sem números. "
    "'acompanhamento': 1 a 3 frases (até 300 caracteres) PARA O ADULTO da família sobre a evolução, "
    "falando da criança em terceira pessoa ('a criança'), sem usar 'você': "
    "celebre o que melhorou, fale com calma do que ficou difícil e sugira o próximo passo; não invente "
    "números nem fale de tempo ou rapidez (você não recebe esses dados), não compare com outras crianças, não faça diagnóstico. "
    "'recado': 1 ou 2 frases curtas (até 140 caracteres) FALANDO DIRETAMENTE COM A CRIANÇA (você), "
    "acolhedoras; não fale com o adulto. "
    "'dicas': uma dica para o adulto (até 180 caracteres) só para cada jogo que está 'dificil' agora, "
    "usando o id do jogo como chave; ação concreta para fazer junto. "
    "'pratica': escolha um tema de 'temas_permitidos', de preferência ligado ao jogo mais difícil; "
    "'jogos' com 1 ou 2 ids desse tema (nunca o nome); titulo até 60 caracteres; 1 a 3 instrucoes de até "
    "160 caracteres FALANDO COM A CRIANÇA (você); se ela jogou pouco, convide sem cobrar. "
    "Em tudo: português do Brasil, palavras simples do dia a dia (nada de termos técnicos como "
    "'percepção visual' ou 'coordenação motora'), sem marcar gênero da criança, nada de nomes de pessoas "
    "nem marcadores de nome, sem aspas; ao citar um jogo no texto, use o nome do jogo exatamente como em "
    "'nome', nunca o id; "
    "sem termos clínicos ou avaliativos, sem emojis, links ou HTML. Os jogos sorteiam os itens de cada "
    "partida: nunca diga qual palavra, figura, cor, forma ou fruta vai aparecer no jogo."
)


@dataclass
class Conteudo:
    titulo: str | None = None
    acompanhamento: str | None = None
    recado: str | None = None
    dicas: dict = field(default_factory=dict)
    pratica: dict | None = None

    @property
    def usado(self):
        """Algo da IA entrou no TEXTO do relatório (o título só aparece nos cartões)."""
        return bool(self.acompanhamento or self.recado or self.dicas or self.pratica)


def montar_mensagens(nivel, ev):
    """Pedido anônimo: só categorias e o catálogo público de jogos e temas."""
    dados = {
        "nivel": {"id": nivel, "rotulo": NIVEIS[nivel]},
        "ritmo": {"agora": ev.faixa_total_agora, "antes": ev.faixa_total_antes},
        "jogos": [
            {"id": j.game_id, "nome": JOGOS[j.game_id]["nome"], "descricao": JOGOS[j.game_id]["descricao"],
             "agora": j.agora, "antes": j.antes, "tendencia": j.tendencia, "faixa_agora": j.faixa_agora}
            for j in ev.jogos if j.game_id in JOGOS
        ],
        "nunca_jogou": [g for g in ev.nunca_jogou if g in JOGOS],
        "temas_permitidos": [
            {"tema": t, "rotulo": TEMAS[t], "jogos": MAPA_TEMAS[t][nivel]}
            for t in TEMAS if nivel in MAPA_TEMAS.get(t, {})
        ],
    }
    return [{"role": "system", "content": REGRAS},
            {"role": "user", "content": json.dumps(dados, ensure_ascii=False)}]


def _sem_acento(texto):
    return "".join(c for c in unicodedata.normalize("NFD", texto or "") if unicodedata.category(c) != "Mn").lower()


def _cita_nome(texto, nome):
    alvo = _sem_acento(texto)
    for parte in re.findall(r"\w+", _sem_acento(nome)):
        if len(parte) >= 3 and re.search(rf"(?<!\w){re.escape(parte)}(?!\w)", alvo):
            return True
    return False


def _base(agora):
    return {"status": "rascunho", "origem": "groq", "modelo": MODELO_PADRAO,
            "gerado_em": agora.isoformat(timespec="seconds"), "rascunho_arquivo": "ao-vivo"}


# Filtros extras só da IA ao vivo (vistos no teste real de 25/11); o catálogo revisado não passa por eles.
_RE_ASPAS = re.compile("[\"'“”‘’`]")
_RE_TECNICO = re.compile(r"percep|cogniti|motor[ae]?s?\b|coordena|estimul|neuro|desempenho|desenvolviment|habilidade"
                         r"|rapid|velocid|veloz|\btempo\b|domin",
                         re.IGNORECASE)
_RE_VOCE = re.compile(r"\b(voc[eê]s?|vc|te|teu|tua)\b", re.IGNORECASE)


def _texto_ok(texto, nome):
    return (isinstance(texto, str) and bool(texto.strip()) and not _cita_nome(texto, nome)
            and not _RE_ASPAS.search(texto) and not _RE_TECNICO.search(_sem_acento(texto)))


def _ler_json(bruto):
    """O objeto JSON da resposta, mesmo com cercas de código ou uma frase em volta; senão None."""
    if not isinstance(bruto, str):
        return None
    for texto in (bruto, bruto[bruto.find("{"):bruto.rfind("}") + 1]):
        try:
            dados = json.loads(texto)
        except ValueError:
            continue
        if isinstance(dados, dict):
            return dados
    return None


def interpretar(bruto, *, nivel, situacao_geral, jogos_dificeis, nome_crianca):
    """Lê a resposta e devolve só os pedaços que passaram na validação."""
    dados = _ler_json(bruto)
    if dados is None:
        return Conteudo()
    base = _base(datetime.now(timezone.utc))
    out = Conteudo()

    titulo = dados.get("titulo")
    if _texto_ok(titulo, nome_crianca) and 5 <= len(titulo.strip()) <= 40 and not _RE_VOCE.search(titulo) \
            and not re.search(r"\d", titulo) and not _problemas_texto(titulo, "titulo", 5, 40) \
            and not promete_item_sorteado(titulo):
        out.titulo = titulo.strip()

    acomp = dados.get("acompanhamento")
    if _texto_ok(acomp, nome_crianca) and not _problemas_texto(acomp, "acompanhamento", 20, 300) \
            and not promete_item_sorteado(acomp) and not _RE_VOCE.search(acomp):
        out.acompanhamento = acomp.strip()

    recado = dados.get("recado")
    if situacao_geral and _texto_ok(recado, nome_crianca):
        item = {**base, "id": f"recado-{situacao_geral}-{nivel}-01", "situacao": situacao_geral,
                "nivel": nivel, "texto": recado.strip()}
        if not validar_recado(item):
            out.recado = item["texto"]

    dicas = dados.get("dicas") if isinstance(dados.get("dicas"), dict) else {}
    for jogo in jogos_dificeis:
        texto = dicas.get(jogo)
        if _texto_ok(texto, nome_crianca):
            item = {**base, "id": f"dica-{jogo}-01", "jogo": jogo, "situacao": "dificil", "texto": texto.strip()}
            if not validar_dica(item):
                out.dicas[jogo] = item["texto"]

    p = dados.get("pratica")
    if isinstance(p, dict) and isinstance(p.get("tema"), str):
        item = {**base, "id": f"{p['tema']}-{nivel}-01", "tema": p["tema"], "nivel": nivel,
                "titulo": p.get("titulo"), "jogos": p.get("jogos"), "instrucoes": p.get("instrucoes")}
        textos = [item["titulo"]] + (item["instrucoes"] if isinstance(item["instrucoes"], list) else [])
        if not validar_item(item) and all(_texto_ok(t, nome_crianca) for t in textos):
            out.pratica = item
    return out


def gerar(nivel, ev, *, situacao_geral, jogos_dificeis, nome_crianca):
    """Uma chamada à Groq. None quando não há jogos no período ou a Groq não respondeu."""
    if not any(j.agora != "nao_jogou" for j in ev.jogos):
        return None
    bruto = chamar_no_servidor(montar_mensagens(nivel, ev))
    if bruto is None:
        return None
    conteudo = interpretar(bruto, nivel=nivel, situacao_geral=situacao_geral,
                           jogos_dificeis=jogos_dificeis, nome_crianca=nome_crianca)
    logger.info("IA ao vivo: acompanhamento=%s recado=%s dicas=%d pratica=%s",
                bool(conteudo.acompanhamento), bool(conteudo.recado), len(conteudo.dicas), bool(conteudo.pratica))
    return conteudo
