from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import chat,history,preference,trip


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
    

    app.include_router(chat.router)
    app.include_router(history.router)
    app.include_router(preference.router)
    app.include_router(trip.router)
    return app

app = create_app()