from sqlalchemy import Column, Integer, String, Float, JSON, Date
from datetime import date
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class UserPlan(Base):
    __tablename__ = "user_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    date_created = Column(Date, default=date.today)

    # BMI Data
    age = Column(Integer)
    weight = Column(Float)
    height = Column(Float)
    bmi = Column(Float)
    bmi_category = Column(String)

    # Goal Data
    target_bmi = Column(Float)
    target_weight = Column(Float)
    weight_change = Column(Float)
    timeline_weeks = Column(Integer)
    daily_calories = Column(String)
    deficit_surplus = Column(String)
    realistic = Column(String)
    advice = Column(String)

    # Diet Plan
    goal = Column(String)
    meals = Column(JSON)
    supplements = Column(JSON)
    total_calories = Column(String)
    budget = Column(Float, nullable=True)

class WeightLog(Base):
    __tablename__ = "weight_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    weight = Column(Float)
    mood = Column(String, nullable=True)      # "great", "good", "okay", "bad"
    notes = Column(String, nullable=True)
    date = Column(Date, default=date.today)
    ai_feedback = Column(String, nullable=True)

class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    role = Column(String)       # "user" or "assistant"
    content = Column(String)
    timestamp = Column(Date, default=date.today)   

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    avatar = Column(String, nullable=True)  # emoji or color code