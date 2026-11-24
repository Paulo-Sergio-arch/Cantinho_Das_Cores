from datetime import datetime, timezone
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Response, status
from app.modules.auth.dependencies import get_current_claims
from app.modules.auth.repository import repository as users_repository
from app.modules.children.schemas import ChildCreate, ChildUpdate, ChildPublic
from app.modules.children.repository import ChildRecord, repository
from app.modules.sessions.repository import repository as sessions_repository

router = APIRouter(prefix="/api/children", tags=["Perfis das crianças"])

def responsible_id(claims: dict = Depends(get_current_claims)) -> str:
    if claims.get("guest") or claims.get("role") != "responsible":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas responsáveis cadastrados podem gerenciar perfis")
    if users_repository.get_by_id(claims.get("sub", "")) is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuário não encontrado ou sessão inválida")
    return claims["sub"]

@router.post("", response_model=ChildPublic, status_code=status.HTTP_201_CREATED)
def create_child(payload: ChildCreate, owner_id: str = Depends(responsible_id)):
    now = datetime.now(timezone.utc)
    child = ChildRecord(
        id=str(uuid4()),
        name=payload.name,
        age=payload.age,
        responsible_id=owner_id,
        created_at=now,
        updated_at=now,
        voice_enabled=payload.voice_enabled,
    )
    return repository.create(child)

@router.get("", response_model=list[ChildPublic])
def list_children(owner_id: str = Depends(responsible_id)):
    return repository.list_by_responsible(owner_id)

@router.get("/{child_id}", response_model=ChildPublic)
def get_child(child_id: str, owner_id: str = Depends(responsible_id)):
    child = repository.get_owned(child_id, owner_id)
    if child is None:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    return child

@router.put("/{child_id}", response_model=ChildPublic)
def update_child(child_id: str, payload: ChildUpdate, owner_id: str = Depends(responsible_id)):
    child = repository.get_owned(child_id, owner_id)
    if child is None:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    changes = payload.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=422, detail="Informe ao menos um campo para atualizar")
    for field, value in changes.items():
        if value is not None:
            setattr(child, field, value)
    return repository.update(child)

@router.delete("/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_child(child_id: str, owner_id: str = Depends(responsible_id)):
    child = repository.get_owned(child_id, owner_id)
    if child is None:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    sessions_repository.delete_for_child(child_id)
    repository.delete(child_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
