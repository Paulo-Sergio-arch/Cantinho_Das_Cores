"""Comando interno: passa UM item revisado de um rascunho para o catálogo aprovado.

Uso (na pasta backend/), depois de ler e corrigir o texto no próprio arquivo de rascunho:
    python -m scripts.aprovar_rascunho --catalogo recados \\
        --rascunho data/recados_rascunhos/2026-11-26T10-00-00.json --id recado-dificil-8-01 --revisor AK

Recusa, sem mexer no catálogo: id repetido, origem simulação, item inválido ou rascunho fora de data/
(a única exceção é a reserva manual app/modules/reports/praticas_reserva_para_revisao.json).
Não chama a Groq e não abre o banco.
"""
import argparse
import json
import sys
from datetime import date
from pathlib import Path

from app.praticas.conteudo import validar_dica, validar_recado
from app.praticas.validacao import validar_item

BACKEND = Path(__file__).resolve().parents[1]
PASTA_DATA = BACKEND / "data"
PASTA_REPORTS = BACKEND / "app" / "modules" / "reports"
CATALOGOS = {
    "praticas": (PASTA_REPORTS / "praticas_aprovadas.json", validar_item),
    "recados": (PASTA_REPORTS / "recados_aprovados.json", validar_recado),
    "dicas": (PASTA_REPORTS / "dicas_aprovadas.json", validar_dica),
}
RESERVA_MANUAL = PASTA_REPORTS / "praticas_reserva_para_revisao.json"
RECUSADO = 2


def _parse_args(argv):
    p = argparse.ArgumentParser(description="Aprova um item revisado (revisão humana obrigatória).")
    p.add_argument("--catalogo", required=True, choices=sorted(CATALOGOS))
    p.add_argument("--rascunho", required=True, help="arquivo de rascunho dentro de backend/data/")
    p.add_argument("--id", required=True, dest="item_id")
    p.add_argument("--revisor", required=True, help="iniciais de quem revisou")
    p.add_argument("--observacao", default="", help="o que foi editado na revisão (opcional)")
    return p.parse_args(argv)


def _ler_json(caminho):
    return json.loads(Path(caminho).read_text(encoding="utf-8"))


def main(argv=None, *, hoje=None):
    a = _parse_args(argv)
    destino, validar = CATALOGOS[a.catalogo]
    rascunho = Path(a.rascunho)
    if not rascunho.is_absolute():
        rascunho = BACKEND / rascunho
    rascunho = rascunho.resolve()
    if PASTA_DATA.resolve() not in rascunho.parents and rascunho != RESERVA_MANUAL.resolve():
        print("Recusado: o rascunho precisa estar em backend/data/ ou ser a reserva manual de práticas.")
        return RECUSADO
    revisor = a.revisor.strip()
    if not revisor:
        print("Recusado: informe as iniciais de quem revisou.")
        return RECUSADO
    try:
        itens = _ler_json(rascunho).get("itens", [])
    except (OSError, ValueError, AttributeError):
        print(f"Recusado: não consegui ler {rascunho.name}.")
        return RECUSADO
    achados = [i for i in itens if isinstance(i, dict) and i.get("id") == a.item_id]
    if len(achados) != 1:
        print(f"Recusado: o id {a.item_id} não aparece uma única vez em {rascunho.name}.")
        return RECUSADO
    item = dict(achados[0])
    if item.get("origem") == "simulacao":
        print("Recusado: item de simulação nunca entra no catálogo aprovado.")
        return RECUSADO
    item.update(status="aprovado", revisado_por=revisor, revisado_em=(hoje or date.today()).isoformat())
    if a.observacao.strip():
        item["observacao_revisao"] = a.observacao.strip()
    motivos = validar(item, exigir_aprovado=True)
    if motivos:
        print("Recusado: " + "; ".join(motivos))
        return RECUSADO

    catalogo = _ler_json(destino)
    if any(i.get("id") == item["id"] for i in catalogo.get("itens", [])):
        print(f"Recusado: {item['id']} já está no catálogo aprovado.")
        return RECUSADO
    catalogo["itens"] = sorted(catalogo.get("itens", []) + [item], key=lambda i: i.get("id", ""))
    catalogo["versao"] = int(catalogo.get("versao", 0)) + 1
    destino.write_text(json.dumps(catalogo, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Aprovado: {item['id']} entrou em {destino.name} (versão {catalogo['versao']}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
