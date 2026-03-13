from pydantic import BaseModel

class NoteUpdate(BaseModel):
    note: str
