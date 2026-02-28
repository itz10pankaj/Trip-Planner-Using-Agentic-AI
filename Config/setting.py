from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    OPENWEATHER_API_KEY:str
    OPENAI_API_KEY: str
    DB_HOST: str
    DB_PORT: int
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str
    DB_SSLMODE: str = "require"
    PROJECT_NAME:str = "AI Trip Planner"
    AMADEUS_API_KEY:str
    AMADEUS_API_SECRET:str
    class Config:
        env_file = ".env"
        extra = "ignore"

#@lru_cache
def get_settings():
    return Settings()