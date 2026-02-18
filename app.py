from fastapi import FastAPI,Header
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import HumanMessage
from typing import Optional
# from Agent.planner_agent import create_planner_agent

# agent = create_planner_agent()

from LangGraph.graph import agent


# response = agent.invoke({
#     "input": "what is weather of SriLanka And also tell me have you used any tool for this"
# })
# print(response)

def create_app() -> FastAPI:
    app = FastAPI(
        title ="AI TRIP PLANNNER",
        description= "Agentic AI powered trip planner using OpenAI + LangGraph",
        version="1.0.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/")
    def health_check():
        return {
            "status": "success",
            "message": "Trip Planner API is running 🚀"
        }

    # @app.get("/ask")
    # def ask_agent(question: str):
    #     response = agent.invoke({"input": question})

    #     final_output = response.get("output", "")

    #     return {
    #         "status": "success",
    #         "question": question,
    #         "answer": final_output,
    #         "tools_used": [
    #             step[0].tool for step in response.get("intermediate_steps", [])
    #         ]
    #     }

    @app.get("/ask")
    def ask(question: str, x_user_id: Optional[str] = Header(None, convert_underscores=False)):
        if not x_user_id:
            return {
                "status":"error",
                "message": "x_user_id is required in Headers"
            }
        result = agent.invoke(
            {
                "messages": [HumanMessage(content=question)]
            },
            config={
                 "configurable": { "thread_id": x_user_id }
            }
        )
        if result.get("trip_plan"):
            return {
                "status": "success",
                "type": "trip_plan",
                "data": result["trip_plan"].model_dump()
            }

        return {
            "status": "success",
            "type": "general",
            "answer": result["messages"][-1].content
        }


    return app

app = create_app()