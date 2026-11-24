import hmac
import logging
from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import INTEGRITY_ERRORS, create_backup, list_backups
from app.modules.auth.router import router as auth_router
from app.modules.children.router import router as children_router
from app.modules.games.router import router as games_router
from app.modules.sessions.router import router as sessions_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.reports.router import router as reports_router

logger = logging.getLogger("cantinho")

_show_docs = not settings.is_production or settings.enable_docs_in_production

app = FastAPI(
    title="Cantinho das Cores API",
    description="API do Cantinho das Cores — Autenticação reforçada, perfis, catálogo, partidas, dashboard, envio de relatórios e backup SQLite.",
    version="1.0.0",
    docs_url="/docs" if _show_docs else None,
    redoc_url="/redoc" if _show_docs else None,
    openapi_url="/openapi.json" if _show_docs else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Admin-Key"],
    expose_headers=["Retry-After"],
)


def require_admin_key(x_admin_key: str | None = Header(default=None, alias="X-Admin-Key")) -> None:
    """Protege rotas administrativas do sistema (backups) via chave dedicada ADMIN_API_KEY."""
    configured = (settings.admin_api_key or "").strip()
    if not configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Operações administrativas desabilitadas: configure ADMIN_API_KEY no servidor.",
        )
    if not x_admin_key or not hmac.compare_digest(x_admin_key.strip(), configured):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito à administração do sistema.",
        )


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")
    if not request.url.path.startswith(("/docs", "/redoc", "/openapi.json")):
        response.headers.setdefault("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
    if settings.is_production or request.headers.get("x-forwarded-proto") == "https":
        response.headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
    return response


app.include_router(auth_router)
app.include_router(children_router)
app.include_router(games_router)
app.include_router(sessions_router)
app.include_router(dashboard_router)
app.include_router(reports_router)


async def db_constraint_error(_: Request, exc: Exception):
    message = str(exc).lower()
    if "unique" in message or "duplicate key" in message:
        detail = "Este registro já existe."
        code = 409
    elif "foreign key" in message:
        detail = "Não foi possível concluir: o registro relacionado não existe ou não está disponível."
        code = 422
    elif "check constraint" in message or "not null" in message:
        detail = "Os dados informados não atendem às regras de cadastro."
        code = 422
    else:
        detail = "Não foi possível salvar os dados informados."
        code = 422
    return JSONResponse(status_code=code, content={"detail": detail})


for _err_cls in INTEGRITY_ERRORS:
    app.add_exception_handler(_err_cls, db_constraint_error)


@app.exception_handler(Exception)
async def unexpected_error(request: Request, exc: Exception):
    """Resposta genérica: nada de SQL, caminhos, tokens ou stack trace para o cliente. O detalhe vai só para o log."""
    logger.error("Erro inesperado em %s %s: %s", request.method, request.url.path, type(exc).__name__, exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Erro interno do servidor. Tente novamente em instantes."})


@app.get("/health", tags=["Sistema"])
def health_check():
    return {"status": "ok", "service": "cantinho-das-cores-api", "version": "1.0.0"}


@app.post("/api/system/backup", tags=["Sistema"], status_code=status.HTTP_201_CREATED)
def trigger_backup(_: None = Depends(require_admin_key)):
    """Executa backup online consistente do banco SQLite com rotação automática (somente administração)."""
    info = create_backup()
    # Nunca expor o caminho absoluto do filesystem do servidor na resposta HTTP
    return {
        "filename": info["filename"],
        "size_bytes": info["size_bytes"],
        "created_at": info["created_at"],
        "rotated_out": info["rotated_out"],
    }


@app.get("/api/system/backups", tags=["Sistema"])
def get_backups(_: None = Depends(require_admin_key)):
    """Lista os backups disponíveis no diretório persistente (somente administração)."""
    return list_backups()
