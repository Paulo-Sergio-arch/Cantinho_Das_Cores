"""Situações e validação de recados (para a criança) e dicas (para a família)."""
import pytest

from app.praticas.conteudo import situacao_geral, validar_dica, validar_recado


def recado(**over):
    base = {"id": "recado-dificil-8-01", "status": "rascunho", "origem": "groq", "modelo": "openai/gpt-oss-20b",
            "gerado_em": "2026-11-26T10:00:00+00:00", "rascunho_arquivo": "x.json",
            "situacao": "dificil", "nivel": "8",
            "texto": "Você está aprendendo um pouco a cada dia. Tente de novo com calma."}
    base.update(over)
    return base


def dica(**over):
    base = {"id": "dica-ligar-01", "status": "rascunho", "origem": "groq", "modelo": "openai/gpt-oss-20b",
            "gerado_em": "2026-11-26T10:00:00+00:00", "rascunho_arquivo": "x.json",
            "jogo": "ligar", "situacao": "dificil",
            "texto": "Antes de jogar, apontem juntos objetos da casa e digam o nome de cada um em voz alta."}
    base.update(over)
    return base


def aprovado(item):
    return {**item, "status": "aprovado", "revisado_por": "AK", "revisado_em": "2026-11-26"}


def test_situacao_geral():
    assert situacao_geral([]) is None
    assert situacao_geral(["facil", "dificil"]) == "dificil"
    assert situacao_geral(["facil", "facil"]) == "facil"
    assert situacao_geral(["facil", "no_ponto"]) == "no_ponto"


def test_recado_valido_fala_com_a_crianca():
    assert validar_recado(recado()) == []
    assert validar_recado(aprovado(recado()), exigir_aprovado=True) == []


@pytest.mark.parametrize("texto", [
    "Incentive a criança a tentar de novo.",
    "Parabéns, {nome}! Você foi bem.",
    "Você vai ver o azul no jogo.",
    "Veja mais em www.site.com hoje.",
    "Você joga bem. Você tenta. Você aprende.",
    "Seu atraso vai passar logo, viu.",
])
def test_recado_recusado(texto):
    assert validar_recado(recado(texto=texto)) != []


def test_recado_id_coerente_com_situacao_e_nivel():
    assert validar_recado(recado(id="recado-facil-8-01")) != []
    assert validar_recado(recado(nivel="11")) != []
    assert validar_recado(recado(situacao="otima", id="recado-otima-8-01")) != []


def test_dica_valida_fala_com_o_adulto():
    assert validar_dica(dica()) == []
    assert validar_dica(dica(texto="Joguem juntos com calma e ajude a criança a ler o nome em voz alta.")) == []


def test_dica_so_para_jogo_existente_e_dificil():
    assert validar_dica(dica(jogo="xadrez", id="dica-xadrez-01")) != []
    assert validar_dica(dica(situacao="facil")) != []


def test_dica_nao_promete_item_sorteado():
    assert validar_dica(dica(texto="No jogo Acerte a cor vai aparecer o azul, então treinem antes.")) != []


@pytest.mark.parametrize("validar,item", [(validar_recado, recado()), (validar_dica, dica())])
def test_simulacao_e_sem_revisao_nunca_aprovados(validar, item):
    assert validar(aprovado({**item, "origem": "simulacao"}), exigir_aprovado=True) != []
    assert validar({**item, "status": "aprovado"}, exigir_aprovado=True) != []
    assert validar(item, exigir_aprovado=True) != []
