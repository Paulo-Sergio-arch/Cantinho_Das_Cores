"""Comando interno: gera RASCUNHOS de recados (para a criança) e dicas (para a família) com a Groq.

Uso (na pasta backend/):
    python -m scripts.gerar_conteudo --tipo recado --lote 6 --niveis 8,9
    python -m scripts.gerar_conteudo --tipo dica --lote 6
    python -m scripts.gerar_conteudo --tipo recado --simular --lote 2   # sem rede, sem chave

Regras (as mesmas de scripts.gerar_praticas):
- Envia à Groq só rótulos fixos (situação, nível) e o catálogo público de jogos.
  Não abre o banco e não lê nenhum dado de criança.
- No máximo LOTE_MAXIMO chamadas por execução, sem repetição: para no primeiro erro.
- Só grava rascunhos em backend/data/{recados,dicas}_rascunhos/ (fora do Git).
  A revisão humana é obrigatória; aprove com `python -m scripts.aprovar_rascunho`.
"""
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from app.praticas.catalogo import JOGOS, NIVEIS, versao_catalogo_jogos
from app.praticas.conteudo import SITUACOES, validar_dica, validar_recado
from scripts import praticas_groq

LOTE_PADRAO = 3
LOTE_MAXIMO = 6
PASTA_DATA = Path(__file__).resolve().parents[1] / "data"
PASTAS = {"recado": PASTA_DATA / "recados_rascunhos", "dica": PASTA_DATA / "dicas_rascunhos"}

_COMUM = (
    "Responda SOMENTE com um objeto JSON no formato {\"texto\": str}, em português do Brasil, "
    "com frases curtas e palavras simples. Não use nome de pessoa nem marcador de nome, não avalie, "
    "não compare, não use termos clínicos, emojis, links ou HTML. Os jogos sorteiam os itens de cada "
    "partida, então nunca diga qual palavra, figura, cor, forma ou fruta vai aparecer no jogo. "
    "Tom calmo e acolhedor, sem pressa e sem cobrança."
)
REGRAS = {
    "recado": (
        "Você escreve recados curtos para crianças que usam um app de jogos educativos; o adulto lê "
        "o recado junto com a criança no fim do relatório. Escreva 1 ou 2 frases, até 140 caracteres, "
        "FALANDO DIRETAMENTE COM A CRIANÇA, na segunda pessoa (você), adequadas à situação recebida "
        "(como os jogos estão para ela) e ao nível. Não fale com o adulto e não use 'a criança', "
        "'seu filho' ou 'responsável'. " + _COMUM
    ),
    "dica": (
        "Você escreve dicas curtas para o adulto da família de uma criança que usa um app de jogos "
        "educativos. A dica é para o jogo recebido, que está difícil para a criança. Escreva uma ação "
        "concreta que o adulto pode fazer junto com a criança, em até 180 caracteres, em palavras "
        "simples, sem termos técnicos. " + _COMUM
    ),
}


def alvos(tipo, niveis, situacoes, jogos):
    """Lista estável do que pedir à Groq."""
    if tipo == "recado":
        return [{"situacao": s, "nivel": n} for n in NIVEIS if n in niveis for s in SITUACOES if s in situacoes]
    return [{"jogo": j} for j in JOGOS if j in jogos]


def montar_mensagens(tipo, alvo):
    """Conteúdo enviado à Groq: só rótulos fixos e o catálogo público de jogos."""
    if tipo == "recado":
        dados = {"situacao": {"id": alvo["situacao"], "rotulo": SITUACOES[alvo["situacao"]]},
                 "nivel": {"id": alvo["nivel"], "rotulo": NIVEIS[alvo["nivel"]]}}
    else:
        j = alvo["jogo"]
        dados = {"jogo": {"id": j, "nome": JOGOS[j]["nome"], "descricao": JOGOS[j]["descricao"]},
                 "situacao": {"id": "dificil", "rotulo": SITUACOES["dificil"]}}
    return [{"role": "system", "content": REGRAS[tipo]},
            {"role": "user", "content": json.dumps(dados, ensure_ascii=False)}]


def resposta_simulada(tipo, alvo):
    if tipo == "recado":
        return json.dumps({"texto": "Você aprende um pouco em cada partida. Siga no seu ritmo."}, ensure_ascii=False)
    return json.dumps({"texto": f"Joguem juntos {JOGOS[alvo['jogo']]['nome']} com calma e comemorem cada acerto."},
                      ensure_ascii=False)


def _lista(valor, validos, nome, p):
    itens = [v for v in valor.split(",") if v] or list(validos)
    for v in itens:
        if v not in validos:
            p.error(f"{nome} desconhecido: {v}")
    return itens


def _parse_args(argv):
    p = argparse.ArgumentParser(description="Gera rascunhos de recados e dicas (revisão humana obrigatória).")
    p.add_argument("--tipo", required=True, choices=sorted(REGRAS))
    p.add_argument("--lote", type=int, default=LOTE_PADRAO, help=f"chamadas por execução (máximo {LOTE_MAXIMO})")
    p.add_argument("--niveis", default="", help="recado: 8, 9 e/ou 10 separados por vírgula (padrão: todos)")
    p.add_argument("--situacoes", default="", help="recado: facil, no_ponto e/ou dificil (padrão: todas)")
    p.add_argument("--jogos", default="", help="dica: ids de jogo separados por vírgula (padrão: todos)")
    p.add_argument("--simular", action="store_true", help="não chama a Groq; marca os itens como origem=simulacao")
    p.add_argument("--saida", default="", help="nome do arquivo de saída dentro da pasta de rascunhos")
    a = p.parse_args(argv)
    if not (1 <= a.lote <= LOTE_MAXIMO):
        p.error(f"--lote deve ficar entre 1 e {LOTE_MAXIMO}")
    return (a, _lista(a.niveis, NIVEIS, "nível", p), _lista(a.situacoes, SITUACOES, "situação", p),
            _lista(a.jogos, JOGOS, "jogo", p))


def _caminho_saida(tipo, nome, agora):
    pasta = PASTAS[tipo]
    pasta.mkdir(parents=True, exist_ok=True)
    nome = nome or agora.strftime("%Y-%m-%dT%H-%M-%S") + ".json"
    destino = (pasta / Path(nome).name).resolve()
    if destino.parent != pasta.resolve():
        raise SystemExit(f"A saída precisa ficar em {pasta}.")
    return destino


def _item(tipo, alvo, texto, origem, saida, destino, contagem):
    if tipo == "recado":
        prefixo = f"recado-{alvo['situacao']}-{alvo['nivel']}"
    else:
        prefixo = f"dica-{alvo['jogo']}"
    contagem[prefixo] = contagem.get(prefixo, 0) + 1
    item = {"id": f"{prefixo}-{contagem[prefixo]:02d}", "status": "rascunho", "origem": origem,
            "modelo": saida["modelo"], "gerado_em": saida["gerado_em"], "rascunho_arquivo": destino.name}
    if origem == "simulacao":
        item.pop("modelo")
    if tipo == "recado":
        item.update(situacao=alvo["situacao"], nivel=alvo["nivel"])
    else:
        item.update(jogo=alvo["jogo"], situacao="dificil")
    item["texto"] = texto
    return item


def main(argv=None, *, chamar=None):
    args, niveis, situacoes, jogos = _parse_args(argv)
    tipo = args.tipo
    chamar = chamar or praticas_groq.chamar_groq
    validar = validar_recado if tipo == "recado" else validar_dica
    pedidos = alvos(tipo, niveis, situacoes, jogos)[: args.lote]

    chave = ""
    if not args.simular:
        chave = praticas_groq.ler_chave()
        if not chave:
            print("GROQ_API_KEY ausente: nenhuma chamada foi feita. Use --simular para testar sem rede.")
            return 3

    agora = datetime.now(timezone.utc)
    destino = _caminho_saida(tipo, args.saida, agora)
    origem = "simulacao" if args.simular else "groq"
    saida = {
        "aviso": "RASCUNHO. Não usar no relatório sem revisão humana da equipe do projeto.",
        "tipo": tipo,
        "versao_catalogo_jogos": versao_catalogo_jogos(),
        "gerado_em": agora.isoformat(timespec="seconds"),
        "origem": origem,
        "modelo": None if args.simular else praticas_groq.MODELO_PADRAO,
        "chamadas_externas": 0,
        "itens": [],
        "descartados": [],
        "interrompido": None,
    }
    contagem = {}
    for alvo in pedidos:
        try:
            if args.simular:
                bruto = resposta_simulada(tipo, alvo)
            else:
                saida["chamadas_externas"] += 1
                bruto = chamar(montar_mensagens(tipo, alvo), chave=chave)
        except praticas_groq.GroqIndisponivel as exc:
            saida["interrompido"] = f"{alvo}: {exc}"
            print(f"Parando sem repetir: {saida['interrompido']}")
            break
        try:
            dados = json.loads(bruto)
            if not isinstance(dados, dict):
                raise ValueError("não é objeto")
        except ValueError:
            saida["descartados"].append({"alvo": alvo, "motivos": ["resposta não é JSON válido"]})
            continue
        item = _item(tipo, alvo, dados.get("texto"), origem, saida, destino, contagem)
        motivos = validar(item)
        if motivos:
            saida["descartados"].append({"item": item, "motivos": motivos})
        else:
            saida["itens"].append(item)

    destino.write_text(json.dumps(saida, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Rascunho gravado em {destino} — {len(saida['itens'])} válido(s), "
          f"{len(saida['descartados'])} descartado(s), {saida['chamadas_externas']} chamada(s) externa(s).")
    print("Revise o texto no próprio arquivo e aprove com: python -m scripts.aprovar_rascunho "
          f"--catalogo {tipo}s --rascunho <arquivo> --id <id> --revisor <iniciais>")
    return 0 if saida["interrompido"] is None else 1


if __name__ == "__main__":
    sys.exit(main())
