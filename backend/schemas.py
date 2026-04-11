from pydantic import BaseModel
from typing import List, Optional

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    age: int

class UserVerify(BaseModel):
    email: str
    code: str

class Token(BaseModel):
    access_token: str
    token_type: str

class RecipeCreate(BaseModel):
    title: str
    video_url: str
    ingredients: List[dict]
    steps: List[dict]
    tags: List[str] 
    tips: Optional[str] = None

class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    ingredients: Optional[List[dict]] = None
    steps: Optional[List[dict]] = None
    tags: Optional[List[str]] = None
    tips: Optional[str] = None

from typing import Any
class FeedResponse(BaseModel):
    data: List[Any]
    nextCursor: Optional[str] = None

class CommentCreate(BaseModel):
    text: str
    parent_id: Optional[int] = None

class CollectionCreate(BaseModel):
    name: str

class MessageCreate(BaseModel):
    text: str

class MessageOut(BaseModel):
    id: int
    text: str
    sender_id: int
    created_at: str
    read: bool

    class Config:
        from_attributes = True

class ConversationUserOut(BaseModel):
    id: int
    username: str
    avatar_url: Optional[str] = None

class ConversationOut(BaseModel):
    id: int
    other_user: ConversationUserOut
    last_message: Optional[str] = None
    last_message_time: Optional[str] = None
    unread_count: int = 0

