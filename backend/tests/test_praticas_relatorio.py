"""Testes de aceite: "Sugestão de prática em casa" nos novos relatórios, sem Groq no fluxo das famílias."""
import json
import sys
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.auth.repository import repository as users
from app.modules.children.repository import repository as kids
from app.modules.reports import praticas
from app.modules.reports.delivery import clear_outbox, get_outbox
from app.modules.sessions.repository import repository as sessions

client = TestClient(app)
SECAO = "Sugestão de prática em casa"
BACKEND = Path(__file__).resolve().parents[1]


def setup_function():
    users.clear(); kids.clear(); sessions.clear(); clear_outbox()


def item(id_, nivel="8", tema=None, **over):
    tema = tema or id_.split("-")[0]
    base = {
        "id": id_, "status": "aprovado", "origem": "groq", "modelo": "openai/gpt-oss-20b",
        "gerado_em": "2026-11-25T03:00:00+00:00", "rascunho_arquivo": "teste.json",
        "revisado_por": "EQ", "revisado_em": "2026-11-25",
        "tema": tema, "nivel": nivel, "titulo": f"Título {id_}", "jogos": ["cores", "corforma"],
        "instrucoes": ["Joguem juntos uma partida de Acerte a cor.", "Depois, procurem juntos algo azul pela casa."],
    }
    base.update(over)
    return base


@pytest.fixture
def catalogo(tmp_path, monkeypatch):
    caminho = tmp_path / "praticas_aprovadas.json"
    monkeypatch.setenv("PRATICAS_APROVADAS_PATH", str(caminho))

    def gravar(itens=None, bruto=None):
        caminho.write_text(bruto if bruto is not None else json.dumps({"versao": 1, "itens": itens or []}),
                           encoding="utf-8")
        praticas._cache["chave"] = None
        return caminho
    return gravar


def register(email="pratica@example.com"):
    r = client.post("/api/auth/register", json={"name": "Responsável Fictício", "email": email,
                                                 "password": "SenhaForte123", "accepted_terms": True})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def child(h, name="Criança Demo", age=8):
    return client.post("/api/children", json={"name": name, "age": age}, headers=h).json()["id"]


def play(h, cid, game, ok, err, done, at="2026-11-10T10:00:00+00:00", dur=60):
    r = client.post("/api/sessions", json={"child_id": cid, "game_id": game, "correct_answers": ok,
                                            "incorrect_answers": err, "completed": done,
                                            "duration_seconds": dur, "played_at": at}, headers=h)
    assert r.status_code == 201


def gen(h, cid):
    r = client.post("/api/reports", json={"child_id": cid, "period_start": "2026-11-01", "period_end": "2026-11-15"},
                    headers=h)
    assert r.status_code == 201, r.text
    return r.json()


def texto_sem_catalogo(h, cid, catalogo):
    catalogo([])
    return gen(h, cid)["text"]


# --- os três cenários de partidas pedidos ---------------------------------------------------------

@pytest.mark.parametrize("cenario", ["concluidas", "sem_partidas", "so_abandonadas"])
def test_secao_nos_tres_cenarios_e_resto_intacto(cenario, catalogo):
    h = register(); cid = child(h)
    if cenario == "concluidas":
        play(h, cid, "cores", 5, 0, True); play(h, cid, "ligar", 5, 5, True, at="2026-11-11T10:00:00+00:00")
    elif cenario == "so_abandonadas":
        play(h, cid, "cores", 1, 0, False, dur=10)
    original = texto_sem_catalogo(h, cid, catalogo)
    catalogo([item("cores-8-01")])
    novo = gen(h, cid)["text"]
    assert novo.startswith(original) and novo != original
    secao = novo[len(original):]
    assert secao.startswith("\n\n" + SECAO + "\n")
    if cenario == "sem_partidas":
        assert "Não houve jogos neste período." in novo
        # sem partidas: só o convite, sem instruções que falam de um jogo ainda não jogado
        assert secao == "\n\n" + SECAO + "\n- Que tal começar por Acerte a cor ou Cor e forma? Joguem juntos, com calma."
        return
    assert "- Título cores-8-01" in secao and "- Jogos no app: Acerte a cor e Cor e forma." in secao
    assert "- Depois, procurem juntos algo azul pela casa." in secao
    if cenario == "so_abandonadas":
        assert "Ainda não terminou nenhum jogo neste período." in novo


@pytest.mark.parametrize("cenario", ["concluidas", "sem_partidas", "so_abandonadas"])
def test_sem_sugestao_valida_texto_original_nos_tres_cenarios(cenario, catalogo):
    h = register(); cid = child(h)
    if cenario == "concluidas":
        play(h, cid, "cores", 5, 0, True)
    elif cenario == "so_abandonadas":
        play(h, cid, "cores", 0, 0, False, dur=5)
    original = texto_sem_catalogo(h, cid, catalogo)
    catalogo([item("cores-8-01", status="rascunho")])
    assert gen(h, cid)["text"] == original


# --- rascunho, simulação e revisão ---------------------------------------------------------------

def test_rascunho_nao_aparece(catalogo, tmp_path, monkeypatch):
    catalogo([item("cores-8-01", status="rascunho"), item("cores-8-02", origem="manual", revisado_por="")])
    rascunhos = tmp_path / "praticas_rascunhos"; rascunhos.mkdir()
    (rascunhos / "x.json").write_text(json.dumps({"itens": [item("cores-8-03", status="rascunho")]}), encoding="utf-8")
    h = register(); cid = child(h)
    assert SECAO not in gen(h, cid)["text"]


def test_simulacao_aprovada_e_descartada(catalogo):
    catalogo([item("cores-8-01", origem="simulacao")])
    h = register(); cid = child(h)
    assert SECAO not in gen(h, cid)["text"]


def test_reserva_manual_do_repositorio_nao_e_lida():
    caminho = BACKEND / "app" / "modules" / "reports" / "praticas_reserva_para_revisao.json"
    assert praticas.CAMINHO_PADRAO.name == "praticas_aprovadas.json"
    assert all(i["status"] == "rascunho" for i in json.loads(caminho.read_text(encoding="utf-8"))["itens"])


def test_catalogo_aprovado_do_repositorio_e_valido():
    dados = json.loads(praticas.CAMINHO_PADRAO.read_text(encoding="utf-8"))
    assert isinstance(dados["versao"], int) and isinstance(dados["itens"], list)
    from app.praticas.validacao import validar_item
    for i in dados["itens"]:
        assert validar_item(i, exigir_aprovado=True) == [], i.get("id")


# --- escolha ----------------------------------------------------------------------------------------

def test_primeiro_aprovado_por_id_independe_de_crianca_e_desempenho(catalogo):
    catalogo([item("formas-8-01", tema="formas", jogos=["encaixe"], titulo="Formas primeiro"),
              item("cores-8-02", titulo="Cores dois"), item("cores-8-01", titulo="Cores um")])
    h = register(); a = child(h, "Criança A"); b = child(h, "Criança B")
    play(h, a, "cores", 5, 0, True); play(h, b, "ligar", 5, 5, True)
    ta, tb = gen(h, a)["text"], gen(h, b)["text"]
    assert "- Cores um" in ta and "- Cores um" in tb


@pytest.mark.parametrize("idade,esperado", [(5, "nivel 8"), (9, "nivel 9"), (12, "nivel 10")])
def test_nivel_efetivo_pela_idade(catalogo, idade, esperado):
    catalogo([item("cores-8-01", titulo="nivel 8"), item("cores-9-01", nivel="9", titulo="nivel 9"),
              item("cores-10-01", nivel="10", titulo="nivel 10")])
    h = register(); cid = child(h, age=idade)
    play(h, cid, "cores", 5, 0, True)
    assert f"- {esperado}" in gen(h, cid)["text"]


def test_nivel_sem_item_relatorio_normal(catalogo):
    h = register(); cid = child(h, age=8)
    original = texto_sem_catalogo(h, cid, catalogo)
    catalogo([item("cores-10-01", nivel="10")])
    assert gen(h, cid)["text"] == original


@pytest.mark.parametrize("bruto", ["", "{", "[]", '{"itens": "x"}', '{"itens": [{"id": "cores-8-01"}]}'])
def test_catalogo_ausente_ou_invalido_relatorio_normal(catalogo, bruto):
    h = register(); cid = child(h)
    original = texto_sem_catalogo(h, cid, catalogo)
    catalogo(bruto=bruto)
    assert gen(h, cid)["text"] == original


def test_catalogo_inexistente(monkeypatch, tmp_path):
    monkeypatch.setenv("PRATICAS_APROVADAS_PATH", str(tmp_path / "nao_existe.json"))
    h = register(); cid = child(h)
    assert SECAO not in gen(h, cid)["text"]


def test_item_invalido_aprovado_e_ignorado(catalogo):
    catalogo([item("cores-8-01", jogos=["frutas"]),
              item("cores-8-02", instrucoes=["No jogo Acerte a cor vai aparecer o azul."])])
    h = register(); cid = child(h)
    assert SECAO not in gen(h, cid)["text"]


def test_erro_inesperado_nao_quebra_relatorio(catalogo, monkeypatch):
    catalogo([item("cores-8-01")])
    monkeypatch.setattr(praticas, "escolher", lambda idade: (_ for _ in ()).throw(RuntimeError("x")))
    h = register(); cid = child(h)
    r = client.post("/api/reports", json={"child_id": cid, "period_start": "2026-11-01", "period_end": "2026-11-15"},
                    headers=h)
    assert r.status_code == 201 and SECAO not in r.json()["text"]


# --- relatórios antigos e envio manual --------------------------------------------------------------

def test_relatorios_antigos_intactos(catalogo):
    h = register(); cid = child(h)
    catalogo([])
    antigo = gen(h, cid)
    catalogo([item("cores-8-01")])
    novo = gen(h, cid)
    assert SECAO in novo["text"]
    assert client.get(f"/api/reports/{antigo['id']}", headers=h).json()["text"] == antigo["text"]
    lista = {r["id"]: r["text"] for r in client.get("/api/reports", headers=h).json()}
    assert lista[antigo["id"]] == antigo["text"] and SECAO not in lista[antigo["id"]]


def test_secao_vai_no_envio_manual(catalogo):
    catalogo([item("cores-8-01")])
    h = register(); cid = child(h)
    rel = gen(h, cid)
    assert get_outbox() == []  # nada é enviado sem ação do responsável
    r = client.post(f"/api/reports/{rel['id']}/send", json={"channel": "console"}, headers=h)
    assert r.status_code == 200, r.text
    assert any(SECAO in e["text"] for e in get_outbox())


# --- sem chave da Groq (padrão dos testes): zero chamadas no fluxo das famílias -----------------

def test_fluxo_familias_zero_groq(catalogo, monkeypatch):
    catalogo([item("cores-8-01")])
    chamadas = []

    def bloqueia(*a, **k):
        chamadas.append(a)
        raise AssertionError("chamada externa no fluxo das famílias")

    # Rede real do httpx (o TestClient usa transporte próprio, sem rede) e o cliente Groq.
    monkeypatch.setattr(httpx.HTTPTransport, "handle_request", bloqueia)
    monkeypatch.setattr(httpx, "post", bloqueia)
    import scripts.praticas_groq as groq
    monkeypatch.setattr(groq, "chamar_groq", bloqueia)

    h = register("familia@example.com")
    assert client.post("/api/auth/login", json={"email": "familia@example.com", "password": "SenhaForte123"}).status_code == 200
    assert client.get("/api/auth/me", headers=h).status_code == 200
    assert client.post("/api/auth/guest").status_code in (200, 201)
    cid = child(h)
    assert client.get("/api/children", headers=h).status_code == 200
    assert client.get("/api/games", headers=h).status_code == 200
    assert client.get("/api/games/cores", headers=h).status_code == 200
    play(h, cid, "cores", 5, 0, True); play(h, cid, "ligar", 1, 2, False)
    assert client.get("/api/sessions", headers=h).status_code == 200
    assert client.get("/api/dashboard/summary", headers=h).status_code == 200
    rel = gen(h, cid)
    assert SECAO in rel["text"]
    assert client.post(f"/api/reports/{rel['id']}/send", json={"channel": "console"}, headers=h).status_code == 200
    assert client.post("/api/auth/logout", headers=h).status_code in (200, 204)
    assert chamadas == []


def test_groq_so_e_chamada_na_geracao_do_relatorio():
    """Regra nova (IA ao vivo): o endereço da Groq só existe em app/ia/groq.py, o cliente do servidor
    só é usado por app/ia/ao_vivo.py, e a IA ao vivo só é chamada pela geração de relatório."""
    app_dir = BACKEND / "app"
    for arquivo in app_dir.rglob("*.py"):
        rel = arquivo.relative_to(app_dir).as_posix()
        conteudo = arquivo.read_text(encoding="utf-8")
        assert "import scripts" not in conteudo and "from scripts" not in conteudo, rel
        if rel != "ia/groq.py":
            assert "api.groq.com" not in conteudo, rel
        if rel not in ("ia/groq.py", "ia/ao_vivo.py"):
            assert "chamar_no_servidor" not in conteudo and "chamar_groq" not in conteudo, rel
        if rel not in ("ia/ao_vivo.py", "modules/reports/router.py"):
            assert "ao_vivo.gerar" not in conteudo and "from app.ia import ao_vivo" not in conteudo, rel


# --- prática escolhida pelo jogo mais difícil ---------------------------------------------------------

def test_pratica_do_jogo_dificil(catalogo):
    catalogo([item("cores-9-01", nivel="9", titulo="Cores"),
              item("palavras-9-01", nivel="9", tema="palavras", jogos=["ligar"], titulo="Palavras")])
    h = register(); cid = child(h, age=9)
    play(h, cid, "cores", 5, 0, True); play(h, cid, "ligar", 5, 6, True)
    t = gen(h, cid)["text"]
    assert "- Palavras" in t and "- Cores\n" not in t


def test_sem_pratica_do_jogo_dificil_usa_primeira_do_nivel(catalogo):
    catalogo([item("cores-9-01", nivel="9", titulo="Cores")])
    h = register(); cid = child(h, age=9)
    play(h, cid, "ligar", 5, 6, True)
    assert "- Cores" in gen(h, cid)["text"]


@pytest.mark.parametrize("idade", [5, 8, 9, 10, 12])
def test_todas_as_idades_recebem_pratica(catalogo, idade):
    catalogo([item("cores-8-01"), item("cores-9-01", nivel="9"), item("cores-10-01", nivel="10")])
    h = register(); cid = child(h, age=idade)
    play(h, cid, "cores", 5, 0, True)
    assert SECAO in gen(h, cid)["text"]


def test_desempenho_nao_sai_do_servidor(catalogo, monkeypatch):
    def proibido(*a, **k):
        raise AssertionError("tentou abrir conexão externa")
    monkeypatch.setattr(httpx, "Client", proibido)
    catalogo([item("palavras-8-01", tema="palavras", jogos=["ligar"])])
    h = register(); cid = child(h)
    play(h, cid, "ligar", 5, 6, True)
    assert "- Título palavras-8-01" in gen(h, cid)["text"]


def test_rodizio_entre_praticas_do_mesmo_jogo(catalogo):
    catalogo([item("cores-8-01", titulo="Cores"),
              item("formas-8-01", tema="formas", jogos=["encaixe", "corforma"], titulo="Formas")])
    h = register(); cid = child(h)
    play(h, cid, "corforma", 5, 6, True)
    titulos = []
    for _ in range(3):
        t = gen(h, cid)["text"]
        titulos.append("Cores" if "- Cores\n" in t else "Formas" if "- Formas\n" in t else "?")
    assert titulos == ["Cores", "Formas", "Cores"]


def test_rodizio_e_por_crianca(catalogo):
    catalogo([item("cores-8-01", titulo="Cores"), item("cores-8-02", titulo="Outra")])
    h = register(); a = child(h, "Criança A"); b = child(h, "Criança B")
    play(h, a, "cores", 5, 0, True); play(h, b, "cores", 5, 0, True)
    gen(h, a)
    assert "- Cores\n" in gen(h, b)["text"]
