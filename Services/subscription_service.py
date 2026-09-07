from sqlalchemy import text
from Config.database import engine
from datetime import datetime, timedelta
from typing import Dict, Any

SUBSCRIPTION_PLANS: Dict[str, Dict[str, Any]] = {
    "free": {
        "name": "Free Tier",
        "subscription_type": "free",
        "daily_limit": 10,
        "model": "gpt-4o-mini",
        "price": "$0/month",
        "description": "Standard trip planning with basic AI capabilities."
    },
    "pro": {
        "name": "Pro Tier",
        "subscription_type": "pro",
        "daily_limit": 100,
        "model": "gpt-4o",
        "price": "$15/month",
        "description": "Advanced trip planning with flagship GPT-4o model and higher rate limits."
    },
    "premium": {
        "name": "Premium Tier",
        "subscription_type": "premium",
        "daily_limit": 1000,
        "model": "gpt-4o",
        "price": "$29/month",
        "description": "Unlimited enterprise planning with priority GPT-4o access."
    }
}


def get_user_subscription(user_id: str) -> Dict[str, Any]:
    """
    Fetch user's subscription details including today's request usage, days remaining, and expiry state.
    If the subscription has expired, fall back to the 'free' tier.
    """
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    with engine.connect() as conn:
        row = conn.execute(
            text("""
                SELECT subscription_type, subscription_expires_at
                FROM users
                WHERE user_id = :user_id
            """),
            {"user_id": user_id}
        ).fetchone()

        # Count today's requests
        count_row = conn.execute(
            text("""
                SELECT COUNT(*) FROM user_request_logs
                WHERE user_id = :user_id
                AND created_at >= :today_start
            """),
            {"user_id": user_id, "today_start": today_start}
        ).fetchone()

        requests_today = count_row[0] if count_row else 0

        if not row:
            plan_info = SUBSCRIPTION_PLANS["free"]
            return {
                "user_id": user_id,
                "active_tier": "free",
                "is_expired": False,
                "expires_at": None,
                "days_remaining": 0,
                "requests_today": requests_today,
                "daily_limit": plan_info["daily_limit"],
                "usage_percentage": min(100, round((requests_today / plan_info["daily_limit"]) * 100, 1)),
                "plan_details": plan_info
            }

        sub_type = row[0] or "free"
        expires_at = row[1]
        
        is_expired = False
        days_remaining = 0

        if expires_at and sub_type != "free":
            now = datetime.now()
            if now > expires_at:
                is_expired = True
                sub_type = "free"  # Downgrade active tier to free if expired
            else:
                delta = expires_at - now
                days_remaining = max(1, delta.days)

        plan_info = SUBSCRIPTION_PLANS.get(sub_type, SUBSCRIPTION_PLANS["free"])
        daily_limit = plan_info["daily_limit"]

        return {
            "user_id": user_id,
            "active_tier": sub_type,
            "raw_subscription_type": row[0] or "free",
            "is_expired": is_expired,
            "expires_at": expires_at.isoformat() if expires_at else None,
            "days_remaining": days_remaining,
            "requests_today": requests_today,
            "daily_limit": daily_limit,
            "usage_percentage": min(100, round((requests_today / daily_limit) * 100, 1)),
            "plan_details": plan_info
        }



def update_user_subscription(user_id: str, subscription_type: str, duration_days: int = 30) -> Dict[str, Any]:
    """
    Update or upgrade a user's subscription tier and set expiry date.
    Creates user record if it doesn't already exist.
    """
    sub_type = subscription_type.lower().strip()
    if sub_type not in SUBSCRIPTION_PLANS:
        raise ValueError(f"Invalid subscription type '{subscription_type}'. Must be one of: {list(SUBSCRIPTION_PLANS.keys())}")

    expires_at = datetime.now() + timedelta(days=duration_days) if sub_type != "free" else None

    with engine.begin() as conn:
        existing = conn.execute(
            text("SELECT user_id FROM users WHERE user_id = :user_id"),
            {"user_id": user_id}
        ).fetchone()

        if existing:
            conn.execute(
                text("""
                    UPDATE users
                    SET subscription_type = :sub_type,
                        subscription_expires_at = :expires_at
                    WHERE user_id = :user_id
                """),
                {
                    "user_id": user_id,
                    "sub_type": sub_type,
                    "expires_at": expires_at
                }
            )
        else:
            conn.execute(
                text("""
                    INSERT INTO users (user_id, username, password_hash, subscription_type, subscription_expires_at)
                    VALUES (:user_id, :username, :password_hash, :sub_type, :expires_at)
                """),
                {
                    "user_id": user_id,
                    "username": f"user_{user_id[:8]}",
                    "password_hash": "managed_user",
                    "sub_type": sub_type,
                    "expires_at": expires_at
                }
            )

    return get_user_subscription(user_id)



def check_and_log_rate_limit(user_id: str, endpoint: str = "/chat") -> Dict[str, Any]:
    """
    Check if the user has exceeded their daily rate limit based on their active subscription tier.
    Logs the request if within limits.
    """
    sub = get_user_subscription(user_id)
    active_tier = sub["active_tier"]
    daily_limit = sub["plan_details"]["daily_limit"]

    # Check requests made today (since 00:00:00)
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

    with engine.begin() as conn:
        count_row = conn.execute(
            text("""
                SELECT COUNT(*) FROM user_request_logs
                WHERE user_id = :user_id
                AND created_at >= :today_start
            """),
            {
                "user_id": user_id,
                "today_start": today_start
            }
        ).fetchone()

        current_usage = count_row[0] if count_row else 0

        if current_usage >= daily_limit:
            return {
                "allowed": False,
                "reason": f"Daily rate limit of {daily_limit} requests reached for '{active_tier}' plan.",
                "current_usage": current_usage,
                "daily_limit": daily_limit,
                "subscription_type": active_tier,
                "model_allowed": sub["plan_details"]["model"]
            }

        # Log this request
        conn.execute(
            text("""
                INSERT INTO user_request_logs (user_id, endpoint, created_at)
                VALUES (:user_id, :endpoint, NOW())
            """),
            {
                "user_id": user_id,
                "endpoint": endpoint
            }
        )

    return {
        "allowed": True,
        "current_usage": current_usage + 1,
        "daily_limit": daily_limit,
        "remaining_requests": daily_limit - (current_usage + 1),
        "subscription_type": active_tier,
        "model_allowed": sub["plan_details"]["model"]
    }
