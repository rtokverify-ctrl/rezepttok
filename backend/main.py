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

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins_env == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",")]

app.add_middleware(
    CORSMiddleware, 
    allow_origins=allowed_origins, 
    allow_methods=["*"], 
    allow_headers=["*"],
    allow_credentials=False if "*" in allowed_origins else True
)

@app.get("/")
def read_root():
    return {"status": "Online"}

@app.head("/")
def head_root():
    return {"status": "Online"}

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
