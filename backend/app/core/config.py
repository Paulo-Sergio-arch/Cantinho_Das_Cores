from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEV_JWT_SECRET = "development-only-secret-change-before-deploy-please-rotate"
EXAMPLE_JWT_SECRET = "change-this-to-a-long-random-secret-before-deploying"  # valor de .env.example
MIN_PRODUCTION_SECRET_LENGTH = 32


class Settings(BaseSettings):
    app_env: str = "development"
    jwt_secret: str = DEV_JWT_SECRET
    jwt_expire_minutes: int = 60
    cors_origins: str = (
        "http://localhost:5185,http://localhost:5173,"
        "https://cantinho-das-cores.vercel.app"
    )
    database_path: str | None = None  # None = backend/data/cantinho_das_cores.sqlite3
    backup_dir: str | None = None     # None = backend/data/backups
    backup_keep_count: int = 10

    # Segurança de autenticação, sessões, rotas públicas e administração
    auth_rate_limit_max_attempts: int = 5
    auth_rate_limit_window_seconds: int = 60
    register_rate_limit_max_attempts: int = 10
    register_rate_limit_window_seconds: int = 300
    guest_rate_limit_max_attempts: int = 30
    guest_rate_limit_window_seconds: int = 60
    report_send_rate_limit_max_attempts: int = 10
    report_send_rate_limit_window_seconds: int = 3600
    enable_docs_in_production: bool = False
    admin_api_key: str = ""

    # Canal real de envio dos relatórios (console | email | smtp | resend | brevo | webhook)
    report_delivery_mode: str = "console"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "no-reply@cantinhodascores.com.br"
    smtp_use_tls: bool = True
    resend_api_key: str = ""
    resend_from: str = ""
    brevo_api_key: str = ""
    brevo_from_name: str = "Cantinho das Cores"
    report_webhook_url: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore", hide_input_in_errors=True)

    @property
    def is_production(self) -> bool:
        return self.app_env.strip().lower() in {"production", "prod"}

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def validate_production(self):
        """Em produção, recusa iniciar com configuração insegura (segredo padrão/curto ou CORS curinga)."""
        if self.is_production:
            if self.jwt_secret in {DEV_JWT_SECRET, EXAMPLE_JWT_SECRET} or len(self.jwt_secret) < MIN_PRODUCTION_SECRET_LENGTH:
                raise ValueError(f"Em produção, defina JWT_SECRET aleatório e privado com pelo menos {MIN_PRODUCTION_SECRET_LENGTH} caracteres.")
            if "*" in self.allowed_origins:
                raise ValueError("Em produção, CORS_ORIGINS deve listar origens explícitas (sem '*').")
        return self


settings = Settings()
