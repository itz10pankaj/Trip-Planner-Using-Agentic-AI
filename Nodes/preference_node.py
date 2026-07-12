from Services.user_preferences_service import get_user_preferences
from Schemas.agent_schema import AgentState
import re
def preference_node(state: AgentState, config):
    thread_id = config["configurable"]["thread_id"]
    print("state...............",state)
    user_id = state["user_id"]
    prefs = get_user_preferences(user_id)

    user_query = state["messages"][-1].content.lower()

    use_vector = False
    max_budget = None

    # Detect similar intent
    if "similar" in user_query or "like my" in user_query:
        use_vector = True

    # Extract budget if mentioned
    budget_match = re.search(r'(\d+)', user_query)
    if budget_match:
        max_budget = float(budget_match.group(1))
    print("prefs...........................",{
        "preferences": prefs,
        "should_update_budget": False,
        "hotel_data": None,
        "similar_trip": None,  # will be filled in planner
        "max_budget": max_budget if use_vector else None,
    })
    return {
        "preferences": prefs,
        "should_update_budget": False,
        "hotel_data": None,
        "similar_trip": None,  # will be filled in planner
        "max_budget": max_budget if use_vector else None,
    }