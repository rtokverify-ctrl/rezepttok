from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import os

from database import get_db
from models import User, Recipe, Like, Comment, Collection, SavedRecipe, Follow, Notification
from schemas import RecipeCreate, RecipeUpdate, CommentCreate, CollectionCreate
from auth import get_current_user

router = APIRouter()

from algorithms.feed_logic import get_feed_with_edge_rank

@router.get("/feed")
def get_feed(cursor: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cursor_score = None
    cursor_id = None
    if cursor and "_" in cursor:
        try:
            parts = cursor.split("_")
            cursor_score = float(parts[0])
            cursor_id = int(parts[1])
        except ValueError:
            pass
            
    # Get recipes using the Edge Rank algorithm
    ranked_recipes = get_feed_with_edge_rank(
        db=db, 
        current_user_id=current_user.id, 
        cursor_score=cursor_score, 
        cursor_id=cursor_id, 
        limit=10
    )
    
    results = []
    for r, score in ranked_recipes:
        owner = db.query(User).filter(User.id == r.owner_id).first()
        chef_display = owner.display_name if owner else "Unknown"
        owner_avatar = owner.avatar_url if owner else None
        
        # We can still count likes and comments for the response, 
        # or we could optimize by returning them from the query, 
        # but for simplicity we keep the existing response format
        count = db.query(Like).filter(Like.recipe_id == r.id).count()
        comment_count = db.query(Comment).filter(Comment.recipe_id == r.id).count()
        my_like = db.query(Like).filter(Like.recipe_id == r.id, Like.user_id == current_user.id).first()
        # Check ob das Rezept IRGENDWO gespeichert ist
        my_save = db.query(SavedRecipe).filter(SavedRecipe.recipe_id == r.id, SavedRecipe.user_id == current_user.id).first()
        # Check ob ich dem Owner folge
        i_follow = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.following_id == r.owner_id).first() is not None if r.owner_id != current_user.id else False
        results.append({
            "id": r.id, "title": r.title, "video_url": r.video_url, "chef": chef_display, "owner_id": r.owner_id, 
            "owner_avatar_url": owner_avatar,
            "ingredients": r.ingredients, "steps": r.steps, "tags": r.tags, "tips": r.tips,
            "likes_count": count, "i_liked_it": my_like is not None, 
            "comments_count": comment_count, "i_saved_it": my_save is not None, "is_mine": (r.owner_id == current_user.id),
            "i_follow_owner": i_follow,
            "created_at": r.created_at,
            "views": r.views,
            "edge_rank_score": score
        })
    nextCursor = f"{ranked_recipes[-1][1]}_{ranked_recipes[-1][0].id}" if ranked_recipes else None
    return {"data": results, "nextCursor": nextCursor}

@router.get("/my-saved-videos/all")
def get_all_saved_videos(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Distinct recipe_ids holen
    saves = db.query(SavedRecipe.recipe_id).filter(SavedRecipe.user_id == current_user.id).distinct().all()
    results = []
    for s in saves:
        r = db.query(Recipe).filter(Recipe.id == s.recipe_id).first()
        if r:
            owner = db.query(User).filter(User.id == r.owner_id).first()
            chef_display = owner.display_name if owner else "Unknown"
            owner_avatar = owner.avatar_url if owner else None
            results.append({ "id": r.id, "video_url": r.video_url, "title": r.title, "ingredients": r.ingredients, "steps": r.steps, "tags": r.tags, "tips": r.tips, "is_mine": (r.owner_id == current_user.id), "chef": chef_display, "owner_id": r.owner_id, "owner_avatar_url": owner_avatar})
    return results

@router.post("/recipes/{recipe_id}/toggle-global-save")
def toggle_global_save(recipe_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # Check ob überhaupt gespeichert
    existing = db.query(SavedRecipe).filter(SavedRecipe.user_id == user.id, SavedRecipe.recipe_id == recipe_id).all()
    
    if existing:
        # Wenn schon gespeichert -> LÖSCHEN (Entmerken)
        for e in existing:
            db.delete(e)
        db.commit()
        return {"saved": False}
    else:
        # Wenn nicht gespeichert -> Speichern (Default: Collection NULL)
        db.add(SavedRecipe(user_id=user.id, recipe_id=recipe_id, collection_id=None))
        db.commit()
        return {"saved": True}

@router.get("/recipes/{recipe_id}/save-status")
def get_save_status(recipe_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    saves = db.query(SavedRecipe).filter(SavedRecipe.user_id == user.id, SavedRecipe.recipe_id == recipe_id).all()
    # Gib Liste der Collection IDs zurück
    collection_ids = [s.collection_id for s in saves if s.collection_id is not None]
    return collection_ids

@router.post("/recipes/{recipe_id}/toggle-collection/{collection_id}")
def toggle_collection_save(recipe_id: int, collection_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = db.query(SavedRecipe).filter(SavedRecipe.user_id == user.id, SavedRecipe.recipe_id == recipe_id, SavedRecipe.collection_id == collection_id).first()
    
    if existing:
        db.delete(existing)
        active = False
    else:
        db.add(SavedRecipe(user_id=user.id, recipe_id=recipe_id, collection_id=collection_id))
        active = True
    
    db.commit()
    return {"active": active}

@router.get("/collections")
def get_collections(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cols = db.query(Collection).filter(Collection.user_id == current_user.id).all()
    return cols

@router.post("/collections")
def create_collection(col: CollectionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_col = Collection(name=col.name, user_id=current_user.id)
    db.add(new_col)
    db.commit()
    db.refresh(new_col)
    return new_col

@router.get("/collections/{collection_id}/videos")
def get_collection_videos(collection_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    saves = db.query(SavedRecipe).filter(SavedRecipe.user_id == current_user.id, SavedRecipe.collection_id == collection_id).all()
    results = []
    for s in saves:
        r = db.query(Recipe).filter(Recipe.id == s.recipe_id).first()
        if r:
            owner = db.query(User).filter(User.id == r.owner_id).first()
            chef_display = owner.display_name if owner else "Unknown"
            owner_avatar = owner.avatar_url if owner else None
            results.append({ "id": r.id, "video_url": r.video_url, "title": r.title, "ingredients": r.ingredients, "steps": r.steps, "tags": r.tags, "tips": r.tips, "is_mine": (r.owner_id == current_user.id), "chef": chef_display, "owner_id": r.owner_id, "owner_avatar_url": owner_avatar})
    return results

@router.post("/recipes/{recipe_id}/like")
async def toggle_like(recipe_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not db.query(Recipe).filter(Recipe.id == recipe_id).first(): raise HTTPException(404, "Nicht gefunden")
    existing = db.query(Like).filter(Like.user_id == user.id, Like.recipe_id == recipe_id).first()
    if existing: 
        db.delete(existing)
        db.commit()
    else: 
        db.add(Like(user_id=user.id, recipe_id=recipe_id))
        recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
        if recipe and recipe.owner_id != user.id:
            db.add(Notification(recipient_id=recipe.owner_id, sender_id=user.id, type="like", post_id=recipe_id, created_at=datetime.now().isoformat()))
            db.commit()
            from services.push_service import send_push_notification
            await send_push_notification(db, recipe.owner_id, "Neuer Like", f"{user.username} gefällt dein Rezept!")
        else:
            db.commit()
    return {"msg": "Ok"}

@router.get("/recipes/{recipe_id}/comments")
def get_comments(recipe_id: int, db: Session = Depends(get_db)):
    # Get all comments for this recipe
    all_comments = db.query(Comment).filter(Comment.recipe_id == recipe_id).order_by(Comment.id.asc()).all()
    
    # Build user lookup
    user_ids = set(c.user_id for c in all_comments)
    users = {u.id: u for u in db.query(User).filter(User.id.in_(user_ids)).all()} if user_ids else {}
    
    def format_comment(c):
        u = users.get(c.user_id)
        return {
            "id": c.id, "text": c.text, 
            "username": u.display_name if u and u.display_name else (u.username if u else "Gast"), 
            "user_id": c.user_id,
            "avatar": u.avatar_url if u else None,
            "parent_id": c.parent_id,
            "created_at": c.created_at,
            "replies": []
        }
    
    # Separate top-level and replies
    comment_map = {}
    top_level = []
    
    for c in all_comments:
        formatted = format_comment(c)
        comment_map[c.id] = formatted
        if c.parent_id is None:
            top_level.append(formatted)
        else:
            parent = comment_map.get(c.parent_id)
            if parent:
                parent["replies"].append(formatted)
    
    # Reverse so newest top-level comments are first
    top_level.reverse()
    return top_level

@router.post("/recipes/{recipe_id}/comments")
async def create_comment(recipe_id: int, comment: CommentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    new_comment = Comment(text=comment.text, user_id=user.id, recipe_id=recipe_id, parent_id=comment.parent_id, created_at=datetime.now().isoformat())
    db.add(new_comment)
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    
    # Notify recipe owner about comment (if not self)
    if recipe and recipe.owner_id != user.id:
        db.add(Notification(recipient_id=recipe.owner_id, sender_id=user.id, type="comment", post_id=recipe_id, created_at=datetime.now().isoformat()))
    
    # If replying, also notify the parent comment author (if different from self and recipe owner)
    if comment.parent_id:
        parent_comment = db.query(Comment).filter(Comment.id == comment.parent_id).first()
        if parent_comment and parent_comment.user_id != user.id and (not recipe or parent_comment.user_id != recipe.owner_id):
            db.add(Notification(recipient_id=parent_comment.user_id, sender_id=user.id, type="reply", post_id=recipe_id, created_at=datetime.now().isoformat()))
    
    db.commit()
    db.refresh(new_comment)
    
    # Push notifications
    from services.push_service import send_push_notification
    if recipe and recipe.owner_id != user.id:
        await send_push_notification(db, recipe.owner_id, "Neuer Kommentar", f"{user.username} hat kommentiert: {comment.text}")
    if comment.parent_id:
        parent_comment = db.query(Comment).filter(Comment.id == comment.parent_id).first()
        if parent_comment and parent_comment.user_id != user.id and (not recipe or parent_comment.user_id != recipe.owner_id):
            await send_push_notification(db, parent_comment.user_id, "Antwort auf deinen Kommentar", f"{user.username}: {comment.text}")
    
    # Return full comment object for frontend
    return {
        "id": new_comment.id, "text": new_comment.text, 
        "username": user.display_name if user.display_name else user.username, 
        "user_id": user.id,
        "avatar": user.avatar_url,
        "parent_id": new_comment.parent_id,
        "created_at": new_comment.created_at,
        "replies": []
    }

@router.post("/upload")
def create_recipe(recipe: RecipeCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db_recipe = Recipe(title=recipe.title, video_url=recipe.video_url, chef=user.username, owner_id=user.id, ingredients=recipe.ingredients, steps=recipe.steps, tags=recipe.tags, tips=recipe.tips, created_at=datetime.now().isoformat())
    db.add(db_recipe)
    db.commit()
    return db_recipe

@router.patch("/recipes/{recipe_id}")
def update_recipe(recipe_id: int, data: RecipeUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Rezept nicht gefunden")
    if recipe.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Nur der Ersteller kann dieses Rezept bearbeiten")
    
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(recipe, field, value)
    db.commit()
    db.refresh(recipe)
    
    return {
        "id": recipe.id, "title": recipe.title, "video_url": recipe.video_url,
        "ingredients": recipe.ingredients, "steps": recipe.steps,
        "tags": recipe.tags, "tips": recipe.tips, "owner_id": recipe.owner_id,
        "created_at": recipe.created_at, "views": recipe.views
    }

@router.delete("/recipes/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe or recipe.owner_id != user.id: raise HTTPException(403, "Fehler")
    if os.path.exists(recipe.video_url.lstrip("/")): os.remove(recipe.video_url.lstrip("/"))
    db.delete(recipe)
    db.commit()
    return {"msg": "Weg"}

@router.get("/recipes/trending")
def get_trending_recipes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Standard query logic without full Edge Rank, descending by views (or likes if views not available).
    # Since we added views to the model, we order by views.
    recipes = db.query(Recipe).order_by(Recipe.views.desc().nullslast(), Recipe.created_at.desc()).limit(15).all()
    
    results = []
    for r in recipes:
        owner = db.query(User).filter(User.id == r.owner_id).first()
        chef_display = owner.display_name if owner else "Unknown"
        owner_avatar = owner.avatar_url if owner else None
        count = db.query(Like).filter(Like.recipe_id == r.id).count()
        comment_count = db.query(Comment).filter(Comment.recipe_id == r.id).count()
        my_like = db.query(Like).filter(Like.recipe_id == r.id, Like.user_id == current_user.id).first()
        my_save = db.query(SavedRecipe).filter(SavedRecipe.recipe_id == r.id, SavedRecipe.user_id == current_user.id).first()
        i_follow = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.following_id == r.owner_id).first() is not None if r.owner_id != current_user.id else False
        
        results.append({
            "id": r.id, "title": r.title, "video_url": r.video_url, "chef": chef_display, "owner_id": r.owner_id, 
            "owner_avatar_url": owner_avatar,
            "ingredients": r.ingredients, "steps": r.steps, "tags": r.tags, "tips": r.tips,
            "likes_count": count, "i_liked_it": my_like is not None, 
            "comments_count": comment_count, "i_saved_it": my_save is not None, "is_mine": (r.owner_id == current_user.id),
            "i_follow_owner": i_follow,
            "created_at": r.created_at,
            "views": r.views
        })
    return {"data": results}

@router.get("/recipes/tags/{tag}")
def get_recipes_by_tag(tag: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from sqlalchemy import cast, String
    recipes = db.query(Recipe).filter(cast(Recipe.tags, String).ilike(f"%{tag}%")).order_by(Recipe.created_at.desc()).limit(20).all()
    
    results = []
    for r in recipes:
        owner = db.query(User).filter(User.id == r.owner_id).first()
        chef_display = owner.display_name if owner else "Unknown"
        owner_avatar = owner.avatar_url if owner else None
        count = db.query(Like).filter(Like.recipe_id == r.id).count()
        comment_count = db.query(Comment).filter(Comment.recipe_id == r.id).count()
        my_like = db.query(Like).filter(Like.recipe_id == r.id, Like.user_id == current_user.id).first()
        my_save = db.query(SavedRecipe).filter(SavedRecipe.recipe_id == r.id, SavedRecipe.user_id == current_user.id).first()
        i_follow = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.following_id == r.owner_id).first() is not None if r.owner_id != current_user.id else False
        
        results.append({
            "id": r.id, "title": r.title, "video_url": r.video_url, "chef": chef_display, "owner_id": r.owner_id, 
            "owner_avatar_url": owner_avatar,
            "ingredients": r.ingredients, "steps": r.steps, "tags": r.tags, "tips": r.tips,
            "likes_count": count, "i_liked_it": my_like is not None, 
            "comments_count": comment_count, "i_saved_it": my_save is not None, "is_mine": (r.owner_id == current_user.id),
            "i_follow_owner": i_follow,
            "created_at": r.created_at,
            "views": r.views
        })
    return {"data": results}
