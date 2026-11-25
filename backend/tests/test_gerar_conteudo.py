"""Comando scripts.gerar_conteudo (recados e dicas) com a Groq sempre simulada."""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

import pytest

from scripts import gerar_conteudo, praticas_groq

BACKEND = Path(__file__).resolve().parents[1]
REPORTS = BACKEND / "app" / "modules" / "reports"
APROVADOS = [REPORTS / n for n in ("praticas_aprovadas.json", "recados_aprovados.json", "dicas_aprovadas.json")]
PROIBIDOS = ("@", r"\bidade", "perfil", "histórico", "historico", "partidas", r"\berros", "child")


class GroqFalsa:
    def __init__(self, respostas=None, falhar_na=None):
        self.chamadas, self.respostas, self.falhar_na = [], respostas, falhar_na

    def __call__(self, mensagens, *, chave, modelo=praticas_groq.MODELO_PADRAO):
        self.chamadas.append(mensagens)
        if self.falhar_na and len(self.chamadas) == self.falhar_na:
            raise praticas_groq.GroqIndisponivel("HTTP 429")
        if self.respostas:
            return self.respostas[len(self.chamadas) - 1]
        dados = json.loads(mensagens[1]["content"])
        if "jogo" in dados:
            return json.dumps({"texto": f"Joguem juntos {dados['jogo']['nome']} devagar e comemorem cada acerto."})
        return json.dumps({"texto": "Você aprende um pouco em cada partida. Siga no seu ritmo."})


@pytest.fixture
def pasta(tmp_path, monkeypatch):
    monkeypatch.setattr(gerar_conteudo, "PASTAS", {"recado": tmp_path / "r", "dica": tmp_path / "d"})
    monkeypatch.setenv("GROQ_API_KEY", "chave-falsa-de-teste")
    return tmp_path


def _saida(pasta, sub):
    arquivos = list((pasta / sub).glob("*.json"))
    assert len(arquivos) == 1
    return json.loads(arquivos[0].read_text(encoding="utf-8"))


def _hashes():
    return [hashlib.sha256(p.read_bytes()).hexdigest() for p in APROVADOS]


def _sem_dados_de_crianca(msgs):
    bruto = json.dumps(msgs, ensure_ascii=False).lower()
    for proibido in PROIBIDOS:
        assert not re.search(proibido, bruto), proibido


def test_payload_recado_so_rotulos(pasta):
    groq = GroqFalsa()
    assert gerar_conteudo.main(["--tipo", "recado", "--lote", "2"], chamar=groq) == 0
    assert len(groq.chamadas) == 2
    for msgs in groq.chamadas:
        assert [m["role"] for m in msgs] == ["system", "user"]
        dados = json.loads(msgs[1]["content"])
        assert set(dados) == {"situacao", "nivel"}
        assert set(dados["situacao"]) == {"id", "rotulo"} and set(dados["nivel"]) == {"id", "rotulo"}
        _sem_dados_de_crianca(msgs[1])
    s = _saida(pasta, "r")
    assert [i["id"] for i in s["itens"]] == ["recado-facil-8-01", "recado-no_ponto-8-01"]


def test_payload_dica_so_catalogo_publico(pasta):
    groq = GroqFalsa()
    assert gerar_conteudo.main(["--tipo", "dica", "--lote", "6"], chamar=groq) == 0
    for msgs in groq.chamadas:
        dados = json.loads(msgs[1]["content"])
        assert set(dados) == {"jogo", "situacao"} and set(dados["jogo"]) == {"id", "nome", "descricao"}
        _sem_dados_de_crianca(msgs[1])
    s = _saida(pasta, "d")
    assert len(s["itens"]) == 6 and all(i["situacao"] == "dificil" for i in s["itens"])


def test_lote_maximo_6_e_sem_retry(pasta):
    with pytest.raises(SystemExit):
        gerar_conteudo.main(["--tipo", "recado", "--lote", "7"], chamar=GroqFalsa())
    groq = GroqFalsa(falhar_na=2)
    assert gerar_conteudo.main(["--tipo", "recado", "--lote", "4"], chamar=groq) == 1
    assert len(groq.chamadas) == 2
    s = _saida(pasta, "r")
    assert len(s["itens"]) == 1 and "429" in s["interrompido"]


def test_sem_chave_nao_chama(pasta, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "")
    groq = GroqFalsa()
    assert gerar_conteudo.main(["--tipo", "dica"], chamar=groq) == 3
    assert groq.chamadas == [] and not list(pasta.rglob("*.json"))


def test_resposta_invalida_vai_para_descartados(pasta):
    respostas = [json.dumps({"texto": "Incentive a criança a jogar mais."}), "isto não é json",
                 json.dumps({"texto": "Parabéns, {nome}! Você foi bem."})]
    assert gerar_conteudo.main(["--tipo", "recado", "--lote", "3"], chamar=GroqFalsa(respostas)) == 0
    s = _saida(pasta, "r")
    assert s["itens"] == [] and len(s["descartados"]) == 3


def test_simulacao_marcada_e_sem_rede(pasta, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "")
    def proibido(*a, **k):
        raise AssertionError("simulação chamou a Groq")
    assert gerar_conteudo.main(["--tipo", "dica", "--simular", "--lote", "2"], chamar=proibido) == 0
    s = _saida(pasta, "d")
    assert s["origem"] == "simulacao" and s["chamadas_externas"] == 0
    assert all(i["origem"] == "simulacao" and i["status"] == "rascunho" for i in s["itens"])


def test_catalogos_aprovados_intactos(pasta):
    antes = _hashes()
    gerar_conteudo.main(["--tipo", "recado", "--lote", "3"], chamar=GroqFalsa())
    gerar_conteudo.main(["--tipo", "dica", "--lote", "3"], chamar=GroqFalsa())
    assert _hashes() == antes


def test_saida_nao_escapa_da_pasta(pasta):
    gerar_conteudo.main(["--tipo", "recado", "--simular", "--lote", "1", "--saida", "../../fora.json"],
                        chamar=GroqFalsa())
    assert (pasta / "r" / "fora.json").exists()


def test_prompts():
    recado = gerar_conteudo.montar_mensagens("recado", {"situacao": "dificil", "nivel": "9"})[0]["content"]
    dica = gerar_conteudo.montar_mensagens("dica", {"jogo": "ligar"})[0]["content"]
    assert "FALANDO DIRETAMENTE COM A CRIANÇA" in recado and "adulto da família" in dica
    assert "nunca diga qual palavra" in recado and "nunca diga qual palavra" in dica


def test_comando_nao_importa_banco():
    codigo = ("import json, sys; import scripts.gerar_conteudo, scripts.aprovar_rascunho;"
              "print(json.dumps(sorted(m for m in sys.modules if m.startswith('app.'))))")
    r = subprocess.run([sys.executable, "-c", codigo], cwd=BACKEND, capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr
    carregados = set(json.loads(r.stdout.strip().splitlines()[-1]))
    assert "app.modules.games.catalog" not in carregados
    assert "app.core.database" not in carregados and "app.core.config" not in carregados
