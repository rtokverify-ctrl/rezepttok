from fastapi import APIRouter

router = APIRouter()

@router.get("/video/{id}")
def get_video(id: str):
    # Missing database dependency, returning dummy data
    return {"id": id, "title": "Sample Video"}
