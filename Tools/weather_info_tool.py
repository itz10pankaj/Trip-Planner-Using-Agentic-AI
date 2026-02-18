import requests
from langchain.tools import tool
from Config.setting import get_settings

setting = get_settings()

@tool
def get_current_weather(city:str) -> str:
    """
    Get current weather details for a given city.
    Input should be a city name.
    """
    api_key = setting.OPENWEATHER_API_KEY
    base_url = "https://api.openweathermap.org/data/2.5/weather"

    params = {
        "q":city,
        "appid":api_key,
        "units": "metric"
    }

    try:
        response= requests.get(base_url,params=params,timeout=5)
        data = response.json()

        if response.status_code != 200:
            return f"Error fetching weather: {data.get('message', 'Unknown error')}"
        temperature = data["main"]["temp"]
        description = data["weather"][0]["description"]
        humidity = data["main"]["humidity"]
        return (
            f"The current weather in {city} is {description}. "
            f"Temperature is {temperature}°C with humidity {humidity}%."
        )

    except Exception as e:
        return f"Weather tool error{str(e)}"