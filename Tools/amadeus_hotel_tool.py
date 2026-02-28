import requests
from typing import Optional, List, Dict
from langchain.tools import tool
import json
from Config.setting import get_settings

setting = get_settings()
AMADEUS_BASE_URL = "https://test.api.amadeus.com"

@tool
def get_hotels(city_code: str, offset: int = 0, limit: int = 5) -> str:
    """
    Use this tool to fetch real hotel data for a city using its IATA city code (e.g., PAR, LON, NYC).
    Always call this tool when the user asks for hotel suggestions.
    Returns a JSON list of hotels.

    Args:
        city_code (str): IATA city code like PAR, LON, NYC.

    Returns:
        JSON string containing list of hotels with:
        - name
        - hotelId
        - latitude
        - longitude
        - distance
        - distanceUnit
    """
    hotels = search_hotels_by_city(city_code)
    sliced = hotels[offset: offset + limit]
    if not sliced:
        return json.dumps([])
    return json.dumps(sliced)



def get_amadeus_access_token():
    url = "https://test.api.amadeus.com/v1/security/oauth2/token"
    payload = {
        "grant_type": "client_credentials",
        "client_id":setting.AMADEUS_API_KEY,
        "client_secret":setting.AMADEUS_API_SECRET
    }
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    response = requests.post(url, data=payload, headers=headers)
    response.raise_for_status()
    return response.json()["access_token"]


def search_hotels_by_city(city_code: str,radius: int = 5, radius_unit: str = "KM") -> List[Dict]:
    url = f"{AMADEUS_BASE_URL}/v1/reference-data/locations/hotels/by-city"
    headers = {
        "Authorization": f"Bearer {get_amadeus_access_token()}"
    }
    params = {
        "cityCode": city_code,
        "radius": radius,
        "radiusUnit": radius_unit,
        "hotelSource": "ALL"
    }
    response = requests.get(url, headers=headers, params=params)
    print("Response................",response)
    if response.status_code != 200:
        return [{"error": response.text}]
    data = response.json()
    hotels = []
    for hotel in data.get("data", []):
        hotels.append({
            "name": hotel.get("name"),
            "hotelId": hotel.get("hotelId"),
            "latitude": hotel.get("geoCode", {}).get("latitude"),
            "longitude": hotel.get("geoCode", {}).get("longitude"),
            "distance": hotel.get("distance", {}).get("value"),
            "distanceUnit": hotel.get("distance", {}).get("unit"),
        })
    print("hotels......",hotels)
    return hotels