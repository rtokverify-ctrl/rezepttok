from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, ShoppingList, SharedShoppingList, Collection, SharedCollection
from auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class ShareRequest(BaseModel):
    username: str

@router.post("/shopping-lists/{list_id}/share")
def share_list(list_id: int, request: ShareRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Teilt eine Einkaufsliste mit einem anderen User via Username."""
    # Check ownership
    l = db.query(ShoppingList).filter(ShoppingList.id == list_id, ShoppingList.user_id == current_user.id).first()
    if not l:
        raise HTTPException(status_code=404, detail="List not found or unauthorized")

    # Find target user
    target_user = db.query(User).filter(User.username == request.username).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot share with yourself")

    # Check if already shared
    existing = db.query(SharedShoppingList).filter(SharedShoppingList.list_id == list_id, SharedShoppingList.shared_with_user_id == target_user.id).first()
    if existing:
        return {"message": "Already shared with this user"}

    # Add share
    share = SharedShoppingList(list_id=list_id, shared_with_user_id=target_user.id)
    db.add(share)
    db.commit()
    return {"message": f"List shared with {target_user.username}"}

@router.post("/collections/{collection_id}/share")
def share_collection(collection_id: int, request: ShareRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Teilt eine gespeicherte Video-Sammlung mit einem anderen User."""
    # Check ownership
    c = db.query(Collection).filter(Collection.id == collection_id, Collection.user_id == current_user.id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Collection not found or unauthorized")

    # Find target user
    target_user = db.query(User).filter(User.username == request.username).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot share with yourself")

    # Check if already shared
    existing = db.query(SharedCollection).filter(SharedCollection.collection_id == collection_id, SharedCollection.shared_with_user_id == target_user.id).first()
    if existing:
        return {"message": "Already shared with this user"}

    # Add share
    share = SharedCollection(collection_id=collection_id, shared_with_user_id=target_user.id)
    db.add(share)
    db.commit()
    return {"message": f"Collection shared with {target_user.username}"}
