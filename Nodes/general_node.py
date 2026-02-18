
from typing import TypedDict,Annotated, Sequence,Optional
from langchain_core.messages import BaseMessage
from Config.setting import get_settings
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from Agent.all_agents import general_model
from Schemas.trip_detail_response import TripPlan
settings = get_settings()



class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    intent: Optional[str]
    trip_plan: Optional[TripPlan]

memory = MemorySaver()


def general_node(state: AgentState):
    response = general_model.invoke(state["messages"])
    return {
        "messages": state["messages"] + [response]
    }
