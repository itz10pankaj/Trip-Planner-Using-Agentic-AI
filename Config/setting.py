from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    OPENWEATHER_API_KEY:str
    OPENAI_API_KEY: str
    PROJECT_NAME:str = "AI Trip Planner"

    class Config:
        env_file = ".env"
        extra = "ignore"

#@lru_cache
def get_settings():
    return Settings()