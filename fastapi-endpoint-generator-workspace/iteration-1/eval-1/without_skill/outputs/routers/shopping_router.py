from fastapi import APIRouter
import models, schemas

router = APIRouter()

@router.patch("/shopping/{item_id}")
def update_note(item_id: int, data: schemas.NoteUpdate):
    # db code missing dependency injection
    return {"status": "ok"}
