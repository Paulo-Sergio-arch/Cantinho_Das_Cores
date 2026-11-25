"""Pedido anônimo à Groq e validação pedaço por pedaço da resposta ao vivo."""
import json
import re

import pytest

from app.ia import ao_vivo
from app.modules.reports.evolucao import calcular

NOMES = {"ligar": "Ligue ao nome", "cores": "Acerte a cor"}


def g(gid, total=1, erros=0):
    return {"game_id": gid, "name": NOMES[gid], "total_matches": total, "completed_matches": total, "total_errors": erros}


def evolucao_exemplo():
    return calcular(agora=[g("ligar", erros=6), g("cores")], antes=[g("ligar", erros=6), g("cores", total=0)],
                    nunca_jogou=["falar"])


BOA = {
    "acompanhamento": "Ligue ao nome continua desafiador. Joguem juntos com calma e comemorem cada acerto.",
    "recado": "Você está se esforçando muito. Cada tentativa ajuda você a aprender.",
    "dicas": {"ligar": "Olhem juntos objetos da casa e digam o nome de cada um em voz alta antes de jogar.",
              "cores": "Dica para jogo que não está difícil."},
    "pratica": {"tema": "palavras", "titulo": "Palavras da casa", "jogos": ["ligar"],
                "instrucoes": ["Jogue uma partida de Ligue ao nome com calma.",
                               "Depois, aponte três coisas da sua casa e diga o nome de cada uma."]},
}


def _interpretar(resposta, nome="Ana"):
    return ao_vivo.interpretar(json.dumps(resposta), nivel="9", situacao_geral="dificil",
                               jogos_dificeis=["ligar"], nome_crianca=nome)


def test_payload_sem_dados_pessoais():
    msgs = ao_vivo.montar_mensagens("9", evolucao_exemplo())
    dados = json.loads(msgs[1]["content"])
    assert set(dados) == {"nivel", "ritmo", "jogos", "nunca_jogou", "temas_permitidos"}
    assert all(set(j) == {"id", "nome", "descricao", "agora", "antes", "tendencia", "faixa_agora"} for j in dados["jogos"])
    bruto = msgs[1]["content"].lower()
    for proibido in ("@", "idade", r"\berros\b", "acertos", "partidas\"", "ana", "child", "email"):
        assert not re.search(proibido, bruto), proibido
    assert {t["tema"] for t in dados["temas_permitidos"]} == {"cores", "formas", "frutas", "palavras", "convivencia"}


def test_resposta_completa_valida():
    c = _interpretar(BOA)
    assert c.acompanhamento and c.recado and c.pratica["tema"] == "palavras"
    assert list(c.dicas) == ["ligar"]  # dica de jogo que não está difícil é descartada
    assert c.usado


def test_resposta_parcial():
    c = _interpretar({**BOA, "pratica": {**BOA["pratica"], "jogos": ["xadrez"]}})
    assert c.pratica is None and c.recado and c.dicas


def test_recado_falando_com_adulto_descartado():
    assert _interpretar({**BOA, "recado": "Incentive a criança a jogar mais."}).recado is None


def test_acompanhamento_com_diagnostico_descartado():
    assert _interpretar({**BOA, "acompanhamento": "Ela pode ter atraso na leitura e precisa de terapia."}).acompanhamento is None


def test_texto_com_nome_da_crianca_descartado():
    c = _interpretar({**BOA, "recado": "Parabéns, Lua! Você foi bem."}, nome="Luã")
    assert c.recado is None and c.acompanhamento


def test_json_invalido_vira_conteudo_vazio():
    c = ao_vivo.interpretar("isto não é json", nivel="9", situacao_geral="dificil", jogos_dificeis=[], nome_crianca="Ana")
    assert not c.usado


def test_sem_jogos_nao_chama(monkeypatch):
    chamadas = []
    monkeypatch.setattr(ao_vivo, "chamar_no_servidor", lambda m, **k: chamadas.append(m))
    ev = calcular(agora=[g("ligar", total=0)], antes=[g("ligar")])
    assert ao_vivo.gerar("8", ev, situacao_geral=None, jogos_dificeis=[], nome_crianca="Ana") is None
    assert chamadas == []


# Problemas vistos no teste com a Groq de verdade (25/11)
def test_acompanhamento_falando_com_a_crianca_descartado():
    c = _interpretar({**BOA, "acompanhamento": "Você está avançando bem nos jogos. Continue praticando."})
    assert c.acompanhamento is None and c.recado  # o resto continua


def test_id_do_jogo_entre_aspas_descartado():
    p = {**BOA["pratica"], "instrucoes": ["Tente o jogo 'ligar' com calma.", "Depois, diga o nome de três coisas."]}
    assert _interpretar({**BOA, "pratica": p}).pratica is None
    assert _interpretar({**BOA, "dicas": {"ligar": "Joguem juntos \"Ligue ao nome\" e digam cada palavra em voz alta."}}).dicas == {}


def test_termo_tecnico_descartado():
    texto = "Joguem juntos com calma para fortalecer a percepção visual. Comemorem cada acerto."
    assert _interpretar({**BOA, "acompanhamento": texto}).acompanhamento is None
    assert _interpretar({**BOA, "dicas": {"ligar": "Treinem a coordenação motora com blocos antes de jogar."}}).dicas == {}


def test_regras_pedem_terceira_pessoa_e_nome_do_jogo():
    assert "sem usar 'você'" in ao_vivo.REGRAS
    assert "nome do jogo exatamente como em 'nome'" in ao_vivo.REGRAS


def test_rapidez_inventada_e_avaliacao_descartadas():
    """A Groq não recebe tempo de jogo: texto sobre rapidez é invenção. 'Dominar' avalia a criança."""
    for texto in ("A criança tem avançado na rapidez de jogo. Continuem com calma.",
                  "A criança está acertando mais rapidamente. Comemorem cada acerto.",
                  "A criança ainda não dominou o jogo Vamos falar. Joguem juntos."):
        assert _interpretar({**BOA, "acompanhamento": texto}).acompanhamento is None, texto


def test_resposta_com_texto_em_volta_do_json():
    """Sem o modo JSON da Groq, o modelo às vezes põe cercas de código ou uma frase antes."""
    bruto = "Aqui está:\n```json\n" + json.dumps(BOA, ensure_ascii=False) + "\n```"
    c = ao_vivo.interpretar(bruto, nivel="9", situacao_geral="dificil", jogos_dificeis=["ligar"], nome_crianca="Ana")
    assert c.acompanhamento and c.recado and c.pratica


def test_titulo_valido_entra():
    assert _interpretar({**BOA, "titulo": "Uma semana de cores"}).titulo == "Uma semana de cores"


@pytest.mark.parametrize("ruim", ["Semana da Ana", "Você foi bem", "3 jogos", "A" * 41, "Oi", "Semana 'top'"])
def test_titulo_ruim_fica_none(ruim):
    c = _interpretar({**BOA, "titulo": ruim})
    assert c.titulo is None and c.recado


def test_resposta_sem_titulo_continua_valendo():
    c = _interpretar(BOA)
    assert c.titulo is None and c.recado
