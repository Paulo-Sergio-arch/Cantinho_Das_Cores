"""Consultas agregadas do dashboard pedagógico (somente leitura sobre partidas).

Contagens de partidas (total, concluídas, abandonadas, taxa de conclusão) usam todas as partidas.
Indicadores de desempenho (pontuação, tempo, acertos, erros) usam SOMENTE partidas concluídas;
partidas abandonadas aparecem apenas nas contagens e no histórico.
"""
from datetime import datetime, timezone
from app.core.database import connect


def _date_col(col: str, tz_offset_minutes: int) -> tuple[str, list]:
    if tz_offset_minutes:
        return f"date({col}, ?)", [f"{int(tz_offset_minutes):+d} minutes"]
    return f"date({col})", []


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
        d_expr, tz_args = _date_col("p.jogado_em", tz_offset_minutes)
        sql += f" AND {d_expr} >= ?"
        args.extend(tz_args)
        args.append(since)
    return sql, args


def _dt(v):
    if not v:
        return None
    dt = datetime.fromisoformat(v)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


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
    total, done = r["total"], r["done"]
    return {
        "child_id": str(child_id) if child_id is not None else None,
        "total_matches": total,
        "completed_matches": done,
        "abandoned_matches": total - done,
        "completion_rate": round(done / total * 100) if total else 0,
        "average_score": r["score"],
        "average_duration_seconds": r["dur"],
        "total_correct": r["ok"],
        "total_errors": r["err"],
        "last_played_at": _dt(r["last"]),
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
            ON p.id_jogo=j.id_jogo GROUP BY j.id_jogo ORDER BY j.id_jogo""",
            a,
        ).fetchall()
    return [
        {
            "game_id": r["id_jogo"],
            "name": r["nome"],
            "skill": r["habilidade"],
            "total_matches": r["total"],
            "completed_matches": r["done"],
            "abandoned_matches": r["total"] - r["done"],
            "average_score": r["score"],
            "average_duration_seconds": r["dur"],
            "total_errors": r["err"],
            "last_played_at": _dt(r["last"]),
        }
        for r in rows
    ]


def evolution(owner_id, child_id=None, game_id=None, since=None, tz_offset_minutes: int = 0):
    w, a = _where(owner_id, child_id, game_id, since, tz_offset_minutes=tz_offset_minutes)
    d_expr, tz_args = _date_col("p.jogado_em", tz_offset_minutes)
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
            "date": r["d"],
            "matches": r["n"],
            "completed_matches": r["done"],
            "abandoned_matches": r["n"] - r["done"],
            "average_score": r["score"],
            "average_duration_seconds": r["dur"],
        }
        for r in rows
    ]


def history(owner_id, child_id=None, game_id=None, limit=20, offset=0, since=None, tz_offset_minutes: int = 0):
    w, a = _where(owner_id, child_id, game_id, since=since, tz_offset_minutes=tz_offset_minutes)
    with connect() as db:
        total = db.execute(
            f"SELECT COUNT(*) FROM partidas p JOIN criancas c ON c.id_crianca=p.id_crianca WHERE {w}",
            a,
        ).fetchone()[0]
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
            "correct_answers": r["acertos"],
            "incorrect_answers": r["erros"],
            "score": r["pontuacao"],
            "duration_seconds": r["duracao_seg"],
            "completed": bool(r["concluida"]),
            "played_at": _dt(r["jogado_em"]),
        }
        for r in rows
    ]
    return {"total": total, "limit": limit, "offset": offset, "items": items}
