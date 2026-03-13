---
name: fastapi-endpoint-generator
description: Use this skill whenever the user asks to create, update, or design a new backend API endpoint, database table, or feature in the FastAPI backend for the RezeptTok app. This ensures the endpoint follows the strict 4-step architecture (Database Model -> Pydantic Schema -> Router Logic -> Integration Test) and interacts with Supabase correctly.
---

# FastAPI Endpoint & Supabase Schema Generator (RezeptTok)

Whenever you are tasked with creating a new feature or endpoint for the RezeptTok backend, you must follow this strict, modular architectural pattern. 

## 1. Database Model (`models.py`)
- Define the SQLAlchemy model.
- Ensure correct column types (e.g., `UUID` for foreign keys linking to Supabase auth users).
- Set up `relationship()` bindings if necessary.

## 2. Pydantic Schema (`schemas.py`)
- Create the Pydantic schemas for data validation.
- You typically need at least two schemas per feature: a `Create` schema (for incoming POST data) and a response schema (with `orm_mode = True` or `from_attributes = True` for Pydantic v2).

## 3. Router Logic (`routers/<name>_router.py`)
- DO NOT add routes directly to `main.py`.
- Create or update a specific router file in the `routers/` directory (e.g., `shopping_router.py`).
- Use the `get_db` dependency to inject the database session (`db: Session = Depends(get_db)`).
- Use the `get_current_user` dependency for any route that requires authentication.
- Always handle standard exceptions gracefully and return helpful HTTP error codes (e.g., 404 for not found).

## 4. Integration Test (`tests/test_<name>.py`)
- Before finishing, ALWAYS generate a test using the `pytest` and `TestClient` framework.
- The test must verify that the endpoint returns the correct status code and data structure.

## Example Flow: Adding a 'Ping' Feature

**1. models.py**
```python
from sqlalchemy import Column, Integer, String
from database import Base

class Ping(Base):
    __tablename__ = "pings"
    id = Column(Integer, primary_key=True, index=True)
    message = Column(String)
```

**2. schemas.py**
```python
from pydantic import BaseModel

class PingCreate(BaseModel):
    message: str

class PingResponse(PingCreate):
    id: int
    class Config:
        from_attributes = True
```

**3. routers/ping_router.py**
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/pings", tags=["Pings"])

@router.post("/", response_model=schemas.PingResponse)
def create_ping(ping: schemas.PingCreate, db: Session = Depends(get_db)):
    db_ping = models.Ping(**ping.model_dump())
    db.add(db_ping)
    db.commit()
    db.refresh(db_ping)
    return db_ping
```

**4. tests/test_pings.py**
```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_create_ping():
    response = client.post("/pings/", json={"message": "hello"})
    assert response.status_code == 200
    assert response.json()["message"] == "hello"
```

## 5. Verification
After generating these files, you MUST ensure that `main.py` actually includes the router via `app.include_router(ping_router.router)`.
