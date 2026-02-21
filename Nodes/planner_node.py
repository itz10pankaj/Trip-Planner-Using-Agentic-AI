from typing import TypedDict,Annotated, Sequence,Optional
from langchain_core.messages import BaseMessage,AIMessage
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from Agent.all_agents import planner_model
from Schemas.trip_detail_response import TripPlan
import json


class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    intent: Optional[str]
    trip_plan: Optional[TripPlan]

memory = MemorySaver()

def planner_node(state: AgentState):
    recent_messages = state["messages"][-10:]
    structured_response = planner_model.invoke(recent_messages)
    trip_message = AIMessage(
        content=json.dumps(structured_response.model_dump()),
        additional_kwargs={"type": "ai"}
    )
    return {
        "trip_plan": structured_response,
        "messages": [trip_message] 
    }

