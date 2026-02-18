from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import ShoppingListItem, User
from auth import get_current_user
from pydantic import BaseModel
from typing import List

router = APIRouter()

class ShoppingItemCreate(BaseModel):
    item: str

class ShoppingItemOut(BaseModel):
    id: int
    item: str
    completed: bool

    class Config:
        from_attributes = True

@router.get("/shopping-list", response_model=List[ShoppingItemOut])
def get_shopping_list(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    items = db.query(ShoppingListItem).filter(ShoppingListItem.user_id == current_user.id).all()
    return items

@router.post("/shopping-list", response_model=ShoppingItemOut)
def add_shopping_item(item: ShoppingItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_item = ShoppingListItem(user_id=current_user.id, item=item.item)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.delete("/shopping-list/{item_id}")
def delete_shopping_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(ShoppingListItem).filter(ShoppingListItem.id == item_id, ShoppingListItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"message": "Item deleted"}

@router.post("/shopping-list/{item_id}/toggle")
def toggle_shopping_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(ShoppingListItem).filter(ShoppingListItem.id == item_id, ShoppingListItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    item.completed = not item.completed
    db.commit()
    return {"completed": item.completed}
