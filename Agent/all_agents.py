from langchain_openai import ChatOpenAI
from Config.setting import get_settings
from Schemas.trip_detail_response import TripPlan
from Schemas.router_schema import Intent
from langchain.chat_models import init_chat_model
from Tools.weather_info_tool import get_current_weather
from Tools.currency_conversion_tool import convert_currency
from Tools.amadeus_hotel_tool import get_hotels
settings=get_settings()


router_model = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    api_key=settings.OPENAI_API_KEY
).with_structured_output(Intent)


planner_model = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    api_key=settings.OPENAI_API_KEY
).with_structured_output(TripPlan)


general_model = init_chat_model(
    "gpt-4o-mini",
    temperature=0,
    api_key=settings.OPENAI_API_KEY
).bind_tools([get_current_weather, convert_currency,get_hotels])
