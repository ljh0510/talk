from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise Messenger"
    API_V1_STR: str = "/api/v1"
    
    # JWT & Security
    SECRET_KEY: str = "super_secret_kakao_key_enterprise_grade_1234567890"  # Override in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./messenger.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
