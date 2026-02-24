from fastapi import APIRouter,Header
from typing import Optional
from pydantic import BaseModel
from Services.user_preferences_service import upsert_user_preferences,get_user_preferences

router = APIRouter()

class UserPreferences(BaseModel):
        travel_style: str | None = None
        budget_range: str | None = None
        preferred_climate: str | None = None
        food_preference: str | None = None
        accommodation_type: str | None = None
        pace: str | None = None
        
@router.post("/preferences")
def save_preference(
    prefs:UserPreferences,
    x_user_id:Optional[str]=Header(None,convert_underscores=False)
):
    if not x_user_id:
        return {"status": "error", "message": "x_user_id required"}

    upsert_user_preferences(x_user_id, prefs.model_dump())

    return {"status": "success", "message": "Preferences saved"}
    
@router.get("/preferences")
def fetch_preferences(
    x_user_id: Optional[str] = Header(None, convert_underscores=False)
):
    if not x_user_id:
        return {"status": "error", "message": "x_user_id required"}

    prefs = get_user_preferences(x_user_id)

    return {"status": "success", "data": prefs}