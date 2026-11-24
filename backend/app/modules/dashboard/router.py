from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from app.modules.auth.dependencies import get_current_claims
from app.modules.auth.repository import repository as users_repository
from app.modules.children.repository import repository as children_repository
from app.modules.games.catalog import get_game
from app.modules.dashboard import repository as repo
from app.modules.dashboard.schemas import Summary, GamePerformance, EvolutionPoint, History

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard pedagógico"])


def responsible_id(claims: dict = Depends(get_current_claims)) -> str:
    if claims.get("guest") or claims.get("role") != "responsible":
        raise HTTPException(status_code=403, detail="Apenas responsáveis cadastrados podem consultar o dashboard")
    if users_repository.get_by_id(claims.get("sub", "")) is None:
        raise HTTPException(status_code=401, detail="Usuário não encontrado ou sessão inválida")
    return claims["sub"]


def check_child(child_id, owner_id):
    if child_id is not None and children_repository.get_owned(child_id, owner_id) is None:
        raise HTTPException(status_code=404, detail="Perfil da criança não encontrado")


def since_date(days: int | None, tz_offset_minutes: int = 0) -> str | None:
    if not days:
        return None
    now_shifted = datetime.now(timezone.utc) + timedelta(minutes=tz_offset_minutes)
    return (now_shifted.date() - timedelta(days=days - 1)).isoformat()


DAYS = Query(default=None, ge=1, le=365, description="Considera só os últimos N dias; omita para todo o período")
TZ_OFFSET = Query(default=0, ge=-840, le=840, description="Deslocamento do fuso horário do cliente em minutos (ex.: -180 para UTC-3)")


@router.get("/summary", response_model=Summary)
def summary(
    child_id: str | None = None,
    days: int | None = DAYS,
    tz_offset_minutes: int = TZ_OFFSET,
    owner_id: str = Depends(responsible_id),
):
    check_child(child_id, owner_id)
    return repo.summary(owner_id, child_id, since_date(days, tz_offset_minutes), tz_offset_minutes=tz_offset_minutes)


@router.get("/games", response_model=list[GamePerformance])
def games(
    child_id: str | None = None,
    days: int | None = DAYS,
    tz_offset_minutes: int = TZ_OFFSET,
    owner_id: str = Depends(responsible_id),
):
    check_child(child_id, owner_id)
    return repo.by_game(owner_id, child_id, since_date(days, tz_offset_minutes), tz_offset_minutes=tz_offset_minutes)


@router.get("/evolution", response_model=list[EvolutionPoint])
def evolution(
    child_id: str | None = None,
    game_id: str | None = None,
    days: int | None = DAYS,
    tz_offset_minutes: int = TZ_OFFSET,
    owner_id: str = Depends(responsible_id),
):
    check_child(child_id, owner_id)
    if game_id is not None and get_game(game_id) is None:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")
    return repo.evolution(owner_id, child_id, game_id, since_date(days, tz_offset_minutes), tz_offset_minutes=tz_offset_minutes)


@router.get("/history", response_model=History)
def history(
    child_id: str | None = None,
    game_id: str | None = None,
    days: int | None = DAYS,
    tz_offset_minutes: int = TZ_OFFSET,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    owner_id: str = Depends(responsible_id),
):
    check_child(child_id, owner_id)
    if game_id is not None and get_game(game_id) is None:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")
    return repo.history(
        owner_id,
        child_id,
        game_id,
        limit,
        offset,
        since=since_date(days, tz_offset_minutes),
        tz_offset_minutes=tz_offset_minutes,
    )
