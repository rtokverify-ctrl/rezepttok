from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database import get_db
from models import User, Recipe
from auth import get_current_user

router = APIRouter()

@router.get("/search")
def search(q: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not q: return {"users": [], "videos": []}
    
    # Search Users
    users = db.query(User).filter(or_(User.username.ilike(f"%{q}%"), User.display_name.ilike(f"%{q}%"))).all()
    user_results = []
    for u in users:
        user_results.append({
            "id": u.id,
            "username": u.username,
            "display_name": u.display_name,
            "avatar_url": u.avatar_url
        })
        
    # Search Recipes
    # SQLite doesn't support JSON specific operators easily with SQLAlchemy in this setup, 
    # so we'll fetch all and filter in python or use simple text match on other fields.
    # For now, let's search title and tags (as string match if possible, or just title)
    
    # Simple Title Search
    recipes = db.query(Recipe).filter(Recipe.title.ilike(f"%{q}%")).all()
    
    # For tags, it's a bit harder with simple SQL on JSON. 
    # We can stick to Title for now or fetch all and filter (inefficient but works for small app).
    # Let's stick to simple title search for efficiency.
    
    video_results = []
    for r in recipes:
        video_results.append({
            "id": r.id,
            "title": r.title,
            "video_url": r.video_url, # Already full URL? No, needs prefix in frontend or backend. 
                                      # In other routers we return full URL or partial. Main.py/feed returned full?
                                      # Let's check feed logic. Feed does: video_url: r.video_url
                                      # Frontend adds BASE_URL.
        })
        
    return {"users": user_results, "videos": video_results}
