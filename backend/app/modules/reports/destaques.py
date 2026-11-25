"""Destaques do relatório: os mesmos pedaços do texto, em JSON, com a ORIGEM de cada um.

A tela de relatórios desenha esse JSON como cartões (com selo de quem escreveu). O texto
(`relatorios.texto`) continua sendo a fonte do e-mail, do "Copiar" e do PDF. Nada aqui chama
a Groq: só reaproveita o que o relatório já escolheu. O nome da criança nunca entra.
"""
import logging

from app.praticas.catalogo import nome_jogo

logger = logging.getLogger("cantinho.relatorio")

VERSAO = 1
ORIGENS = ("ia", "ia_revisado", "equipe")


def origem_catalogo(item):
    """Item de catálogo escrito com a Groq e revisado → ia_revisado; escrito à mão → equipe."""
    return "ia_revisado" if (item or {}).get("origem") == "groq" else "equipe"


def _texto(texto, origem):
    return {"texto": texto, "origem": origem} if texto else None


def montar(*, nivel, games, ev, conteudo, idade, jogou, prioridade=(), rodizio=0):
    """Dicionário versão 1 (veja o plano plano-ia-visivel.md). Nunca levanta: erro → None."""
    from app.modules.reports.generator import dicas_escolhidas, jogados_ordenados, recado_escolhido
    from app.modules.reports.praticas import pratica_escolhida

    try:
        jogados = jogados_ordenados(games) if jogou else []
        recado, origem_recado = recado_escolhido(nivel, jogados, conteudo.recado if conteudo else None) \
            if jogados else (None, None)
        dicas = dicas_escolhidas(jogados, conteudo.dicas if conteudo else None) if jogados else []
        item, origem_pratica, convite = pratica_escolhida(idade, jogou, prioridade, rodizio,
                                                          conteudo.pratica if conteudo else None)
        pratica = None
        if item is not None:
            pratica = {"titulo": None if convite else item["titulo"].strip(),
                       "jogos": [nome_jogo(j) for j in item["jogos"]],
                       "jogos_ids": list(item["jogos"]),
                       "instrucoes": [] if convite else [t.strip() for t in item["instrucoes"]],
                       "origem": origem_pratica, "convite": convite}
        return {
            "versao": VERSAO,
            "titulo": _texto(getattr(conteudo, "titulo", None), "ia"),
            "acompanhamento": _texto(conteudo.acompanhamento if conteudo else None, "ia"),
            "recado": _texto(recado, origem_recado),
            "dicas": dicas,
            "pratica": pratica,
            "jogos": [{"jogo": j.game_id, "nome": j.nome, "antes": j.antes, "agora": j.agora,
                       "tendencia": j.tendencia} for j in (ev.jogos if ev else [])],
        }
    except Exception:  # os cartões são opcionais: o relatório em texto nunca quebra por eles
        logger.exception("Falha ao montar os destaques; o relatório segue só com o texto.")
        return None
