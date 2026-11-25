"""Comando scripts.aprovar_rascunho: só itens revisados entram, sem tocar no catálogo quando recusa."""
import hashlib
import json
from datetime import date

import pytest

from scripts import aprovar_rascunho as ap

HOJE = date(2026, 11, 26)


def recado(**over):
    base = {"id": "recado-dificil-8-01", "status": "rascunho", "origem": "groq", "modelo": "openai/gpt-oss-20b",
            "gerado_em": "2026-11-26T10:00:00+00:00", "rascunho_arquivo": "r.json",
            "situacao": "dificil", "nivel": "8", "texto": "Você aprende um pouco em cada partida."}
    base.update(over)
    return base


@pytest.fixture
def ambiente(tmp_path, monkeypatch):
    data = tmp_path / "data"; (data / "recados_rascunhos").mkdir(parents=True)
    catalogo = tmp_path / "recados_aprovados.json"
    catalogo.write_text(json.dumps({"versao": 1, "itens": []}), encoding="utf-8")
    monkeypatch.setattr(ap, "PASTA_DATA", data)
    monkeypatch.setitem(ap.CATALOGOS, "recados", (catalogo, ap.CATALOGOS["recados"][1]))

    def rascunho(*itens):
        p = data / "recados_rascunhos" / "r.json"
        p.write_text(json.dumps({"itens": list(itens)}), encoding="utf-8")
        return str(p)
    return {"catalogo": catalogo, "rascunho": rascunho, "tmp": tmp_path}


def _hash(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def _aprovar(caminho, item_id="recado-dificil-8-01", *extra):
    return ap.main(["--catalogo", "recados", "--rascunho", caminho, "--id", item_id, "--revisor", "AK", *extra], hoje=HOJE)


def test_aprovar_grava_revisao_e_versao(ambiente):
    assert _aprovar(ambiente["rascunho"](recado()), "recado-dificil-8-01", "--observacao", "texto encurtado") == 0
    dados = json.loads(ambiente["catalogo"].read_text(encoding="utf-8"))
    assert dados["versao"] == 2
    [item] = dados["itens"]
    assert item["status"] == "aprovado" and item["revisado_por"] == "AK" and item["revisado_em"] == "2026-11-26"
    assert item["observacao_revisao"] == "texto encurtado"


def test_aprovar_recusa_duplicado_e_simulacao(ambiente):
    caminho = ambiente["rascunho"](recado(), recado(id="recado-dificil-8-02", origem="simulacao"))
    assert _aprovar(caminho) == 0
    antes = _hash(ambiente["catalogo"])
    assert _aprovar(caminho) == ap.RECUSADO
    assert _aprovar(caminho, "recado-dificil-8-02") == ap.RECUSADO
    assert _hash(ambiente["catalogo"]) == antes


def test_aprovar_recusa_texto_editado_invalido(ambiente):
    antes = _hash(ambiente["catalogo"])
    assert _aprovar(ambiente["rascunho"](recado(texto="Incentive a criança a tentar de novo."))) == ap.RECUSADO
    assert _hash(ambiente["catalogo"]) == antes


def test_aprovar_recusa_rascunho_fora_de_data(ambiente):
    fora = ambiente["tmp"] / "fora.json"
    fora.write_text(json.dumps({"itens": [recado()]}), encoding="utf-8")
    assert _aprovar(str(fora)) == ap.RECUSADO


def test_aprovar_recusa_id_inexistente(ambiente):
    assert _aprovar(ambiente["rascunho"](recado()), "recado-dificil-8-09") == ap.RECUSADO


def test_reserva_manual_e_aceita_como_origem():
    assert ap.RESERVA_MANUAL.exists()
    dados = json.loads(ap.RESERVA_MANUAL.read_text(encoding="utf-8"))
    assert {i["id"] for i in dados["itens"]} >= {"cores-8-01", "palavras-9-01", "convivencia-10-01"}
