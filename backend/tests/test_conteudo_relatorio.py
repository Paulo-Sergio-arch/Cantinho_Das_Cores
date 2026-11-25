"""Recados e dicas aprovados no texto do relatório (só catálogos locais, nunca a Groq)."""
import json
import subprocess
import sys
from datetime import date
from pathlib import Path

import pytest

from app.modules.reports import conteudo_aprovado as ca
from app.modules.reports.generator import build_text, jogos_por_prioridade

BACKEND = Path(__file__).resolve().parents[1]
INI, FIM = date(2026, 11, 1), date(2026, 11, 15)
REVISAO = {"status": "aprovado", "origem": "groq", "modelo": "openai/gpt-oss-20b",
           "gerado_em": "2026-11-26T10:00:00+00:00", "rascunho_arquivo": "t.json",
           "revisado_por": "AK", "revisado_em": "2026-11-26"}
NOMES = {"cores": "Acerte a cor", "ligar": "Ligue ao nome", "falar": "Vamos falar", "frutas": "Bloquinho de Frutas"}


def recado(situacao="dificil", nivel="8", nn="01", texto="Você está aprendendo um pouco a cada dia.", **over):
    return {**REVISAO, "id": f"recado-{situacao}-{nivel}-{nn}", "situacao": situacao, "nivel": nivel,
            "texto": texto, **over}


def dica(jogo="ligar", nn="01", texto="Antes de jogar, digam juntos o nome de objetos da casa em voz alta.", **over):
    return {**REVISAO, "id": f"dica-{jogo}-{nn}", "jogo": jogo, "situacao": "dificil", "texto": texto, **over}


def jogo(gid, feitas=1, erros=0, total=None):
    total = feitas if total is None else total
    return {"game_id": gid, "name": NOMES[gid], "total_matches": total, "completed_matches": feitas,
            "total_errors": erros}


def resumo(jogos):
    total = sum(j["total_matches"] for j in jogos)
    feitas = sum(j["completed_matches"] for j in jogos)
    return {"total_matches": total, "completed_matches": feitas, "total_correct": 5 * feitas,
            "total_errors": sum(j["total_errors"] for j in jogos), "average_duration_seconds": 90 if feitas else None}


def texto(nome, idade, jogos):
    return build_text(nome, idade, INI, FIM, resumo(jogos), jogos)


@pytest.fixture
def catalogos(tmp_path, monkeypatch):
    caminhos = {"recados": tmp_path / "recados.json", "dicas": tmp_path / "dicas.json"}
    monkeypatch.setenv("RECADOS_APROVADOS_PATH", str(caminhos["recados"]))
    monkeypatch.setenv("DICAS_APROVADAS_PATH", str(caminhos["dicas"]))
    ca._cache.clear()

    def gravar(recados=(), dicas=(), bruto=None):
        caminhos["recados"].write_text(bruto if bruto is not None else json.dumps({"versao": 1, "itens": list(recados)}),
                                       encoding="utf-8")
        caminhos["dicas"].write_text(json.dumps({"versao": 1, "itens": list(dicas)}), encoding="utf-8")
        ca._cache.clear()
    return gravar


# --- leitura dos catálogos ---------------------------------------------------------------------------

def test_sem_catalogo_nada_escolhido(tmp_path, monkeypatch):
    monkeypatch.setenv("RECADOS_APROVADOS_PATH", str(tmp_path / "nao-existe.json"))
    monkeypatch.setenv("DICAS_APROVADAS_PATH", str(tmp_path / "nao-existe.json"))
    ca._cache.clear()
    assert ca.escolher_recado("dificil", "8") is None and ca.escolher_dica("ligar") is None


@pytest.mark.parametrize("bruto", ["{quebrado", "[]", '{"itens": "x"}', '{"itens": [{"id": "recado"}]}'])
def test_json_quebrado_nao_derruba(catalogos, bruto):
    catalogos(bruto=bruto)
    assert ca.carregar_recados() == []
    assert "Recado para" not in texto("Ana", 7, [jogo("ligar", erros=6)])


def test_escolhe_primeiro_aprovado_por_id(catalogos):
    catalogos([recado(nn="02", texto="Segundo recado para você hoje."), recado(nn="01")])
    assert ca.escolher_recado("dificil", "8")["id"] == "recado-dificil-8-01"


def test_rascunho_simulacao_e_repetido_ignorados(catalogos):
    catalogos([recado(status="rascunho"), recado(nn="02", origem="simulacao")])
    assert ca.escolher_recado("dificil", "8") is None
    catalogos([recado(), recado(texto="Outro texto com o mesmo id.")])
    assert len(ca.carregar_recados()) == 1


def test_dica_do_jogo(catalogos):
    catalogos(dicas=[dica("ligar")])
    assert ca.escolher_dica("ligar")["jogo"] == "ligar" and ca.escolher_dica("falar") is None


def test_relatorio_nao_importa_groq():
    codigo = ("import sys, app.modules.reports.conteudo_aprovado, app.modules.reports.generator;"
              "print('scripts.praticas_groq' in sys.modules, 'httpx' in sys.modules)")
    r = subprocess.run([sys.executable, "-c", codigo], cwd=BACKEND, capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr
    assert r.stdout.strip().splitlines()[-1] == "False False"


# --- recado e dica no texto ----------------------------------------------------------------------------

def test_recado_entra_com_nome_so_no_titulo(catalogos):
    catalogos([recado()])
    t = texto("Luã D'Ávila", 7, [jogo("ligar", erros=6)])
    assert t.endswith("\n\nRecado para Luã D'Ávila\n- Você está aprendendo um pouco a cada dia.")


def test_recado_segue_situacao_geral_e_nivel(catalogos):
    catalogos([recado("facil", "9", texto="Você mandou muito bem nesses jogos."),
               recado("no_ponto", "9", texto="Você está no caminho certo, continue assim.")])
    assert "Você mandou muito bem" in texto("Bia", 9, [jogo("cores", erros=0)])
    assert "Você está no caminho certo" in texto("Bia", 9, [jogo("cores", erros=0), jogo("ligar", erros=3)])
    assert "Recado para" not in texto("Bia", 10, [jogo("cores", erros=0)])  # nível 10 sem recado


def test_dica_do_jogo_dificil_e_generica_para_o_outro(catalogos):
    catalogos(dicas=[dica("ligar")])
    t = texto("Ana", 7, [jogo("ligar", erros=6), jogo("falar", erros=7)])
    assert "- Como ajudar em Ligue ao nome: Antes de jogar, digam juntos" in t
    assert "- Vale jogar Vamos falar mais vezes, juntos, com calma e sem pressa." in t


def test_sem_partidas_sem_recado_nem_dica(catalogos):
    catalogos([recado(s, "8", texto="Texto qualquer para você.") for s in ("facil", "no_ponto", "dificil")])
    t = texto("Ana", 7, [])
    assert "Recado para" not in t and "Como ajudar" not in t and t.endswith("Não houve jogos neste período.")


def test_sem_catalogo_texto_igual_ao_de_hoje(catalogos):
    jogos = [jogo("ligar", erros=6), jogo("cores", erros=0)]
    catalogos()
    sem = texto("Ana", 7, jogos)
    assert sem.endswith("- Vale jogar Ligue ao nome mais vezes, juntos, com calma e sem pressa.")
    assert "Recado para" not in sem and "Como ajudar" not in sem


def test_jogos_por_prioridade():
    games = [jogo("cores", erros=0), jogo("ligar", erros=6), jogo("falar", erros=3), jogo("frutas", feitas=0, total=0)]
    assert jogos_por_prioridade(games) == ["ligar", "falar", "cores"]
