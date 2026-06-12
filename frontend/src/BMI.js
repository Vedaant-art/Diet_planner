import { useState } from "react";

const API = "http://127.0.0.1:8000";

const getCategoryColor = (category) => {
  const colors = {
    "Severely Underweight": "#818cf8",
    "Underweight": "#60a5fa",
    "Healthy": "#4ade80",
    "Overweight": "#facc15",
    "Obese": "#fb923c",
    "Severely Obese": "#f87171",
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
    if (!form.age || !form.weight || !form.height) { setError("Please fill all fields"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/bmi`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ age: parseInt(form.age), weight: parseFloat(form.weight), height: parseFloat(form.height) }),
      });
      const data = await res.json();
      if (res.ok) { setBmiResult(data); setStep(2); }
      else setError("❌ " + data.detail);
    } catch { setError("❌ Server error"); }
    setLoading(false);
  };

  const handleCalculateGoal = async () => {
    if (!goalForm.target_bmi || !goalForm.timeline_weeks) { setError("Please fill all fields"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/goal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          age: parseInt(form.age), weight: parseFloat(form.weight), height: parseFloat(form.height),
          target_bmi: parseFloat(goalForm.target_bmi), timeline_weeks: parseInt(goalForm.timeline_weeks),
        }),
      });
      const data = await res.json();
      if (res.ok) { setGoalResult(data); setStep(3); }
      else setError("❌ " + data.detail);
    } catch { setError("❌ Server error"); }
    setLoading(false);
  };

  const handleGetDietPlan = async () => {
    setLoading(true); setError("");
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
        await fetch(`${API}/save-plan`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            age: parseInt(form.age), weight: parseFloat(form.weight), height: parseFloat(form.height),
            bmi: bmiResult.bmi, bmi_category: bmiResult.category,
            target_bmi: parseFloat(goalForm.target_bmi),
            target_weight: goalResult.target_weight, weight_change: goalResult.weight_change,
            timeline_weeks: parseInt(goalForm.timeline_weeks), daily_calories: goalResult.daily_calories,
            deficit_surplus: goalResult.deficit_surplus, realistic: goalResult.realistic, advice: goalResult.advice,
            goal: dietForm.goal, meals: data.meals, supplements: data.supplements,
            total_calories: data.total_calories,
            budget: dietForm.want_supplements ? parseFloat(dietForm.budget) : null,
          }),
        });
      } else setError("❌ " + data.detail);
    } catch { setError("❌ Server error"); }
    setLoading(false);
  };

  const mealLabels = {
    breakfast: "🌅 Breakfast", morning_snack: "🍎 Morning Snack",
    lunch: "🍱 Lunch", evening_snack: "☕ Evening Snack", dinner: "🌙 Dinner",
  };

  return (
    <div style={s.page}>
      <div style={s.card} className="fade-in">

        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>🧬 Diet Planner</h1>
            <p style={s.subtitle}>AI-powered personalized nutrition</p>
          </div>
          <button style={s.logout} className="text-btn" onClick={onLogout}>Logout</button>
        </div>

        {/* Step Indicator */}
        <div style={s.steps}>
          {["BMI", "Goal", "Diet", "Plan"].map((label, i) => (
            <div key={i} style={s.stepItem}>
              <div style={{
                ...s.stepDot,
                background: step > i + 1 ? "#a78bfa" : step === i + 1 ? "#a78bfa" : "#1a1a2e",
                color: step >= i + 1 ? "#fff" : "#444",
                boxShadow: step === i + 1 ? "0 0 16px rgba(167,139,250,0.5)" : "none",
                transition: "all 0.3s ease",
              }}>{step > i + 1 ? "✓" : i + 1}</div>
              <p style={{ ...s.stepLabel, color: step >= i + 1 ? "#a78bfa" : "#444" }}>{label}</p>
            </div>
          ))}
        </div>

        {error && <p style={s.error} className="fade-in">{error}</p>}

        {/* STEP 1 — BMI */}
        {step === 1 && (
          <div style={s.section} className="hover-card fade-in">
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
              <button style={s.btn} className="btn-primary" onClick={handleCalculateBMI} disabled={loading}>
                {loading ? "Calculating..." : "Calculate BMI →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Goal */}
        {step === 2 && bmiResult && (
          <div style={s.section} className="fade-in">
            <div style={s.bmiCard} className="hover-card">
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
                <button style={s.btn} className="btn-primary" onClick={handleCalculateGoal} disabled={loading}>
                  {loading ? "AI Calculating..." : "Get Calorie Plan →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — Diet Preferences */}
        {step === 3 && goalResult && (
          <div style={s.section} className="fade-in">
            <div style={s.statsRow}>
              {[
                { label: "Daily Calories", value: goalResult.daily_calories },
                { label: "Target Weight", value: `${goalResult.target_weight} kg` },
                { label: "Weight Change", value: `${goalResult.weight_change > 0 ? "+" : ""}${goalResult.weight_change} kg`, color: goalResult.weight_change > 0 ? "#4ade80" : "#f87171" },
              ].map((stat, i) => (
                <div key={i} style={s.statBox} className="stat-card">
                  <p style={{ ...s.statVal, color: stat.color || "#fff" }}>{stat.value}</p>
                  <p style={s.statLbl}>{stat.label}</p>
                </div>
              ))}
            </div>

            {goalResult.realistic === "Yes"
              ? <p style={s.pill} className="fade-in">✅ Realistic Goal • {goalResult.deficit_surplus}</p>
              : <p style={{ ...s.pill, background: "#7f1d1d" }} className="fade-in">⚠️ Challenging • {goalResult.deficit_surplus}</p>
            }

            {goalResult.advice && (
              <div style={s.adviceBox} className="hover-card">
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

              <div style={s.toggleRow} className="hover-card">
                <div>
                  <p style={s.label}>Want Supplements?</p>
                  <p style={s.hint}>Protein powder, creatine etc. with Indian brands</p>
                </div>
                <div className="toggle"
                  style={{ ...s.toggle, background: dietForm.want_supplements ? "#a78bfa" : "#333" }}
                  onClick={() => setDietForm({ ...dietForm, want_supplements: !dietForm.want_supplements })}>
                  <div style={{ ...s.toggleDot, transform: dietForm.want_supplements ? "translateX(24px)" : "translateX(2px)" }} />
                </div>
              </div>

              {dietForm.want_supplements && (
                <div style={s.inputGroup} className="fade-in">
                  <label style={s.label}>Monthly Budget (₹)</label>
                  <input style={s.input} type="number" placeholder="e.g. 2000"
                    value={dietForm.budget}
                    onChange={e => setDietForm({ ...dietForm, budget: e.target.value })} />
                </div>
              )}

              <div style={s.btnRow}>
                <button style={s.btnOutline} onClick={() => setStep(2)}>← Back</button>
                <button style={s.btn} className="btn-primary" onClick={handleGetDietPlan} disabled={loading}>
                  {loading ? "AI generating plan..." : "Generate Diet Plan →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — Diet Plan */}
        {step === 4 && dietResult && (
          <div style={s.section} className="fade-in">
            <h2 style={s.sectionTitle}>🥗 Your Indian Diet Plan</h2>
            <p style={s.hint}>Personalized for {goalResult.daily_calories} kcal/day • {goalForm.timeline_weeks} weeks</p>

            <div style={s.mealList}>
              {Object.entries(dietResult.meals).map(([key, meal]) => (
                <div key={key} style={s.mealCard} className="meal-card">
                  <div style={s.mealHeader}>
                    <p style={s.mealTitle}>{mealLabels[key] || key}</p>
                    <span style={s.calBadge}>{meal.calories} kcal</span>
                  </div>
                  <p style={s.mealName}>{meal.name}</p>
                  <p style={s.ingredients}>🥄 {meal.ingredients}</p>
                </div>
              ))}
            </div>

            <div style={s.totalBox} className="hover-card">
              <p style={s.totalText}>Total: <b style={{ color: "#a78bfa" }}>{dietResult.total_calories} kcal</b></p>
            </div>

            {dietResult.supplements && dietResult.supplements.length > 0 && (
              <div style={{ marginTop: "24px" }} className="fade-in">
                <h2 style={s.sectionTitle}>💊 Recommended Supplements</h2>
                <div style={s.mealList}>
                  {dietResult.supplements.map((supp, i) => (
                    <div key={i} style={s.mealCard} className="meal-card">
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

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button style={{ ...s.btnOutline, flex: 1 }} onClick={() => {
                setStep(1); setBmiResult(null); setGoalResult(null);
                setDietResult(null); setForm({ age: "", weight: "", height: "" });
              }}>🔄 Start Over</button>
              <button style={{ ...s.btn, flex: 1 }} className="btn-primary" onClick={onDashboard}>
                📊 View Dashboard
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #0f0726 0%, #1a1040 50%, #0f0726 100%)", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "40px 16px", fontFamily: "'Segoe UI', sans-serif" },
  card: { background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)", padding: "36px", borderRadius: "24px", width: "100%", maxWidth: "520px", boxShadow: "0 0 40px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.08)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" },
  title: { fontSize: "24px", color: "#fff", fontWeight: "700", margin: 0 },
  subtitle: { fontSize: "13px", color: "rgba(255,255,255,0.3)", marginTop: "4px" },
  logout: { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", padding: "6px 14px", borderRadius: "8px", fontSize: "13px" },
  steps: { display: "flex", justifyContent: "space-between", marginBottom: "28px" },
  stepItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" },
  stepDot: { width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "bold" },
  stepLabel: { fontSize: "11px" },
  section: { background: "rgba(255,255,255,0.03)", borderRadius: "16px", padding: "20px", border: "1px solid rgba(255,255,255,0.06)" },
  sectionTitle: { fontSize: "18px", color: "#fff", fontWeight: "bold", marginBottom: "6px" },
  hint: { fontSize: "13px", color: "rgba(255,255,255,0.35)", marginBottom: "16px" },
  form: { display: "flex", flexDirection: "column", gap: "14px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px", flex: 1 },
  label: { fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.8px" },
  input: { padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", width: "100%" },
  row: { display: "flex", gap: "12px" },
  btn: { padding: "13px", borderRadius: "10px", background: "linear-gradient(135deg, #a78bfa, #7c3aed)", color: "#fff", fontWeight: "bold", fontSize: "15px", border: "none", width: "100%" },
  btnOutline: { padding: "13px", borderRadius: "10px", background: "transparent", color: "#a78bfa", fontWeight: "bold", fontSize: "15px", border: "1px solid #a78bfa", flex: 1 },
  btnRow: { display: "flex", gap: "12px" },
  error: { color: "#f87171", fontSize: "13px", textAlign: "center", marginBottom: "12px" },
  bmiCard: { textAlign: "center", padding: "24px", background: "rgba(255,255,255,0.03)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" },
  bmiNum: { fontSize: "56px", fontWeight: "bold", color: "#fff" },
  bmiCat: { fontSize: "20px", fontWeight: "bold", marginTop: "6px" },
  bmiMeta: { display: "flex", justifyContent: "center", gap: "8px", marginTop: "12px", flexWrap: "wrap" },
  chip: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", color: "rgba(255,255,255,0.5)" },
  statsRow: { display: "flex", gap: "10px", marginBottom: "14px" },
  statBox: { flex: 1, textAlign: "center", background: "rgba(255,255,255,0.04)", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" },
  statVal: { fontSize: "20px", fontWeight: "bold", color: "#fff" },
  statLbl: { fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "4px" },
  pill: { display: "inline-block", background: "rgba(167,139,250,0.15)", color: "#a78bfa", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", marginBottom: "14px" },
  adviceBox: { padding: "12px", background: "rgba(167,139,250,0.06)", borderRadius: "10px", border: "1px solid rgba(167,139,250,0.15)", marginBottom: "4px" },
  adviceText: { color: "rgba(255,255,255,0.6)", fontSize: "13px", lineHeight: "1.6" },
  toggleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)" },
  toggle: { width: "48px", height: "26px", borderRadius: "13px", cursor: "pointer", position: "relative", transition: "background 0.3s" },
  toggleDot: { position: "absolute", top: "3px", width: "20px", height: "20px", background: "#fff", borderRadius: "50%", transition: "transform 0.3s" },
  mealList: { display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" },
  mealCard: { background: "rgba(255,255,255,0.04)", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" },
  mealHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
  mealTitle: { color: "rgba(255,255,255,0.4)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" },
  calBadge: { background: "rgba(167,139,250,0.15)", color: "#a78bfa", padding: "2px 10px", borderRadius: "20px", fontSize: "12px" },
  mealName: { color: "#fff", fontSize: "15px", fontWeight: "bold", marginBottom: "6px" },
  ingredients: { color: "rgba(255,255,255,0.35)", fontSize: "13px", lineHeight: "1.5" },
  totalBox: { marginTop: "14px", padding: "12px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" },
  totalText: { color: "rgba(255,255,255,0.6)", fontSize: "15px" },
  suppBrand: { color: "rgba(255,255,255,0.5)", fontSize: "13px", marginBottom: "4px" },
  costBadge: { background: "rgba(96,165,250,0.15)", color: "#60a5fa", padding: "2px 10px", borderRadius: "20px", fontSize: "12px" },
};

export default BMI;