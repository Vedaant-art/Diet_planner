from groq import Groq
from dotenv import load_dotenv
import os
load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
def calculate_calories_with_ai(age, weight, height, current_bmi, target_bmi, timeline_weeks):
    
    height_m = height / 100
    target_weight = target_bmi * (height_m ** 2)
    weight_diff = target_weight - weight

    prompt = f"""
You are a professional nutritionist. A user wants to reach their target BMI.

User details:
- Age: {age} years
- Current weight: {weight} kg
- Height: {height} cm
- Current BMI: {current_bmi}
- Target BMI: {target_bmi}
- Target weight: {round(target_weight, 1)} kg
- Weight to {'gain' if weight_diff > 0 else 'lose'}: {abs(round(weight_diff, 1))} kg
- Timeline: {timeline_weeks} weeks

Reply in EXACTLY this format, nothing else:
DAILY_CALORIES: [just the number]
DEFICIT_SURPLUS: [just the number] ([deficit or surplus])
REALISTIC: [Yes or No]
ADVICE: [one sentence]
"""

    chat_completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200,
        temperature=0.3
    )

    response_text = chat_completion.choices[0].message.content
    print("GROQ RESPONSE:", response_text)  # for debugging

    result = {
        "daily_calories": None,
        "deficit_surplus": None,
        "realistic": None,
        "advice": None,
        "target_weight": round(target_weight, 1),
        "weight_change": round(weight_diff, 1)
    }

    for line in response_text.strip().split('\n'):
        line = line.strip()
        if line.startswith('DAILY_CALORIES:'):
            result['daily_calories'] = line.replace('DAILY_CALORIES:', '').strip()
        elif line.startswith('DEFICIT_SURPLUS:'):
            result['deficit_surplus'] = line.replace('DEFICIT_SURPLUS:', '').strip()
        elif line.startswith('REALISTIC:'):
            result['realistic'] = line.replace('REALISTIC:', '').strip()
        elif line.startswith('ADVICE:'):
            result['advice'] = line.replace('ADVICE:', '').strip()

    return result