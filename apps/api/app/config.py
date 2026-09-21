from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

API_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = API_DIR / "project_control.db"


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = f"sqlite:///{DATABASE_PATH.as_posix()}"
    jwt_secret: str = "dev-secret-key-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)


@lru_cache
def get_settings() -> Settings:
    return Settings()
