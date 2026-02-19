from fastapi import APIRouter, UploadFile, Depends
import shutil
import uuid
import os

from models import User
from auth import get_current_user

router = APIRouter()

from services.storage_manager import storage_manager

@router.post("/upload-video")
async def upload_video_file(file: UploadFile, user: User = Depends(get_current_user)):
    ext = file.filename.split(".")[-1]
    new_name = f"{uuid.uuid4()}.{ext}"
    
    # Use StorageManager (handles both local and S3)
    url = await storage_manager.save_video(file, new_name)
    
    return {"url": url}
