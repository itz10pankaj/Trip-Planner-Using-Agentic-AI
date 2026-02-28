from langchain_core.messages import AIMessage,SystemMessage
from langgraph.graph.message import add_messages
from Agent.all_agents import planner_model
from Schemas.trip_detail_response import TripPlan
from Schemas.agent_schema import AgentState
import json



def planner_node(state: AgentState):
    clean_messages = []

    for msg in state["messages"]:
        # Keep only:
        # - Human messages
        # - AI messages WITHOUT tool_calls
        if msg.type == "human":
            clean_messages.append(msg)

        elif msg.type == "ai" and not getattr(msg, "tool_calls", None):
            clean_messages.append(msg)

        # take last 10 after filtering
        clean_messages = clean_messages[-10:]
    preferences = state.get("preferences")
    preference_block = ""

    if preferences:
        preference_block = f"""
        The user has the following travel preferences:
        - Travel Style: {preferences.get("travel_style")}
        - Budget Range: {preferences.get("budget_range")}
        - Preferred Climate: {preferences.get("preferred_climate")}
        - Food Preference: {preferences.get("food_preference")}
        - Accommodation Type: {preferences.get("accommodation_type")}
        - Travel Pace: {preferences.get("pace")}

        STRICTLY tailor the itinerary according to these preferences.
        """

    system_message = SystemMessage(content=preference_block)

    structured_response = planner_model.invoke([system_message]+clean_messages)
    trip_message = AIMessage(
        content=json.dumps(structured_response.model_dump()),
        additional_kwargs={"type": "trip_plan"}
    )
    return {
        "trip_plan": structured_response,
        "messages": [trip_message],
        "should_update_budget": False,
        "hotel_data": None
    }
    