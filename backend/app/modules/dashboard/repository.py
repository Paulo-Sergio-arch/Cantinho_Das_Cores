"""Consultas agregadas do dashboard pedagógico (somente leitura sobre partidas).

Contagens de partidas (total, concluídas, abandonadas, taxa de conclusão) usam todas as partidas.
Indicadores de desempenho (pontuação, tempo, acertos, erros) usam SOMENTE partidas concluídas;
partidas abandonadas aparecem apenas nas contagens e no histórico.
"""
from app.core.database import as_datetime, as_float, connect, sql_date


def _where(owner_id, child_id, game_id=None, since=None, tz_offset_minutes: int = 0):
    sql = "c.id_responsavel = ?"
    args = [int(owner_id)]
    if child_id is not None:
        sql += " AND p.id_crianca = ?"
        args.append(int(child_id))
    if game_id is not None:
        sql += " AND p.id_jogo = ?"
        args.append(game_id)
    if since is not None:
        d_expr, tz_args = sql_date("p.jogado_em", tz_offset_minutes)
        sql += f" AND {d_expr} >= ?"
        args.extend(tz_args)
        args.append(since)
    return sql, args


def summary(owner_id, child_id=None, since=None, tz_offset_minutes: int = 0):
    w, a = _where(owner_id, child_id, since=since, tz_offset_minutes=tz_offset_minutes)
    with connect() as db:
        r = db.execute(
            f"""SELECT COUNT(*) total, COALESCE(SUM(p.concluida),0) done,
            ROUND(AVG(CASE WHEN p.concluida=1 THEN p.pontuacao END),1) score,
            ROUND(AVG(CASE WHEN p.concluida=1 THEN p.duracao_seg END),1) dur,
            COALESCE(SUM(CASE WHEN p.concluida=1 THEN p.acertos END),0) ok,
            COALESCE(SUM(CASE WHEN p.concluida=1 THEN p.erros END),0) err, MAX(p.jogado_em) last
            FROM partidas p JOIN criancas c ON c.id_crianca=p.id_crianca WHERE {w}""",
            a,
        ).fetchone()
    total, done = int(r["total"]), int(r["done"])
    return {
        "child_id": str(child_id) if child_id is not None else None,
        "total_matches": total,
        "completed_matches": done,
        "abandoned_matches": total - done,
        "completion_rate": round(done / total * 100) if total else 0,
        "average_score": as_float(r["score"]),
        "average_duration_seconds": as_float(r["dur"]),
        "total_correct": int(r["ok"]),
        "total_errors": int(r["err"]),
        "last_played_at": as_datetime(r["last"]),
    }


def by_game(owner_id, child_id=None, since=None, tz_offset_minutes: int = 0):
    w, a = _where(owner_id, child_id, since=since, tz_offset_minutes=tz_offset_minutes)
    with connect() as db:
        rows = db.execute(
            f"""SELECT j.id_jogo, j.nome, j.habilidade, COUNT(p.id_partida) total,
            COALESCE(SUM(p.concluida),0) done,
            ROUND(AVG(CASE WHEN p.concluida=1 THEN p.pontuacao END),1) score,
            ROUND(AVG(CASE WHEN p.concluida=1 THEN p.duracao_seg END),1) dur,
            COALESCE(SUM(CASE WHEN p.concluida=1 THEN p.erros END),0) err, MAX(p.jogado_em) last
            FROM jogos j LEFT JOIN (SELECT p.* FROM partidas p JOIN criancas c ON c.id_crianca=p.id_crianca WHERE {w}) p
            ON p.id_jogo=j.id_jogo GROUP BY j.id_jogo, j.nome, j.habilidade ORDER BY j.id_jogo""",
            a,
        ).fetchall()
    return [
        {
            "game_id": r["id_jogo"],
            "name": r["nome"],
            "skill": r["habilidade"],
            "total_matches": int(r["total"]),
            "completed_matches": int(r["done"]),
            "abandoned_matches": int(r["total"]) - int(r["done"]),
            "average_score": as_float(r["score"]),
            "average_duration_seconds": as_float(r["dur"]),
            "total_errors": int(r["err"]),
            "last_played_at": as_datetime(r["last"]),
        }
        for r in rows
    ]


def evolution(owner_id, child_id=None, game_id=None, since=None, tz_offset_minutes: int = 0):
    w, a = _where(owner_id, child_id, game_id, since, tz_offset_minutes=tz_offset_minutes)
    d_expr, tz_args = sql_date("p.jogado_em", tz_offset_minutes)
    with connect() as db:
        rows = db.execute(
            f"""SELECT {d_expr} d, COUNT(*) n, SUM(p.concluida) done,
            ROUND(AVG(CASE WHEN p.concluida=1 THEN p.pontuacao END),1) score,
            ROUND(AVG(CASE WHEN p.concluida=1 THEN p.duracao_seg END),1) dur
            FROM partidas p JOIN criancas c ON c.id_crianca=p.id_crianca WHERE {w}
            GROUP BY d ORDER BY d""",
            [*tz_args, *a],
        ).fetchall()
    return [
        {
            "date": str(r["d"]),
            "matches": int(r["n"]),
            "completed_matches": int(r["done"]),
            "abandoned_matches": int(r["n"]) - int(r["done"]),
            "average_score": as_float(r["score"]),
            "average_duration_seconds": as_float(r["dur"]),
        }
        for r in rows
    ]


def history(owner_id, child_id=None, game_id=None, limit=20, offset=0, since=None, tz_offset_minutes: int = 0):
    w, a = _where(owner_id, child_id, game_id, since=since, tz_offset_minutes=tz_offset_minutes)
    with connect() as db:
        total = int(
            db.execute(
                f"SELECT COUNT(*) FROM partidas p JOIN criancas c ON c.id_crianca=p.id_crianca WHERE {w}",
                a,
            ).fetchone()[0]
        )
        rows = db.execute(
            f"""SELECT p.*, c.apelido, j.nome jogo FROM partidas p
            JOIN criancas c ON c.id_crianca=p.id_crianca JOIN jogos j ON j.id_jogo=p.id_jogo
            WHERE {w} ORDER BY p.jogado_em DESC, p.id_partida DESC LIMIT ? OFFSET ?""",
            a + [limit, offset],
        ).fetchall()
    items = [
        {
            "id": str(r["id_partida"]),
            "child_id": str(r["id_crianca"]),
            "child_name": r["apelido"],
            "game_id": r["id_jogo"],
            "game_name": r["jogo"],
            "correct_answers": int(r["acertos"]),
            "incorrect_answers": int(r["erros"]),
            "score": int(r["pontuacao"]),
            "duration_seconds": int(r["duracao_seg"] or 0),
            "completed": bool(r["concluida"]),
            "played_at": as_datetime(r["jogado_em"]),
        }
        for r in rows
    ]
    return {"total": total, "limit": limit, "offset": offset, "items": items}
