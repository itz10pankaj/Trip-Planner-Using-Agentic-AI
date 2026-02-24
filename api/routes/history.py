from fastapi import APIRouter
from Services.chat_history_service import get_messages
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