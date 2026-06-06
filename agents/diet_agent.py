from groq import Groq
from dotenv import load_dotenv
import os
load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_diet_plan(daily_calories, goal, timeline_weeks, budget=None, want_supplements=False):

    supplement_prompt = ""
    if want_supplements and budget:
        supplement_prompt = f"""
Also recommend Indian market supplements with:
- Budget: ₹{budget}/month
- Include brand names available in India (MuscleBlaze, Optimum Nutrition, Fast&Up, HK Vitals etc.)
- Include: protein powder, creatine, vitamins if budget allows
- Show cost of each supplement
- Format:
SUPPLEMENT: [name] | BRAND: [brand] | COST: ₹[amount]/month | DOSE: [dosage]
"""

    prompt = f"""
You are a professional Indian nutritionist and fitness expert.

User details:
- Daily calorie target: {daily_calories} kcal
- Goal: {goal}
- Timeline: {timeline_weeks} weeks
{supplement_prompt}

Create a detailed Indian diet chart for ONE full day.
Use only Indian foods (roti, dal, rice, curd, sabzi, paneer, eggs, chicken, fruits, vegetables etc.)

Format EXACTLY like this:

BREAKFAST: [meal name]
BREAKFAST_INGREDIENTS: [ingredient 1 - quantity], [ingredient 2 - quantity]
BREAKFAST_CALORIES: [number]

MORNING_SNACK: [meal name]
MORNING_SNACK_INGREDIENTS: [ingredient 1 - quantity], [ingredient 2 - quantity]
MORNING_SNACK_CALORIES: [number]

LUNCH: [meal name]
LUNCH_INGREDIENTS: [ingredient 1 - quantity], [ingredient 2 - quantity]
LUNCH_CALORIES: [number]

EVENING_SNACK: [meal name]
EVENING_SNACK_INGREDIENTS: [ingredient 1 - quantity], [ingredient 2 - quantity]
EVENING_SNACK_CALORIES: [number]

DINNER: [meal name]
DINNER_INGREDIENTS: [ingredient 1 - quantity], [ingredient 2 - quantity]
DINNER_CALORIES: [number]

TOTAL_CALORIES: [number]

{supplement_prompt}
"""

    chat_completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
        temperature=0.3
    )

    response_text = chat_completion.choices[0].message.content
    print("Diet Agent Response:", response_text)

    # Parse meals
    meals = {}
    supplements = []
    meal_keys = ["BREAKFAST", "MORNING_SNACK", "LUNCH", "EVENING_SNACK", "DINNER"]

    for key in meal_keys:
        meal = {}
        for line in response_text.split('\n'):
            line = line.strip()
            if line.startswith(f"{key}:"):
                meal['name'] = line.replace(f"{key}:", "").strip()
            elif line.startswith(f"{key}_INGREDIENTS:"):
                meal['ingredients'] = line.replace(f"{key}_INGREDIENTS:", "").strip()
            elif line.startswith(f"{key}_CALORIES:"):
                meal['calories'] = line.replace(f"{key}_CALORIES:", "").strip()
        if meal:
            meals[key.lower()] = meal

    # Parse supplements
    for line in response_text.split('\n'):
        line = line.strip()
        if line.startswith("SUPPLEMENT:"):
            parts = line.split('|')
            supp = {}
            for part in parts:
                part = part.strip()
                if part.startswith("SUPPLEMENT:"):
                    supp['name'] = part.replace("SUPPLEMENT:", "").strip()
                elif part.startswith("BRAND:"):
                    supp['brand'] = part.replace("BRAND:", "").strip()
                elif part.startswith("COST:"):
                    supp['cost'] = part.replace("COST:", "").strip()
                elif part.startswith("DOSE:"):
                    supp['dose'] = part.replace("DOSE:", "").strip()
            if supp:
                supplements.append(supp)

    # Parse total calories
    total_calories = None
    for line in response_text.split('\n'):
        if line.strip().startswith("TOTAL_CALORIES:"):
            total_calories = line.strip().replace("TOTAL_CALORIES:", "").strip()

    return {
        "meals": meals,
        "supplements": supplements if want_supplements else [],
        "total_calories": total_calories,
        "goal": goal,
        "timeline_weeks": timeline_weeks
    }