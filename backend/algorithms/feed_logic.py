from sqlalchemy import func, select, cast, DateTime, case, or_, and_
from sqlalchemy.orm import Session
from models import Recipe, Like, SavedRecipe, Comment, Follow
from database import engine

from typing import Optional

def get_feed_with_edge_rank(db: Session, current_user_id: int, cursor_score: Optional[float] = None, cursor_id: Optional[int] = None, limit: int = 10):
    # Base count subqueries
    likes_sub = select(func.count(Like.user_id)).where(Like.recipe_id == Recipe.id).scalar_subquery()
    saves_sub = select(func.count(SavedRecipe.user_id)).where(SavedRecipe.recipe_id == Recipe.id).scalar_subquery()
    comments_sub = select(func.count(Comment.id)).where(Comment.recipe_id == Recipe.id).scalar_subquery()
    
    # Using coalesce to handle NULLs from subqueries if any
    c_likes = func.coalesce(likes_sub, 0)
    c_saves = func.coalesce(saves_sub, 0)
    c_comments = func.coalesce(comments_sub, 0)
    c_views = func.coalesce(Recipe.views, 0)
    
    base_score = (c_likes * 2) + (c_saves * 3) + (c_comments * 2) + (c_views * 0.1)
    
    # Age calculation
    if getattr(engine.dialect, 'name', '') == 'sqlite':
        # SQLite compatible age calculation (in hours)
        age_hours = (func.julianday('now') - func.julianday(Recipe.created_at)) * 24
        # SQLite might not have power natively, using simple multiplication for
        # exponent 1.5 is hard in strict SQLite. We can approximate or use a
        # simple multiplier. SQLAlchemy translates func.power to POWER which
        # works in newer sqlite.
        time_penalty = func.power(age_hours + 2, 1.5)
    else:
        # PostgreSQL compatible calculation
        # Convert isoformat string to timestamp, then subtract from now(), get epoch seconds
        age_seconds = func.extract('epoch', func.now() - cast(Recipe.created_at, DateTime))
        age_hours = age_seconds / 3600.0
        time_penalty = func.power(age_hours + 2, 1.5)
    
    raw_score = base_score / time_penalty
    
    # Cold start boost: views < 50 AND age_in_hours < 24 -> +50
    is_cold_start = and_(c_views < 50, age_hours < 24)
    raw_score_with_boost = raw_score + case((is_cold_start, 50.0), else_=0.0)
    
    # Personalization boost: if following the creator -> * 1.5
    is_following = select(Follow.follower_id).where(
        and_(Follow.follower_id == current_user_id, Follow.following_id == Recipe.owner_id)
    ).exists()
    
    final_score = raw_score_with_boost * case((is_following, 1.5), else_=1.0)
    final_score_label = final_score.label('score')
    
    query = db.query(Recipe, final_score_label)
    
    if cursor_score is not None and cursor_id is not None:
        query = query.filter(
            or_(
                final_score < cursor_score,
                and_(final_score == cursor_score, Recipe.id < cursor_id)
            )
        )
        
    query = query.order_by(final_score.desc(), Recipe.id.desc()).limit(limit)
    return query.all()
