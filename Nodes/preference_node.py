from Services.user_preferences_service import get_user_preferences
from Schemas.agent_schema import AgentState
def preference_node(state: AgentState, config):
    thread_id = config["configurable"]["thread_id"]

    from Services.user_preferences_service import get_user_preferences
    prefs = get_user_preferences(thread_id)

    return {
        "preferences": prefs,
        "should_update_budget": False,
        "hotel_data": None
    }