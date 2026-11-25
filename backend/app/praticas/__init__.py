"""Módulo compartilhado das sugestões de prática em casa.

Regra: nada aqui pode acessar banco de dados, rede ou configuração da aplicação.
Ele é importado tanto pelo relatório (servidor) quanto pelo comando interno
`python -m scripts.gerar_praticas`, que roda fora do servidor.
"""
