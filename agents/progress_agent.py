from groq import Groq
from dotenv import load_dotenv
import os
load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def analyze_progress(current_weight, target_weight, start_weight, weeks_elapsed, total_weeks, logs):
    weight_diff = current_weight - start_weight
    target_diff = target_weight - start_weight
    progress_pct = round((weight_diff / target_diff) * 100, 1) if target_diff != 0 else 0

    logs_text = "\n".join([f"Day {i+1}: {l['weight']} kg" for i, l in enumerate(logs[-7:])])

    prompt = f"""
You are a fitness coach analyzing a user's weight progress.

Details:
- Start weight: {start_weight} kg
- Current weight: {current_weight} kg
- Target weight: {target_weight} kg
- Weeks elapsed: {weeks_elapsed}
- Total timeline: {total_weeks} weeks
- Progress: {progress_pct}%
- Recent logs (last 7 days):
{logs_text}

Give a short motivational analysis. Respond in EXACTLY this format:
STATUS: [On Track / Ahead / Behind / Just Started]
FEEDBACK: [2-3 sentence motivational feedback]
TIP: [one actionable tip for this week]
"""

    chat_completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200,
        temperature=0.5
    )

    response_text = chat_completion.choices[0].message.content
    print("Progress Agent:", response_text)

    result = {"status": None, "feedback": None, "tip": None}
    for line in response_text.strip().split('\n'):
        line = line.strip()
        if line.startswith("STATUS:"):
            result["status"] = line.replace("STATUS:", "").strip()
        elif line.startswith("FEEDBACK:"):
            result["feedback"] = line.replace("FEEDBACK:", "").strip()
        elif line.startswith("TIP:"):
            result["tip"] = line.replace("TIP:", "").strip()

    return result