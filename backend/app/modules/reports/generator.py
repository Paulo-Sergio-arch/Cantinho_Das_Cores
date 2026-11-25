"""Gera o texto do relatório a partir das partidas do período (regras fixas, sem IA).

Linguagem simples, para qualquer família ler. Mostra o nível em que a criança joga
(definido pela idade do perfil, igual ao app) e, jogo por jogo, se esse nível está
fácil, no ponto ou difícil para ela, a partir dos erros e das partidas não terminadas.
"""
from app.modules.reports.conteudo_aprovado import escolher_dica, escolher_recado
from app.modules.reports.evolucao import linhas_evolucao
from app.praticas.catalogo import NIVEIS, nivel_por_idade
from app.praticas.conteudo import situacao_geral

# Regras de dificuldade por jogo (erros por partida terminada).
LIMITE_FACIL = 1      # até 1 erro por partida terminada → "está fácil"
LIMITE_DIFICIL = 5    # 5 ou mais erros por partida terminada → "está difícil"

FACIL, NO_PONTO, DIFICIL = "está fácil", "está no ponto", "está difícil"
SITUACAO_ID = {FACIL: "facil", NO_PONTO: "no_ponto", DIFICIL: "dificil"}


def _fmt_date(d):
    return d.strftime("%d/%m/%Y")


def _plural(n, singular, plural):
    return f"{n} {singular if n == 1 else plural}"


def _tempo_simples(sec):
    if sec is None:
        return None
    meios = round(sec / 30) / 2  # arredonda para meio minuto
    if meios < 1:
        return "menos de 1 minuto"
    inteiro = int(meios)
    texto = _plural(inteiro, "minuto", "minutos")
    return texto + " e meio" if meios - inteiro else texto


def dificuldade_do_jogo(game):
    """Classifica como o nível atual está para a criança neste jogo. None = não jogou."""
    total, feitas = game["total_matches"], game["completed_matches"]
    if total == 0:
        return None
    nao_terminadas = total - feitas
    if feitas == 0 or nao_terminadas > feitas:
        return DIFICIL
    erros_por_partida = game.get("total_errors", 0) / feitas
    if erros_por_partida <= LIMITE_FACIL:
        return FACIL
    if erros_por_partida >= LIMITE_DIFICIL:
        return DIFICIL
    return NO_PONTO


def jogos_por_prioridade(games):
    """IDs dos jogos com partidas, do mais difícil para o mais fácil (empate: nome do jogo)."""
    ordem = {DIFICIL: 0, NO_PONTO: 1, FACIL: 2}
    jogados = [(g, dificuldade_do_jogo(g)) for g in games if g["total_matches"] > 0]
    jogados.sort(key=lambda par: (ordem[par[1]], par[0]["name"]))
    return [g["game_id"] for g, _ in jogados if g.get("game_id")]


def jogados_ordenados(games):
    """[(jogo, situação)] dos jogos com partidas, do mais fácil ao mais difícil (ordem do relatório)."""
    ordem = {FACIL: 0, NO_PONTO: 1, DIFICIL: 2}
    jogados = [(g, dificuldade_do_jogo(g)) for g in games if g["total_matches"] > 0]
    jogados.sort(key=lambda par: (ordem[par[1]], par[0]["name"]))
    return jogados


def dicas_escolhidas(jogados, dicas_ao_vivo=None):
    """Dica de cada jogo difícil que tiver uma: [{jogo, nome, texto, origem}], na ordem das linhas.

    origem: "ia" (IA ao vivo), "ia_revisado" (catálogo escrito com a Groq e revisado) ou "equipe".
    """
    from app.modules.reports.destaques import origem_catalogo

    saida = []
    for g, st in jogados:
        if st != DIFICIL:
            continue
        gid = g.get("game_id")
        texto, origem = (dicas_ao_vivo or {}).get(gid), "ia"
        if not texto:
            item = escolher_dica(gid)
            texto, origem = (item["texto"].strip(), origem_catalogo(item)) if item else (None, None)
        if texto:
            saida.append({"jogo": gid, "nome": g["name"], "texto": texto, "origem": origem})
    return saida


def _linhas_dica(child_name, jogados, dicas_ao_vivo=None):
    """Seção "Dica": dica revisada para cada jogo difícil que tiver uma; senão, a frase de sempre."""
    dificeis = [g for g, st in jogados if st == DIFICIL]
    faceis = [g for g, st in jogados if st == FACIL]
    linhas = ["", "Dica"]
    if dificeis:
        escolhidas = dicas_escolhidas(jogados, dicas_ao_vivo)
        linhas += [f"- Como ajudar em {d['nome']}: {d['texto']}" for d in escolhidas]
        com_dica = {d["jogo"] for d in escolhidas}
        sem_dica = [g["name"] for g in dificeis if g.get("game_id") not in com_dica]
        if sem_dica:
            linhas.append(f"- Vale jogar {' e '.join(sem_dica)} mais vezes, juntos, com calma e sem pressa.")
    elif faceis and len(faceis) == len(jogados):
        linhas.append(f"- Os jogos estão fáceis para {child_name} neste nível. Continue elogiando cada conquista.")
    else:
        linhas.append("- Continue jogando no mesmo ritmo e comemore cada conquista.")
    return linhas


def recado_escolhido(nivel, jogados, recado_ao_vivo=None):
    """(texto, origem) do recado para a criança: IA ao vivo, senão catálogo revisado; (None, None) se nada."""
    from app.modules.reports.destaques import origem_catalogo

    if recado_ao_vivo:
        return recado_ao_vivo, "ia"
    item = escolher_recado(situacao_geral([SITUACAO_ID[st] for _, st in jogados]), nivel)
    if not item:
        return None, None
    return item["texto"].strip(), origem_catalogo(item)


def _linhas_recado(child_name, nivel, jogados, recado_ao_vivo=None):
    """Recado curto para a criança: o da IA ao vivo ou o do catálogo revisado. O nome entra só aqui."""
    texto, _ = recado_escolhido(nivel, jogados, recado_ao_vivo)
    if not texto:
        return []
    return ["", f"Recado para {child_name}", f"- {texto}"]


def _linha_jogo(game, status):
    total, feitas = game["total_matches"], game["completed_matches"]
    if feitas == 0:
        return f"- {game['name']}: {status}. Começou {_plural(total, 'vez', 'vezes')}, mas ainda não terminou. Tudo bem!"
    detalhe = {FACIL: "com poucos erros", NO_PONTO: "com alguns erros", DIFICIL: "com muitos erros"}[status]
    if status == DIFICIL and total - feitas > feitas:
        detalhe = "e deixou outros pela metade"
    return f"- {game['name']}: {status}. Terminou {feitas} de {total}, {detalhe}."


def build_text(child_name, age, start, end, summary, games, evolucao=None, ao_vivo=None):
    nivel = nivel_por_idade(age)
    lines = [
        f"Relatório de {child_name} — {_fmt_date(start)} a {_fmt_date(end)}",
        f"Nível: {NIVEIS[nivel]} ({age} anos)",
    ]
    if summary["total_matches"] == 0:
        lines += ["", "Não houve jogos neste período."]
        return "\n".join(lines)

    total, feitas = summary["total_matches"], summary["completed_matches"]
    lines += ["", "Como foi", f"- Jogou {_plural(total, 'vez', 'vezes')} e terminou {_plural(feitas, 'jogo', 'jogos')}."]
    if feitas:
        lines.append(f"- Nos jogos que terminou: {_plural(summary['total_correct'], 'acerto', 'acertos')} "
                     f"e {_plural(summary['total_errors'], 'erro', 'erros')}.")
        tempo = _tempo_simples(summary["average_duration_seconds"])
        if tempo:
            lines.append(f"- Cada jogo levou mais ou menos {tempo}.")
    else:
        lines.append("- Ainda não terminou nenhum jogo neste período.")

    jogados = jogados_ordenados(games)
    lines += ["", f"Como está o nível {NIVEIS[nivel]} em cada jogo"]
    lines += [_linha_jogo(g, st) for g, st in jogados]
    nao_jogou = [g["name"] for g in games if g["total_matches"] == 0]
    if nao_jogou:
        lines.append(f"- Ainda não jogou: {', '.join(nao_jogou)}.")

    if evolucao is not None:
        lines += linhas_evolucao(evolucao, child_name, ao_vivo.acompanhamento if ao_vivo else None)
    lines += _linhas_dica(child_name, jogados, ao_vivo.dicas if ao_vivo else None)
    lines += _linhas_recado(child_name, nivel, jogados, ao_vivo.recado if ao_vivo else None)
    return "\n".join(lines)
