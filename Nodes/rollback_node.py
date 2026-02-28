from sqlalchemy import text
from Config.database import engine
from langchain_core.messages import AIMessage
from Services.trip_itinerary_service import rollback_itinerary
def rollback_node(state,config):
    last_message = state["messages"][-1].content.lower()
    trip_id = config["configurable"]["thread_id"]
    import re
    match = re.search(r'\d+', last_message)

    if not match:
        return {
            "messages": [AIMessage(content="Please specify a version number to restore.")],
            "should_update_budget": False,
            "hotel_data": None
        }

    target_version = int(match.group())
    rollback_itinerary(trip_id,target_version)
    return {
        "messages": [AIMessage(content=f"Successfully restored version {target_version}.")],
        "should_update_budget": False,
        "hotel_data": None
    }