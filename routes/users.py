from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth

router = APIRouter()

@router.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=auth.hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "Registered successfully!"}

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not db_user or not auth.verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = auth.create_access_token(data={"sub": db_user.email})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return {
        "name": current_user.name,
        "email": current_user.email,
        "avatar": current_user.avatar or "👤"
    }

@router.put("/me")
def update_profile(
    data: schemas.UpdateProfileInput,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if data.name:
        current_user.name = data.name
    if data.avatar:
        current_user.avatar = data.avatar
    db.commit()
    return {"message": "Profile updated!"}

@router.put("/change-password")
def change_password(
    data: schemas.ChangePasswordInput,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not auth.verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = auth.hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully!"}

@router.delete("/delete-account")
def delete_account(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Delete all related data
    db.query(models.UserPlan).filter(models.UserPlan.user_id == current_user.id).delete()
    db.query(models.WeightLog).filter(models.WeightLog.user_id == current_user.id).delete()
    db.query(models.ChatHistory).filter(models.ChatHistory.user_id == current_user.id).delete()
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted"}