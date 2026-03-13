from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from ..dependencies import get_current_user
import models, schemas

router = APIRouter(prefix="/shopping", tags=["Shopping"])

@router.patch("/{item_id}/note", response_model=schemas.ShoppingItemResponse)
def update_item_note(item_id: int, note_data: schemas.ShoppingItemNoteUpdate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    db_item = db.query(models.ShoppingItem).filter(models.ShoppingItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db_item.note = note_data.note
    db.commit()
    db.refresh(db_item)
    return db_item
