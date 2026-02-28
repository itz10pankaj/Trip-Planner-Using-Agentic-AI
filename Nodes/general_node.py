
from langchain_core.messages import SystemMessage
from Config.setting import get_settings
from Agent.all_agents import general_model
from Schemas.agent_schema import AgentState
settings = get_settings()


system_prompt = """You are a helpful travel assistant. When mentioning budget information, always format it consistently as:
"[amount] [CURRENCY_CODE]"

Examples:
- "54,616 INR" (not "INR 54,616" or "₹54,616")
- "5000 USD" (not "USD 5000" or "$5000")
- "1500 EUR" (not "EUR 1500" or "€1500")

Always use the currency code (like INR, USD, EUR) and place the amount before the code.
If the user is modifying, converting, or asking to update the trip budget,
respond normally BUT internally you are updating budget context.

IMPORTANT TOOL USAGE:
- If the user asks for hotel suggestions in a city, you MUST use the get_hotels tool.
- If the user asks about weather, use the get_current_weather tool.
- If the user asks for currency conversion, use the convert_currency tool.

HOTEL TOOL PAGINATION:
When calling get_hotels tool:
- Always provide offset (starting position) and limit (number of results) parameters
- Start with offset=0 and limit=5 for the initial request
- If user asks for "more hotels" or "next hotels", calculate new offset = previous_offset + previous_limit
- Keep limit=5 unless user specifies a different number
- Example: First call (offset=0, limit=5), Second call (offset=5, limit=5), Third call (offset=10, limit=5)

RESPONSE FORMAT FOR HOTELS:
When returning hotel data from the tool, format your response as:
{
    "type": "hotels",
    "data": [array of hotel objects],
    "offset": current_offset,
    "limit": current_limit,
    "message": "Brief description of results"
}

Return the raw JSON without markdown formatting for hotel results."""

def general_node(state: AgentState):
    # Prepend system prompt to messages
    messages_with_prompt = [SystemMessage(content=system_prompt)] + state["messages"]
    response = general_model.invoke(messages_with_prompt)
    import re
    import json
    
    # Check if response contains hotel data in JSON format
    try:
        # Try to parse if response is JSON
        if response.content.strip().startswith('{'):
            hotel_data = json.loads(response.content)
            if hotel_data.get("type") == "hotels":
                # Hotel response already in JSON format
                return {
                    "messages": [response],
                    "trip_plan": None,
                    "should_update_budget": False,
                    "hotel_data": hotel_data
                }
    except json.JSONDecodeError:
        pass
    
    # Check for budget in response
    budget_pattern = r"\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s[A-Z]{3}\b"
    match = re.search(budget_pattern, response.content)
    should_update_budget = bool(match)
    print("should_update_budget//////",should_update_budget)
    return {
        "messages": [response],
        "trip_plan": None,
        "should_update_budget": should_update_budget,
        "hotel_data": None
    }
