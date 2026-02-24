
from typing import TypedDict,Annotated, Sequence,Optional
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages
from Schemas.trip_detail_response import TripPlan


class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    intent: Optional[str]
    trip_plan: Optional[TripPlan]
    preferences: Optional[dict]