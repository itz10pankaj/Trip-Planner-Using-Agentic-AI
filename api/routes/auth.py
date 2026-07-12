from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import uuid
import hashlib
from Config.database import engine
from sqlalchemy import text

router = APIRouter(prefix="/auth", tags=["Auth"])

class AuthRequest(BaseModel):
    username: str
    password: str

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/register")
def register(body: AuthRequest):
    username = body.username.strip()
    password = body.password.strip()
    
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password are required")
        
    user_id = str(uuid.uuid4())
    password_hash = hash_password(password)
    
    with engine.begin() as conn:
        existing = conn.execute(
            text("SELECT user_id FROM users WHERE username = :username"),
            {"username": username}
        ).fetchone()
        
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")
            
        conn.execute(
            text("INSERT INTO users (user_id, username, password_hash) VALUES (:user_id, :username, :password_hash)"),
            {"user_id": user_id, "username": username, "password_hash": password_hash}
        )
        
    return {
        "status": "success",
        "message": "User registered successfully",
        "user_id": user_id,
        "username": username
    }

@router.post("/login")
def login(body: AuthRequest):
    username = body.username.strip()
    password = body.password.strip()
    
    password_hash = hash_password(password)
    
    with engine.connect() as conn:
        user = conn.execute(
            text("SELECT user_id, password_hash FROM users WHERE username = :username"),
            {"username": username}
        ).fetchone()
        
        if not user or user[1] != password_hash:
            raise HTTPException(status_code=401, detail="Invalid username or password")
            
        return {
            "status": "success",
            "message": "Logged in successfully",
            "user_id": user[0],
            "username": username
        }
