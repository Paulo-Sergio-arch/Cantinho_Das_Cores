"""Comando interno scripts.gerar_praticas com a Groq sempre simulada (sem rede, sem chave real)."""
import hashlib
import json
import subprocess
import sys
from pathlib import Path

import pytest

from scripts import gerar_praticas, praticas_groq

BACKEND = Path(__file__).resolve().parents[1]
APROVADAS = BACKEND / "app" / "modules" / "reports" / "praticas_aprovadas.json"


class GroqFalsa:
    def __init__(self, respostas=None, falhar_na=None):
        self.chamadas = []
        self.respostas = respostas
        self.falhar_na = falhar_na

    def __call__(self, mensagens, *, chave, modelo=praticas_groq.MODELO_PADRAO):
        self.chamadas.append(mensagens)
        if self.falhar_na and len(self.chamadas) == self.falhar_na:
            raise praticas_groq.GroqIndisponivel("HTTP 429")
        dados = json.loads(mensagens[1]["content"])
        jogo = dados["jogos_permitidos"][0]
        if self.respostas:
            return self.respostas[len(self.chamadas) - 1]
        return json.dumps({"titulo": f"Prática com {jogo['nome']}",
                           "jogos": [jogo["id"]],
                           "instrucoes": [f"Joguem juntos uma partida de {jogo['nome']}.",
                                          "Depois, conversem com calma sobre a brincadeira."]})


@pytest.fixture
def pasta(tmp_path, monkeypatch):
    monkeypatch.setattr(gerar_praticas, "PASTA_RASCUNHOS", tmp_path)
    monkeypatch.setenv("GROQ_API_KEY", "chave-falsa-de-teste")
    return tmp_path


def _saida(pasta):
    arquivos = list(pasta.glob("*.json"))
    assert len(arquivos) == 1
    return json.loads(arquivos[0].read_text(encoding="utf-8"))


def _hash(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def test_comando_nao_importa_catalogo_nem_banco():
    codigo = (
        "import json, sys; import scripts.gerar_praticas;"
        "print(json.dumps(sorted(m for m in sys.modules if m.startswith('app.'))))"
    )
    r = subprocess.run([sys.executable, "-c", codigo], cwd=BACKEND, capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr
    carregados = set(json.loads(r.stdout.strip().splitlines()[-1]))
    assert "app.modules.games.catalog" not in carregados
    assert "app.core.database" not in carregados and "app.core.config" not in carregados


def test_payload_so_temas_e_catalogo(pasta):
    groq = GroqFalsa()
    assert gerar_praticas.main(["--lote", "2"], chamar=groq) == 0
    for msgs in groq.chamadas:
        assert [m["role"] for m in msgs] == ["system", "user"]
        dados = json.loads(msgs[1]["content"])
        assert set(dados) == {"temas", "tema", "nivel", "jogos_permitidos"}
        for j in dados["jogos_permitidos"]:
            assert set(j) == {"id", "nome", "descricao"}
        assert set(dados["tema"]) == {"id", "rotulo"} and set(dados["nivel"]) == {"id", "rotulo"}
        bruto = json.dumps(msgs, ensure_ascii=False).lower()
        for proibido in ("@", "child", "perfil", "historico", "histórico", "desempenho", "pontua", "partidas"):
            assert proibido not in bruto, proibido


def test_lote_limitado(pasta):
    with pytest.raises(SystemExit):
        gerar_praticas.main(["--lote", "7"], chamar=GroqFalsa())
    groq = GroqFalsa()
    assert gerar_praticas.main(["--lote", "6"], chamar=groq) == 0
    assert len(groq.chamadas) == 6
    assert _saida(pasta)["chamadas_externas"] == 6


def test_sem_retry_para_no_primeiro_erro(pasta):
    groq = GroqFalsa(falhar_na=2)
    assert gerar_praticas.main(["--lote", "4"], chamar=groq) == 1
    assert len(groq.chamadas) == 2
    s = _saida(pasta)
    assert len(s["itens"]) == 1 and "429" in s["interrompido"]


def test_sem_chave_nao_chama(pasta, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "")
    groq = GroqFalsa()
    assert gerar_praticas.main(["--lote", "2"], chamar=groq) == 3
    assert groq.chamadas == [] and list(pasta.glob("*.json")) == []


def test_cliente_real_sem_chave_nao_abre_conexao(monkeypatch):
    def proibido(*a, **k):
        raise AssertionError("tentou abrir conexão")
    monkeypatch.setattr(praticas_groq.httpx, "Client", proibido)
    with pytest.raises(praticas_groq.GroqIndisponivel):
        praticas_groq.chamar_groq([], chave="")


def test_saida_sempre_rascunho_e_catalogo_aprovado_intacto(pasta):
    antes = _hash(APROVADAS)
    assert gerar_praticas.main(["--lote", "3"], chamar=GroqFalsa()) == 0
    s = _saida(pasta)
    assert s["itens"] and all(i["status"] == "rascunho" and i["origem"] == "groq" for i in s["itens"])
    assert all(i["modelo"] == praticas_groq.MODELO_PADRAO and i["gerado_em"] for i in s["itens"])
    assert _hash(APROVADAS) == antes


def test_resposta_invalida_vai_para_descartados(pasta):
    respostas = [
        json.dumps({"titulo": "Jogo novo", "jogos": ["xadrez"], "instrucoes": ["Joguem xadrez juntos hoje."]}),
        "isto não é json",
        json.dumps({"titulo": "Promessa", "jogos": ["cores"],
                    "instrucoes": ["No jogo Acerte a cor vai aparecer o azul."]}),
    ]
    assert gerar_praticas.main(["--lote", "3", "--temas", "cores"], chamar=GroqFalsa(respostas)) == 0
    s = _saida(pasta)
    assert s["itens"] == [] and len(s["descartados"]) == 3
    motivos = json.dumps(s["descartados"], ensure_ascii=False)
    assert "não existe" in motivos and "JSON" in motivos and "sorteia" in motivos


def test_simulacao_marcada_e_sem_rede(pasta, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "")
    def proibido(*a, **k):
        raise AssertionError("simulação chamou a Groq")
    assert gerar_praticas.main(["--simular", "--lote", "2"], chamar=proibido) == 0
    s = _saida(pasta)
    assert s["origem"] == "simulacao" and s["chamadas_externas"] == 0
    assert all(i["origem"] == "simulacao" and i["status"] == "rascunho" for i in s["itens"])


def test_saida_nao_escapa_da_pasta(pasta):
    gerar_praticas.main(["--simular", "--lote", "1", "--saida", "../../fora.json"], chamar=GroqFalsa())
    assert (pasta / "fora.json").exists()


def test_prompt_pede_ids_e_fala_com_a_crianca():
    regras = gerar_praticas.montar_mensagens("formas", "8")[0]["content"]
    assert "FALANDO DIRETAMENTE COM A CRIANÇA" in regras and "nunca o nome do jogo" in regras
