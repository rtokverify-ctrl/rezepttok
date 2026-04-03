from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
import re

from database import get_db
from models import User
from schemas import UserCreate, Token, UserVerify
from auth import get_password_hash, verify_password, create_access_token
from fastapi.security import OAuth2PasswordRequestForm
from limiter import limiter

router = APIRouter()

from fastapi import BackgroundTasks

@router.post("/register")
@limiter.limit("5/minute")
def register(request: Request, user: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if user.age < 16: raise HTTPException(status_code=400, detail="Du musst mindestens 16 Jahre alt sein!")
    email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    if not re.match(email_regex, user.email): raise HTTPException(status_code=400, detail="Keine gültige Email-Adresse!")
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Username vergeben"
        )
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email schon registriert"
        )
    hashed_pw = get_password_hash(user.password)
    
    new_user = User(
        username=user.username, 
        email=user.email, 
        age=user.age, 
        hashed_password=hashed_pw, 
        display_name=user.username,
        verification_code=None,
        is_verified=True  # Auto-verify (Email-Verifizierung deaktiviert)
    )
    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username oder Email bereits vergeben"
        )
    
    # Auto-verify: direkt Token zurückgeben
    access_token = create_access_token(data={"sub": user.username})
    return {"msg": "Registration successful!", "email": user.email, "access_token": access_token, "token_type": "bearer"}

@router.post("/verify", response_model=Token)
def verify_email(data: UserVerify, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    
    if user.is_verified:
        # If already verified, just login
        access_token = create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer"}

    if user.verification_code != data.code:
        raise HTTPException(status_code=400, detail="Falscher Code")
    
    user.is_verified = True
    user.verification_code = None
    db.commit()
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/resend-code")
def resend_code(data: UserVerify, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # We use UserVerify just for email, code is ignored here
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
        
    if user.is_verified:
        return {"msg": "Bereits verifiziert"}
        
    import random
    verification_code = str(random.randint(100000, 999999))
    user.verification_code = verification_code
    db.commit()
    
    from services.mail_manager import mail_manager
    background_tasks.add_task(mail_manager.send_verification_code, user.email, verification_code)
    
    print(f"DEBUG: Resending verification code {verification_code} to {user.email}")
    return {"msg": "Code erneut gesendet"}

@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(or_(User.username == form_data.username, User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Falscher Username oder Passwort")
    
    if not user.is_verified:
        # Legacy accounts that were not verified are auto-verified upon successful login
        user.is_verified = True
        db.commit()
        
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
