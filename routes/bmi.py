from fastapi import APIRouter
from schemas import BMIInput

router = APIRouter()

@router.post("/bmi")
def calculate_bmi(data: BMIInput):
    height_m = data.height / 100
    bmi = round(data.weight / (height_m ** 2), 2)

    if bmi < 18.5:
        category = "Underweight"
    elif bmi < 25:
        category = "Normal weight"
    elif bmi < 30:
        category = "Overweight"
    else:
        category = "Obese"

    return {
        "age": data.age,
        "bmi": bmi,
        "category": category
    }