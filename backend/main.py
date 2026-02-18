from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

from database import engine, Base
import models 
from routers import auth_router, users_router, recipes_router, video_router, search_router, notifications_router, shopping_router

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

if not os.path.exists("static"): os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"]
)

@app.get("/")
def read_root(): return {"status": "Online"}

app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(recipes_router.router)
app.include_router(video_router.router)
app.include_router(search_router.router)
app.include_router(notifications_router.router)
app.include_router(shopping_router.router)
