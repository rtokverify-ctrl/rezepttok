from pydantic import BaseModel
from typing import Optional

class ShoppingItemNoteUpdate(BaseModel):
    note: str

class ShoppingItemResponse(BaseModel):
    id: int
    name: str
    note: Optional[str] = None
    
    class Config:
        from_attributes = True
