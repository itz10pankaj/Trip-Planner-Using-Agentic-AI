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
            subscription_type VARCHAR(50) DEFAULT 'free',
            subscription_expires_at DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """))
    
    # Add subscription columns if users table already existed
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN subscription_type VARCHAR(50) DEFAULT 'free'"))
    except Exception:
        pass
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN subscription_expires_at DATETIME NULL"))
    except Exception:
        pass

    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS user_request_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            endpoint VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_time (user_id, created_at)
        )
    """))
