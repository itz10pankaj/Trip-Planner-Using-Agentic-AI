from fastapi import APIRouter,Header
from langchain_core.messages import HumanMessage
from LangGraph.graph import agent
from typing import Optional
from Services.trip_itinerary_service import save_or_update_itinerary
from Services.chat_services import extract_budget_from_text
import json
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
            print(trip_id,trip_plan,estimated_budget,currency)
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

        # Check if general response contains budget information
        answer_text = result["messages"][-1].content
        print("result.......",answer_text)
        print(result.get("should_update_budget"))
        if result.get("should_update_budget"):
            estimated_budget, currency = extract_budget_from_text(answer_text)
        else:
            estimated_budget, currency = None, None
        print("estimated_budget.......",estimated_budget)
        if estimated_budget is not None and currency is not None:
            save_or_update_itinerary(
                trip_id=trip_id,
                itinerary_data=None,
                estimated_budget=estimated_budget,
                currency=currency,
            )

        # Check if hotel_data exists in result (hotel response from general_node)
        if result.get("hotel_data"):
            hotel_data = result.get("hotel_data")
            return {
                "status": "success",
                "type": "hotels",
                "data": hotel_data
            }

        # Check if response contains JSON hotel data
        try:
            last_message = result["messages"][-1]
            if last_message.tool_calls or (answer_text.strip().startswith('{') and '"type": "hotels"' in answer_text):
                hotel_data = json.loads(answer_text)
                if hotel_data.get("type") == "hotels":
                    return {
                        "status": "success",
                        "type": "hotels",
                        "data": hotel_data
                    }
        except (json.JSONDecodeError, AttributeError):
            pass

        return {
            "status": "success",
            "type": "general",
            "answer": answer_text
        }
