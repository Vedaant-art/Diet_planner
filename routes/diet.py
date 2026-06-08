from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, schemas, auth
from agents.calorie_agent import calculate_calories_with_ai
from agents.diet_agent import generate_diet_plan
from agents.progress_agent import analyze_progress
from datetime import date as date_today
from agents.workout_agent import generate_workout_plan
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

@router.post("/log-weight")
def log_weight(
    data: schemas.WeightLogInput,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Check if already logged today
    existing = db.query(models.WeightLog).filter(
        models.WeightLog.user_id == current_user.id,
        models.WeightLog.date == date_today.today()
    ).first()

    if existing:
        existing.weight = data.weight
        existing.mood = data.mood
        existing.notes=data.notes
        db.commit()
        db.refresh(existing)
        log = existing
    else:
        log = models.WeightLog(
    user_id=current_user.id,
    weight=data.weight,
    mood=data.mood,
    notes=data.notes,
    date=date_today.today()
        )
        db.add(log)
        db.commit()
        db.refresh(log)

    # Get all logs for AI analysis
    all_logs = db.query(models.WeightLog).filter(
        models.WeightLog.user_id == current_user.id
    ).order_by(models.WeightLog.date).all()

    # Get user plan for context
    plan = db.query(models.UserPlan).filter(
        models.UserPlan.user_id == current_user.id
    ).first()

    if plan and len(all_logs) > 0:
        logs_list = [{"weight": l.weight, "date": str(l.date), "mood": l.mood, "notes": l.notes} for l in all_logs]
        start_weight = all_logs[0].weight
        weeks_elapsed = max(1, len(all_logs) // 7)

        feedback = analyze_progress(
            current_weight=data.weight,
            target_weight=plan.target_weight,
            start_weight=start_weight,
            weeks_elapsed=weeks_elapsed,
            total_weeks=plan.timeline_weeks,
            logs=logs_list
        )

        log.ai_feedback = feedback.get("feedback", "")
        db.commit()

        return {
            "message": "Weight logged!",
            "weight": data.weight,
            "date": str(date_today.today()),
            "ai_analysis": feedback
        }

    return {"message": "Weight logged!", "weight": data.weight}


@router.get("/progress")
def get_progress(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    logs = db.query(models.WeightLog).filter(
        models.WeightLog.user_id == current_user.id
    ).order_by(models.WeightLog.date).all()

    plan = db.query(models.UserPlan).filter(
        models.UserPlan.user_id == current_user.id
    ).first()

    if not logs:
        return {"has_logs": False}

    logs_list = [{"weight": l.weight, "date": str(l.date), "feedback": l.ai_feedback} for l in logs]

    return {
        "has_logs": True,
        "logs": logs_list,
        "start_weight": logs[0].weight,
        "current_weight": logs[-1].weight,
        "target_weight": plan.target_weight if plan else None,
        "total_logs": len(logs)
    }

@router.post("/workout-plan")
def get_workout_plan(
    data: schemas.WorkoutInput,
    current_user: models.User = Depends(auth.get_current_user)
):
    result = generate_workout_plan(
        goal=data.goal,
        days_per_week=data.days_per_week,
        workout_type=data.workout_type,
        fitness_level=data.fitness_level
    )
    return result