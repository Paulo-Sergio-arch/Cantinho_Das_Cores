import re
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


def _check_password_strength(value: str) -> str:
    if not re.search(r"[A-Za-zÀ-ÿ]", value) or not re.search(r"\d", value):
        raise ValueError("A senha deve conter pelo menos uma letra e um número.")
    return value


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    accepted_terms: bool = Field(...)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        clean = value.strip()
        if len(clean) < 2:
            raise ValueError("Informe um nome com pelo menos 2 caracteres.")
        return clean

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        return _check_password_strength(value)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password_strength(cls, value: str) -> str:
        return _check_password_strength(value)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=12)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_reset_password_strength(cls, value: str) -> str:
        return _check_password_strength(value)


class DeleteAccountRequest(BaseModel):
    password: str = Field(min_length=1, max_length=128)


class UserPublic(BaseModel):
    id: str
    name: str
    email: str | None = None
    role: str
    is_guest: bool = False
    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserPublic


class MessageResponse(BaseModel):
    message: str
