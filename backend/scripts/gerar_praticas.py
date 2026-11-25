"""Comando interno: gera RASCUNHOS de "Sugestão de prática em casa" com a Groq.

Uso (na pasta backend/):
    python -m scripts.gerar_praticas --lote 3 --temas cores,formas --niveis 8
    python -m scripts.gerar_praticas --simular --lote 2      # sem rede, sem chave

Regras:
- Envia à Groq só os temas fixos e o catálogo público de jogos. Não abre o banco
  e não lê nenhum dado de criança.
- Uma chamada por combinação tema/nível, no máximo LOTE_MAXIMO por execução,
  sem repetição automática: para no primeiro erro e grava o que já tiver.
- Só grava rascunhos em backend/data/praticas_rascunhos/ (fora do Git).
  Nunca escreve no catálogo aprovado; a revisão humana é obrigatória.
"""
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from app.praticas.catalogo import JOGOS, NIVEIS, TEMAS, combinacoes, jogos_permitidos, versao_catalogo_jogos
from app.praticas.validacao import validar_item
from scripts import praticas_groq

LOTE_PADRAO = 3
LOTE_MAXIMO = 6
PASTA_RASCUNHOS = Path(__file__).resolve().parents[1] / "data" / "praticas_rascunhos"

REGRAS = (
    "Você escreve sugestões curtas de prática em casa para crianças que usam um app de jogos "
    "educativos; o adulto lê o texto junto com a criança. Responda SOMENTE com um objeto JSON no formato "
    '{"titulo": str, "jogos": [str], "instrucoes": [str]}. Regras: '
    "em 'jogos' use 1 ou 2 valores do campo 'id' de 'jogos_permitidos' (por exemplo \"cores\"), "
    "nunca o nome do jogo; titulo com até 60 caracteres; de 1 a 3 instrucoes, cada uma com até "
    "160 caracteres, em português do Brasil, FALANDO DIRETAMENTE COM A CRIANÇA, na segunda pessoa "
    "(você), com frases curtas e simples; não fale com o adulto e não use 'a criança', 'seu filho' "
    "ou 'responsável'; "
    "os jogos sorteiam os itens de cada partida, então nunca diga qual palavra, figura, cor, forma "
    "ou fruta vai aparecer no jogo; atividades fora do jogo podem ser genéricas "
    "(por exemplo, procurar algo azul em casa); "
    "não avalie a criança, não use termos clínicos, não use emojis, links ou HTML; "
    "tom calmo e acolhedor, sem pressa e sem cobrança."
)


def montar_mensagens(tema, nivel):
    """Conteúdo enviado à Groq: só temas fixos, a combinação pedida e o catálogo público."""
    dados = {
        "temas": TEMAS,
        "tema": {"id": tema, "rotulo": TEMAS[tema]},
        "nivel": {"id": nivel, "rotulo": NIVEIS[nivel]},
        "jogos_permitidos": [
            {"id": j, "nome": JOGOS[j]["nome"], "descricao": JOGOS[j]["descricao"]}
            for j in jogos_permitidos(tema, nivel)
        ],
    }
    return [
        {"role": "system", "content": REGRAS},
        {"role": "user", "content": json.dumps(dados, ensure_ascii=False)},
    ]


def resposta_simulada(tema, nivel):
    jogos = jogos_permitidos(tema, nivel)[:1]
    nome = JOGOS[jogos[0]]["nome"]
    return json.dumps({
        "titulo": f"Prática simulada: {TEMAS[tema]}"[:60],
        "jogos": jogos,
        "instrucoes": [f"Jogue uma partida de {nome} no seu ritmo.",
                       "Depois, conte para alguém da sua casa do que você mais gostou."],
    }, ensure_ascii=False)


def _parse_args(argv):
    p = argparse.ArgumentParser(description="Gera rascunhos de prática em casa (revisão humana obrigatória).")
    p.add_argument("--lote", type=int, default=LOTE_PADRAO, help=f"combinações por execução (máximo {LOTE_MAXIMO})")
    p.add_argument("--temas", default="", help="ids separados por vírgula (padrão: todos)")
    p.add_argument("--niveis", default="", help="8, 9 e/ou 10 separados por vírgula (padrão: todos)")
    p.add_argument("--simular", action="store_true", help="não chama a Groq; marca os itens como origem=simulacao")
    p.add_argument("--saida", default="", help="arquivo de saída dentro de data/praticas_rascunhos/")
    a = p.parse_args(argv)
    if not (1 <= a.lote <= LOTE_MAXIMO):
        p.error(f"--lote deve ficar entre 1 e {LOTE_MAXIMO}")
    temas = [t for t in a.temas.split(",") if t] or list(TEMAS)
    niveis = [n for n in a.niveis.split(",") if n] or list(NIVEIS)
    for t in temas:
        if t not in TEMAS:
            p.error(f"tema desconhecido: {t}")
    for n in niveis:
        if n not in NIVEIS:
            p.error(f"nível desconhecido: {n}")
    return a, temas, niveis


def _caminho_saida(nome, agora):
    PASTA_RASCUNHOS.mkdir(parents=True, exist_ok=True)
    nome = nome or agora.strftime("%Y-%m-%dT%H-%M-%S") + ".json"
    destino = (PASTA_RASCUNHOS / Path(nome).name).resolve()
    if destino.parent != PASTA_RASCUNHOS.resolve():
        raise SystemExit("A saída precisa ficar em data/praticas_rascunhos/.")
    return destino


def main(argv=None, *, chamar=None):
    args, temas, niveis = _parse_args(argv)
    chamar = chamar or praticas_groq.chamar_groq
    pedidos = [(t, n) for (t, n) in combinacoes() if t in temas and n in niveis][: args.lote]
    if not pedidos:
        print("Nenhuma combinação tema/nível válida para os filtros informados.")
        return 2

    chave = ""
    if not args.simular:
        chave = praticas_groq.ler_chave()
        if not chave:
            print("GROQ_API_KEY ausente: nenhuma chamada foi feita. Use --simular para testar sem rede.")
            return 3

    agora = datetime.now(timezone.utc)
    destino = _caminho_saida(args.saida, agora)
    origem = "simulacao" if args.simular else "groq"
    saida = {
        "aviso": "RASCUNHO. Não usar no relatório sem revisão humana da equipe do projeto.",
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
    for tema, nivel in pedidos:
        try:
            if args.simular:
                bruto = resposta_simulada(tema, nivel)
            else:
                saida["chamadas_externas"] += 1
                bruto = chamar(montar_mensagens(tema, nivel), chave=chave)
        except praticas_groq.GroqIndisponivel as exc:
            saida["interrompido"] = f"{tema}/{nivel}: {exc}"
            print(f"Parando sem repetir: {saida['interrompido']}")
            break
        try:
            dados = json.loads(bruto)
            if not isinstance(dados, dict):
                raise ValueError("não é objeto")
        except ValueError:
            saida["descartados"].append({"tema": tema, "nivel": nivel, "motivos": ["resposta não é JSON válido"]})
            continue
        contagem[(tema, nivel)] = contagem.get((tema, nivel), 0) + 1
        item = {
            "id": f"{tema}-{nivel}-{contagem[(tema, nivel)]:02d}",
            "status": "rascunho",
            "origem": origem,
            "modelo": saida["modelo"],
            "gerado_em": saida["gerado_em"],
            "rascunho_arquivo": destino.name,
            "tema": tema,
            "nivel": nivel,
            "titulo": dados.get("titulo"),
            "jogos": dados.get("jogos"),
            "instrucoes": dados.get("instrucoes"),
        }
        if origem == "simulacao":
            item.pop("modelo")
        motivos = validar_item(item)
        if motivos:
            saida["descartados"].append({"item": item, "motivos": motivos})
        else:
            saida["itens"].append(item)

    destino.write_text(json.dumps(saida, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Rascunho gravado em {destino} — {len(saida['itens'])} válido(s), "
          f"{len(saida['descartados'])} descartado(s), {saida['chamadas_externas']} chamada(s) externa(s).")
    print("Revise o texto no próprio arquivo e aprove com: python -m scripts.aprovar_rascunho "
          "--catalogo praticas --rascunho <arquivo> --id <id> --revisor <iniciais>")
    return 0 if saida["interrompido"] is None else 1


if __name__ == "__main__":
    sys.exit(main())
