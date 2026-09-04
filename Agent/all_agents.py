from langchain_openai import ChatOpenAI
from Config.setting import get_settings
from Schemas.trip_detail_response import TripPlan
from Schemas.router_schema import Intent
from langchain.chat_models import init_chat_model
from Tools.weather_info_tool import get_current_weather
from Tools.currency_conversion_tool import convert_currency
from Tools.amadeus_hotel_tool import get_hotels
from Services.subscription_service import SUBSCRIPTION_PLANS

settings = get_settings()

TIER_MODELS = {
    "free": "gpt-4o-mini",
    "pro": "gpt-4o",
    "premium": "gpt-4o"
}


def get_model_name_for_tier(subscription_tier: str = "free") -> str:
    tier = (subscription_tier or "free").lower()
    print("tier",tier,TIER_MODELS.get(tier, "gpt-4o-mini"))
    return TIER_MODELS.get(tier, "gpt-4o-mini")


def get_router_model(subscription_tier: str = "free"):
    model_name = get_model_name_for_tier(subscription_tier)
    return ChatOpenAI(
        model=model_name,
        temperature=0,
        api_key=settings.OPENAI_API_KEY
    ).with_structured_output(Intent)


def get_planner_model(subscription_tier: str = "free"):
    model_name = get_model_name_for_tier(subscription_tier)
    return ChatOpenAI(
        model=model_name,
        temperature=0,
        api_key=settings.OPENAI_API_KEY
    ).with_structured_output(TripPlan)


def get_general_model(subscription_tier: str = "free"):
    model_name = get_model_name_for_tier(subscription_tier)
    return init_chat_model(
        model_name,
        temperature=0,
        api_key=settings.OPENAI_API_KEY
    ).bind_tools([get_current_weather, convert_currency, get_hotels])


# Default instances for backward compatibility
router_model = get_router_model("free")
planner_model = get_planner_model("free")
general_model = get_general_model("free")

