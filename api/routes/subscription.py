from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from Services.subscription_service import (
    get_user_subscription,
    update_user_subscription,
    SUBSCRIPTION_PLANS
)

router = APIRouter(prefix="/subscription", tags=["Subscription"])


class UpgradeRequest(BaseModel):
    user_id: str
    subscription_type: str
    duration_days: int = 30


@router.get("/plans")
def get_plans():
    """
    Get list of available subscription plans and their features.
    """
    return {
        "status": "success",
        "plans": list(SUBSCRIPTION_PLANS.values())
    }


@router.get("/status")
def get_status(x_user_id: Optional[str] = Header(None, convert_underscores=False), user_id: Optional[str] = None):
    """
    Get active subscription status, rate limits, and expiry date for a user.
    """
    target_user_id = x_user_id or user_id
    if not target_user_id:
        raise HTTPException(status_code=400, detail="x_user_id header or user_id query parameter is required")

    sub_info = get_user_subscription(target_user_id)
    return {
        "status": "success",
        "data": sub_info
    }


@router.post("/upgrade")
def upgrade_subscription(body: UpgradeRequest):
    """
    Mock endpoint to upgrade or extend a user's subscription tier and set expiry date.
    (Will be connected to Payment Gateway later)
    """
    try:
        updated_sub = update_user_subscription(
            user_id=body.user_id,
            subscription_type=body.subscription_type,
            duration_days=body.duration_days
        )
        return {
            "status": "success",
            "message": f"Successfully upgraded user to '{body.subscription_type}' for {body.duration_days} days.",
            "data": updated_sub
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
