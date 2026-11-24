"""Conexões SQLite, persistência em modo WAL, backups online seguros e inicialização idempotente do schema oficial da equipe."""
from datetime import datetime, timezone
import re
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from app.core.config import settings

BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DB = BACKEND_DIR / "data" / "cantinho_das_cores.sqlite3"
DB_PATH = Path(settings.database_path) if settings.database_path else DEFAULT_DB
DEFAULT_BACKUP_DIR = BACKEND_DIR / "data" / "backups"
BACKUP_DIR = Path(settings.backup_dir) if settings.backup_dir else DEFAULT_BACKUP_DIR
SCHEMA_PATH = BACKEND_DIR / "schema.sql"

_ID_RE = re.compile(r"[0-9]{1,18}")


def to_id(value):
    """Converte um identificador recebido pela API em inteiro do SQLite; devolve None se não for válido
    (texto, decimal, vazio ou fora da faixa), para que a rota responda 404 em vez de estourar 500."""
    text = str(value).strip() if value is not None else ""
    return int(text) if _ID_RE.fullmatch(text) else None


@contextmanager
def connect():
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
            "INSERT OR IGNORE INTO jogos (id_jogo, nome, habilidade) VALUES (?, ?, ?)",
            ("frutas", "Bloquinho de Frutas", "Atividade lúdica com frutas e blocos"),
        )


def create_backup(target_dir: Path | str | None = None, keep_count: int | None = None) -> dict:
    """Realiza backup online consistente usando a API nativa sqlite3.Connection.backup()
    e aplica rotação mantendo os últimos `keep_count` arquivos."""
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
