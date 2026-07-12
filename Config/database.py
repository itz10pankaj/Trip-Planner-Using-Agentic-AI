from sqlalchemy import create_engine, text
from urllib.parse import quote_plus
from Config.setting import get_settings
settings = get_settings()
DB_PASS = quote_plus(settings.DB_PASSWORD)

DB_URL = (
    f"mysql+pymysql://{settings.DB_USER}:"
    f"{DB_PASS}@{settings.DB_HOST}:"
    f"{settings.DB_PORT}/{settings.DB_NAME}"
)

engine = create_engine(DB_URL, pool_pre_ping=True)

# Automatically initialize database tables
with engine.begin() as conn:
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS users (
            user_id VARCHAR(255) PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))