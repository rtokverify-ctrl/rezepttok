from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
import os

from database import engine, Base
import models 
from limiter import limiter
from routers import auth_router, users_router, recipes_router, video_router, search_router, notifications_router, shopping_router, debug_router, chat_router, health_router, collaboration_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

if not os.path.exists("static"): os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:8080,http://localhost:3000,http://127.0.0.1:8080").split(",")

app.add_middleware(
    CORSMiddleware, 
    allow_origins=allowed_origins, 
    allow_methods=["*"], 
    allow_headers=["*"]
)

@app.get("/")
def read_root(): return {"status": "Online"}

@app.head("/")
def head_root(): return {"status": "Online"}

app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(recipes_router.router)
app.include_router(video_router.router)
app.include_router(search_router.router)
app.include_router(notifications_router.router)
app.include_router(shopping_router.router)
app.include_router(debug_router.router, tags=["Debug"])
app.include_router(chat_router.router)
app.include_router(health_router.router)
app.include_router(collaboration_router.router)
