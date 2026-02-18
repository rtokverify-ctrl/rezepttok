from fastapi import APIRouter, UploadFile, Depends
import shutil
import uuid
import os

from models import User
from auth import get_current_user

router = APIRouter()

@router.post("/upload-video")
async def upload_video_file(file: UploadFile, user: User = Depends(get_current_user)):
    ext = file.filename.split(".")[-1]
    new_name = f"{uuid.uuid4()}.{ext}"
    os.makedirs("static", exist_ok=True)
    with open(f"static/{new_name}", "wb") as buffer: shutil.copyfileobj(file.file, buffer)
    return {"url": f"/static/{new_name}"}
