from sqlalchemy import text
from Config.database import engine
import json


def save_or_update_itinerary(
    trip_id: str,
    itinerary_data: dict = None,
    estimated_budget: float | None = None,
    currency: str | None = None
):
    """
    Creates a new version of itinerary.
    - Older active version becomes inactive.
    - If only budget is updated, previous itinerary_json is preserved.
    """

    with engine.begin() as conn:

        # 1️⃣ Get current active itinerary (if exists)
        previous = conn.execute(
            text("""
                SELECT itinerary_json, estimated_budget, currency, version
                FROM trip_itineraries
                WHERE trip_id = :trip_id
                ORDER BY version DESC
                LIMIT 1
                
            """),
            {"trip_id": trip_id}
        ).fetchone()
        print("previous....",previous)
        previous_itinerary = previous[0] if previous else None
        previous_budget = previous[1] if previous else None
        previous_currency = previous[2] if previous else None
        previous_version = previous[3] if previous else 0

        # 2️⃣ Determine new version number
        new_version = (previous_version or 0) + 1
        print("new_version......",new_version)
        # 3️⃣ Decide final values
        final_itinerary = (
            json.dumps(itinerary_data)
            if itinerary_data is not None
            else previous_itinerary
        )

        final_budget = (
            estimated_budget
            if estimated_budget is not None
            else previous_budget
        )

        final_currency = (
            currency
            if currency is not None
            else previous_currency
        )

        # 4️⃣ Deactivate old version (if exists)
        if previous:
            conn.execute(
                text("""
                    UPDATE trip_itineraries
                    SET is_active = FALSE
                    WHERE trip_id = :trip_id
                    AND is_active = TRUE
                """),
                {"trip_id": trip_id}
            )

        # 5️⃣ Insert new version
        conn.execute(
            text("""
                INSERT INTO trip_itineraries (
                    trip_id,
                    itinerary_json,
                    estimated_budget,
                    currency,
                    version,
                    is_active,
                    created_at
                )
                VALUES (
                    :trip_id,
                    :itinerary_json,
                    :estimated_budget,
                    :currency,
                    :version,
                    TRUE,
                    NOW()
                )
            """),
            {
                "trip_id": trip_id,
                "itinerary_json": final_itinerary,
                "estimated_budget": final_budget,
                "currency": final_currency,
                "version": new_version,
            }
        )


def rollback_itinerary(trip_id: str, target_version: int):
    """
    Restores a specific version of itinerary.
    """

    with engine.begin() as conn:
        exists = conn.execute(
            text("""
                SELECT id
                FROM trip_itineraries
                WHERE trip_id = :trip_id
                AND version = :version
            """),
            {
                "trip_id": trip_id,
                "version": target_version
            }
        ).fetchone()

        if not exists:
            return {
                "status": "error",
                "message": "Version not found"
            }

        # 2️⃣ Deactivate all versions
        conn.execute(
            text("""
                UPDATE trip_itineraries
                SET is_active = FALSE
                WHERE trip_id = :trip_id
            """),
            {"trip_id": trip_id}
        )

        # 3️⃣ Activate selected version
        conn.execute(
            text("""
                UPDATE trip_itineraries
                SET is_active = TRUE
                WHERE trip_id = :trip_id
                AND version = :version
            """),
            {
                "trip_id": trip_id,
                "version": target_version
            }
        )

    return {
        "status": "success",
        "message": f"Trip restored to version {target_version}"
    }




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