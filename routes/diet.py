from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth
from agents.calorie_agent import calculate_calories_with_ai
from agents.diet_agent import generate_diet_plan

router = APIRouter()

@router.post("/goal")
def calculate_goal(
    data: schemas.GoalInput,
    current_user: models.User = Depends(auth.get_current_user)
):
    height_m = data.height / 100
    current_bmi = round(data.weight / (height_m ** 2), 2)
    result = calculate_calories_with_ai(
        age=data.age,
        weight=data.weight,
        height=data.height,
        current_bmi=current_bmi,
        target_bmi=data.target_bmi,
        timeline_weeks=data.timeline_weeks
    )
    return {"current_bmi": current_bmi, "target_bmi": data.target_bmi, **result}

@router.post("/diet-plan")
def get_diet_plan(
    data: schemas.DietInput,
    current_user: models.User = Depends(auth.get_current_user)
):
    result = generate_diet_plan(
        daily_calories=data.daily_calories,
        goal=data.goal,
        timeline_weeks=data.timeline_weeks,
        budget=data.budget,
        want_supplements=data.want_supplements
    )
    return result

@router.post("/save-plan")
def save_plan(
    data: schemas.SavePlanInput,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Delete old plan if exists
    db.query(models.UserPlan).filter(
        models.UserPlan.user_id == current_user.id
    ).delete()

    plan = models.UserPlan(
        user_id=current_user.id,
        **data.dict()
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return {"message": "Plan saved successfully!"}

@router.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    plan = db.query(models.UserPlan).filter(
        models.UserPlan.user_id == current_user.id
    ).first()

    if not plan:
        return {"has_plan": False}

    return {
        "has_plan": True,
        "user_name": current_user.name,
        "user_email": current_user.email,
        "date_created": str(plan.date_created),
        "bmi": plan.bmi,
        "bmi_category": plan.bmi_category,
        "age": plan.age,
        "weight": plan.weight,
        "height": plan.height,
        "target_bmi": plan.target_bmi,
        "target_weight": plan.target_weight,
        "weight_change": plan.weight_change,
        "timeline_weeks": plan.timeline_weeks,
        "daily_calories": plan.daily_calories,
        "deficit_surplus": plan.deficit_surplus,
        "realistic": plan.realistic,
        "advice": plan.advice,
        "goal": plan.goal,
        "meals": plan.meals,
        "supplements": plan.supplements,
        "total_calories": plan.total_calories,
        "budget": plan.budget,
    }