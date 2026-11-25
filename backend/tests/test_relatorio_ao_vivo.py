"""Relatório com IA ao vivo: textos da Groq nas seções de sempre e reserva no catálogo."""
import json
import time

import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.ia import ao_vivo, groq
from app.main import app
from app.modules.auth.repository import repository as users
from app.modules.children.repository import repository as kids
from app.modules.reports import conteudo_aprovado, praticas
from app.modules.reports.delivery import clear_outbox
from app.modules.sessions.repository import repository as sessions

client = TestClient(app)
AVISO = "Parte deste relatório foi escrita com ajuda de inteligência artificial."
REV = {"status": "aprovado", "origem": "groq", "modelo": "openai/gpt-oss-20b", "gerado_em": "2026-11-25T10:00:00+00:00",
       "rascunho_arquivo": "t.json", "revisado_por": "AK", "revisado_em": "2026-11-25"}
RESPOSTA = {
    "acompanhamento": "Ligue ao nome continua desafiador. Joguem juntos com calma e comemorem cada acerto.",
    "recado": "Você está aprendendo um pouco a cada partida. Siga no seu ritmo.",
    "dicas": {"ligar": "Antes de jogar, digam juntos em voz alta o nome de três objetos da casa."},
    "pratica": {"tema": "palavras", "titulo": "Palavras ao vivo", "jogos": ["ligar"],
                "instrucoes": ["Jogue uma partida de Ligue ao nome com calma.",
                               "Depois, aponte três coisas da sua casa e diga o nome de cada uma."]},
}


@pytest.fixture
def catalogos(tmp_path, monkeypatch):
    users.clear(); kids.clear(); sessions.clear(); clear_outbox()
    arq = {n: tmp_path / f"{n}.json" for n in ("praticas", "recados", "dicas")}
    arq["praticas"].write_text(json.dumps({"itens": [{**REV, "id": "palavras-9-01", "tema": "palavras", "nivel": "9",
        "titulo": "Palavras do catálogo", "jogos": ["ligar"],
        "instrucoes": ["Jogue uma partida de Ligue ao nome no seu ritmo."]}]}), encoding="utf-8")
    arq["recados"].write_text(json.dumps({"itens": [{**REV, "id": "recado-dificil-9-01", "situacao": "dificil",
        "nivel": "9", "texto": "Recado do catálogo para você."}]}), encoding="utf-8")
    arq["dicas"].write_text(json.dumps({"itens": [{**REV, "id": "dica-ligar-01", "jogo": "ligar", "situacao": "dificil",
        "texto": "Dica do catálogo: joguem juntos com calma, sem pressa."}]}), encoding="utf-8")
    monkeypatch.setenv("PRATICAS_APROVADAS_PATH", str(arq["praticas"]))
    monkeypatch.setenv("RECADOS_APROVADOS_PATH", str(arq["recados"]))
    monkeypatch.setenv("DICAS_APROVADAS_PATH", str(arq["dicas"]))
    praticas._cache["chave"] = None
    conteudo_aprovado._cache.clear()
    groq.disjuntor.zerar()
    yield
    groq.disjuntor.zerar()


@pytest.fixture
def groq_falsa(monkeypatch):
    estado = {"chamadas": [], "resposta": json.dumps(RESPOSTA)}

    def falsa(mensagens, **k):
        estado["chamadas"].append(mensagens)
        return estado["resposta"]
    monkeypatch.setattr(ao_vivo, "chamar_no_servidor", falsa)
    return estado


def preparar(dificil=True, jogar=True):
    r = client.post("/api/auth/register", json={"name": "Responsável Fictício", "email": "vivo@example.com",
                                                 "password": "SenhaForte123", "accepted_terms": True})
    h = {"Authorization": f"Bearer {r.json()['access_token']}"}
    cid = client.post("/api/children", json={"name": "Ana Demo", "age": 9}, headers=h).json()["id"]
    if jogar:
        client.post("/api/sessions", json={"child_id": cid, "game_id": "ligar", "correct_answers": 5,
                                           "incorrect_answers": 6 if dificil else 0, "completed": True,
                                           "duration_seconds": 60, "played_at": "2026-11-10T10:00:00+00:00"}, headers=h)
    return h, cid


def gerar(h, cid):
    r = client.post("/api/reports", json={"child_id": cid, "period_start": "2026-11-09", "period_end": "2026-11-15"},
                    headers=h)
    assert r.status_code == 201, r.text
    return r.json()


def test_relatorio_com_textos_ao_vivo(catalogos, groq_falsa):
    t = gerar(*preparar())["text"]
    assert "Como Ana Demo evoluiu\n- Ligue ao nome continua desafiador." in t
    assert "- Como ajudar em Ligue ao nome: Antes de jogar, digam juntos" in t
    assert "Recado para Ana Demo\n- Você está aprendendo um pouco a cada partida." in t
    assert "- Palavras ao vivo" in t and "Palavras do catálogo" not in t
    assert t.endswith("\n\n" + AVISO)
    assert len(groq_falsa["chamadas"]) == 1


def test_groq_indisponivel_usa_catalogo(catalogos, monkeypatch):
    monkeypatch.setattr(ao_vivo, "chamar_no_servidor", lambda m, **k: None)
    t = gerar(*preparar())["text"]
    assert "Dica do catálogo" in t and "Recado do catálogo" in t and "Palavras do catálogo" in t
    assert AVISO not in t


def test_resposta_ruim_cai_no_catalogo_pedaco_por_pedaco(catalogos, groq_falsa):
    groq_falsa["resposta"] = json.dumps({**RESPOSTA, "recado": "Incentive a criança a jogar.",
                                         "pratica": {**RESPOSTA["pratica"], "jogos": ["xadrez"]}})
    t = gerar(*preparar())["text"]
    assert "Recado do catálogo" in t and "Palavras do catálogo" in t
    assert "Antes de jogar, digam juntos" in t and t.endswith(AVISO)


def test_groq_lenta_nao_trava(catalogos, monkeypatch):
    monkeypatch.setattr(settings, "groq_api_key", "chave-falsa")
    monkeypatch.setattr(settings, "ia_timeout_segundos", 0.5)

    class Lento(httpx.BaseTransport):
        def handle_request(self, request):
            raise httpx.ReadTimeout("demorou", request=request)
    original = httpx.Client
    monkeypatch.setattr(groq.httpx, "Client", lambda *a, **k: original(*a, **{**k, "transport": Lento()}))
    inicio = time.monotonic()
    t = gerar(*preparar())["text"]
    assert time.monotonic() - inicio < 8
    assert "Dica do catálogo" in t and AVISO not in t


def test_sem_partidas_nao_chama_groq(catalogos, groq_falsa):
    t = gerar(*preparar(jogar=False))["text"]
    assert groq_falsa["chamadas"] == [] and "Que tal começar por" in t and AVISO not in t


def test_envio_e_leitura_nao_chamam_groq(catalogos, groq_falsa):
    h, cid = preparar()
    rel = gerar(h, cid)
    assert len(groq_falsa["chamadas"]) == 1
    assert client.get(f"/api/reports/{rel['id']}", headers=h).status_code == 200
    assert client.get("/api/reports", headers=h).status_code == 200
    assert client.post(f"/api/reports/{rel['id']}/send", json={"channel": "console"}, headers=h).status_code == 200
    assert len(groq_falsa["chamadas"]) == 1


def test_payload_do_relatorio_sem_dados_pessoais(catalogos, groq_falsa):
    gerar(*preparar())
    bruto = json.dumps(groq_falsa["chamadas"][0], ensure_ascii=False).lower()
    for proibido in ("ana", "vivo@example.com", "fictício", "\"9 anos", "\"erros\"", "\"acertos\"", "2026-11"):
        assert proibido not in bruto, proibido


def test_relatorios_antigos_intactos(catalogos, groq_falsa):
    h, cid = preparar()
    antigo = gerar(h, cid)
    groq_falsa["resposta"] = "{}"
    gerar(h, cid)
    assert client.get(f"/api/reports/{antigo['id']}", headers=h).json()["text"] == antigo["text"]
