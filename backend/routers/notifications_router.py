from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Notification, User, Recipe
from auth import get_current_user
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

class NotificationOut(BaseModel):
    id: int
    type: str # like, comment, follow
    read: bool
    created_at: str
    sender_name: str
    sender_avatar: Optional[str]
    post_id: Optional[int]
    post_image: Optional[str]

    class Config:
        from_attributes = True

@router.get("/notifications", response_model=List[NotificationOut])
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notifs = db.query(Notification).filter(Notification.recipient_id == current_user.id).order_by(Notification.id.desc()).all()
    
    result = []
    for n in notifs:
        sender = db.query(User).filter(User.id == n.sender_id).first()
        post_image = None
        if n.post_id:
            post = db.query(Recipe).filter(Recipe.id == n.post_id).first()
            if post:
                # Use video_url as image for now, frontend knows how to handle it or we can change later
                post_image = post.video_url 
        
        result.append(NotificationOut(
            id=n.id,
            type=n.type,
            read=n.read,
            created_at=n.created_at,
            sender_name=sender.username if sender else "Unknown",
            sender_avatar=sender.avatar_url if sender else None,
            post_id=n.post_id,
            post_image=post_image
        ))
    return result

@router.post("/notifications/{id}/read")
def read_notification(id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notif = db.query(Notification).filter(Notification.id == id, Notification.recipient_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Not found")
    notif.read = True
    db.commit()
    return {"status": "ok"}
