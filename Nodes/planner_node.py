from langchain_core.messages import AIMessage,SystemMessage
from langgraph.graph.message import add_messages
from Agent.all_agents import planner_model
from Schemas.trip_detail_response import TripPlan
from Schemas.agent_schema import AgentState
from Config.vector_store import search_similar_with_budget
import json



def planner_node(state: AgentState):

    clean_messages = []

    for msg in state["messages"]:
        if msg.type == "human":
            clean_messages.append(msg)

        elif msg.type == "ai" and not getattr(msg, "tool_calls", None):
            clean_messages.append(msg)

    clean_messages = clean_messages[-10:]

    preferences = state.get("preferences")
    max_budget = state.get("max_budget")
    user_id = state.get("user_id")
    print("max_budget...............",max_budget)
    # ✅ ALWAYS initialize
    similar_trip = None
    memory_block = ""

    # 🔥 VECTOR RETRIEVAL
    if max_budget:
        user_query = state["messages"][-1].content

        similar_results = search_similar_with_budget(
            query_text=user_query,
            max_budget=max_budget
        )
        print("similar_results................",similar_results)
        if similar_results:
            similar_trip = similar_results[0]
            memory_block = f"""
            The user previously had this similar trip:
            {similar_trip.get("summary")}

            Use it as inspiration but create a NEW itinerary.
            """

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

    system_message = SystemMessage(
        content=memory_block + "\n" + preference_block
    )
    print("system_message..........",system_message)
    structured_response = planner_model.invoke(
        [system_message] + clean_messages
    )

    trip_message = AIMessage(
        content=json.dumps(structured_response.model_dump()),
        additional_kwargs={"type": "trip_plan"}
    )

    return {
        "trip_plan": structured_response,
        "messages": [trip_message],
        "similar_trip": similar_trip,   # optional but useful
        "should_update_budget": False,
        "hotel_data": None
    }   