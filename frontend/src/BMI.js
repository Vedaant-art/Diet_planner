import { useState } from "react";

const API = "http://127.0.0.1:8000";

const getCategoryColor = (category) => {
  const colors = {
    "Severely Underweight": "#0019fc",
    "Underweight": "#004ba8",
    "Healthy": "#00ff5e",
    "Overweight": "#ffcc00",
    "Obese": "#948a00",
    "Severely Obese": "#ff0000",
  };
  return colors[category] || "#fff";
};

const getCategoryEmoji = (category) => {
  const emojis = {
    "Severely Underweight": "🔵",
    "Underweight": "💙",
    "Healthy": "✅",
    "Overweight": "⚠️",
    "Obese": "🔶",
    "Severely Obese": "🔴",
  };
  return emojis[category] || "📊";
};

function BMI({ token, onLogout, onDashboard }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ age: "", weight: "", height: "" });
  const [bmiResult, setBmiResult] = useState(null);
  const [goalForm, setGoalForm] = useState({ target_bmi: "", timeline_weeks: "" });
  const [goalResult, setGoalResult] = useState(null);
  const [dietForm, setDietForm] = useState({ goal: "muscle_gain", budget: "", want_supplements: false });
  const [dietResult, setDietResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCalculateBMI = async () => {
    if (!form.age || !form.weight || !form.height) {
      setError("Please fill all fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/bmi`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          age: parseInt(form.age),
          weight: parseFloat(form.weight),
          height: parseFloat(form.height),
        }),
      });
      const data = await res.json();
      if (res.ok) { setBmiResult(data); setStep(2); }
      else setError("❌ " + data.detail);
    } catch { setError("❌ Server error"); }
    setLoading(false);
  };

  const handleCalculateGoal = async () => {
    if (!goalForm.target_bmi || !goalForm.timeline_weeks) {
      setError("Please fill all fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/goal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          age: parseInt(form.age),
          weight: parseFloat(form.weight),
          height: parseFloat(form.height),
          target_bmi: parseFloat(goalForm.target_bmi),
          timeline_weeks: parseInt(goalForm.timeline_weeks),
        }),
      });
      const data = await res.json();
      if (res.ok) { setGoalResult(data); setStep(3); }
      else setError("❌ " + data.detail);
    } catch { setError("❌ Server error"); }
    setLoading(false);
  };

  const handleGetDietPlan = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/diet-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          daily_calories: parseInt(goalResult.daily_calories),
          goal: dietForm.goal,
          timeline_weeks: parseInt(goalForm.timeline_weeks),
          budget: dietForm.want_supplements ? parseFloat(dietForm.budget) : null,
          want_supplements: dietForm.want_supplements,
        }),
      });
      const data = await res.json();
      if (res.ok) {
  setDietResult(data);
  setStep(4);

  // Auto save plan to DB
  await fetch(`${API}/save-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      age: parseInt(form.age),
      weight: parseFloat(form.weight),
      height: parseFloat(form.height),
      bmi: bmiResult.bmi,
      bmi_category: bmiResult.category,
      target_bmi: parseFloat(goalForm.target_bmi),
      target_weight: goalResult.target_weight,
      weight_change: goalResult.weight_change,
      timeline_weeks: parseInt(goalForm.timeline_weeks),
      daily_calories: goalResult.daily_calories,
      deficit_surplus: goalResult.deficit_surplus,
      realistic: goalResult.realistic,
      advice: goalResult.advice,
      goal: dietForm.goal,
      meals: data.meals,
      supplements: data.supplements,
      total_calories: data.total_calories,
      budget: dietForm.want_supplements ? parseFloat(dietForm.budget) : null,
    }),
  });
}
      else setError("❌ " + data.detail);
    } catch { setError("❌ Server error"); }
    setLoading(false);
  };
  
  const mealLabels = {
    breakfast: "🌅 Breakfast",
    morning_snack: "🍎 Morning Snack",
    lunch: "🍱 Lunch",
    evening_snack: "☕ Evening Snack",
    dinner: "🌙 Dinner",
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>🧬 Diet Planner</h1>
            <p style={s.subtitle}>AI-powered personalized nutrition</p>
          </div>
          <button style={s.logout} onClick={onLogout}>Logout</button>
        </div>

        {/* Step Indicator */}
        <div style={s.steps}>
          {["BMI", "Goal", "Diet", "Plan"].map((label, i) => (
            <div key={i} style={s.stepItem}>
              <div style={{
                ...s.stepDot,
                background: step > i + 1 ? "#4ade80" : step === i + 1 ? "#4ade80" : "#333",
                color: step >= i + 1 ? "#000" : "#666",
              }}>{step > i + 1 ? "✓" : i + 1}</div>
              <p style={{ ...s.stepLabel, color: step >= i + 1 ? "#4ade80" : "#555" }}>{label}</p>
            </div>
          ))}
        </div>

        {error && <p style={s.error}>{error}</p>}

        {/* STEP 1 — BMI */}
        {step === 1 && (
          <div style={s.section}>
            <h2 style={s.sectionTitle}>📏 Your Body Stats</h2>
            <p style={s.hint}>Enter your details to calculate your BMI</p>
            <div style={s.form}>
              <div style={s.inputGroup}>
                <label style={s.label}>Age</label>
                <input style={s.input} type="number" placeholder="e.g. 22"
                  value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
              </div>
              <div style={s.row}>
                <div style={s.inputGroup}>
                  <label style={s.label}>Weight (kg)</label>
                  <input style={s.input} type="number" placeholder="e.g. 65"
                    value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
                </div>
                <div style={s.inputGroup}>
                  <label style={s.label}>Height (cm)</label>
                  <input style={s.input} type="number" placeholder="e.g. 170"
                    value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} />
                </div>
              </div>
              <button style={s.btn} onClick={handleCalculateBMI} disabled={loading}>
                {loading ? "Calculating..." : "Calculate BMI →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Goal */}
        {step === 2 && bmiResult && (
          <div style={s.section}>
            {/* BMI Result */}
            <div style={s.bmiCard}>
              <p style={s.bmiNum}>{bmiResult.bmi}</p>
              <p style={{ ...s.bmiCat, color: getCategoryColor(bmiResult.category) }}>
                {getCategoryEmoji(bmiResult.category)} {bmiResult.category}
              </p>
              <div style={s.bmiMeta}>
                <span style={s.chip}>Age: {bmiResult.age} yrs</span>
                <span style={s.chip}>Weight: {form.weight} kg</span>
                <span style={s.chip}>Height: {form.height} cm</span>
              </div>
            </div>

            <h2 style={{ ...s.sectionTitle, marginTop: "24px" }}>🎯 Set Your Goal</h2>
            <p style={s.hint}>What BMI do you want to achieve and in how long?</p>
            <div style={s.form}>
              <div style={s.row}>
                <div style={s.inputGroup}>
                  <label style={s.label}>Target BMI</label>
                  <input style={s.input} type="number" placeholder="e.g. 22"
                    value={goalForm.target_bmi}
                    onChange={e => setGoalForm({ ...goalForm, target_bmi: e.target.value })} />
                </div>
                <div style={s.inputGroup}>
                  <label style={s.label}>Timeline (weeks)</label>
                  <input style={s.input} type="number" placeholder="e.g. 12"
                    value={goalForm.timeline_weeks}
                    onChange={e => setGoalForm({ ...goalForm, timeline_weeks: e.target.value })} />
                </div>
              </div>
              <div style={s.btnRow}>
                <button style={s.btnOutline} onClick={() => setStep(1)}>← Back</button>
                <button style={s.btn} onClick={handleCalculateGoal} disabled={loading}>
                  {loading ? "AI Calculating..." : "Get Calorie Plan →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — Diet Preferences */}
        {step === 3 && goalResult && (
          <div style={s.section}>
            {/* Goal Result */}
            <div style={s.statsRow}>
              <div style={s.statBox}>
                <p style={s.statVal}>{goalResult.daily_calories}</p>
                <p style={s.statLbl}>Daily Calories</p>
              </div>
              <div style={s.statBox}>
                <p style={s.statVal}>{goalResult.target_weight} kg</p>
                <p style={s.statLbl}>Target Weight</p>
              </div>
              <div style={s.statBox}>
                <p style={{ ...s.statVal, color: goalResult.weight_change > 0 ? "#4ade80" : "#f87171" }}>
                  {goalResult.weight_change > 0 ? "+" : ""}{goalResult.weight_change} kg
                </p>
                <p style={s.statLbl}>Weight Change</p>
              </div>
            </div>

            {goalResult.realistic === "Yes"
              ? <p style={s.pill}>✅ Realistic Goal • {goalResult.deficit_surplus}</p>
              : <p style={{ ...s.pill, background: "#7f1d1d" }}>⚠️ Challenging Goal • {goalResult.deficit_surplus}</p>
            }

            {goalResult.advice && (
              <div style={s.adviceBox}>
                <p style={s.adviceText}>💡 {goalResult.advice}</p>
              </div>
            )}

            <h2 style={{ ...s.sectionTitle, marginTop: "24px" }}>🍽️ Diet Preferences</h2>
            <div style={s.form}>
              <div style={s.inputGroup}>
                <label style={s.label}>Your Goal</label>
                <select style={s.input} value={dietForm.goal}
                  onChange={e => setDietForm({ ...dietForm, goal: e.target.value })}>
                  <option value="muscle_gain">💪 Muscle Gain</option>
                  <option value="weight_loss">🔥 Weight Loss</option>
                  <option value="maintenance">⚖️ Maintenance</option>
                </select>
              </div>

              {/* Supplements Toggle */}
              <div style={s.toggleRow}>
                <div>
                  <p style={s.label}>Want Supplements?</p>
                  <p style={s.hint}>Protein powder, creatine etc. with Indian brands</p>
                </div>
                <div
                  style={{ ...s.toggle, background: dietForm.want_supplements ? "#4ade80" : "#333" }}
                  onClick={() => setDietForm({ ...dietForm, want_supplements: !dietForm.want_supplements })}
                >
                  <div style={{
                    ...s.toggleDot,
                    transform: dietForm.want_supplements ? "translateX(24px)" : "translateX(2px)"
                  }} />
                </div>
              </div>

              {dietForm.want_supplements && (
                <div style={s.inputGroup}>
                  <label style={s.label}>Monthly Budget (₹)</label>
                  <input style={s.input} type="number" placeholder="e.g. 2000"
                    value={dietForm.budget}
                    onChange={e => setDietForm({ ...dietForm, budget: e.target.value })} />
                </div>
              )}

              <div style={s.btnRow}>
                <button style={s.btnOutline} onClick={() => setStep(2)}>← Back</button>
                <button style={s.btn} onClick={handleGetDietPlan} disabled={loading}>
                  {loading ? "AI generating plan..." : "Generate Diet Plan →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — Diet Plan */}
        {step === 4 && dietResult && (
          <div style={s.section}>
            <h2 style={s.sectionTitle}>🥗 Your Indian Diet Plan</h2>
            <p style={s.hint}>Personalized for {goalResult.daily_calories} kcal/day • {goalForm.timeline_weeks} weeks</p>

            <div style={s.mealList}>
              {Object.entries(dietResult.meals).map(([key, meal]) => (
                <div key={key} style={s.mealCard}>
                  <div style={s.mealHeader}>
                    <p style={s.mealTitle}>{mealLabels[key] || key}</p>
                    <span style={s.calBadge}>{meal.calories} kcal</span>
                  </div>
                  <p style={s.mealName}>{meal.name}</p>
                  <p style={s.ingredients}>🥄 {meal.ingredients}</p>
                </div>
              ))}
            </div>

            <div style={s.totalBox}>
              <p style={s.totalText}>Total: <b style={{ color: "#4ade80" }}>{dietResult.total_calories} kcal</b></p>
            </div>

            {/* Supplements */}
            {dietResult.supplements && dietResult.supplements.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <h2 style={s.sectionTitle}>💊 Recommended Supplements</h2>
                <div style={s.mealList}>
                  {dietResult.supplements.map((supp, i) => (
                    <div key={i} style={s.suppCard}>
                      <div style={s.mealHeader}>
                        <p style={s.mealTitle}>💪 {supp.name}</p>
                        <span style={s.costBadge}>{supp.cost}</span>
                      </div>
                      <p style={s.suppBrand}>🏷️ {supp.brand}</p>
                      <p style={s.ingredients}>📏 Dose: {supp.dose}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button style={{ ...s.btn, marginTop: "24px" }} onClick={() => {
              setStep(1); setBmiResult(null); setGoalResult(null);
              setDietResult(null); setForm({ age: "", weight: "", height: "" });
            }}>
              🔄 Start Over
            </button>
            <button style={{ ...s.btn, flex: 1 }} onClick={onDashboard}>
              📊 View Dashboard
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", backgroundImage: "url('https://w0.peakpx.com/wallpaper/234/89/HD-wallpaper-box-with-fresh-vegetables-fruit-healthy-food-concepts-tomatoes-cucumbers-cabbage-eggplant-onions-carrots-peppers-mushrooms.jpg')", backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "32px 16px" },
  card: { background: "#111", padding: "32px", borderRadius: "20px", width: "100%", maxWidth: "520px", boxShadow: "0 0 40px rgba(0,0,0,0.6)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  title: { fontSize: "24px", color: "#4ade80", fontWeight: "bold" },
  subtitle: { fontSize: "13px", color: "#555", marginTop: "4px" },
  logout: { background: "transparent", border: "1px solid #333", color: "#666", padding: "6px 14px", borderRadius: "8px", fontSize: "13px" },
  steps: { display: "flex", justifyContent: "space-between", marginBottom: "28px", position: "relative" },
  stepItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" },
  stepDot: { width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "bold" },
  stepLabel: { fontSize: "11px" },
  section: {},
  sectionTitle: { fontSize: "18px", color: "#fff", fontWeight: "bold", marginBottom: "6px" },
  hint: { fontSize: "13px", color: "#555", marginBottom: "16px" },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px", flex: 1 },
  label: { fontSize: "13px", color: "#888" },
  input: { padding: "12px", borderRadius: "10px", border: "1px solid #222", background: "#0a0a0a", color: "#fff", fontSize: "15px", width: "100%" },
  row: { display: "flex", gap: "12px" },
  btn: { padding: "13px", borderRadius: "10px", background: "#4ade80", color: "#000", fontWeight: "bold", fontSize: "15px", border: "none", width: "100%" },
  btnOutline: { padding: "13px", borderRadius: "10px", background: "transparent", color: "#4ade80", fontWeight: "bold", fontSize: "15px", border: "1px solid #4ade80", flex: 1 },
  btnRow: { display: "flex", gap: "12px" },
  error: { color: "#f87171", fontSize: "13px", textAlign: "center", marginBottom: "12px" },
  bmiCard: { textAlign: "center", padding: "24px", background: "#0a0a0a", borderRadius: "14px", border: "1px solid #222" },
  bmiNum: { fontSize: "56px", fontWeight: "bold", color: "#fff" },
  bmiCat: { fontSize: "20px", fontWeight: "bold", marginTop: "6px" },
  bmiMeta: { display: "flex", justifyContent: "center", gap: "8px", marginTop: "12px", flexWrap: "wrap" },
  chip: { background: "#1a1a1a", border: "1px solid #333", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", color: "#888" },
  statsRow: { display: "flex", gap: "10px" },
  statBox: { flex: 1, textAlign: "center", background: "#0a0a0a", padding: "14px", borderRadius: "12px", border: "1px solid #222" },
  statVal: { fontSize: "20px", fontWeight: "bold", color: "#fff" },
  statLbl: { fontSize: "11px", color: "#555", marginTop: "4px" },
  pill: { marginTop: "12px", display: "inline-block", background: "#14532d", color: "#4ade80", padding: "6px 14px", borderRadius: "20px", fontSize: "13px" },
  adviceBox: { marginTop: "12px", padding: "12px", background: "#0a0a0a", borderRadius: "10px", border: "1px solid #222" },
  adviceText: { color: "#aaa", fontSize: "13px", lineHeight: "1.6" },
  toggleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "#0a0a0a", borderRadius: "10px", border: "1px solid #222" },
  toggle: { width: "48px", height: "26px", borderRadius: "13px", cursor: "pointer", position: "relative", transition: "background 0.3s" },
  toggleDot: { position: "absolute", top: "3px", width: "20px", height: "20px", background: "#fff", borderRadius: "50%", transition: "transform 0.3s" },
  mealList: { display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" },
  mealCard: { background: "#0a0a0a", padding: "14px", borderRadius: "12px", border: "1px solid #222" },
  mealHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
  mealTitle: { color: "#888", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" },
  calBadge: { background: "#14532d", color: "#4ade80", padding: "2px 10px", borderRadius: "20px", fontSize: "12px" },
  mealName: { color: "#fff", fontSize: "15px", fontWeight: "bold", marginBottom: "6px" },
  ingredients: { color: "#555", fontSize: "13px", lineHeight: "1.5" },
  totalBox: { marginTop: "14px", padding: "12px", background: "#0a0a0a", borderRadius: "10px", border: "1px solid #333", textAlign: "center" },
  totalText: { color: "#888", fontSize: "15px" },
  suppCard: { background: "#0a0a0a", padding: "14px", borderRadius: "12px", border: "1px solid #222" },
  suppBrand: { color: "#aaa", fontSize: "13px", marginBottom: "4px" },
  costBadge: { background: "#1e3a5f", color: "#60a5fa", padding: "2px 10px", borderRadius: "20px", fontSize: "12px" },
};

export default BMI;