from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import os

from database import get_db
from models import User, Recipe, Like, Comment, Collection, SavedRecipe, Follow, Notification
from schemas import RecipeCreate, CommentCreate, CollectionCreate
from auth import get_current_user

router = APIRouter()

@router.get("/feed")
def get_feed(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recipes = db.query(Recipe).order_by(Recipe.id.desc()).all()
    results = []
    for r in recipes:
        owner = db.query(User).filter(User.id == r.owner_id).first()
        chef_display = owner.display_name if owner else "Unknown"
        owner_avatar = owner.avatar_url if owner else None
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
            "i_follow_owner": i_follow
        })
    return results

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
def toggle_like(recipe_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not db.query(Recipe).filter(Recipe.id == recipe_id).first(): raise HTTPException(404, "Nicht gefunden")
    existing = db.query(Like).filter(Like.user_id == user.id, Like.recipe_id == recipe_id).first()
    if existing: db.delete(existing)
    else: 
        db.add(Like(user_id=user.id, recipe_id=recipe_id))
        recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
        if recipe and recipe.owner_id != user.id:
            db.add(Notification(recipient_id=recipe.owner_id, sender_id=user.id, type="like", post_id=recipe_id, created_at=datetime.now().isoformat()))
    db.commit()
    return {"msg": "Ok"}

@router.get("/recipes/{recipe_id}/comments")
def get_comments(recipe_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(Comment.recipe_id == recipe_id).order_by(Comment.id.desc()).all()
    results = []
    for c in comments:
        u = db.query(User).filter(User.id == c.user_id).first()
        results.append({
            "id": c.id, "text": c.text, "username": u.display_name if u and u.display_name else (u.username if u else "Gast"), "avatar": u.avatar_url if u else None,
            "created_at": c.created_at
        })
    return results

@router.post("/recipes/{recipe_id}/comments")
def create_comment(recipe_id: int, comment: CommentCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    new_comment = Comment(text=comment.text, user_id=user.id, recipe_id=recipe_id, created_at=datetime.now().isoformat())
    db.add(new_comment)
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if recipe and recipe.owner_id != user.id:
        db.add(Notification(recipient_id=recipe.owner_id, sender_id=user.id, type="comment", post_id=recipe_id, created_at=datetime.now().isoformat()))
    db.commit()
    db.refresh(new_comment)
    
    # Return full comment object for frontend
    return {
        "id": new_comment.id, "text": new_comment.text, 
        "username": user.display_name if user.display_name else user.username, 
        "avatar": user.avatar_url,
        "created_at": new_comment.created_at
    }

@router.post("/upload")
def create_recipe(recipe: RecipeCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db_recipe = Recipe(title=recipe.title, video_url=recipe.video_url, chef=user.username, owner_id=user.id, ingredients=recipe.ingredients, steps=recipe.steps, tags=recipe.tags, tips=recipe.tips)
    db.add(db_recipe)
    db.commit()
    return db_recipe

@router.delete("/recipes/{recipe_id}")
def delete_recipe(recipe_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe or recipe.owner_id != user.id: raise HTTPException(403, "Fehler")
    if os.path.exists(recipe.video_url.lstrip("/")): os.remove(recipe.video_url.lstrip("/"))
    db.delete(recipe)
    db.commit()
    return {"msg": "Weg"}
