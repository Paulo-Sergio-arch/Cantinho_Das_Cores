"""Repositório SQLite de responsáveis, persistência de nome, redefinição de senha e exclusão LGPD."""
from dataclasses import dataclass
import hashlib
import secrets
import time
from app.core.database import connect


@dataclass
class UserRecord:
    id: str
    name: str
    email: str
    password_hash: str
    role: str = "responsible"
    is_guest: bool = False


def _hash_reset_code(email: str, code: str) -> str:
    payload = f"{email.strip().lower()}:{code.strip()}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


class SQLiteUserRepository:
    def get_by_email(self, email):
        with connect() as db:
            row = db.execute("SELECT * FROM responsaveis WHERE lower(email) = lower(?)", (email.strip(),)).fetchone()
        return self._record(row) if row else None

    def get_by_id(self, user_id):
        try:
            key = int(user_id)
        except (TypeError, ValueError):
            return None
        with connect() as db:
            row = db.execute("SELECT * FROM responsaveis WHERE id_responsavel = ?", (key,)).fetchone()
        return self._record(row) if row else None

    def add(self, user, accepted_terms=True):
        if not accepted_terms:
            raise ValueError("terms_not_accepted")
        clean_name = (user.name or "").strip() or user.email.split("@")[0]
        with connect() as db:
            inserted = db.execute(
                "INSERT INTO responsaveis(email, senha, aceito_termo, nome) VALUES (?, ?, 1, ?) RETURNING id_responsavel",
                (user.email.strip(), user.password_hash, clean_name),
            ).fetchone()
            user.id = str(inserted["id_responsavel"])
            user.name = clean_name
        return user

    def update_password(self, user_id: str, new_password_hash: str) -> bool:
        try:
            key = int(user_id)
        except (TypeError, ValueError):
            return False
        with connect() as db:
            cur = db.execute(
                "UPDATE responsaveis SET senha = ? WHERE id_responsavel = ?",
                (new_password_hash, key),
            )
            db.execute("DELETE FROM tokens_recuperacao_senha WHERE id_responsavel = ?", (key,))
            return cur.rowcount == 1

    def delete_by_id(self, user_id: str) -> bool:
        try:
            key = int(user_id)
        except (TypeError, ValueError):
            return False
        with connect() as db:
            cur = db.execute("DELETE FROM responsaveis WHERE id_responsavel = ?", (key,))
            return cur.rowcount == 1

    def create_password_reset_code(self, user_id: str, email: str, ttl_seconds: int = 900) -> str:
        code = f"{secrets.randbelow(1_000_000):06d}"
        token_hash = _hash_reset_code(email, code)
        now = time.time()
        with connect() as db:
            db.execute("DELETE FROM tokens_recuperacao_senha WHERE expira_em < ? OR id_responsavel = ?", (now, int(user_id)))
            db.execute(
                "INSERT INTO tokens_recuperacao_senha(token_hash, id_responsavel, expira_em, usado) VALUES (?, ?, ?, 0)",
                (token_hash, int(user_id), now + ttl_seconds),
            )
        return code

    def consume_password_reset_code(self, email: str, code: str) -> str | None:
        token_hash = _hash_reset_code(email, code)
        now = time.time()
        with connect() as db:
            row = db.execute(
                """SELECT id_responsavel FROM tokens_recuperacao_senha
                   WHERE token_hash = ? AND usado = 0 AND expira_em >= ?""",
                (token_hash, now),
            ).fetchone()
            if not row:
                return None
            db.execute("UPDATE tokens_recuperacao_senha SET usado = 1 WHERE token_hash = ?", (token_hash,))
            return str(row["id_responsavel"])

    def clear(self):
        from app.modules.auth.security import clear_revoked_tokens, reset_failed_attempts
        with connect() as db:
            db.execute("DELETE FROM tokens_recuperacao_senha")
            db.execute("DELETE FROM responsaveis")
        clear_revoked_tokens()
        reset_failed_attempts()

    @staticmethod
    def _record(row):
        keys = set(row.keys())
        saved_name = (row["nome"] or "").strip() if "nome" in keys and row["nome"] else ""
        display_name = saved_name or row["email"].split("@")[0]
        return UserRecord(str(row["id_responsavel"]), display_name, row["email"], row["senha"])


repository = SQLiteUserRepository()
