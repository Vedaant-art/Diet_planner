from typing import Optional

from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class BMIInput(BaseModel):
    age: int
    weight: float  # kg
    height: float  # cm

class GoalInput(BaseModel):
    age: int
    weight: float
    height: float
    target_bmi: float
    timeline_weeks: int

class DietInput(BaseModel):
    daily_calories: int
    goal: str
    timeline_weeks: int
    budget: Optional[float] = None
    want_supplements: bool = False

class SavePlanInput(BaseModel):
    # BMI
    age: int
    weight: float
    height: float
    bmi: float
    bmi_category: str

    # Goal
    target_bmi: float
    target_weight: float
    weight_change: float
    timeline_weeks: int
    daily_calories: str
    deficit_surplus: str
    realistic: str
    advice: str

    # Diet
    goal: str
    meals: dict
    supplements: list
    total_calories: str
    budget: Optional[float] = None

class WeightLogInput(BaseModel):
    weight: float
    mood: Optional[str] = None      # "great", "good", "okay", "bad"
    notes: Optional[str] = None

class WorkoutInput(BaseModel):
    goal: str
    days_per_week: int
    workout_type: str  # "gym", "home", "both"
    fitness_level: str  # "beginner", "intermediate", "advanced"

class AssistantInput(BaseModel):
    messages: list
    system: str