import uuid
from Config.database import engine
from sqlalchemy import text

def create_trip(user_id: str, title: str, destination: str):
    trip_id = str(uuid.uuid4())

    with engine.connect() as conn:
        conn.execute(
            text("""
                INSERT INTO trips (trip_id, user_id, title, destination)
                VALUES (:trip_id, :user_id, :title, :destination)
            """),
            {
                "trip_id": trip_id,
                "user_id": user_id,
                "title": title,
                "destination": destination
            }
        )
        conn.commit()

    return trip_id

def get_trips(user_id):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT trip_id, title, destination, status, created_at
                FROM trips
                WHERE user_id = :user_id
                ORDER BY created_at DESC
            """),
            {"user_id": user_id}
        ).mappings().fetchall()

        return {
            "trip_count": len(result),
            "trips": result
        }