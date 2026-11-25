"""Seção "Sugestão de prática em casa" dos novos relatórios.

Lê SOMENTE o catálogo local revisado (praticas_aprovadas.json). Nunca chama a Groq,
nunca lê rascunhos e nunca falha o relatório: qualquer problema devolve o texto original.
"""
import json
import logging
import os
from pathlib import Path

from app.praticas.catalogo import nivel_por_idade, nome_jogo
from app.praticas.validacao import validar_item

logger = logging.getLogger("cantinho.praticas")

CAMINHO_PADRAO = Path(__file__).with_name("praticas_aprovadas.json")
TITULO_SECAO = "Sugestão de prática em casa"

_cache = {"chave": None, "itens": []}


def _caminho():
    return Path(os.environ.get("PRATICAS_APROVADAS_PATH") or CAMINHO_PADRAO)


def carregar():
    """Itens aprovados e válidos, ordenados por id. Arquivo ausente ou inválido → []."""
    caminho = _caminho()
    try:
        st = caminho.stat()
    except OSError:
        return []
    chave = (str(caminho), st.st_mtime_ns, st.st_size)
    if _cache["chave"] == chave:
        return list(_cache["itens"])
    try:
        dados = json.loads(caminho.read_text(encoding="utf-8"))
        brutos = dados.get("itens", []) if isinstance(dados, dict) else []
        if not isinstance(brutos, list):
            brutos = []
    except (OSError, ValueError):
        logger.warning("Catálogo de práticas ilegível em %s; relatórios seguem sem a seção.", caminho.name)
        brutos = []
    itens, vistos = [], set()
    for item in brutos:
        motivos = validar_item(item, exigir_aprovado=True)
        if motivos:
            if isinstance(item, dict) and item.get("status") == "aprovado":
                logger.warning("Prática %s ignorada: %s", item.get("id"), "; ".join(motivos))
            continue
        if item["id"] in vistos:
            logger.warning("Prática %s ignorada: id repetido", item["id"])
            continue
        vistos.add(item["id"])
        itens.append(item)
    itens.sort(key=lambda i: i["id"])
    _cache.update(chave=chave, itens=itens)
    return list(itens)


def escolher(idade, prioridade=(), rodizio=0):
    """Prática do nível efetivo (pela idade, só no servidor).

    Segue `prioridade` (IDs de jogo, do mais difícil para o mais fácil): as práticas aprovadas do
    nível que usam o primeiro desses jogos que tiver alguma. Sem prioridade ou sem prática para
    esses jogos, todas as aprovadas do nível. Entre as candidatas (em ordem de id), `rodizio`
    (quantos relatórios a criança já tem) alterna a escolha a cada relatório novo.
    """
    nivel = nivel_por_idade(idade)
    do_nivel = [item for item in carregar() if str(item["nivel"]) == nivel]
    candidatas = do_nivel
    for jogo in prioridade:
        do_jogo = [item for item in do_nivel if jogo in item["jogos"]]
        if do_jogo:
            candidatas = do_jogo
            break
    if not candidatas:
        return None
    return candidatas[int(rodizio or 0) % len(candidatas)]


def formatar_secao(item):
    nomes = [nome_jogo(j) for j in item["jogos"]]
    linhas = ["", "", TITULO_SECAO, f"- {item['titulo'].strip()}", f"- Jogos no app: {' e '.join(nomes)}."]
    linhas += [f"- {txt.strip()}" for txt in item["instrucoes"]]
    return "\n".join(linhas)


def formatar_convite(item):
    """Sem partidas no período: só um convite curto para começar pelos jogos do item."""
    nomes = [nome_jogo(j) for j in item["jogos"]]
    return "\n".join(["", "", TITULO_SECAO, f"- Que tal começar por {' ou '.join(nomes)}? Joguem juntos, com calma."])


def pratica_escolhida(idade, jogou=True, prioridade=(), rodizio=0, ao_vivo_pratica=None):
    """(item, origem, convite) da prática do relatório; (None, None, False) se não houver.

    Mesma ordem de sempre: a da IA ao vivo (só se jogou), senão o catálogo aprovado pelo jogo
    mais difícil com rodízio. Sem partidas, o item do catálogo vira convite.
    """
    from app.modules.reports.destaques import origem_catalogo

    if jogou and ao_vivo_pratica:
        return ao_vivo_pratica, "ia", False
    item = escolher(idade, prioridade, rodizio)
    if item is None:
        return None, None, False
    return item, origem_catalogo(item), not jogou


def acrescentar_sugestao(texto, idade, jogou=True, prioridade=(), rodizio=0, ao_vivo_pratica=None):
    """Texto do relatório + seção, ou o texto original intacto se não houver item válido.

    Se a criança não jogou no período (jogou=False), a seção vira um convite curto,
    porque as instruções da prática falam de um jogo que ela ainda não jogou.
    """
    try:
        item, origem, convite = pratica_escolhida(idade, jogou, prioridade, rodizio, ao_vivo_pratica)
        if item is None:
            return texto
        if origem == "ia":
            logger.info("Prática em casa escrita pela IA ao vivo (tema=%s).", item.get("tema"))
        else:
            logger.info("Prática em casa %s (origem=%s) acrescentada ao relatório.", item["id"], item["origem"])
        return texto + (formatar_convite(item) if convite else formatar_secao(item))
    except Exception:  # o relatório nunca quebra por causa da seção opcional
        logger.exception("Falha ao montar a prática em casa; relatório segue sem a seção.")
        return texto
