"""Cliente da Groq no servidor: nunca levanta, pausa depois de falha e respeita o teto diário."""
import httpx
import pytest

from app.core.config import settings
from app.ia import groq
from scripts import praticas_groq

DIA = 1_800_000_000.0  # um instante fixo (UTC)


class Transporte(httpx.BaseTransport):
    def __init__(self, status=200, conteudo='{"ok": true}'):
        self.status, self.conteudo, self.pedidos = status, conteudo, []

    def handle_request(self, request):
        self.pedidos.append(request)
        if self.status == 200:
            return httpx.Response(200, json={"choices": [{"message": {"content": self.conteudo}}]})
        return httpx.Response(self.status, json={})


@pytest.fixture
def ambiente(monkeypatch):
    groq.disjuntor.zerar()
    monkeypatch.setattr(settings, "groq_api_key", "chave-falsa")
    monkeypatch.setattr(settings, "ia_ao_vivo", True)
    monkeypatch.setattr(settings, "ia_teto_diario", 300)
    monkeypatch.setattr(settings, "ia_timeout_segundos", 6.0)
    estado = {"transporte": Transporte(), "kwargs": []}
    original = httpx.Client

    def cliente(*a, **k):
        estado["kwargs"].append(k)
        k["transport"] = estado["transporte"]
        return original(*a, **k)
    monkeypatch.setattr(groq.httpx, "Client", cliente)
    yield estado
    groq.disjuntor.zerar()


def _proibido(*a, **k):
    raise AssertionError("abriu conexão")


def test_sem_chave_nao_abre_conexao(ambiente, monkeypatch):
    monkeypatch.setattr(settings, "groq_api_key", "")
    monkeypatch.setattr(groq.httpx, "Client", _proibido)
    assert groq.chamar_no_servidor([], agora=DIA) is None


def test_desligado_por_config(ambiente, monkeypatch):
    monkeypatch.setattr(settings, "ia_ao_vivo", False)
    monkeypatch.setattr(groq.httpx, "Client", _proibido)
    assert groq.chamar_no_servidor([], agora=DIA) is None


def test_sucesso_devolve_texto(ambiente):
    assert groq.chamar_no_servidor([{"role": "user", "content": "x"}], agora=DIA) == '{"ok": true}'


@pytest.mark.parametrize("status", [429, 401, 500])
def test_falha_abre_disjuntor_por_10_minutos(ambiente, status):
    ambiente["transporte"] = Transporte(status=status)
    assert groq.chamar_no_servidor([], agora=DIA) is None
    ambiente["transporte"] = Transporte()
    assert groq.chamar_no_servidor([], agora=DIA + 599) is None
    assert ambiente["transporte"].pedidos == []
    assert groq.chamar_no_servidor([], agora=DIA + 601) == '{"ok": true}'


def test_teto_diario(ambiente, monkeypatch):
    monkeypatch.setattr(settings, "ia_teto_diario", 2)
    assert groq.chamar_no_servidor([], agora=DIA) and groq.chamar_no_servidor([], agora=DIA + 1)
    assert groq.chamar_no_servidor([], agora=DIA + 2) is None
    assert len(ambiente["transporte"].pedidos) == 2
    assert groq.chamar_no_servidor([], agora=DIA + 86400) == '{"ok": true}'


def test_uma_chamada_sem_retry_e_timeout(ambiente):
    groq.chamar_no_servidor([], agora=DIA)
    assert ambiente["kwargs"][0]["timeout"] == 6.0
    assert len(ambiente["transporte"].pedidos) == 1


def test_comandos_da_equipe_continuam():
    assert praticas_groq.chamar_groq is groq.chamar_groq
    assert praticas_groq.GroqIndisponivel is groq.GroqIndisponivel


def test_400_de_um_pedido_nao_pausa_e_mostra_o_codigo(ambiente, caplog):
    """HTTP 400 (ex.: a resposta do modelo não era JSON) é problema daquele pedido, não da Groq:
    o relatório usa o catálogo, mas o próximo relatório já pode tentar de novo."""
    class Erro400(Transporte):
        def handle_request(self, request):
            self.pedidos.append(request)
            return httpx.Response(400, json={"error": {"code": "json_validate_failed", "message": "texto longo"}})
    ambiente["transporte"] = Erro400()
    with caplog.at_level("WARNING", logger="cantinho.ia"):
        assert groq.chamar_no_servidor([], agora=DIA) is None
    assert "json_validate_failed" in caplog.text and "chave-falsa" not in caplog.text
    ambiente["transporte"] = Transporte()
    assert groq.chamar_no_servidor([], agora=DIA + 1) == '{"ok": true}'


def test_servidor_nao_usa_modo_json_da_groq(ambiente):
    """No modo JSON a Groq recusa (400 json_validate_failed) quando o modelo erra o formato;
    no servidor o próprio app lê e valida a resposta, então o modo fica desligado."""
    import json as _json
    groq.chamar_no_servidor([], agora=DIA)
    corpo = _json.loads(ambiente["transporte"].pedidos[0].content)
    assert "response_format" not in corpo


def test_comandos_da_equipe_continuam_com_modo_json(ambiente):
    import json as _json
    groq.chamar_groq([], chave="chave-falsa")
    assert _json.loads(ambiente["transporte"].pedidos[0].content)["response_format"] == {"type": "json_object"}


class Com429(Transporte):
    def __init__(self, cabecalhos=None):
        super().__init__(status=429)
        self.cabecalhos = cabecalhos or {}

    def handle_request(self, request):
        self.pedidos.append(request)
        return httpx.Response(429, json={"error": {"code": "rate_limit_exceeded"}}, headers=self.cabecalhos)


def test_servidor_pede_raciocinio_curto(ambiente):
    import json as _json
    groq.chamar_no_servidor([], agora=DIA)
    corpo = _json.loads(ambiente["transporte"].pedidos[0].content)
    assert corpo["reasoning_effort"] == "low" and corpo["max_completion_tokens"] == groq.MAX_TOKENS_RESPOSTA


def test_comandos_da_equipe_sem_campos_do_servidor(ambiente):
    import json as _json
    groq.chamar_groq([], chave="chave-falsa")
    corpo = _json.loads(ambiente["transporte"].pedidos[0].content)
    assert "reasoning_effort" not in corpo and "max_completion_tokens" not in corpo


@pytest.mark.parametrize("cabecalhos,pausa", [({"retry-after": "42"}, 42), ({"retry-after": "99999"}, 600),
                                               ({}, 600), ({"retry-after": "abc"}, 600)])
def test_429_pausa_pelo_retry_after(ambiente, cabecalhos, pausa):
    ambiente["transporte"] = Com429(cabecalhos)
    assert groq.chamar_no_servidor([], agora=DIA) is None
    assert groq.disjuntor.aberto_ate - DIA == pytest.approx(pausa)
