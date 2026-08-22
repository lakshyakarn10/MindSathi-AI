import os
from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    PROJECT_NAME: str = "MindSaathi API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "sqlite:///./mindsaathi.db"

    # JWT
    JWT_SECRET_KEY: str = "mindsaathi_super_secret_jwt_key_development_2026_change_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    FRONTEND_ORIGIN: Union[str, List[str]] = "http://localhost:3000,http://localhost:5173"

    @field_validator("FRONTEND_ORIGIN", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        return ["http://localhost:3000", "http://localhost:5173"]

    # Encryption (AES for Journal)
    JOURNAL_ENCRYPTION_KEY: str = "mindsaathi_32_byte_aes_secret_key_demo!"

    # National Helpline
    TELE_MANAS_RESOURCE_URL: str = "https://telemanas.mohfw.gov.in/"
    TELE_MANAS_HELPLINE: str = "14416"

    # Privacy & k-Anonymity
    MAX_AGGREGATE_GROUP_SIZE: int = 15
    MIN_COHORT_PRIVACY_THRESHOLD: int = 15

    # Rate Limiting
    RATE_LIMIT_LOGIN_PER_MINUTE: int = 10
    RATE_LIMIT_GENERAL_PER_MINUTE: int = 100

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
