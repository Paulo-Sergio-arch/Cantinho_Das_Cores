"""Módulo compartilhado app.praticas: isolamento, paridade com o catálogo e validação."""
import json
import re
import subprocess
import sys
from pathlib import Path

import pytest

from app.praticas.catalogo import JOGOS, MAPA_TEMAS, TEMAS, combinacoes, nivel_por_idade
from app.praticas.itens_sorteados import CORES, FALA, FORMAS, FRUTAS, PALAVRAS
from app.praticas.validacao import promete_item_sorteado, validar_item

BACKEND = Path(__file__).resolve().parents[1]
JOGOS_DATA_JS = BACKEND.parent / "src" / "data" / "jogosData.js"


def item_ok(**over):
    base = {
        "id": "cores-8-01", "status": "rascunho", "origem": "manual", "tema": "cores", "nivel": "8",
        "titulo": "Caça às cores em casa", "jogos": ["cores", "corforma"],
        "instrucoes": ["Joguem juntos uma partida de Acerte a cor no nível Fácil.",
                       "Depois, procurem juntos algo azul pela casa."],
    }
    base.update(over)
    return base


def aprovado(**over):
    return item_ok(status="aprovado", revisado_por="EQ", revisado_em="2026-11-25", **over)


def _importa_em_subprocesso(codigo):
    r = subprocess.run([sys.executable, "-c", codigo], cwd=BACKEND, capture_output=True, text=True, timeout=60)
    assert r.returncode == 0, r.stderr
    return json.loads(r.stdout.strip().splitlines()[-1])


def test_modulo_compartilhado_sem_banco_nem_rede():
    carregados = _importa_em_subprocesso(
        "import json, sys; import app.praticas.catalogo, app.praticas.validacao, app.praticas.itens_sorteados;"
        "print(json.dumps(sorted(m for m in sys.modules if m.split('.')[0] in "
        "{'app','httpx','sqlite3','psycopg','scripts'} or m.startswith('app.'))))"
    )
    proibidos = {"app.core.database", "app.core.config", "app.modules.games.catalog", "httpx", "sqlite3",
                 "psycopg", "scripts.praticas_groq"}
    assert not proibidos & set(carregados), carregados


def test_jogos_iguais_ao_catalogo_do_app():
    from app.modules.games.catalog import FRONTEND_GAMES
    assert list(JOGOS) == list(FRONTEND_GAMES)
    for gid, (nome, descricao) in FRONTEND_GAMES.items():
        assert JOGOS[gid] == {"nome": nome, "descricao": descricao}


def test_mapa_tem_15_combinacoes_e_jogos_existentes():
    assert len(combinacoes()) == 15
    assert TEMAS["convivencia"] == "Convivência e vocabulário"
    for tema, niveis in MAPA_TEMAS.items():
        for jogos in niveis.values():
            assert 1 <= len(jogos) <= 2 and all(j in JOGOS for j in jogos)
    assert "9" not in MAPA_TEMAS["pedir"] and "8" not in MAPA_TEMAS["convivencia"]


def _bloco(js, nome):
    m = re.search(rf"export const {nome} = \[(.*?)\];", js, re.S)
    assert m, nome
    return m.group(1)


def test_itens_sorteados_bate_com_front():
    js = JOGOS_DATA_JS.read_text(encoding="utf-8")
    assert re.findall(r'n: "([^"]+)"', _bloco(js, "CORES")) == CORES
    assert re.findall(r'n: "([^"]+)"', _bloco(js, "FORMAS")) == FORMAS
    assert re.findall(r'nome: "([^"]+)"', _bloco(js, "FRUTAS")) == FRUTAS
    palavras = sum((re.findall(r'id: "([^"]+)"', _bloco(js, n)) for n in ("PALAVRAS", "PALAVRAS_9", "PALAVRAS_10")), [])
    assert palavras == PALAVRAS
    fala = sum((re.findall(r'w: "([^"]+)"', _bloco(js, n)) for n in ("FALA", "FALA_9", "FALA_10")), [])
    assert fala == FALA


@pytest.mark.parametrize("idade,nivel", [(3, "8"), (8, "8"), (9, "9"), (10, "10"), (18, "10"), (None, "8")])
def test_nivel_por_idade(idade, nivel):
    assert nivel_por_idade(idade) == nivel


def test_item_valido():
    assert validar_item(item_ok()) == []
    assert validar_item(aprovado(), exigir_aprovado=True) == []


@pytest.mark.parametrize("over,trecho", [
    ({"jogos": ["xadrez"]}, "não existe"),
    ({"jogos": ["frutas"]}, "não atende"),
    ({"jogos": []}, "de 1 a 2"),
    ({"jogos": ["cores", "corforma", "encaixe"]}, "de 1 a 2"),
    ({"jogos": ["cores", "cores"]}, "repetido"),
    ({"tema": "animais", "id": "animais-8-01"}, "tema"),
    ({"tema": "pedir", "nivel": "9", "id": "pedir-9-01", "jogos": ["falar"]}, "sem jogo compatível"),
    ({"id": "cores-9-01"}, "deve começar"),
    ({"titulo": "<b>Oi</b> cores"}, "HTML"),
    ({"titulo": "x" * 61}, "tamanho"),
    ({"instrucoes": ["Veja mais em https://exemplo.com hoje."]}, "link"),
    ({"instrucoes": ["Joguem juntos e comemorem 🎉 bastante."]}, "emoji"),
    ({"instrucoes": ["Linha um da instrução\nlinha dois."]}, "quebra"),
    ({"instrucoes": ["Observe se há atraso na resposta da criança."]}, "avaliativa"),
    ({"instrucoes": []}, "de 1 a 3"),
    ({"origem": "groq"}, "modelo e gerado_em"),
])
def test_item_invalido(over, trecho):
    motivos = validar_item(item_ok(**over))
    assert any(trecho in m for m in motivos), motivos


def test_promessa_de_item_sorteado_e_rejeitada():
    frase = "No Ligue ao nome vai aparecer o gato."
    assert promete_item_sorteado(frase)
    item = item_ok(tema="palavras", id="palavras-8-01", jogos=["ligar"], instrucoes=[frase])
    assert any("sorteia" in m for m in validar_item(item))
    assert promete_item_sorteado("No jogo Acerte a cor, a criança vai tocar no azul.")


def test_pratica_generica_fora_do_jogo_e_aceita():
    assert not promete_item_sorteado("Depois, procurem juntos algo azul pela casa.")
    assert not promete_item_sorteado("Joguem mais uma partida de Vamos falar com calma.")
    assert validar_item(item_ok(instrucoes=["Procurem juntos algo azul pela casa."])) == []


def test_aprovado_exige_revisao_humana_e_rejeita_simulacao():
    sem_revisor = item_ok(status="aprovado")
    assert any("revisado_por" in m for m in validar_item(sem_revisor, exigir_aprovado=True))
    assert any("só itens aprovados" in m for m in validar_item(item_ok(), exigir_aprovado=True))
    simulado = aprovado(origem="simulacao")
    assert any("simulação" in m for m in validar_item(simulado, exigir_aprovado=True))


def test_reserva_manual_valida_mas_em_rascunho():
    caminho = BACKEND / "app" / "modules" / "reports" / "praticas_reserva_para_revisao.json"
    dados = json.loads(caminho.read_text(encoding="utf-8"))
    assert 2 <= len(dados["itens"]) <= 3
    for item in dados["itens"]:
        assert item["status"] == "rascunho" and item["origem"] == "manual"
        assert validar_item(item) == [], item["id"]


def test_instrucao_deve_falar_com_a_crianca():
    from app.praticas.validacao import fala_com_adulto
    assert fala_com_adulto("Depois de terminar, peça para a criança apontar algo em casa.")
    assert fala_com_adulto("Incentive seu filho a jogar de novo.")
    assert not fala_com_adulto("Depois, procure em casa uma coisa com uma forma que você viu no jogo.")
    item = item_ok(instrucoes=["Depois, peça para a criança apontar algo azul em casa."])
    assert any("falar com a criança" in m for m in validar_item(item))
    assert validar_item(item_ok(instrucoes=["Jogue Acerte a cor no seu ritmo.", "Depois, procure algo azul em casa."])) == []
