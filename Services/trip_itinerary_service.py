from sqlalchemy import text
from Config.database import engine
import json


def save_or_update_itinerary(
    trip_id: str,
    itinerary_data: dict,
    estimated_budget: float | None = None,
    currency: str | None = None
):
    """
    Inserts or updates itinerary for a trip.
    """

    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO trip_itineraries (trip_id, itinerary_json, estimated_budget, currency)
                VALUES (:trip_id, :itinerary_json, :estimated_budget, :currency)
                ON DUPLICATE KEY UPDATE
                    itinerary_json = :itinerary_json,
                    estimated_budget = :estimated_budget,
                    currency = :currency
            """),
            {
                "trip_id": trip_id,
                "itinerary_json": json.dumps(itinerary_data),
                "estimated_budget": estimated_budget,
                "currency": currency
            }
        )


def get_itinerary(trip_id: str):
    """
    Fetch itinerary by trip_id
    """
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT itinerary_json, estimated_budget, currency
                FROM trip_itineraries
                WHERE trip_id = :trip_id
            """),
            {"trip_id": trip_id}
        ).mappings().first()

        if not result:
            return None

        return {
            "itinerary": result["itinerary_json"],
            "estimated_budget": float(result["estimated_budget"]) if result["estimated_budget"] else None,
            "currency": result["currency"]
        }