from pydantic import BaseModel
from typing import List,Literal

class DayPlan(BaseModel):
    day : int
    title: str
    activities: List[str]

class Budget(BaseModel):
    currency:str
    amount:float

class TripPlan(BaseModel):
    trip_summary: str
    days: List[DayPlan]
    estimated_budget: Budget
    weather_advice: str