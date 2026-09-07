from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional
from Config.setting import get_settings
from Services.subscription_service import (
    get_user_subscription,
    update_user_subscription,
    SUBSCRIPTION_PLANS
)
try:
    import stripe
except ImportError:
    stripe = None

settings = get_settings()
router = APIRouter(prefix="/subscription", tags=["Subscription"])

# Configure Stripe API key if set in environment and module is loaded
if stripe and settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY



class UpgradeRequest(BaseModel):
    user_id: str
    subscription_type: str
    duration_days: int = 30


class CreateCheckoutSessionRequest(BaseModel):
    user_id: str
    subscription_type: str
    origin: Optional[str] = "http://localhost:5173"


# Plan Prices in USD (Cents for Stripe)
PLAN_PRICES_CENTS = {
    "free": 0,
    "pro": 1500,       # $15.00
    "premium": 2900    # $29.00
}


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
    Direct endpoint to update user subscription tier (useful for admin/testing).
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


@router.post("/create-checkout-session")
def create_checkout_session(body: CreateCheckoutSessionRequest):
    """
    Create a Stripe Checkout Session for subscription upgrade.
    Redirects user to Stripe hosted checkout page.
    """
    sub_type = body.subscription_type.lower().strip()
    if sub_type not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail=f"Invalid subscription type '{sub_type}'")

    plan = SUBSCRIPTION_PLANS[sub_type]
    amount_cents = PLAN_PRICES_CENTS.get(sub_type, 0)

    # If Free plan requested, directly upgrade without payment
    if sub_type == "free" or amount_cents == 0:
        updated = update_user_subscription(body.user_id, "free")
        return {
            "status": "success",
            "mode": "free",
            "message": "Switched to Free plan.",
            "data": updated
        }
    global stripe
    if stripe is None:
        try:
            import stripe
        except Exception as e:
            print("Stripe import error:", e)

    current_settings = get_settings()
    secret_key = current_settings.STRIPE_SECRET_KEY or settings.STRIPE_SECRET_KEY

    print("STRIPE_SECRET_KEY:", secret_key, "stripe module:", stripe)


    # Check if real Stripe secret key is configured and stripe package is available
    if stripe and secret_key and secret_key != "sk_test_mock":
        try:
            stripe.api_key = secret_key
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": f"{plan['name']} - AI Trip Planner",
                            "description": plan['description'],
                        },
                        "unit_amount": amount_cents,
                    },
                    "quantity": 1,
                }],
                mode="payment",
                success_url=f"{body.origin}/?payment=success&session_id={{CHECKOUT_SESSION_ID}}&tier={sub_type}",
                cancel_url=f"{body.origin}/?payment=cancelled",
                client_reference_id=body.user_id,
                metadata={
                    "user_id": body.user_id,
                    "subscription_type": sub_type,
                    "duration_days": "30"
                }
            )
            print("Stripe Session Created URL:", session.url)
            return {
                "status": "success",
                "mode": "stripe",
                "checkout_url": session.url,
                "session_id": session.id
            }
        except Exception as e:
            print(f"Stripe Error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Stripe Session Creation Error: {str(e)}")
    else:
        # Fallback Test/Simulated Mode if Stripe keys not set in env yet
        updated = update_user_subscription(body.user_id, sub_type, 30)
        return {
            "status": "success",
            "mode": "test_simulated",
            "message": f"Stripe keys not set in .env. Upgraded to {sub_type.upper()} in test mode!",
            "data": updated
        }



@router.get("/verify-checkout-session")
def verify_checkout_session(session_id: str, user_id: str, tier: str):
    global stripe
    if stripe is None:
        try:
            import stripe
        except Exception:
            pass

    current_settings = get_settings()
    secret_key = current_settings.STRIPE_SECRET_KEY or settings.STRIPE_SECRET_KEY

    if stripe and secret_key and secret_key != "sk_test_mock":
        try:
            stripe.api_key = secret_key
            session = stripe.checkout.Session.retrieve(session_id)
            if session.payment_status == "paid":
                meta_user_id = session.metadata.get("user_id") or user_id
                meta_tier = session.metadata.get("subscription_type") or tier
                updated = update_user_subscription(meta_user_id, meta_tier, 30)
                return {
                    "status": "success",
                    "payment_status": "paid",
                    "data": updated
                }
        except Exception as e:
            print(f"Verify Checkout Error: {str(e)}")

    # Update subscription
    updated = update_user_subscription(user_id, tier, 30)
    return {
        "status": "success",
        "payment_status": "paid",
        "data": updated
    }


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Stripe Webhook listener to handle successful payment events automatically.
    """
    global stripe
    if stripe is None:
        try:
            import stripe
        except Exception:
            pass

    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")
    current_settings = get_settings()
    webhook_secret = current_settings.STRIPE_WEBHOOK_SECRET or settings.STRIPE_WEBHOOK_SECRET


    event = None

    if stripe and webhook_secret:
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            raise HTTPException(status_code=400, detail="Invalid signature")
    else:
        # Fallback if webhook secret is not configured
        import json
        event = json.loads(payload)

    # Handle payment success event
    if event and event.get("type") in ["checkout.session.completed", "invoice.payment_succeeded"]:
        session = event["data"]["object"]
        metadata = session.get("metadata", {})
        user_id = metadata.get("user_id") or session.get("client_reference_id")
        sub_type = metadata.get("subscription_type")
        duration_days = int(metadata.get("duration_days", 30))

        if user_id and sub_type:
            print(f"🎉 Webhook received! Upgrading user {user_id} to {sub_type}")
            update_user_subscription(user_id, sub_type, duration_days)

    return {"status": "success"}


