from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import ShoppingList, ShoppingListItem, SharedShoppingList, User
from auth import get_current_user
from pydantic import BaseModel
from typing import List
from datetime import datetime

router = APIRouter()

# --- Pydantic Schemas ---
class ShoppingListCreate(BaseModel):
    name: str

class ShoppingListOut(BaseModel):
    id: int
    name: str
    user_id: int
    created_at: str
    is_shared: bool = False

    class Config:
        from_attributes = True

class ShoppingItemCreate(BaseModel):
    item: str
    quantity: str | None = ""

class ShoppingItemUpdate(BaseModel):
    item: str | None = None
    quantity: str | None = None

class ShoppingItemOut(BaseModel):
    id: int
    list_id: int
    item: str
    quantity: str | None
    completed: bool

    class Config:
        from_attributes = True

# --- Shopping Lists Routing ---

@router.get("/shopping-lists", response_model=List[ShoppingListOut])
def get_shopping_lists(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Holt alle Listen des Users (eigene) UND Listen, die mit ihm geteilt wurden."""
    # Eigene Listen
    owned_lists = db.query(ShoppingList).filter(ShoppingList.user_id == current_user.id).all()
    
    # Geteilte Listen
    shared_entries = db.query(SharedShoppingList).filter(SharedShoppingList.shared_with_user_id == current_user.id).all()
    shared_list_ids = [e.list_id for e in shared_entries]
    shared_lists = db.query(ShoppingList).filter(ShoppingList.id.in_(shared_list_ids)).all()

    # is_shared Flag setzen (Pydantic model expects this)
    result = []
    for l in owned_lists:
        l_dict = l.__dict__.copy()
        l_dict["is_shared"] = False
        result.append(l_dict)
    
    for l in shared_lists:
        l_dict = l.__dict__.copy()
        l_dict["is_shared"] = True
        result.append(l_dict)
        
    return result

@router.post("/shopping-lists", response_model=ShoppingListOut)
def create_shopping_list(list_data: ShoppingListCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_list = ShoppingList(
        user_id=current_user.id, 
        name=list_data.name, 
        created_at=datetime.utcnow().isoformat()
    )
    db.add(new_list)
    db.commit()
    db.refresh(new_list)
    return new_list

@router.delete("/shopping-lists/{list_id}")
def delete_shopping_list(list_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    l = db.query(ShoppingList).filter(ShoppingList.id == list_id, ShoppingList.user_id == current_user.id).first()
    if not l:
        raise HTTPException(status_code=404, detail="List not found")
    db.delete(l)
    db.commit()
    return {"message": "List deleted"}


# --- Shopping List ITEMS Routing ---

def _verify_list_access(list_id: int, user_id: int, db: Session):
    # Check ownership
    l = db.query(ShoppingList).filter(ShoppingList.id == list_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="List not found")
        
    if l.user_id == user_id:
        return l
        
    # Check shared access
    shared = db.query(SharedShoppingList).filter(SharedShoppingList.list_id == list_id, SharedShoppingList.shared_with_user_id == user_id).first()
    if shared:
        return l
        
    raise HTTPException(status_code=403, detail="Not authorized to access this list")

@router.get("/shopping-lists/{list_id}/items", response_model=List[ShoppingItemOut])
def get_shopping_items(list_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _verify_list_access(list_id, current_user.id, db)
    items = db.query(ShoppingListItem).filter(ShoppingListItem.list_id == list_id).all()
    return items

@router.post("/shopping-lists/{list_id}/items", response_model=ShoppingItemOut)
def add_shopping_item(list_id: int, item: ShoppingItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _verify_list_access(list_id, current_user.id, db)
    new_item = ShoppingListItem(list_id=list_id, item=item.item, quantity=item.quantity)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.patch("/shopping-lists/items/{item_id}", response_model=ShoppingItemOut)
def update_shopping_item(item_id: int, updates: ShoppingItemUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(ShoppingListItem).filter(ShoppingListItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    _verify_list_access(item.list_id, current_user.id, db)
    
    if updates.item is not None:
        item.item = updates.item
    if updates.quantity is not None:
        item.quantity = updates.quantity
        
    db.commit()
    db.refresh(item)
    return item

@router.delete("/shopping-lists/items/{item_id}")
def delete_shopping_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(ShoppingListItem).filter(ShoppingListItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    _verify_list_access(item.list_id, current_user.id, db)
    db.delete(item)
    db.commit()
    return {"message": "Item deleted"}

@router.post("/shopping-lists/items/{item_id}/toggle")
def toggle_shopping_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = db.query(ShoppingListItem).filter(ShoppingListItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    _verify_list_access(item.list_id, current_user.id, db)
    item.completed = not item.completed
    db.commit()
    return {"completed": item.completed}
