from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
import uuid
import os

from database import get_db
from models import User, Follow, Recipe, Like, Notification, SavedRecipe
from datetime import datetime
from schemas import UserCreate
from auth import get_current_user
from pydantic import BaseModel

class PushTokenInput(BaseModel):
    token: str

router = APIRouter()

@router.post("/push-token")
def save_push_token(input: PushTokenInput, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from models import PushToken
    existing = db.query(PushToken).filter(PushToken.token == input.token).first()
    if existing:
        if existing.user_id != current_user.id:
            existing.user_id = current_user.id
            db.commit()
    else:
        new_token = PushToken(user_id=current_user.id, token=input.token, created_at=datetime.now().isoformat())
        db.add(new_token)
        db.commit()
    return {"status": "ok"}

@router.post("/update-profile")
async def update_profile(
    display_name: str = Form(...), 
    bio: str = Form(...), 
    file: UploadFile = File(None), 
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    display_name = display_name.strip()
    if not display_name:
        display_name = current_user.username
    current_user.display_name = display_name
    current_user.bio = bio
    if file:
        from services.storage_manager import storage_manager
        ext = file.filename.split(".")[-1]
        new_name = f"avatar_{current_user.id}_{uuid.uuid4()}.{ext}"
        avatar_url = await storage_manager.save_avatar(file, new_name)
        current_user.avatar_url = avatar_url
    db.commit()
    return {"msg": "Profil aktualisiert", "avatar_url": current_user.avatar_url}

@router.get("/my-videos")
def get_my_videos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recipes = db.query(Recipe).filter(Recipe.owner_id == current_user.id).order_by(Recipe.id.desc()).all()
    followers_count = db.query(Follow).filter(Follow.following_id == current_user.id).count()
    following_count = db.query(Follow).filter(Follow.follower_id == current_user.id).count()
    results = []
    for r in recipes:
        count = db.query(Like).filter(Like.recipe_id == r.id).count()
        # comment_count = db.query(Comment).filter(Comment.recipe_id == r.id).count() # optimize import if needed
        # Just use verify logic or simplify. Let's keep it consistent.
        # Need Comment model imported if using it.
        # Let's import Comment inside or at top.
        # Added Comment to imports.
        pass
        
    # Re-reading logic from main.py, it was calculating comment count.
    # I need to import Comment model.
    from models import Comment
    
    for r in recipes:
        count = db.query(Like).filter(Like.recipe_id == r.id).count()
        comment_count = db.query(Comment).filter(Comment.recipe_id == r.id).count()
        results.append({
            "id": r.id, "title": r.title, "video_url": r.video_url, "chef": current_user.display_name, "owner_id": r.owner_id, 
            "ingredients": r.ingredients, "steps": r.steps, "tags": r.tags, "tips": r.tips,
            "likes_count": count, "i_liked_it": False, 
            "comments_count": comment_count, "i_saved_it": False, "is_mine": True
        })
    return {"profile": {"display_name": current_user.display_name, "username": current_user.username, "bio": current_user.bio, "avatar_url": current_user.avatar_url, "followers_count": followers_count, "following_count": following_count}, "videos": results}

@router.post("/users/{user_id}/toggle-follow")
async def toggle_follow(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Du kannst dir nicht selbst folgen")
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    existing = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.following_id == user_id).first()
    if existing:
        db.delete(existing)
        db.commit()
        return {"following": False}
    else:
        db.add(Follow(follower_id=current_user.id, following_id=user_id))
        # Notification create
        notif = Notification(recipient_id=user_id, sender_id=current_user.id, type="follow", created_at=datetime.now().isoformat())
        db.add(notif)
        db.commit()
        
        from services.push_service import send_push_notification
        await send_push_notification(db, user_id, "Neuer Follow", f"{current_user.username} folgt dir jetzt!")
        
        return {"following": True}

@router.get("/users/{user_id}/profile")
def get_user_profile(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    followers_count = db.query(Follow).filter(Follow.following_id == user_id).count()
    following_count = db.query(Follow).filter(Follow.follower_id == user_id).count()
    i_follow = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.following_id == user_id).first() is not None
    recipes = db.query(Recipe).filter(Recipe.owner_id == user_id).order_by(Recipe.id.desc()).all()
    videos = []
    for r in recipes:
        like_count = db.query(Like).filter(Like.recipe_id == r.id).count()
        videos.append({
            "id": r.id, "title": r.title, "video_url": r.video_url,
            "likes_count": like_count, "tags": r.tags,
            "ingredients": r.ingredients, "steps": r.steps, "tips": r.tips
        })
    return {
        "profile": {
            "id": user.id, "display_name": user.display_name, "username": user.username,
            "bio": user.bio, "avatar_url": user.avatar_url,
            "followers_count": followers_count, "following_count": following_count,
            "i_follow": i_follow, "is_me": (user.id == current_user.id)
        },
        "videos": videos
    }

@router.get("/my-profile")
def get_my_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    followers_count = db.query(Follow).filter(Follow.following_id == current_user.id).count()
    following_count = db.query(Follow).filter(Follow.follower_id == current_user.id).count()
    return {
        "id": current_user.id, "display_name": current_user.display_name, "username": current_user.username,
        "bio": current_user.bio, "avatar_url": current_user.avatar_url,
        "followers_count": followers_count, "following_count": following_count
    }

@router.get("/liked-videos")
def get_my_liked_videos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # ... existing implementation ...

    likes = db.query(Like).filter(Like.user_id == current_user.id).all()
    results = []
    for like in likes:
        r = db.query(Recipe).filter(Recipe.id == like.recipe_id).first()
        if r:
            results.append({ "id": r.id, "video_url": r.video_url, "title": r.title, "ingredients": r.ingredients, "steps": r.steps, "tags": r.tags, "tips": r.tips, "is_mine": (r.owner_id == current_user.id)})
    return results

@router.get("/saved-videos")
def get_my_saved_videos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    saved = db.query(SavedRecipe).filter(SavedRecipe.user_id == current_user.id).all()
    results = []
    # To avoid duplicates if saved in multiple collections, we might want to use a set or distinct query.
    # But usually a recipe is saved once per user per collection?
    # If a user saves a recipe to multiple collections, it appears multiple times in SavedRecipe table?
    # Let's deduplicate by recipe ID for the "All Saved" view.
    seen_recipe_ids = set()
    
    for s in saved:
        if s.recipe_id in seen_recipe_ids: continue
        r = db.query(Recipe).filter(Recipe.id == s.recipe_id).first()
        if r:
            seen_recipe_ids.add(r.id)
            results.append({ "id": r.id, "video_url": r.video_url, "title": r.title, "ingredients": r.ingredients, "steps": r.steps, "tags": r.tags, "tips": r.tips, "is_mine": (r.owner_id == current_user.id)})
    return results

@router.delete("/my-profile")
async def delete_my_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from models import (
        Comment, Collection, SharedCollection, ShoppingList, 
        ShoppingListItem, SharedShoppingList, Conversation, Message, PushToken
    )
    from services.storage_manager import storage_manager
    from sqlalchemy import or_

    # 1. Avatar löschen
    if current_user.avatar_url:
        await storage_manager.delete_file(current_user.avatar_url)
    
    # 2. Fremde und Eigene Notifications bereinigen
    db.query(Notification).filter(
        or_(Notification.sender_id == current_user.id, Notification.recipient_id == current_user.id)
    ).delete(synchronize_session=False)

    # 3. Follow-Beziehungen auflösen
    db.query(Follow).filter(
        or_(Follow.follower_id == current_user.id, Follow.following_id == current_user.id)
    ).delete(synchronize_session=False)

    # 4. Likes, Comments, SavedRecipes (von fremden Videos) löschen
    db.query(Like).filter(Like.user_id == current_user.id).delete(synchronize_session=False)
    db.query(Comment).filter(Comment.user_id == current_user.id).delete(synchronize_session=False)
    db.query(SavedRecipe).filter(SavedRecipe.user_id == current_user.id).delete(synchronize_session=False)

    # 5. Chats / Conversations / Messages
    db.query(Message).filter(Message.sender_id == current_user.id).delete(synchronize_session=False)
    user_convos = db.query(Conversation).filter(
        or_(Conversation.user1_id == current_user.id, Conversation.user2_id == current_user.id)
    ).all()
    for convo in user_convos:
        db.query(Message).filter(Message.conversation_id == convo.id).delete(synchronize_session=False)
        db.delete(convo)
        
    # 6. Collections
    db.query(SharedCollection).filter(SharedCollection.shared_with_user_id == current_user.id).delete(synchronize_session=False)
    user_collections = db.query(Collection).filter(Collection.user_id == current_user.id).all()
    for col in user_collections:
        db.query(SavedRecipe).filter(SavedRecipe.collection_id == col.id).delete(synchronize_session=False)
        db.query(SharedCollection).filter(SharedCollection.collection_id == col.id).delete(synchronize_session=False)
        db.delete(col)

    # 7. ShoppingLists
    db.query(SharedShoppingList).filter(SharedShoppingList.shared_with_user_id == current_user.id).delete(synchronize_session=False)
    user_lists = db.query(ShoppingList).filter(ShoppingList.user_id == current_user.id).all()
    for slist in user_lists:
        db.query(ShoppingListItem).filter(ShoppingListItem.list_id == slist.id).delete(synchronize_session=False)
        db.query(SharedShoppingList).filter(SharedShoppingList.list_id == slist.id).delete(synchronize_session=False)
        db.delete(slist)

    # 8. Rezepte löschen
    my_recipes = db.query(Recipe).filter(Recipe.owner_id == current_user.id).all()
    for r in my_recipes:
        if r.video_url:
            await storage_manager.delete_file(r.video_url)
        db.query(Like).filter(Like.recipe_id == r.id).delete(synchronize_session=False)
        db.query(Comment).filter(Comment.recipe_id == r.id).delete(synchronize_session=False)
        db.query(SavedRecipe).filter(SavedRecipe.recipe_id == r.id).delete(synchronize_session=False)
        db.delete(r)

    # 9. PushTokens löschen 
    db.query(PushToken).filter(PushToken.user_id == current_user.id).delete(synchronize_session=False)

    # 10. User löschen
    db.delete(current_user)
    db.commit()
    return {"msg": "Account erfolgreich unwiderruflich gelöscht"}
