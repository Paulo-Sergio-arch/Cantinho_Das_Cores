"""Repositório SQLite de perfis de crianças, incluindo preferência individual de voz (voz_ativa)."""
from dataclasses import dataclass
from datetime import datetime
from app.core.database import connect, to_id


@dataclass
class ChildRecord:
    id: str
    name: str
    age: int
    responsible_id: str
    created_at: datetime
    updated_at: datetime
    voice_enabled: bool = True


class SQLiteChildRepository:
    def create(self, child: ChildRecord):
        with connect() as db:
            cur = db.execute(
                "INSERT INTO criancas(id_responsavel, apelido, idade, voz_ativa) VALUES (?, ?, ?, ?)",
                (int(child.responsible_id), child.name, child.age, int(bool(child.voice_enabled))),
            )
            row = db.execute("SELECT * FROM criancas WHERE id_crianca=?", (cur.lastrowid,)).fetchone()
        return self._record(row)

    def list_by_responsible(self, responsible_id):
        with connect() as db:
            rows = db.execute(
                "SELECT * FROM criancas WHERE id_responsavel=? ORDER BY criado_em",
                (int(responsible_id),),
            ).fetchall()
        return [self._record(r) for r in rows]

    def get_owned(self, child_id, responsible_id):
        child_key, owner_key = to_id(child_id), to_id(responsible_id)
        if child_key is None or owner_key is None:
            return None
        with connect() as db:
            row = db.execute(
                "SELECT * FROM criancas WHERE id_crianca=? AND id_responsavel=?",
                (child_key, owner_key),
            ).fetchone()
        return self._record(row) if row else None

    def update(self, child: ChildRecord):
        with connect() as db:
            db.execute(
                "UPDATE criancas SET apelido=?, idade=?, voz_ativa=? WHERE id_crianca=? AND id_responsavel=?",
                (child.name, child.age, int(bool(child.voice_enabled)), int(child.id), int(child.responsible_id)),
            )
            row = db.execute("SELECT * FROM criancas WHERE id_crianca=?", (int(child.id),)).fetchone()
        return self._record(row)

    def delete(self, child_id):
        with connect() as db:
            db.execute("DELETE FROM criancas WHERE id_crianca=?", (int(child_id),))

    def clear(self):
        with connect() as db:
            db.execute("DELETE FROM criancas")

    @staticmethod
    def _record(r):
        dt = datetime.fromisoformat(r["criado_em"])
        voz = bool(r["voz_ativa"]) if "voz_ativa" in r.keys() else True
        return ChildRecord(
            str(r["id_crianca"]),
            r["apelido"],
            r["idade"],
            str(r["id_responsavel"]),
            dt,
            dt,
            voz,
        )


repository = SQLiteChildRepository()
