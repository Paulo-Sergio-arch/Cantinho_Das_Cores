from datetime import date, datetime, timezone
from app.core.database import connect, to_id


def _utc_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    dt = datetime.fromisoformat(value)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _rec(r):
    sent = r["enviado_em"]
    return {
        "id": str(r["id_relatorio"]),
        "child_id": str(r["id_crianca"]),
        "child_name": r["apelido"],
        "period_start": date.fromisoformat(r["periodo_inicio"]),
        "period_end": date.fromisoformat(r["periodo_fim"]),
        "text": r["texto"],
        "generated_at": _utc_dt(r["gerado_em"]),
        "sent_at": _utc_dt(sent),
        "sent": sent is not None,
    }


BASE = "SELECT r.*, c.apelido FROM relatorios r JOIN criancas c ON c.id_crianca=r.id_crianca"


def _date_expr(col: str, tz_offset_minutes: int) -> tuple[str, list]:
    if tz_offset_minutes:
        return f"date({col}, ?)", [f"{int(tz_offset_minutes):+d} minutes"]
    return f"date({col})", []


def stats(owner_id, child_id, start, end, tz_offset_minutes: int = 0):
    """Resumo e desempenho por jogo restritos ao intervalo [start, end] considerando o fuso informado."""
    d_partidas, tz_args = _date_expr("jogado_em", tz_offset_minutes)
    d_join, tz_join_args = _date_expr("p.jogado_em", tz_offset_minutes)
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
            AVG(CASE WHEN p.concluida=1 THEN pontuacao END) score, AVG(CASE WHEN p.concluida=1 THEN duracao_seg END) dur FROM jogos j
            LEFT JOIN partidas p ON p.id_jogo=j.id_jogo AND p.id_crianca=? AND {d_join} BETWEEN ? AND ?
            GROUP BY j.id_jogo ORDER BY j.id_jogo""",
            args_games,
        ).fetchall()
    total = r["total"]
    summary = {
        "total_matches": total,
        "completed_matches": r["done"],
        "abandoned_matches": total - r["done"],
        "completion_rate": round(r["done"] / total * 100) if total else 0,
        "average_score": r["score"],
        "average_duration_seconds": r["dur"],
        "total_correct": r["ok"],
        "total_errors": r["err"],
    }
    games = [
        {
            "game_id": g["id_jogo"],
            "name": g["nome"],
            "skill": g["habilidade"],
            "total_matches": g["total"],
            "completed_matches": g["done"],
            "average_score": g["score"],
            "average_duration_seconds": g["dur"],
        }
        for g in rows
    ]
    return summary, games


def create(child_id, start, end, text):
    with connect() as db:
        cur = db.execute(
            "INSERT INTO relatorios(id_crianca, periodo_inicio, periodo_fim, texto) VALUES (?,?,?,?)",
            (int(child_id), start.isoformat(), end.isoformat(), text),
        )
        return _rec(db.execute(BASE + " WHERE r.id_relatorio=?", (cur.lastrowid,)).fetchone())


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
