from uuid import uuid4
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from app.modules.auth.dependencies import get_current_claims
from app.modules.auth.repository import repository as users_repository
from app.modules.children.repository import repository as children_repository
from app.modules.games.catalog import get_game
from app.modules.sessions.schemas import SessionCreate, SessionPublic
from app.modules.sessions.repository import SessionRecord, calculate_frutas_score, repository

router = APIRouter(prefix="/api/sessions", tags=["Sessões e resultados"])


def responsible_id(claims: dict = Depends(get_current_claims)) -> str:
    if claims.get("guest") or claims.get("role") != "responsible":
        raise HTTPException(status_code=403, detail="Apenas responsáveis cadastrados podem registrar ou consultar sessões")
    if users_repository.get_by_id(claims.get("sub", "")) is None:
        raise HTTPException(status_code=401, detail="Usuário não encontrado ou sessão inválida")
    return claims["sub"]


@router.post("", response_model=SessionPublic, status_code=status.HTTP_201_CREATED)
def create_session(payload: SessionCreate, owner_id: str = Depends(responsible_id)):
    child = children_repository.get_owned(payload.child_id, owner_id)
    if child is None:
        raise HTTPException(status_code=404, detail="Perfil da criança não encontrado")
    game = get_game(payload.game_id)
    if game is None or not game["active"]:
        raise HTTPException(status_code=404, detail="Jogo não encontrado ou indisponível")
    if child.age not in game["supported_ages"]:
        raise HTTPException(status_code=422, detail="Jogo não disponível para a idade do perfil")

    if game["id"] == "frutas" and (
        payload.goals_completed is not None or payload.squares_closed > 0 or payload.moves_remaining > 0
    ):
        correct_answers, accuracy_rate, score = calculate_frutas_score(
            correct_answers=payload.correct_answers,
            incorrect_answers=payload.incorrect_answers,
            completed=payload.completed,
            goals_completed=payload.goals_completed,
            total_goals=payload.total_goals,
            squares_closed=payload.squares_closed,
            moves_remaining=payload.moves_remaining,
        )
    else:
        if payload.completed and payload.correct_answers != 5:
            raise HTTPException(status_code=422, detail="Uma partida só pode ser concluída com 5 acertos")
        correct_answers = payload.correct_answers
        attempts_calc = correct_answers + payload.incorrect_answers
        accuracy_rate = round(correct_answers / attempts_calc * 100) if attempts_calc else 0
        score = accuracy_rate

    attempts = correct_answers + payload.incorrect_answers
    played_at = payload.played_at or datetime.now(timezone.utc)
    now = datetime.now(timezone.utc)
    item = SessionRecord(
        id=str(uuid4()),
        responsible_id=owner_id,
        child_id=child.id,
        game_id=game["id"],
        age=child.age,
        correct_answers=correct_answers,
        incorrect_answers=payload.incorrect_answers,
        attempts=attempts,
        accuracy_rate=accuracy_rate,
        score=score,
        completed=payload.completed,
        duration_seconds=payload.duration_seconds,
        played_at=played_at,
        created_at=now,
    )
    return repository.create(item)


@router.get("", response_model=list[SessionPublic])
def list_sessions(
    child_id: str | None = Query(default=None),
    game_id: str | None = Query(default=None),
    owner_id: str = Depends(responsible_id),
):
    if child_id is not None and children_repository.get_owned(child_id, owner_id) is None:
        raise HTTPException(status_code=404, detail="Perfil da criança não encontrado")
    if game_id is not None and get_game(game_id) is None:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")
    return repository.list_by_owner(owner_id, child_id=child_id, game_id=game_id)


@router.get("/{session_id}", response_model=SessionPublic)
def read_session(session_id: str, owner_id: str = Depends(responsible_id)):
    item = repository.get_owned(session_id, owner_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    return item
