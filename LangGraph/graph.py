from langgraph.graph import StateGraph,END
from typing import TypedDict,Annotated, Sequence,Optional
from langchain_core.messages import BaseMessage
from langgraph.prebuilt import ToolNode
from Tools.weather_info_tool import get_current_weather
from Tools.currency_conversion_tool import convert_currency
from langgraph.graph.message import add_messages
from Config.dbConfig import memory
from Schemas.trip_detail_response import TripPlan
from Nodes.router_node import router_node
from Nodes.planner_node import planner_node
from Nodes.general_node import general_node
from Nodes.preference_node import preference_node


class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    intent: Optional[str]
    trip_plan: Optional[TripPlan]



tools = [get_current_weather, convert_currency]

tool_node = ToolNode(tools)

graph = StateGraph(AgentState)
graph.add_node("router", router_node)
graph.add_node("planner", planner_node)
graph.add_node("general", general_node)
graph.add_node("tools", tool_node)
graph.add_node("preferences", preference_node)

graph.set_entry_point("router")
graph.add_edge("tools", "general")
graph.add_edge("planner", END)
graph.add_edge("router", "preferences")


def route_decision(state: AgentState):
    if state["intent"] == "trip":
        return "planner"
    return "general"

graph.add_conditional_edges(
    "general",
    lambda state: "tools" if state["messages"][-1].tool_calls else END,
)
graph.add_conditional_edges(
    "preferences",
    route_decision,
    {
        "planner": "planner",
        "general": "general"
    }
)
agent = graph.compile(checkpointer=memory)