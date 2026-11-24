"""Testes dos requisitos de produção e hardening do backend:
1. Regra definitiva de pontuação do Bloquinho de Frutas
2. Canal real de envio dos relatórios (outbox, SMTP, webhook e trava em produção)
3. Configuração de hospedagem, domínio, CORS e cabeçalhos HTTPS
4. Backup online protegido por X-Admin-Key, sem vazamento de path, e persistência WAL
5. Segurança reforçada de autenticação e sessões (revogação de JWT + limpeza de expirados, refresh token, rate limit persistido em SQLite e usuário removido)
"""
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from app.core import database
from app.core.config import settings
from app.main import app
from app.modules.auth.repository import repository as users
from app.modules.auth.security import purge_expired_revoked_tokens, revoke_token_jti
from app.modules.children.repository import repository as kids
from app.modules.reports.delivery import clear_outbox, get_outbox
from app.modules.sessions.repository import repository as sessions

client = TestClient(app)
SENHA = "SenhaForte123"


def setup_function():
    users.clear()
    kids.clear()
    sessions.clear()
    clear_outbox()


def registrar_e_logar(email="novos@example.com"):
    r = client.post(
        "/api/auth/register",
        json={"name": "Responsável", "email": email, "password": SENHA, "accepted_terms": True},
    )
    assert r.status_code == 201
    tok = r.json()["access_token"]
    return tok, {"Authorization": f"Bearer {tok}"}


def criar_crianca(headers, nome="Bia", idade=9):
    r = client.post("/api/children", json={"name": nome, "age": idade}, headers=headers)
    assert r.status_code == 201
    return r.json()["id"]


# ---------- 1. Regra definitiva de pontuação do Bloquinho de Frutas ----------
def test_pontuacao_definitiva_bloquinho_de_frutas_concluida_com_bonus():
    _, h = registrar_e_logar("frutas@example.com")
    cid = criar_crianca(h)
    r = client.post(
        "/api/sessions",
        json={
            "child_id": cid,
            "game_id": "frutas",
            "correct_answers": 4,
            "incorrect_answers": 1,
            "completed": True,
            "duration_seconds": 65,
            "goals_completed": 3,
            "total_goals": 3,
            "squares_closed": 2,
            "moves_remaining": 4,
        },
        headers=h,
    )
    assert r.status_code == 201
    body = r.json()
    assert body["completed"] is True
    assert body["correct_answers"] == 5  # normalizado para 5 ao concluir todas as metas
    assert body["score"] == 100


def test_pontuacao_definitiva_bloquinho_de_frutas_parcial_proporcional_as_metas():
    _, h = registrar_e_logar("frutas_parcial@example.com")
    cid = criar_crianca(h)
    r = client.post(
        "/api/sessions",
        json={
            "child_id": cid,
            "game_id": "frutas",
            "correct_answers": 3,
            "incorrect_answers": 2,
            "completed": False,
            "duration_seconds": 50,
            "goals_completed": 2,
            "total_goals": 4,
            "squares_closed": 1,
            "moves_remaining": 0,
        },
        headers=h,
    )
    assert r.status_code == 201
    body = r.json()
    assert body["completed"] is False
    assert 1 <= body["correct_answers"] <= 4
    assert 0 < body["score"] <= 100


# ---------- 2. Canal real de envio dos relatórios ----------
def test_envio_real_de_relatorio_registra_na_outbox_e_marca_enviado():
    _, h = registrar_e_logar("relatorio@example.com")
    cid = criar_crianca(h)
    hoje = datetime.now(timezone.utc).date().isoformat()
    rep = client.post("/api/reports", json={"child_id": cid, "period_start": hoje, "period_end": hoje}, headers=h)
    assert rep.status_code == 201
    rid = rep.json()["id"]

    enviado = client.post(
        f"/api/reports/{rid}/send",
        json={"channel": "console", "recipient": "escola@example.com"},
        headers=h,
    )
    assert enviado.status_code == 200
    data = enviado.json()
    assert data["sent"] is True and data["sent_at"] is not None
    assert data["delivery_channel"] == "console"
    assert data["delivery_recipient"] == "escola@example.com"

    outbox = get_outbox()
    assert len(outbox) == 1
    assert outbox[0]["report_id"] == rid
    assert outbox[0]["recipient"] == "escola@example.com"


def test_producao_recusa_envio_silencioso_sem_smtp_configurado(monkeypatch):
    _, h = registrar_e_logar("prod_rel@example.com")
    cid = criar_crianca(h)
    hoje = datetime.now(timezone.utc).date().isoformat()
    rid = client.post("/api/reports", json={"child_id": cid, "period_start": hoje, "period_end": hoje}, headers=h).json()["id"]

    monkeypatch.setattr(settings, "app_env", "production")
    monkeypatch.setattr(settings, "smtp_host", "")

    r_email = client.post(f"/api/reports/{rid}/send", json={"channel": "email"}, headers=h)
    assert r_email.status_code == 422
    r_console = client.post(f"/api/reports/{rid}/send", json={"channel": "console"}, headers=h)
    assert r_console.status_code == 422
    # Não deve ter marcado como enviado após falha
    assert client.get(f"/api/reports/{rid}/status", headers=h).json()["sent"] is False


# ---------- 3. Hospedagem, domínio e cabeçalhos HTTPS ----------
def test_cabecalhos_de_seguranca_e_hsts_em_https():
    r = client.get("/health", headers={"X-Forwarded-Proto": "https"})
    assert r.status_code == 200
    assert r.headers.get("x-content-type-options") == "nosniff"
    assert r.headers.get("x-frame-options") == "DENY"
    assert "max-age=" in r.headers.get("strict-transport-security", "")


# ---------- 4. Backup e persistência do banco de dados ----------
def test_backup_exige_admin_key_e_nao_vaza_caminho_do_servidor(tmp_path, monkeypatch):
    monkeypatch.setattr(database, "BACKUP_DIR", tmp_path)
    _, h = registrar_e_logar("backup@example.com")
    criar_crianca(h, "Lucas", 10)

    # Responsável comum sem X-Admin-Key é bloqueado com 403
    assert client.post("/api/system/backup", headers=h).status_code == 403
    assert client.get("/api/system/backups", headers=h).status_code == 403

    admin_headers = {"X-Admin-Key": settings.admin_api_key}
    r1 = client.post("/api/system/backup", headers=admin_headers)
    assert r1.status_code == 201
    b1 = r1.json()
    assert b1["filename"].endswith(".sqlite3") and b1["size_bytes"] > 0
    assert "path" not in b1  # nunca vazar caminho absoluto do filesystem
    assert (tmp_path / b1["filename"]).exists()

    lista = client.get("/api/system/backups", headers=admin_headers)
    assert lista.status_code == 200
    assert len(lista.json()) >= 1


# ---------- 5. Segurança da autenticação e das sessões ----------
def test_logout_revoga_token_no_servidor():
    _, h = registrar_e_logar("revogar@example.com")
    assert client.get("/api/auth/me", headers=h).status_code == 200
    assert client.post("/api/auth/logout", headers=h).status_code == 200
    assert client.get("/api/auth/me", headers=h).status_code == 401
    assert client.get("/api/children", headers=h).status_code == 401


def test_limpeza_de_tokens_revogados_expirados():
    expirado = (datetime.now(timezone.utc) - timedelta(hours=2)).timestamp()
    futuro = (datetime.now(timezone.utc) + timedelta(hours=2)).timestamp()
    revoke_token_jti("jti-antigo-expirado", expirado)
    revoke_token_jti("jti-futuro-valido", futuro)

    removidos = purge_expired_revoked_tokens()
    assert removidos >= 0
    with database.connect() as db:
        jtis = {r["jti"] for r in db.execute("SELECT jti FROM tokens_revogados").fetchall()}
    assert "jti-antigo-expirado" not in jtis
    assert "jti-futuro-valido" in jtis


def test_refresh_token_emite_novo_e_revoga_anterior():
    _, h = registrar_e_logar("refresh@example.com")
    r = client.post("/api/auth/refresh", headers=h)
    assert r.status_code == 200
    novo_token = r.json()["access_token"]
    assert client.get("/api/auth/me", headers=h).status_code == 401
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {novo_token}"}).status_code == 200


def test_rate_limiting_persistido_em_sqlite_bloqueia_tentativas_excessivas():
    registrar_e_logar("alvo@example.com")
    for _ in range(5):
        r = client.post("/api/auth/login", json={"email": "alvo@example.com", "password": "errada"})
        assert r.status_code == 401
    with database.connect() as db:
        qtd_ip = db.execute(
            "SELECT COUNT(*) FROM tentativas_login WHERE chave LIKE '%:alvo@example.com' AND chave NOT LIKE 'acct:%'"
        ).fetchone()[0]
        qtd_conta = db.execute(
            "SELECT COUNT(*) FROM tentativas_login WHERE chave = 'acct:alvo@example.com'"
        ).fetchone()[0]
    # Rate limit duplo: cada falha registra a chave ip:email e a chave acct:email.
    assert qtd_ip == 5
    assert qtd_conta == 5
    bloqueado = client.post("/api/auth/login", json={"email": "alvo@example.com", "password": SENHA})
    assert bloqueado.status_code == 429
    assert "Retry-After" in bloqueado.headers


def test_token_de_responsavel_excluido_e_rejeitado_com_401():
    _, h = registrar_e_logar("excluido@example.com")
    with database.connect() as db:
        db.execute("DELETE FROM responsaveis WHERE email='excluido@example.com'")
    assert client.get("/api/children", headers=h).status_code == 401
    assert client.get("/api/dashboard/summary", headers=h).status_code == 401
    assert client.get("/api/reports", headers=h).status_code == 401
