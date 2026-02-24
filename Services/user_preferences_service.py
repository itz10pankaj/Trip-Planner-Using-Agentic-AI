from sqlalchemy import text
from Config.database import engine


def get_user_preferences(user_id:str):
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM user_preferences WHERE user_id = :uid"),
            {"uid": user_id}
        ).mappings().fetchone()
        return dict(result) if result else None
    
def upsert_user_preferences(user_id: str, prefs: dict):
    with engine.connect() as conn:
        conn.execute(
            text("""
                INSERT INTO user_preferences
                (user_id, travel_style, budget_range, preferred_climate,
                 food_preference, accommodation_type, pace)
                VALUES (:user_id, :travel_style, :budget_range,
                        :preferred_climate, :food_preference,
                        :accommodation_type, :pace)
                ON DUPLICATE KEY UPDATE
                    travel_style = VALUES(travel_style),
                    budget_range = VALUES(budget_range),
                    preferred_climate = VALUES(preferred_climate),
                    food_preference = VALUES(food_preference),
                    accommodation_type = VALUES(accommodation_type),
                    pace = VALUES(pace)
            """),
            {"user_id": user_id, **prefs}
        )
        conn.commit()