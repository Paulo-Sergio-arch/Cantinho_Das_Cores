"""Evolução da criança: compara o período do relatório com o período anterior de mesmo tamanho.

Regras fixas, sem rede. O resultado vira a seção "Como {nome} evoluiu" e, de forma anônima
(só categorias), o resumo que a IA ao vivo recebe.
"""
from dataclasses import dataclass, field
from datetime import date, timedelta

ORDEM = {"dificil": 0, "no_ponto": 1, "facil": 2}
ROTULO = {"facil": "fácil", "no_ponto": "no ponto", "dificil": "difícil", "nao_jogou": "sem jogar"}
INICIO_HISTORICO = date(2000, 1, 1)


@dataclass
class JogoEvolucao:
    game_id: str
    nome: str
    agora: str
    antes: str
    tendencia: str
    faixa_agora: str
    faixa_antes: str


@dataclass
class Evolucao:
    jogos: list = field(default_factory=list)
    faixa_total_agora: str = "nenhuma"
    faixa_total_antes: str = "nenhuma"
    ritmo: str = "igual"  # mais | menos | igual
    nunca_jogou: list = field(default_factory=list)
    tem_anterior: bool = False


def periodo_anterior(start, end):
    """Mesmo número de dias, terminando na véspera de `start`."""
    dias = (end - start).days + 1
    fim = start - timedelta(days=1)
    return fim - timedelta(days=dias - 1), fim


def faixa(partidas):
    if partidas <= 0:
        return "nenhuma"
    if partidas <= 2:
        return "poucas"
    if partidas <= 6:
        return "algumas"
    return "muitas"


def _situacao(game):
    from app.modules.reports.generator import SITUACAO_ID, dificuldade_do_jogo

    st = dificuldade_do_jogo(game)
    return SITUACAO_ID[st] if st else "nao_jogou"


def _tendencia(agora, antes):
    if agora == "nao_jogou":
        return "parou"
    if antes == "nao_jogou":
        return "novo"
    if ORDEM[agora] > ORDEM[antes]:
        return "melhorou"
    if ORDEM[agora] < ORDEM[antes]:
        return "piorou"
    return "igual"


def calcular(agora, antes, nunca_jogou=()):
    """`agora`/`antes`: listas de jogos no formato de `repository.stats`."""
    por_id_antes = {g["game_id"]: g for g in antes}
    jogos = []
    for g in agora:
        a = por_id_antes.get(g["game_id"], {"total_matches": 0, "completed_matches": 0, "total_errors": 0})
        sit_agora = _situacao(g) if g["total_matches"] else "nao_jogou"
        sit_antes = _situacao(a) if a["total_matches"] else "nao_jogou"
        if sit_agora == "nao_jogou" and sit_antes == "nao_jogou":
            continue
        jogos.append(JogoEvolucao(g["game_id"], g["name"], sit_agora, sit_antes, _tendencia(sit_agora, sit_antes),
                                  faixa(g["total_matches"]), faixa(a["total_matches"])))
    total_agora = sum(g["total_matches"] for g in agora)
    total_antes = sum(g["total_matches"] for g in antes)
    ritmo = "mais" if total_agora > total_antes else "menos" if total_agora < total_antes else "igual"
    return Evolucao(jogos, faixa(total_agora), faixa(total_antes), ritmo, list(nunca_jogou), total_antes > 0)


def buscar(owner_id, child_id, start, end, tz_offset_minutes=0, games_agora=None):
    from app.modules.reports import repository as repo

    if games_agora is None:
        _, games_agora = repo.stats(owner_id, child_id, start, end, tz_offset_minutes=tz_offset_minutes)
    ini_ant, fim_ant = periodo_anterior(start, end)
    _, games_antes = repo.stats(owner_id, child_id, ini_ant, fim_ant, tz_offset_minutes=tz_offset_minutes)
    _, historico = repo.stats(owner_id, child_id, INICIO_HISTORICO, end, tz_offset_minutes=tz_offset_minutes)
    nunca = [g["game_id"] for g in historico if g["total_matches"] == 0]
    return calcular(games_agora, games_antes, nunca)


_ORDEM_LINHAS = {"melhorou": 0, "piorou": 1, "igual": 2, "novo": 3, "parou": 4}


def linhas_evolucao(ev, nome_crianca, acompanhamento=None):
    """Seção "Como {nome} evoluiu" (regra fixa), com o parágrafo da IA na frente quando houver."""
    linhas = ["", f"Como {nome_crianca} evoluiu"]
    if acompanhamento:
        linhas.append(f"- {acompanhamento.strip()}")
    if not ev.tem_anterior:
        linhas.append("- Este é o primeiro período com jogos. No próximo relatório dá para comparar a evolução.")
        return linhas
    for j in sorted(ev.jogos, key=lambda j: (_ORDEM_LINHAS[j.tendencia], j.nome)):
        a, b = ROTULO[j.antes], ROTULO[j.agora]
        linhas.append({
            "melhorou": f"- {j.nome}: estava {a} e agora está {b}. Que progresso!",
            "piorou": f"- {j.nome}: estava {a} e agora está {b}. Vale jogar junto, com calma.",
            "igual": f"- {j.nome}: continua {b}.",
            "novo": f"- {j.nome}: jogou neste período e não no anterior.",
            "parou": f"- {j.nome}: jogou no período anterior, mas não neste.",
        }[j.tendencia])
    linhas.append({
        "mais": "- Jogou mais vezes do que no período anterior.",
        "menos": "- Jogou menos vezes do que no período anterior.",
        "igual": "- Jogou o mesmo tanto que no período anterior.",
    }[ev.ritmo])
    return linhas
