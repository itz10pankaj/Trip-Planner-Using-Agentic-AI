from fastapi import APIRouter,Header
from langchain_core.messages import HumanMessage
from LangGraph.graph import agent
from typing import Optional
from Services.trip_itinerary_service import save_or_update_itinerary
router = APIRouter()

@router.get("/trips/{trip_id}/chat")
def ask(question: str,  trip_id: str,x_user_id: Optional[str] = Header(None, convert_underscores=False)):
        if not x_user_id:
            return {
                "status":"error",
                "message": "x_user_id is required in Headers"
            }
        result = agent.invoke(
            {
                "messages": [HumanMessage(content=question)]
            },
            config={
                 "configurable": { "thread_id": trip_id }
            }
        )
        if result.get("intent") == "trip" and result.get("trip_plan"):
            trip_plan = result["trip_plan"].model_dump()
            estimated_budget = None
            currency = None
            eb = trip_plan.get("estimated_budget")
            if isinstance(eb, dict):
                estimated_budget = eb.get("amount")
                currency = eb.get("currency")
            else:
                # fallback in case the agent returns a simple value
                estimated_budget = eb
                currency = trip_plan.get("currency")

            save_or_update_itinerary(
                trip_id=trip_id,
                itinerary_data=trip_plan,
                estimated_budget=estimated_budget,
                currency=currency,
            )

            return {
                "status": "success",
                "type": "trip_plan",
                "data": trip_plan
            }

        return {
            "status": "success",
            "type": "general",
            "answer": result["messages"][-1].content
        }
