from typing import TypedDict,Annotated, Sequence,Optional
from langchain_core.messages import BaseMessage,SystemMessage,HumanMessage
from langgraph.graph.message import add_messages
from Agent.all_agents import router_model
from Schemas.trip_detail_response import TripPlan



class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    intent: Optional[str]
    trip_plan: Optional[TripPlan]


def router_node(state:AgentState):
    last_message = state["messages"][-1]
    result=router_model.invoke([
        SystemMessage(content="""
            You are an intent classifier.
            Return:
            - "trip" if user wants travel planning.
            - "general" for everything else.
            """),
        HumanMessage(content=last_message.content)
    ])
    print("ROUTER INTENT:", result.intent)
    return {"intent":result.intent}

