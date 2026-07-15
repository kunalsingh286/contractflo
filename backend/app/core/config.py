from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "ContractFlo API"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"

    # Comma-separated list of allowed origins
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Database (Supabase PostgreSQL) — wired in later phases
    DATABASE_URL: str | None = None

    # Vector store (Qdrant Cloud) — wired in later phases
    QDRANT_URL: str | None = None
    QDRANT_API_KEY: str | None = None

    # AI (Gemini) — wired in later phases
    GEMINI_API_KEY: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
