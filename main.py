from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from routes import users, bmi

Base.metadata.create_all(bind=engine)

app = FastAPI(title="BMI Calculator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, tags=["Auth"])
app.include_router(bmi.router, tags=["BMI"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Diet Planner API! Use /register to create an account and /bmi to calculate your BMI."}