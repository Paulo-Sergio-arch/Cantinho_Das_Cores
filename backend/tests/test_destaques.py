"""Destaques do relatório: os pedaços do texto com a origem de cada um (para os cartões da tela)."""
import json

from app.core.database import connect, init_db, is_postgres
from app.ia import ao_vivo
from app.modules.reports import destaques
from app.modules.reports.generator import DIFICIL, recado_escolhido
from tests.test_relatorio_ao_vivo import AVISO, RESPOSTA, catalogos, client, gerar, groq_falsa, preparar  # noqa: F401

SELOS = {"ia", "ia_revisado", "equipe"}


def test_origem_catalogo():
    assert destaques.origem_catalogo({"origem": "groq"}) == "ia_revisado"
    assert destaques.origem_catalogo({"origem": "manual"}) == "equipe"
    assert destaques.origem_catalogo({}) == "equipe"


def test_recado_escolhido(catalogos):
    jogados = [({"game_id": "ligar", "name": "Ligue ao nome"}, DIFICIL)]
    assert recado_escolhido("9", jogados, "Você está aprendendo.") == ("Você está aprendendo.", "ia")
    assert recado_escolhido("9", jogados, None) == ("Recado do catálogo para você.", "ia_revisado")


def test_relatorio_novo_traz_destaques_que_batem_com_o_texto(catalogos, groq_falsa):
    groq_falsa["resposta"] = json.dumps({**RESPOSTA, "titulo": "Uma semana de palavras"})
    r = gerar(*preparar(dificil=True))
    d, t = r["destaques"], r["text"]
    assert d["versao"] == 1 and d["titulo"] == {"texto": "Uma semana de palavras", "origem": "ia"}
    assert d["acompanhamento"]["texto"] in t and d["acompanhamento"]["origem"] == "ia"
    assert d["recado"]["texto"] in t and d["recado"]["origem"] == "ia"
    assert [x["jogo"] for x in d["dicas"]] == ["ligar"] and all(x["texto"] in t for x in d["dicas"])
    assert d["pratica"]["titulo"] in t and all(i in t for i in d["pratica"]["instrucoes"])
    assert d["pratica"]["jogos"] == ["Ligue ao nome"] and d["pratica"]["convite"] is False
    assert d["jogos"] == [{"jogo": "ligar", "nome": "Ligue ao nome", "antes": "nao_jogou",
                           "agora": "dificil", "tendencia": "novo"}]
    assert "Uma semana de palavras" not in t  # o título só aparece nos cartões
    assert "Ana" not in json.dumps(d, ensure_ascii=False)  # nome da criança nunca entra


def test_groq_fora_sem_selo_ia(catalogos, monkeypatch):
    monkeypatch.setattr(ao_vivo, "chamar_no_servidor", lambda m, **k: None)
    d = gerar(*preparar(dificil=True))["destaques"]
    origens = [d[k]["origem"] for k in ("recado", "pratica") if d[k]] + [x["origem"] for x in d["dicas"]]
    assert origens and set(origens) <= {"ia_revisado"} and "ia" not in origens
    assert d["titulo"] is None and d["acompanhamento"] is None


def test_sem_partidas_jogos_vazio_e_convite(catalogos, groq_falsa):
    d = gerar(*preparar(jogar=False))["destaques"]
    assert d["jogos"] == [] and d["dicas"] == [] and d["recado"] is None
    assert d["pratica"]["convite"] is True and d["pratica"]["instrucoes"] == []
    assert d["titulo"] is None and d["acompanhamento"] is None and groq_falsa["chamadas"] == []


def test_titulo_sozinho_nao_poe_aviso_no_texto(catalogos, groq_falsa):
    groq_falsa["resposta"] = json.dumps({"titulo": "Uma semana de palavras"})
    r = gerar(*preparar())
    assert r["destaques"]["titulo"]["texto"] == "Uma semana de palavras" and AVISO not in r["text"]


def test_lista_e_leitura_devolvem_destaques_sem_chamar_groq(catalogos, groq_falsa):
    h, cid = preparar()
    rel = gerar(h, cid)
    groq_falsa["chamadas"].clear()
    lista = client.get("/api/reports", headers=h, params={"child_id": cid}).json()
    um = client.get(f"/api/reports/{rel['id']}", headers=h).json()
    assert lista[0]["destaques"] == rel["destaques"] == um["destaques"] and groq_falsa["chamadas"] == []


def test_relatorio_antigo_sem_destaques(catalogos):
    h, cid = preparar()
    with connect() as db:
        rid = db.execute("INSERT INTO relatorios(id_crianca, periodo_inicio, periodo_fim, texto) "
                         "VALUES (?,?,?,?) RETURNING id_relatorio",
                         (int(cid), "2026-10-01", "2026-10-07", "Relatório antigo")).fetchone()["id_relatorio"]
        db.execute("UPDATE relatorios SET destaques='{quebrado' WHERE id_relatorio=?", (rid,))
    r = client.get(f"/api/reports/{rid}", headers=h).json()
    assert r["destaques"] is None and r["text"] == "Relatório antigo"


def test_migracao_idempotente():
    init_db()
    init_db()
    sql = ("SELECT column_name AS name FROM information_schema.columns WHERE table_name='relatorios'"
           if is_postgres() else "PRAGMA table_info(relatorios)")
    with connect() as db:
        colunas = {c["name"] for c in db.execute(sql).fetchall()}
    assert "destaques" in colunas


def test_destaques_com_dado_estranho_viram_none():
    """Os cartões são opcionais: um jogo sem os campos esperados não derruba o relatório."""
    assert destaques.montar(nivel="9", games=[{"total_matches": 1}], ev=None, conteudo=None, idade=9,
                            jogou=True) is None


# Recado e desafio da semana, na área da criança
def test_recado_da_semana_traz_recado_e_desafio(catalogos, groq_falsa):
    h, cid = preparar(dificil=True)
    gerar(h, cid)
    groq_falsa["chamadas"].clear()
    r = client.get("/api/reports/recado-da-semana", params={"child_id": cid}, headers=h)
    assert r.status_code == 200
    d = r.json()
    assert d["recado"] == {"texto": RESPOSTA["recado"], "origem": "ia"}
    assert d["desafio"] == {"jogo": "ligar", "nome": "Ligue ao nome"}
    assert groq_falsa["chamadas"] == []  # só lê o que já foi gravado
    assert "text" not in d and "Ana" not in json.dumps(d, ensure_ascii=False)


def test_recado_da_semana_vazio_sem_relatorio(catalogos):
    h, cid = preparar()
    assert client.get("/api/reports/recado-da-semana", params={"child_id": cid}, headers=h).json() == {
        "recado": None, "desafio": None, "gerado_em": None}


def test_recado_da_semana_ignora_relatorio_antigo(catalogos, groq_falsa):
    h, cid = preparar()
    rel = gerar(h, cid)
    with connect() as db:
        db.execute("UPDATE relatorios SET gerado_em='2020-01-01 10:00:00' WHERE id_relatorio=?", (int(rel["id"]),))
    assert client.get("/api/reports/recado-da-semana", params={"child_id": cid}, headers=h).json()["recado"] is None


def test_recado_da_semana_so_da_propria_crianca(catalogos, groq_falsa):
    h, cid = preparar()
    gerar(h, cid)
    outro = client.post("/api/auth/register", json={"name": "Outro Responsável", "email": "outro@example.com",
                                                    "password": "SenhaForte123", "accepted_terms": True})
    h2 = {"Authorization": f"Bearer {outro.json()['access_token']}"}
    assert client.get("/api/reports/recado-da-semana", params={"child_id": cid}, headers=h2).status_code == 404
