"""Temas, níveis e jogos permitidos nas sugestões de prática em casa.

Cópia fixa e pública do catálogo de jogos. NÃO importe `app.modules.games.catalog`
aqui: aquele módulo executa `list_games()` ao ser importado, o que abre o banco.
`tests/test_praticas_modulo.py` confere que esta cópia continua igual a `FRONTEND_GAMES`.
"""
import hashlib
import json

NIVEIS = {"8": "Fácil", "9": "Médio", "10": "Avançado"}

TEMAS = {
    "cores": "Cores do dia a dia",
    "formas": "Formas ao redor",
    "frutas": "Frutas",
    "palavras": "Palavras e figuras",
    "pedir": "Pedir e cumprimentar",
    "convivencia": "Convivência e vocabulário",
}

JOGOS = {
    "cores": {"nome": "Acerte a cor", "descricao": "Identificar e selecionar cores."},
    "encaixe": {"nome": "Encaixe as formas", "descricao": "Reconhecer e encaixar formas geométricas."},
    "ligar": {"nome": "Ligue ao nome", "descricao": "Associar palavras a imagens."},
    "corforma": {"nome": "Cor e forma", "descricao": "Relacionar cores e formas geométricas."},
    "falar": {"nome": "Vamos falar", "descricao": "Explorar palavras, sílabas e frases."},
    "frutas": {"nome": "Bloquinho de Frutas", "descricao": "Atividade lúdica com frutas e blocos."},
}

# Um jogo só atende um tema num nível quando o tema é o conteúdo principal do jogo
# naquele nível (aparece em toda partida). Combinações ausentes não existem.
MAPA_TEMAS = {
    "cores": {"8": ["cores", "corforma"], "9": ["cores", "corforma"], "10": ["cores", "corforma"]},
    "formas": {"8": ["encaixe", "corforma"], "9": ["encaixe", "corforma"], "10": ["encaixe", "corforma"]},
    "frutas": {"8": ["frutas"], "9": ["frutas"], "10": ["frutas"]},
    "palavras": {"8": ["ligar"], "9": ["ligar"], "10": ["ligar"]},
    "pedir": {"8": ["falar"]},
    "convivencia": {"9": ["falar"], "10": ["falar"]},
}


def combinacoes():
    """Lista estável de (tema, nivel) válidos, na ordem de TEMAS e NIVEIS."""
    return [(t, n) for t in TEMAS for n in NIVEIS if n in MAPA_TEMAS.get(t, {})]


def jogos_permitidos(tema, nivel):
    return list(MAPA_TEMAS.get(tema, {}).get(str(nivel), []))


def nome_jogo(jogo_id):
    return JOGOS[jogo_id]["nome"]


def versao_catalogo_jogos():
    """Hash curto e estável dos IDs e nomes dos jogos e do mapa de temas."""
    base = json.dumps({"jogos": {k: v["nome"] for k, v in JOGOS.items()}, "mapa": MAPA_TEMAS}, sort_keys=True)
    return hashlib.sha256(base.encode("utf-8")).hexdigest()[:8]


def nivel_por_idade(idade):
    """Mesma regra de `idadeDoPerfil` em src/App.jsx: até 8 → "8", 9 → "9", 10+ → "10"."""
    try:
        n = int(idade)
    except (TypeError, ValueError):
        n = 8
    if n <= 8:
        return "8"
    if n == 9:
        return "9"
    return "10"
