from sqlalchemy import ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from typing import Optional
from database import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    username: Mapped[str] = mapped_column(unique=True, index=True)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column()
    age: Mapped[int] = mapped_column()
    display_name: Mapped[Optional[str]] = mapped_column(default=None)
    bio: Mapped[Optional[str]] = mapped_column(default=None)
    avatar_url: Mapped[Optional[str]] = mapped_column(default=None)
    
    # Security / 2FA
    is_verified: Mapped[bool] = mapped_column(default=False)
    verification_code: Mapped[Optional[str]] = mapped_column(default=None)

class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    recipient_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    type: Mapped[str] = mapped_column() # like, comment, follow
    post_id: Mapped[Optional[int]] = mapped_column(ForeignKey("recipes.id"), default=None)
    read: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[str] = mapped_column()

class ShoppingListItem(Base):
    __tablename__ = "shopping_list"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    item: Mapped[str] = mapped_column()
    completed: Mapped[bool] = mapped_column(default=False)

class Recipe(Base):
    __tablename__ = "recipes"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column()
    video_url: Mapped[str] = mapped_column()
    chef: Mapped[str] = mapped_column()
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    ingredients: Mapped[Optional[list]] = mapped_column(JSON)
    steps: Mapped[Optional[list]] = mapped_column(JSON)
    tags: Mapped[Optional[list]] = mapped_column(JSON)
    tips: Mapped[Optional[str]] = mapped_column(default=None)

class Like(Base):
    __tablename__ = "likes"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    recipe_id: Mapped[int] = mapped_column(ForeignKey("recipes.id"), primary_key=True)

class Comment(Base):
    __tablename__ = "comments"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    text: Mapped[str] = mapped_column()
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    recipe_id: Mapped[int] = mapped_column(ForeignKey("recipes.id"))
    created_at: Mapped[str] = mapped_column()

class Collection(Base):
    __tablename__ = "collections"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column()
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

class SavedRecipe(Base):
    __tablename__ = "saved_recipes"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    recipe_id: Mapped[int] = mapped_column(ForeignKey("recipes.id"))
    collection_id: Mapped[Optional[int]] = mapped_column(ForeignKey("collections.id"), default=None)

class Follow(Base):
    __tablename__ = "follows"
    follower_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    following_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
