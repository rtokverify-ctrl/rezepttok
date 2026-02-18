from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
import re

from database import get_db
from models import User
from schemas import UserCreate, Token, UserVerify
from auth import get_password_hash, verify_password, create_access_token
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()

from fastapi import BackgroundTasks

@router.post("/register")
def register(user: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if user.age < 16: raise HTTPException(status_code=400, detail="Du musst mindestens 16 Jahre alt sein!")
    email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    if not re.match(email_regex, user.email): raise HTTPException(status_code=400, detail="Keine gültige Email-Adresse!")
    if db.query(User).filter(User.username == user.username).first(): raise HTTPException(status_code=400, detail="Username vergeben")
    if db.query(User).filter(User.email == user.email).first(): raise HTTPException(status_code=400, detail="Email schon registriert")
    hashed_pw = get_password_hash(user.password)
    
    # Generate 2FA Code
    import random
    verification_code = str(random.randint(100000, 999999))
    
    new_user = User(
        username=user.username, 
        email=user.email, 
        age=user.age, 
        hashed_password=hashed_pw, 
        display_name=user.username,
        verification_code=verification_code,
        is_verified=False
    )
    db.add(new_user)
    db.commit()
    
    from services.mail_manager import mail_manager
    background_tasks.add_task(mail_manager.send_verification_code, user.email, verification_code)
    
    print(f"DEBUG: Queuing verification email for {user.email}")
    
    # Do NOT return access token immediately
    return {"msg": "Verification code sent", "email": user.email}

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
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(or_(User.username == form_data.username, User.email == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Falscher Username oder Passwort")
    
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Account nicht verifiziert. Bitte bestätige deine Email.")
        
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
