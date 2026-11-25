import json
from app.core.database import as_date, as_datetime, as_float, connect, sql_date, to_id


def _ler_destaques(r):
    """JSON gravado → dict; relatório antigo, coluna ausente ou inválida → None."""
    try:
        bruto = r["destaques"]
    except (KeyError, IndexError):
        return None
    if not bruto:
        return None
    try:
        dados = json.loads(bruto)
    except (TypeError, ValueError):
        return None
    return dados if isinstance(dados, dict) else None


def _rec(r):
    sent = as_datetime(r["enviado_em"])
    return {
        "id": str(r["id_relatorio"]),
        "child_id": str(r["id_crianca"]),
        "child_name": r["apelido"],
        "child_age": int(r["idade"]),
        "period_start": as_date(r["periodo_inicio"]),
        "period_end": as_date(r["periodo_fim"]),
        "text": r["texto"],
        "destaques": _ler_destaques(r),
        "generated_at": as_datetime(r["gerado_em"]),
        "sent_at": sent,
        "sent": sent is not None,
    }


BASE = "SELECT r.*, c.apelido, c.idade FROM relatorios r JOIN criancas c ON c.id_crianca=r.id_crianca"


def stats(owner_id, child_id, start, end, tz_offset_minutes: int = 0):
    """Resumo e desempenho por jogo restritos ao intervalo [start, end] considerando o fuso informado."""
    d_partidas, tz_args = sql_date("jogado_em", tz_offset_minutes)
    d_join, tz_join_args = sql_date("p.jogado_em", tz_offset_minutes)
    args_summary = [int(child_id), *tz_args, start.isoformat(), end.isoformat()]
    args_games = [int(child_id), *tz_join_args, start.isoformat(), end.isoformat()]
    with connect() as db:
        r = db.execute(
            f"""SELECT COUNT(*) total, COALESCE(SUM(concluida),0) done,
            AVG(CASE WHEN concluida=1 THEN pontuacao END) score, AVG(CASE WHEN concluida=1 THEN duracao_seg END) dur,
            COALESCE(SUM(CASE WHEN concluida=1 THEN acertos END),0) ok,
            COALESCE(SUM(CASE WHEN concluida=1 THEN erros END),0) err FROM partidas
            WHERE id_crianca=? AND {d_partidas} BETWEEN ? AND ?""",
            args_summary,
        ).fetchone()
        rows = db.execute(
            f"""SELECT j.id_jogo, j.nome, j.habilidade, COUNT(p.id_partida) total, COALESCE(SUM(p.concluida),0) done,
            AVG(CASE WHEN p.concluida=1 THEN pontuacao END) score, AVG(CASE WHEN p.concluida=1 THEN duracao_seg END) dur,
            COALESCE(SUM(CASE WHEN p.concluida=1 THEN p.erros END),0) err FROM jogos j
            LEFT JOIN partidas p ON p.id_jogo=j.id_jogo AND p.id_crianca=? AND {d_join} BETWEEN ? AND ?
            GROUP BY j.id_jogo, j.nome, j.habilidade ORDER BY j.id_jogo""",
            args_games,
        ).fetchall()
    total = int(r["total"])
    done = int(r["done"])
    summary = {
        "total_matches": total,
        "completed_matches": done,
        "abandoned_matches": total - done,
        "completion_rate": round(done / total * 100) if total else 0,
        "average_score": as_float(r["score"]),
        "average_duration_seconds": as_float(r["dur"]),
        "total_correct": int(r["ok"]),
        "total_errors": int(r["err"]),
    }
    games = [
        {
            "game_id": g["id_jogo"],
            "name": g["nome"],
            "skill": g["habilidade"],
            "total_matches": int(g["total"]),
            "completed_matches": int(g["done"]),
            "abandoned_matches": int(g["total"]) - int(g["done"]),
            "average_score": as_float(g["score"]),
            "average_duration_seconds": as_float(g["dur"]),
            "total_errors": int(g["err"]),
        }
        for g in rows
    ]
    return summary, games


def count_by_child(child_id):
    """Quantos relatórios a criança já tem (usado só para o rodízio das práticas)."""
    with connect() as db:
        return db.execute("SELECT COUNT(*) n FROM relatorios WHERE id_crianca=?", (int(child_id),)).fetchone()["n"]


def period_details(owner_id, child_id, start, end, tz_offset_minutes: int = 0, history_limit: int = 15):
    """Retorna métricas completas do período (resumo, por jogo, evolução diária e partidas recentes) para visualização e PDF."""
    summary, games = stats(owner_id, child_id, start, end, tz_offset_minutes=tz_offset_minutes)
    d_sel, tz_sel = sql_date("p.jogado_em", tz_offset_minutes)
    d_where, tz_where = sql_date("p.jogado_em", tz_offset_minutes)
    start_iso, end_iso = start.isoformat(), end.isoformat()
    with connect() as db:
        evo_rows = db.execute(
            f"""SELECT {d_sel} d, COUNT(*) n, COALESCE(SUM(p.concluida),0) done,
            ROUND(AVG(CASE WHEN p.concluida=1 THEN p.pontuacao END),1) score,
            ROUND(AVG(CASE WHEN p.concluida=1 THEN p.duracao_seg END),1) dur
            FROM partidas p
            WHERE p.id_crianca=? AND {d_where} BETWEEN ? AND ?
            GROUP BY d ORDER BY d""",
            [*tz_sel, int(child_id), *tz_where, start_iso, end_iso],
        ).fetchall()
        hist_rows = db.execute(
            f"""SELECT p.*, j.nome jogo FROM partidas p
            JOIN jogos j ON j.id_jogo=p.id_jogo
            WHERE p.id_crianca=? AND {d_where} BETWEEN ? AND ?
            ORDER BY p.jogado_em DESC, p.id_partida DESC LIMIT ?""",
            [int(child_id), *tz_where, start_iso, end_iso, int(history_limit)],
        ).fetchall()

    evolution = [
        {
            "date": str(r["d"]),
            "matches": int(r["n"]),
            "completed_matches": int(r["done"]),
            "abandoned_matches": int(r["n"]) - int(r["done"]),
            "average_score": as_float(r["score"]),
            "average_duration_seconds": as_float(r["dur"]),
        }
        for r in evo_rows
    ]
    recent_matches = [
        {
            "id": str(r["id_partida"]),
            "game_id": r["id_jogo"],
            "game_name": r["jogo"],
            "correct_answers": int(r["acertos"]),
            "incorrect_answers": int(r["erros"]),
            "score": int(r["pontuacao"]),
            "duration_seconds": int(r["duracao_seg"] or 0),
            "completed": bool(r["concluida"]),
            "played_at": as_datetime(r["jogado_em"]),
        }
        for r in hist_rows
    ]
    return summary, games, evolution, recent_matches


def create(child_id, start, end, text, destaques=None):
    bruto = json.dumps(destaques, ensure_ascii=False) if destaques else None
    with connect() as db:
        inserted = db.execute(
            "INSERT INTO relatorios(id_crianca, periodo_inicio, periodo_fim, texto, destaques) VALUES (?,?,?,?,?) "
            "RETURNING id_relatorio",
            (int(child_id), start.isoformat(), end.isoformat(), text, bruto),
        ).fetchone()
        return _rec(db.execute(BASE + " WHERE r.id_relatorio=?", (inserted["id_relatorio"],)).fetchone())


def list_by_owner(owner_id, child_id=None, sent=None):
    sql = BASE + " JOIN responsaveis o ON o.id_responsavel=c.id_responsavel WHERE o.id_responsavel=?"
    args = [int(owner_id)]
    if child_id is not None:
        sql += " AND r.id_crianca=?"
        args.append(int(child_id))
    if sent is not None:
        sql += " AND r.enviado_em IS NOT NULL" if sent else " AND r.enviado_em IS NULL"
    sql += " ORDER BY r.gerado_em DESC, r.id_relatorio DESC"
    with connect() as db:
        return [_rec(r) for r in db.execute(sql, args).fetchall()]


def ultimo_com_destaques(child_id, owner_id):
    """Relatório mais recente da criança que tenha destaques (para o recado na área da criança)."""
    cid, oid = to_id(child_id), to_id(owner_id)
    if cid is None or oid is None:
        return None
    with connect() as db:
        r = db.execute(BASE + " WHERE r.id_crianca=? AND c.id_responsavel=? AND r.destaques IS NOT NULL "
                       "ORDER BY r.gerado_em DESC, r.id_relatorio DESC LIMIT 1", (cid, oid)).fetchone()
    return _rec(r) if r else None


def get_owned(report_id, owner_id):
    rid, oid = to_id(report_id), to_id(owner_id)
    if rid is None or oid is None:
        return None
    with connect() as db:
        r = db.execute(BASE + " WHERE r.id_relatorio=? AND c.id_responsavel=?", (rid, oid)).fetchone()
    return _rec(r) if r else None


def mark_sent(report_id, *, allow_resend: bool = False):
    """Marca enviado_em. Quando allow_resend=False, exige que ainda não tenha sido enviado."""
    with connect() as db:
        if allow_resend:
            cur = db.execute(
                "UPDATE relatorios SET enviado_em=CURRENT_TIMESTAMP WHERE id_relatorio=?",
                (int(report_id),),
            )
        else:
            cur = db.execute(
                "UPDATE relatorios SET enviado_em=CURRENT_TIMESTAMP WHERE id_relatorio=? AND enviado_em IS NULL",
                (int(report_id),),
            )
        return cur.rowcount == 1


def delete_owned(report_id, owner_id) -> bool:
    rid, oid = to_id(report_id), to_id(owner_id)
    if rid is None or oid is None:
        return False
    with connect() as db:
        cur = db.execute(
            """DELETE FROM relatorios
               WHERE id_relatorio = ?
                 AND id_crianca IN (SELECT id_crianca FROM criancas WHERE id_responsavel = ?)""",
            (rid, oid),
        )
        return cur.rowcount == 1
