from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    OPENAI_API_KEY: str | None = None
    REDIS_URL: str | None = None
    STORAGE_TYPE: str = "local"
    UPLOAD_DIR: str = "./uploads"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
