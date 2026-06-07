from groq import Groq
from dotenv import load_dotenv
import os
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_workout_plan(goal, days_per_week, workout_type, fitness_level):

    prompt = f"""
You are an expert fitness coach. Create a detailed weekly workout plan.

User details:
- Goal: {goal}
- Days per week: {days_per_week}
- Workout type: {workout_type}
- Fitness level: {fitness_level}

Create exactly {days_per_week} workout days and {7 - days_per_week} rest days.

Respond in EXACTLY this format for each day:

DAY1_NAME: [e.g. Chest & Triceps or Rest Day]
DAY1_TYPE: [Gym/Home/Rest]
DAY1_DURATION: [e.g. 45 mins]
DAY1_EXERCISES: [Exercise 1 - sets x reps, Exercise 2 - sets x reps, Exercise 3 - sets x reps, Exercise 4 - sets x reps]
DAY1_FOCUS: [e.g. Upper Body Strength]

DAY2_NAME: [name]
DAY2_TYPE: [Gym/Home/Rest]
DAY2_DURATION: [duration]
DAY2_EXERCISES: [exercises or Rest and recover]
DAY2_FOCUS: [focus area]

...continue for all 7 days...

DAY7_NAME: [name]
DAY7_TYPE: [Gym/Home/Rest]
DAY7_DURATION: [duration]
DAY7_EXERCISES: [exercises or Rest and recover]
DAY7_FOCUS: [focus area]
"""

    chat_completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1500,
        temperature=0.4
    )

    response_text = chat_completion.choices[0].message.content
    print("Workout Agent:", response_text)

    days = []
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    for i in range(1, 8):
        day = {"day": day_names[i-1]}
        for line in response_text.strip().split('\n'):
            line = line.strip()
            if line.startswith(f"DAY{i}_NAME:"):
                day['name'] = line.replace(f"DAY{i}_NAME:", "").strip()
            elif line.startswith(f"DAY{i}_TYPE:"):
                day['type'] = line.replace(f"DAY{i}_TYPE:", "").strip()
            elif line.startswith(f"DAY{i}_DURATION:"):
                day['duration'] = line.replace(f"DAY{i}_DURATION:", "").strip()
            elif line.startswith(f"DAY{i}_EXERCISES:"):
                day['exercises'] = line.replace(f"DAY{i}_EXERCISES:", "").strip()
            elif line.startswith(f"DAY{i}_FOCUS:"):
                day['focus'] = line.replace(f"DAY{i}_FOCUS:", "").strip()
        days.append(day)

    return {"days": days, "goal": goal, "days_per_week": days_per_week}