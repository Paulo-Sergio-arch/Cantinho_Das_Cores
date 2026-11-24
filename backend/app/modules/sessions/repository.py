"""Persistência de partidas (compatível com SQLite e PostgreSQL/Supabase); partidas abandonadas também são gravadas."""
from dataclasses import dataclass
from datetime import datetime, timezone
from app.core.database import as_datetime, connect, to_id


@dataclass
class SessionRecord:
    id: str
    responsible_id: str
    child_id: str
    game_id: str
    age: int
    correct_answers: int
    incorrect_answers: int
    attempts: int
    accuracy_rate: int
    score: int
    completed: bool
    duration_seconds: int
    played_at: datetime
    created_at: datetime


def calculate_frutas_score(
    *,
    correct_answers: int,
    incorrect_answers: int,
    completed: bool,
    goals_completed: int | None = None,
    total_goals: int | None = None,
    squares_closed: int = 0,
    moves_remaining: int = 0,
) -> tuple[int, int, int]:
    """Regra definitiva de pontuação do Bloquinho de Frutas (`frutas`):
    - Acertos normalizados de 0 a 5 (compatível com `CHECK(acertos BETWEEN 0 AND 5)` e `concluida=1 => acertos=5` do schema.sql).
      Quando `completed=True`, normaliza `acertos = 5`; quando parcial e `goals_completed`/`total_goals` são informados,
      converte a proporção de metas atingidas em 0..4 estrelas.
    - Pontuação (0 a 100):
      Base de precisão das conexões (`acertos / (acertos + erros) * 100`) ponderada pelo progresso de metas
      + bônus de Quadrado Mágico (+5 pts por quadrado fechado, até +15)
      + bônus de eficiência de jogadas (+2 pts por jogada restante ao concluir, até +10),
      limitada ao intervalo [0, 100].
    Retorna `(normalized_correct, accuracy_rate, final_score)`."""
    if completed:
        normalized_correct = 5
    elif goals_completed is not None and total_goals:
        ratio = min(1.0, max(0.0, goals_completed / max(1, total_goals)))
        normalized_correct = min(4, round(ratio * 5))
    else:
        normalized_correct = min(4, max(0, correct_answers))

    attempts = normalized_correct + incorrect_answers
    accuracy_rate = round(normalized_correct / attempts * 100) if attempts else 0

    if attempts == 0 and not completed:
        return normalized_correct, 0, 0

    goal_ratio = (
        1.0
        if completed
        else (
            min(1.0, max(0.0, goals_completed / max(1, total_goals)))
            if (goals_completed is not None and total_goals)
            else (normalized_correct / 5.0)
        )
    )

    base_score = round((accuracy_rate * 0.7) + (goal_ratio * 100 * 0.3)) if (goals_completed is not None or squares_closed or moves_remaining) else accuracy_rate
    bonus_squares = min(15, max(0, squares_closed) * 5)
    bonus_moves = min(10, max(0, moves_remaining) * 2) if completed else 0
    final_score = min(100, max(0, base_score + bonus_squares + bonus_moves))
    return normalized_correct, accuracy_rate, final_score


def _to_utc_naive(moment):
    """Converte para UTC antes de descartar o fuso (descartar sem converter gravava o horário local como se fosse UTC)."""
    return moment.astimezone(timezone.utc).replace(tzinfo=None) if moment.tzinfo else moment


class SQLiteSessionRepository:
    def create(self, item: SessionRecord):
        score = max(0, min(100, int(item.score)))
        with connect() as db:
            inserted = db.execute(
                "INSERT INTO partidas(id_crianca,id_jogo,acertos,erros,duracao_seg,pontuacao,concluida,jogado_em) VALUES(?,?,?,?,?,?,?,?) RETURNING id_partida",
                (
                    int(item.child_id),
                    item.game_id,
                    item.correct_answers,
                    item.incorrect_answers,
                    item.duration_seconds,
                    score,
                    int(item.completed),
                    _to_utc_naive(item.played_at).isoformat(sep=" "),
                ),
            ).fetchone()
            row = db.execute(
                "SELECT p.*, c.id_responsavel,c.idade FROM partidas p JOIN criancas c ON c.id_crianca=p.id_crianca WHERE p.id_partida=?",
                (inserted["id_partida"],),
            ).fetchone()
        return self._record(row)

    def list_by_owner(self, owner_id, child_id=None, game_id=None):
        sql = "SELECT p.*,c.id_responsavel,c.idade FROM partidas p JOIN criancas c ON c.id_crianca=p.id_crianca WHERE c.id_responsavel=? AND p.concluida=1"
        args = [int(owner_id)]
        if child_id is not None:
            sql += " AND p.id_crianca=?"
            args.append(int(child_id))
        if game_id is not None:
            sql += " AND p.id_jogo=?"
            args.append(game_id)
        sql += " ORDER BY p.jogado_em DESC"
        with connect() as db:
            rows = db.execute(sql, args).fetchall()
        return [self._record(r) for r in rows]

    def get_owned(self, session_id, owner_id):
        session_key, owner_key = to_id(session_id), to_id(owner_id)
        if session_key is None or owner_key is None:
            return None
        with connect() as db:
            r = db.execute(
                "SELECT p.*,c.id_responsavel,c.idade FROM partidas p JOIN criancas c ON c.id_crianca=p.id_crianca WHERE p.id_partida=? AND c.id_responsavel=? AND p.concluida=1",
                (session_key, owner_key),
            ).fetchone()
        return self._record(r) if r else None

    def delete_for_child(self, child_id):
        # Mantido por compatibilidade; ON DELETE CASCADE já realiza a exclusão.
        with connect() as db:
            db.execute("DELETE FROM partidas WHERE id_crianca=?", (int(child_id),))

    def clear(self):
        with connect() as db:
            db.execute("DELETE FROM partidas")

    @staticmethod
    def _record(r):
        score = int(r["pontuacao"])
        correct = int(r["acertos"])
        incorrect = int(r["erros"])
        attempts = correct + incorrect
        accuracy = round(correct / attempts * 100) if attempts else 0
        dt = as_datetime(r["jogado_em"])
        return SessionRecord(
            str(r["id_partida"]),
            str(r["id_responsavel"]),
            str(r["id_crianca"]),
            r["id_jogo"],
            int(r["idade"]),
            correct,
            incorrect,
            attempts,
            accuracy,
            score,
            bool(r["concluida"]),
            int(r["duracao_seg"] or 0),
            dt,
            dt,
        )


repository = SQLiteSessionRepository()
