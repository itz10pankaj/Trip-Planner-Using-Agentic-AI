from fastapi import APIRouter
from Services.chat_history_service import get_messages
from Config.database import engine
from sqlalchemy import text

router = APIRouter()

@router.get("/history/{thread_id}")
def get_history(thread_id: str):
        messages =get_messages(thread_id)

        if not messages:
            return {
                "status": "error",
                "message": f"No history found for thread_id: {thread_id}"
            }

        return {
            "status": "success",
            "thread_id": thread_id,
            "message_count": len(messages),
            "messages": messages
        }

@router.get("/history/{thread_id}/versions")
def get_itinerary_versions(thread_id: str):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT version, is_active, created_at, estimated_budget, currency
                FROM trip_itineraries
                WHERE trip_id = :trip_id
                ORDER BY version DESC
            """),
            {"trip_id": thread_id}
        ).mappings().fetchall()
        
        return {
            "status": "success",
            "trip_id": thread_id,
            "version_count": len(result),
            "versions": [
                {
                    "version": r["version"],
                    "is_active": bool(r["is_active"]),
                    "created_at": r["created_at"],
                    "estimated_budget": float(r["estimated_budget"]) if r["estimated_budget"] else None,
                    "currency": r["currency"]
                }
                for r in result
            ]
        }

@router.post("/history/{thread_id}/rollback/{version}")
def post_rollback(thread_id: str, version: int):
    from Services.trip_itinerary_service import rollback_itinerary
    result = rollback_itinerary(thread_id, version)
    return result