from typing import TypedDict,Annotated, Sequence,Optional
from langchain_core.messages import BaseMessage,SystemMessage,HumanMessage
from langgraph.graph.message import add_messages
from Agent.all_agents import router_model
from Schemas.trip_detail_response import TripPlan



class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    intent: Optional[str]
    trip_plan: Optional[TripPlan]

def router_node(state: AgentState):
    last_message = state["messages"][-1]
    
    recent_messages = state["messages"][-5:]
    context = "\n".join([
        f"{msg.type}: {msg.content[:200]}" 
        for msg in recent_messages 
        if msg.content
    ])

    result = router_model.invoke([
        SystemMessage(content="""
            You are an intent classifier.
            You will be given recent conversation history and the latest user message.
            
            Return:
            - "trip" ONLY if user wants to CREATE a NEW travel plan.
            - "general" for everything else including:
              * questions ABOUT a previously planned trip
              * weather questions
              * follow-up questions on existing plans
              * general conversation
            
            Examples:
            - "Plan a trip to Paris" → trip
            - "How many days did you plan?" → general
            - "What is the weather there?" → general
            - "Can you plan a 5 day itinerary for Rome?" → trip
            - "What hotels did you suggest?" → general
            """),
        HumanMessage(content=f"""
            Recent conversation:
            {context}
            
            Latest message: {last_message.content}
            
            Classify the intent:
        """)
    ])
    
    print("ROUTER INTENT:", result.intent)
    return {"intent": result.intent}
