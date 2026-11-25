"""Itens que os jogos sorteiam (espelho de src/data/jogosData.js).

Uma instrução não pode prometer que um destes itens vai aparecer num jogo, porque
cada partida sorteia os itens do nível. Fora do jogo ("procurem algo azul pela casa")
eles podem ser citados. `tests/test_praticas_modulo.py` confere a paridade com o front.
"""

CORES = ["vermelho", "azul", "verde", "amarelo", "rosa", "laranja", "roxo", "turquesa", "marrom"]
FORMAS = ["círculo", "quadrado", "triângulo", "estrela", "pentágono", "losango", "hexágono", "trapézio"]
FRUTAS = ["Morango", "Banana", "Mirtilo", "Maçã", "Uva"]
PALAVRAS = [
    "bola", "gato", "casa", "maçã", "sol", "peixe", "flor", "pão", "leite", "carro", "livro", "cachorro",
    "elefante", "borboleta", "tartaruga", "bicicleta", "morango", "abacaxi", "girafa", "foguete", "mochila", "palhaço",
    "helicóptero", "dinossauro", "computador", "melancia", "passarinho", "astronauta", "telescópio", "jacaré", "violão", "borracha",
]
FALA = [
    "bola", "água", "mais", "ajuda", "acabou", "mamãe", "papai", "quero", "oi", "tchau",
    "obrigado", "escola", "amigo", "lanche", "brincar", "desculpa", "esperar", "calma",
    "biblioteca", "importante", "comunidade", "respeito", "concentração", "sentimento", "organizar", "curiosidade",
]

# Palavras do Vamos falar comuns demais para servir de sinal de promessa
# ("joguem mais uma partida", "com calma", "procure em casa"). Continuam valendo para a revisão humana.
PALAVRAS_COMUNS = {"mais", "oi", "quero", "calma", "casa"}


def termos_proibidos_em_promessa():
    termos = set(CORES) | set(FORMAS) | {f.lower() for f in FRUTAS} | set(PALAVRAS) | set(FALA)
    return sorted(termos - PALAVRAS_COMUNS)
