from fastapi import APIRouter, Header
from pydantic import BaseModel
from Services.trip_service import create_trip,get_trips

router = APIRouter()

class TripCreateRequest(BaseModel):
    title: str
    destination: str

@router.post("/trips")
def create_trip_route(
    body: TripCreateRequest,
    x_user_id: str = Header(..., convert_underscores=False)
):
    trip_id = create_trip(
        user_id=x_user_id,
        title=body.title,
        destination=body.destination
    )

    return {
        "status": "success",
        "trip_id": trip_id
    }

@router.get("/trips")
def get_user_trips(
    x_user_id: str = Header(..., convert_underscores=False)
):
    trips=get_trips(x_user_id)
    return trips