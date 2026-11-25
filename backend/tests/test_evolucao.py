"""Evolução da criança em relação ao período anterior (regras fixas, sem rede)."""
from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.auth.repository import repository as users
from app.modules.children.repository import repository as kids
from app.modules.reports.evolucao import calcular, faixa, linhas_evolucao, periodo_anterior
from app.modules.sessions.repository import repository as sessions

NOMES = {"ligar": "Ligue ao nome", "cores": "Acerte a cor", "falar": "Vamos falar", "frutas": "Bloquinho de Frutas"}
client = TestClient(app)


def g(gid, total=1, feitas=None, erros=0):
    feitas = total if feitas is None else feitas
    return {"game_id": gid, "name": NOMES[gid], "total_matches": total, "completed_matches": feitas, "total_errors": erros}


def z(gid):
    return g(gid, total=0, feitas=0)


def test_periodo_anterior():
    assert periodo_anterior(date(2026, 11, 19), date(2026, 11, 25)) == (date(2026, 11, 12), date(2026, 11, 18))
    assert periodo_anterior(date(2026, 11, 1), date(2026, 11, 1)) == (date(2026, 10, 31), date(2026, 10, 31))


@pytest.mark.parametrize("n,esperado", [(0, "nenhuma"), (2, "poucas"), (3, "algumas"), (6, "algumas"), (7, "muitas")])
def test_faixa(n, esperado):
    assert faixa(n) == esperado


def test_tendencias():
    ev = calcular(agora=[g("ligar", erros=3), g("cores"), g("falar"), z("frutas")],
                  antes=[g("ligar", erros=6), g("cores"), z("falar"), g("frutas")], nunca_jogou=["encaixe"])
    assert {j.game_id: j.tendencia for j in ev.jogos} == {"ligar": "melhorou", "cores": "igual", "falar": "novo",
                                                         "frutas": "parou"}
    assert ev.tem_anterior and ev.ritmo == "igual" and ev.nunca_jogou == ["encaixe"]


def test_linhas_evolucao():
    ev = calcular(agora=[g("ligar", erros=3), g("cores", erros=6), g("falar", total=3)],
                  antes=[g("ligar", erros=6), g("cores"), z("falar")])
    assert linhas_evolucao(ev, "Ana") == [
        "", "Como Ana evoluiu",
        "- Ligue ao nome: estava difícil e agora está no ponto. Que progresso!",
        "- Acerte a cor: estava fácil e agora está difícil. Vale jogar junto, com calma.",
        "- Vamos falar: jogou neste período e não no anterior.",
        "- Jogou mais vezes do que no período anterior.",
    ]


def test_primeiro_periodo_e_acompanhamento_na_frente():
    ev = calcular(agora=[g("ligar")], antes=[z("ligar")])
    assert linhas_evolucao(ev, "Ana", acompanhamento="Texto da IA para a família.") == [
        "", "Como Ana evoluiu", "- Texto da IA para a família.",
        "- Este é o primeiro período com jogos. No próximo relatório dá para comparar a evolução.",
    ]


def test_relatorio_compara_com_periodo_anterior():
    users.clear(); kids.clear(); sessions.clear()
    r = client.post("/api/auth/register", json={"name": "Responsável Fictício", "email": "evo@example.com",
                                                 "password": "SenhaForte123", "accepted_terms": True})
    h = {"Authorization": f"Bearer {r.json()['access_token']}"}
    cid = client.post("/api/children", json={"name": "Ana Demo", "age": 9}, headers=h).json()["id"]
    for at, err in (("2026-11-05T10:00:00+00:00", 6), ("2026-11-12T10:00:00+00:00", 3)):
        assert client.post("/api/sessions", json={"child_id": cid, "game_id": "ligar", "correct_answers": 5,
                                                  "incorrect_answers": err, "completed": True, "duration_seconds": 60,
                                                  "played_at": at}, headers=h).status_code == 201
    rel = client.post("/api/reports", json={"child_id": cid, "period_start": "2026-11-09", "period_end": "2026-11-15"},
                      headers=h).json()
    assert "Como Ana Demo evoluiu\n- Ligue ao nome: estava difícil e agora está no ponto. Que progresso!" in rel["text"]
    assert "inteligência artificial" not in rel["text"]  # sem chave nos testes
