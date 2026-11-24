from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator


class ChildCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    age: int = Field(ge=3, le=18)
    voice_enabled: bool = True

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 2:
            raise ValueError("O nome deve possuir pelo menos 2 caracteres")
        return value


class ChildUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    age: int | None = Field(default=None, ge=3, le=18)
    voice_enabled: bool | None = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if len(value) < 2:
            raise ValueError("O nome deve possuir pelo menos 2 caracteres")
        return value


class ChildPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    age: int
    voice_enabled: bool = True
    responsible_id: str
    created_at: datetime
    updated_at: datetime
