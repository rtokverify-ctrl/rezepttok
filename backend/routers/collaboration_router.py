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

@router.get("/shopping-lists/shared-with-me")
def get_shared_shopping_lists(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Lädt alle Einkaufslisten, die mit dem aktuellen User geteilt wurden."""
    shared = db.query(SharedShoppingList).filter(SharedShoppingList.shared_with_user_id == current_user.id).all()
    results = []
    for s in shared:
        l = db.query(ShoppingList).filter(ShoppingList.id == s.list_id).first()
        if l:
            owner = db.query(User).filter(User.id == l.user_id).first()
            owner_name = owner.display_name if owner and owner.display_name else (owner.username if owner else "Unknown")
            results.append({
                "id": l.id,
                "name": l.name,
                "owner_id": l.user_id,
                "owner_name": owner_name,
                "created_at": l.created_at
            })
    return results

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

@router.get("/collections/shared-with-me")
def get_shared_collections(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Lädt alle Collections, die mit dem aktuellen User geteilt wurden."""
    shared = db.query(SharedCollection).filter(SharedCollection.shared_with_user_id == current_user.id).all()
    results = []
    for s in shared:
        c = db.query(Collection).filter(Collection.id == s.collection_id).first()
        if c:
            owner = db.query(User).filter(User.id == c.user_id).first()
            owner_name = owner.display_name if owner and owner.display_name else (owner.username if owner else "Unknown")
            results.append({
                "id": c.id,
                "name": c.name,
                "owner_id": c.user_id,
                "owner_name": owner_name
            })
    return results
