from typing import TypedDict,Annotated, Sequence,Optional
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from Agent.all_agents import planner_model
from Schemas.trip_detail_response import TripPlan



class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    intent: Optional[str]
    trip_plan: Optional[TripPlan]

memory = MemorySaver()

def planner_node(state: AgentState):
    structured_response = planner_model.invoke(state["messages"])

    return {
        "trip_plan": structured_response
    }

