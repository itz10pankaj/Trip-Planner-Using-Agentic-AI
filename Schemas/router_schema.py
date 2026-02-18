from pydantic import BaseModel
from typing import Literal

class Intent(BaseModel):
      intent: Literal["trip", "general"]