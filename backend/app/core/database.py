"""Camada de persistência dual: SQLite (desenvolvimento/testes em modo WAL + backups online)
e PostgreSQL / Supabase (produção via DATABASE_URL com psycopg)."""
from contextlib import contextmanager
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path
import re
import sqlite3
from app.core.config import settings

try:
    import psycopg
except ImportError:  # pragma: no cover
    psycopg = None

BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DB = BACKEND_DIR / "data" / "cantinho_das_cores.sqlite3"
DB_PATH = Path(settings.database_path) if settings.database_path else DEFAULT_DB
DEFAULT_BACKUP_DIR = BACKEND_DIR / "data" / "backups"
BACKUP_DIR = Path(settings.backup_dir) if settings.backup_dir else DEFAULT_BACKUP_DIR
SCHEMA_PATH = BACKEND_DIR / "schema.sql"
SUPABASE_SCHEMA_PATH = BACKEND_DIR / "schema_supabase.sql"

INTEGRITY_ERRORS: tuple[type[Exception], ...] = (
    (sqlite3.IntegrityError, psycopg.IntegrityError)
    if psycopg is not None
    else (sqlite3.IntegrityError,)
)

_ID_RE = re.compile(r"[0-9]{1,18}")


def is_postgres() -> bool:
    url = (settings.database_url or "").strip().lower()
    return url.startswith(("postgres://", "postgresql://"))


def sql_date(expr: str, tz_offset_minutes: int = 0) -> tuple[str, list]:
    """Extrai a data (YYYY-MM-DD) de uma coluna timestamp considerando o deslocamento de fuso (`tz_offset_minutes`),
    de forma portátil entre SQLite e PostgreSQL/Supabase."""
    offset = int(tz_offset_minutes or 0)
    if is_postgres():
        if offset:
            return f"CAST((({expr} AT TIME ZONE 'UTC') + (? * INTERVAL '1 minute')) AS DATE)", [offset]
        return f"CAST(({expr} AT TIME ZONE 'UTC') AS DATE)", []
    if offset:
        return f"date({expr}, ?)", [f"{offset:+d} minutes"]
    return f"date({expr})", []


def as_datetime(value) -> datetime | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.astimezone(timezone.utc) if value.tzinfo else value.replace(tzinfo=timezone.utc)
    dt = datetime.fromisoformat(str(value))
    return dt.astimezone(timezone.utc) if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def as_date(value) -> date | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return date.fromisoformat(str(value))


def as_float(value) -> float | None:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    return float(value)


def to_id(value):
    """Converte um identificador recebido pela API em inteiro do banco; devolve None se não for válido
    (texto, decimal, vazio ou fora da faixa), para que a rota responda 404 em vez de estourar 500."""
    text = str(value).strip() if value is not None else ""
    return int(text) if _ID_RE.fullmatch(text) else None


def translate_qmarks_to_pg(sql: str) -> str:
    """Converte placeholders `?` (SQLite) para `%s` (psycopg/PostgreSQL),
    preservando literais entre aspas simples e escapando eventuais `%` literais."""
    out: list[str] = []
    in_single = False
    i = 0
    n = len(sql)
    while i < n:
        ch = sql[i]
        if ch == "'":
            out.append(ch)
            if in_single and i + 1 < n and sql[i + 1] == "'":
                out.append("'")
                i += 2
                continue
            in_single = not in_single
        elif not in_single and ch == "?":
            out.append("%s")
        elif ch == "%":
            out.append("%%")
        else:
            out.append(ch)
        i += 1
    return "".join(out)


class PgRow:
    """Wrapper compatível com sqlite3.Row: aceita acesso por nome (`row['col']`) e por índice (`row[0]`)."""

    def __init__(self, columns: tuple[str, ...], values: tuple):
        self._columns = columns
        self._values = values
        self._map = dict(zip(columns, values))

    def __getitem__(self, key):
        if isinstance(key, int):
            return self._values[key]
        return self._map[key]

    def keys(self):
        return self._columns


class PgCursorAdapter:
    def __init__(self, cursor):
        self._cursor = cursor

    @property
    def rowcount(self) -> int:
        return self._cursor.rowcount

    def _columns(self) -> tuple[str, ...]:
        desc = self._cursor.description or ()
        return tuple(col.name for col in desc)

    def fetchone(self):
        row = self._cursor.fetchone()
        if row is None:
            return None
        return PgRow(self._columns(), row)

    def fetchall(self):
        rows = self._cursor.fetchall()
        cols = self._columns()
        return [PgRow(cols, r) for r in rows]

    def __iter__(self):
        return iter(self.fetchall())


class PgConnectionAdapter:
    def __init__(self, conn):
        self._conn = conn

    def execute(self, sql: str, params=None):
        pg_sql = translate_qmarks_to_pg(sql)
        cur = self._conn.cursor()
        if params is None:
            cur.execute(pg_sql)
        else:
            cur.execute(pg_sql, tuple(params))
        return PgCursorAdapter(cur)

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        self._conn.close()


@contextmanager
def connect():
    if is_postgres():
        if psycopg is None:
            raise RuntimeError("Instale `psycopg[binary]` para conectar ao PostgreSQL/Supabase via DATABASE_URL.")
        raw_conn = psycopg.connect(settings.database_url)
        conn = PgConnectionAdapter(raw_conn)
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
        return

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA busy_timeout = 15000")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    if is_postgres():
        schema = SUPABASE_SCHEMA_PATH.read_text(encoding="utf-8")
        with connect() as conn:
            conn._conn.execute(schema)
            conn.execute(
                "DELETE FROM tokens_revogados WHERE expira_em IS NOT NULL AND expira_em < ?",
                (datetime.now(timezone.utc).isoformat(),),
            )
        return

    schema = SCHEMA_PATH.read_text(encoding="utf-8")
    with connect() as conn:
        conn.execute("PRAGMA journal_mode = WAL")
        conn.execute("PRAGMA synchronous = NORMAL")
        conn.executescript(schema)

        # Migração idempotente: adiciona coluna 'nome' em responsaveis preservando o schema.sql original
        colunas_resp = {r["name"] for r in conn.execute("PRAGMA table_info(responsaveis)").fetchall()}
        if "nome" not in colunas_resp:
            conn.execute("ALTER TABLE responsaveis ADD COLUMN nome TEXT")

        # Tabela auxiliar de segurança para revogação de tokens JWT no logout
        conn.execute(
            """CREATE TABLE IF NOT EXISTS tokens_revogados (
                jti         TEXT PRIMARY KEY,
                revogado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expira_em   DATETIME
            )"""
        )
        # Tabela auxiliar para recuperação de senha com códigos hash de uso único e expiração curta
        conn.execute(
            """CREATE TABLE IF NOT EXISTS tokens_recuperacao_senha (
                token_hash     TEXT PRIMARY KEY,
                id_responsavel INTEGER NOT NULL,
                expira_em      REAL NOT NULL,
                usado          INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (id_responsavel) REFERENCES responsaveis(id_responsavel) ON DELETE CASCADE
            )"""
        )
        # Tabela auxiliar para persistência do rate limiting entre reinícios e workers
        conn.execute(
            """CREATE TABLE IF NOT EXISTS tentativas_login (
                chave     TEXT NOT NULL,
                criado_em REAL NOT NULL
            )"""
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_tentativas_login_chave ON tentativas_login(chave, criado_em)"
        )
        # Limpa tokens revogados já expirados
        conn.execute(
            "DELETE FROM tokens_revogados WHERE expira_em IS NOT NULL AND expira_em < ?",
            (datetime.now(timezone.utc).isoformat(),),
        )
        # O Front-End possui seis jogos; o SQL entregue continha somente cinco.
        conn.execute(
            "INSERT INTO jogos (id_jogo, nome, habilidade) VALUES (?, ?, ?) ON CONFLICT (id_jogo) DO NOTHING",
            ("frutas", "Bloquinho de Frutas", "Atividade lúdica com frutas e blocos"),
        )


def create_backup(target_dir: Path | str | None = None, keep_count: int | None = None) -> dict:
    """Realiza backup online consistente usando a API nativa sqlite3.Connection.backup()
    e aplica rotação mantendo os últimos `keep_count` arquivos. Em PostgreSQL/Supabase,
    os backups automáticos são gerenciados diretamente pelo provedor."""
    if is_postgres():
        return {
            "filename": "managed-by-supabase-postgres",
            "path": "",
            "size_bytes": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "rotated_out": [],
            "managed": True,
            "message": "Banco PostgreSQL/Supabase ativo: backups automáticos gerenciados pelo provedor.",
        }

    dest_dir = Path(target_dir) if target_dir else BACKUP_DIR
    dest_dir.mkdir(parents=True, exist_ok=True)
    keep = keep_count if keep_count is not None else max(1, settings.backup_keep_count)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup_file = dest_dir / f"cantinho_backup_{stamp}.sqlite3"
    seq = 1
    while backup_file.exists():
        backup_file = dest_dir / f"cantinho_backup_{stamp}_{seq}.sqlite3"
        seq += 1

    with connect() as src_conn:
        dst_conn = sqlite3.connect(backup_file)
        try:
            src_conn.backup(dst_conn)
        finally:
            dst_conn.close()

    backups = sorted(dest_dir.glob("cantinho_backup_*.sqlite3"), key=lambda p: p.stat().st_mtime, reverse=True)
    removed = []
    for old_file in backups[keep:]:
        try:
            old_file.unlink()
            removed.append(old_file.name)
        except OSError:
            pass

    size_bytes = backup_file.stat().st_size if backup_file.exists() else 0
    return {
        "filename": backup_file.name,
        "path": str(backup_file),
        "size_bytes": size_bytes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "rotated_out": removed,
    }


def list_backups(target_dir: Path | str | None = None) -> list[dict]:
    if is_postgres():
        return []
    dest_dir = Path(target_dir) if target_dir else BACKUP_DIR
    if not dest_dir.exists():
        return []
    files = sorted(dest_dir.glob("cantinho_backup_*.sqlite3"), key=lambda p: p.stat().st_mtime, reverse=True)
    return [
        {
            "filename": f.name,
            "size_bytes": f.stat().st_size,
            "created_at": datetime.fromtimestamp(f.stat().st_mtime, tz=timezone.utc).isoformat(),
        }
        for f in files
    ]


init_db()
