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

class CommentCreate(BaseModel):
    text: str

class CollectionCreate(BaseModel):
    name: str
