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

function HoverButton({ onClick, disabled, children, style }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...style,
        transform: hovered && !disabled ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered && !disabled ? "0 8px 25px rgba(167,139,250,0.4)" : "none",
        opacity: disabled ? 0.6 : 1,
        transition: "all 0.2s ease",
      }}
    >
      {children}
    </button>
  );
}

function HoverInput({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...style,
        border: focused ? "1px solid rgba(167,139,250,0.6)" : "1px solid rgba(255,255,255,0.08)",
        boxShadow: focused ? "0 0 0 3px rgba(167,139,250,0.1)" : "none",
        outline: "none",
        transition: "all 0.2s ease",
      }}
    />
  );
}

function HoverTextarea({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        ...style,
        border: focused ? "1px solid rgba(167,139,250,0.6)" : "1px solid rgba(255,255,255,0.08)",
        boxShadow: focused ? "0 0 0 3px rgba(167,139,250,0.1)" : "none",
        outline: "none",
        transition: "all 0.2s ease",
      }}
    />
  );
}

function HoverCard({ style, children, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...style,
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? "0 12px 30px rgba(0,0,0,0.3)" : "none",
        transition: "all 0.25s ease",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {children}
    </div>
  );
}

export default function BMI({ token, onLogout, onDashboard }) {
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
            target_bmi: parseFloat(goalForm.target_bmi), target_weight: goalResult.target_weight,
            weight_change: goalResult.weight_change, timeline_weeks: parseInt(goalForm.timeline_weeks),
            daily_calories: goalResult.daily_calories, deficit_surplus: goalResult.deficit_surplus,
            realistic: goalResult.realistic, advice: goalResult.advice,
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

  const border = "rgba(255,255,255,0.08)";
  const cardBg = "rgba(255,255,255,0.04)";

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>🧬 Diet Planner</h1>
            <p style={s.subtitle}>AI-powered personalized nutrition</p>
          </div>
          <HoverButton onClick={onLogout} style={s.logoutBtn}>Logout</HoverButton>
        </div>

        {/* Step Indicator */}
        <div style={s.steps}>
          {["BMI", "Goal", "Diet", "Plan"].map((label, i) => (
            <div key={i} style={s.stepItem}>
              <div style={{
                ...s.stepDot,
                background: step > i + 1 ? "linear-gradient(135deg,#a78bfa,#7c3aed)" : step === i + 1 ? "linear-gradient(135deg,#a78bfa,#7c3aed)" : "rgba(255,255,255,0.05)",
                color: step >= i + 1 ? "#fff" : "#444",
                boxShadow: step === i + 1 ? "0 0 15px rgba(167,139,250,0.4)" : "none",
              }}>{step > i + 1 ? "✓" : i + 1}</div>
              <p style={{ ...s.stepLabel, color: step >= i + 1 ? "#a78bfa" : "#444" }}>{label}</p>
            </div>
          ))}
        </div>

        {error && <p style={s.error}>{error}</p>}

        {/* STEP 1 */}
        {step === 1 && (
          <div style={s.section}>
            <h2 style={s.sectionTitle}>📏 Your Body Stats</h2>
            <p style={s.hint}>Enter your details to calculate your BMI</p>
            <div style={s.form}>
              <div style={s.inputGroup}>
                <label style={s.label}>Age</label>
                <HoverInput style={s.input} type="number" placeholder="e.g. 22"
                  value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
              </div>
              <div style={s.row}>
                <div style={s.inputGroup}>
                  <label style={s.label}>Weight (kg)</label>
                  <HoverInput style={s.input} type="number" placeholder="e.g. 65"
                    value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} />
                </div>
                <div style={s.inputGroup}>
                  <label style={s.label}>Height (cm)</label>
                  <HoverInput style={s.input} type="number" placeholder="e.g. 170"
                    value={form.height} onChange={e => setForm({ ...form, height: e.target.value })} />
                </div>
              </div>
              <HoverButton style={s.btn} onClick={handleCalculateBMI} disabled={loading}>
                {loading ? "Calculating..." : "Calculate BMI →"}
              </HoverButton>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && bmiResult && (
          <div style={s.section}>
            <HoverCard style={s.bmiCard}>
              <p style={s.bmiNum}>{bmiResult.bmi}</p>
              <p style={{ ...s.bmiCat, color: getCategoryColor(bmiResult.category) }}>
                {getCategoryEmoji(bmiResult.category)} {bmiResult.category}
              </p>
              <div style={s.bmiMeta}>
                {[`Age: ${bmiResult.age}`, `Weight: ${form.weight} kg`, `Height: ${form.height} cm`].map((t, i) => (
                  <span key={i} style={s.chip}>{t}</span>
                ))}
              </div>
            </HoverCard>

            <h2 style={{ ...s.sectionTitle, marginTop: "24px" }}>🎯 Set Your Goal</h2>
            <p style={s.hint}>What BMI do you want to achieve and in how long?</p>
            <div style={s.form}>
              <div style={s.row}>
                <div style={s.inputGroup}>
                  <label style={s.label}>Target BMI</label>
                  <HoverInput style={s.input} type="number" placeholder="e.g. 22"
                    value={goalForm.target_bmi}
                    onChange={e => setGoalForm({ ...goalForm, target_bmi: e.target.value })} />
                </div>
                <div style={s.inputGroup}>
                  <label style={s.label}>Timeline (weeks)</label>
                  <HoverInput style={s.input} type="number" placeholder="e.g. 12"
                    value={goalForm.timeline_weeks}
                    onChange={e => setGoalForm({ ...goalForm, timeline_weeks: e.target.value })} />
                </div>
              </div>
              <div style={s.btnRow}>
                <HoverButton style={s.btnOutline} onClick={() => setStep(1)}>← Back</HoverButton>
                <HoverButton style={s.btn} onClick={handleCalculateGoal} disabled={loading}>
                  {loading ? "AI Calculating..." : "Get Calorie Plan →"}
                </HoverButton>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && goalResult && (
          <div style={s.section}>
            <div style={s.statsRow}>
              {[
                { label: "Daily Calories", value: goalResult.daily_calories },
                { label: "Target Weight", value: `${goalResult.target_weight} kg` },
                { label: "Weight Change", value: `${goalResult.weight_change > 0 ? "+" : ""}${goalResult.weight_change} kg`, color: goalResult.weight_change > 0 ? "#4ade80" : "#f87171" },
              ].map((s2, i) => (
                <HoverCard key={i} style={s.statBox}>
                  <p style={{ ...s.statVal, color: s2.color || "#fff" }}>{s2.value}</p>
                  <p style={s.statLbl}>{s2.label}</p>
                </HoverCard>
              ))}
            </div>

            <div style={s.pillRow}>
              <span style={{ ...s.pill, background: goalResult.realistic === "Yes" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", color: goalResult.realistic === "Yes" ? "#4ade80" : "#f87171", border: `1px solid ${goalResult.realistic === "Yes" ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}` }}>
                {goalResult.realistic === "Yes" ? "✅ Realistic Goal" : "⚠️ Challenging Goal"}
              </span>
              <span style={s.pill2}>{goalResult.deficit_surplus}</span>
            </div>

            {goalResult.advice && (
              <HoverCard style={s.adviceBox}>
                <p style={s.adviceText}>💡 {goalResult.advice}</p>
              </HoverCard>
            )}

            <h2 style={{ ...s.sectionTitle, marginTop: "24px" }}>🍽️ Diet Preferences</h2>
            <div style={s.form}>
              <div style={s.inputGroup}>
                <label style={s.label}>Your Goal</label>
                <select style={s.select} value={dietForm.goal}
                  onChange={e => setDietForm({ ...dietForm, goal: e.target.value })}>
                  <option value="muscle_gain">💪 Muscle Gain</option>
                  <option value="weight_loss">🔥 Weight Loss</option>
                  <option value="maintenance">⚖️ Maintenance</option>
                </select>
              </div>

              <div style={s.toggleRow} onClick={() => setDietForm({ ...dietForm, want_supplements: !dietForm.want_supplements })}>
                <div>
                  <p style={{ color: "#fff", fontSize: "14px", fontWeight: "600", margin: 0 }}>Want Supplements?</p>
                  <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", margin: "4px 0 0" }}>Protein powder, creatine etc.</p>
                </div>
                <div style={{ ...s.toggle, background: dietForm.want_supplements ? "linear-gradient(135deg,#a78bfa,#7c3aed)" : "rgba(255,255,255,0.1)" }}>
                  <div style={{ ...s.toggleDot, transform: dietForm.want_supplements ? "translateX(22px)" : "translateX(2px)" }} />
                </div>
              </div>

              {dietForm.want_supplements && (
                <div style={s.inputGroup}>
                  <label style={s.label}>Monthly Budget (₹)</label>
                  <HoverInput style={s.input} type="number" placeholder="e.g. 2000"
                    value={dietForm.budget}
                    onChange={e => setDietForm({ ...dietForm, budget: e.target.value })} />
                </div>
              )}

              <div style={s.btnRow}>
                <HoverButton style={s.btnOutline} onClick={() => setStep(2)}>← Back</HoverButton>
                <HoverButton style={s.btn} onClick={handleGetDietPlan} disabled={loading}>
                  {loading ? "🤖 AI generating..." : "Generate Diet Plan →"}
                </HoverButton>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && dietResult && (
          <div style={s.section}>
            <h2 style={s.sectionTitle}>🥗 Your Indian Diet Plan</h2>
            <p style={s.hint}>Personalized for {goalResult.daily_calories} kcal/day</p>

            <div style={s.mealList}>
              {Object.entries(dietResult.meals).map(([key, meal]) => (
                <HoverCard key={key} style={s.mealCard}>
                  <div style={s.mealHeader}>
                    <p style={s.mealType}>{mealLabels[key] || key}</p>
                    <span style={s.calBadge}>{meal.calories} kcal</span>
                  </div>
                  <p style={s.mealName}>{meal.name}</p>
                  <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "10px 0" }} />
                  <p style={s.ingredients}>🥄 {meal.ingredients}</p>
                </HoverCard>
              ))}
            </div>

            <HoverCard style={s.totalBox}>
              <p style={s.totalText}>Total: <b style={{ color: "#a78bfa" }}>{dietResult.total_calories} kcal</b></p>
            </HoverCard>

            {dietResult.supplements?.length > 0 && (
              <div style={{ marginTop: "24px" }}>
                <h2 style={s.sectionTitle}>💊 Supplements</h2>
                <div style={s.mealList}>
                  {dietResult.supplements.map((supp, i) => (
                    <HoverCard key={i} style={s.suppCard}>
                      <div style={s.mealHeader}>
                        <p style={s.mealType}>💪 {supp.name}</p>
                        <span style={s.costBadge}>{supp.cost}</span>
                      </div>
                      <p style={{ color: "#aaa", fontSize: "13px", margin: "4px 0" }}>🏷️ {supp.brand}</p>
                      <p style={s.ingredients}>📏 {supp.dose}</p>
                    </HoverCard>
                  ))}
                </div>
              </div>
            )}

            <div style={{ ...s.btnRow, marginTop: "24px" }}>
              <HoverButton style={s.btnOutline} onClick={() => {
                setStep(1); setBmiResult(null); setGoalResult(null);
                setDietResult(null); setForm({ age: "", weight: "", height: "" });
              }}>🔄 Start Over</HoverButton>
              <HoverButton style={s.btn} onClick={onDashboard}>📊 View Dashboard</HoverButton>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", backgroundImage: "url('https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1920')", backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "40px 16px", fontFamily: "'Segoe UI', sans-serif" },
  card: { background: "rgba(10,7,26,0.88)", backdropFilter: "blur(20px)", padding: "36px", borderRadius: "24px", width: "100%", maxWidth: "520px", boxShadow: "0 25px 60px rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.08)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" },
  title: { fontSize: "24px", fontWeight: "700", color: "#fff", margin: 0 },
  subtitle: { fontSize: "13px", color: "rgba(255,255,255,0.3)", marginTop: "4px" },
  logoutBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", padding: "8px 16px", borderRadius: "10px", fontSize: "13px", cursor: "pointer" },
  steps: { display: "flex", justifyContent: "space-between", marginBottom: "28px" },
  stepItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" },
  stepDot: { width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: "700", transition: "all 0.3s" },
  stepLabel: { fontSize: "11px", transition: "all 0.3s" },
  section: {},
  sectionTitle: { fontSize: "18px", fontWeight: "700", color: "#fff", margin: "0 0 6px" },
  hint: { fontSize: "13px", color: "rgba(255,255,255,0.3)", marginBottom: "20px" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px", flex: 1 },
  label: { fontSize: "12px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" },
  input: { padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: "14px", border: "1px solid rgba(255,255,255,0.08)" },
  select: { padding: "12px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: "14px", border: "1px solid rgba(255,255,255,0.08)", appearance: "none" },
  btnRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" },
  btn: { background: "linear-gradient(135deg,#a78bfa,#7c3aed)", color: "#fff", padding: "12px 20px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", border: "none", cursor: "pointer" },
  btnOutline: { background: "transparent", color: "#fff", padding: "12px 20px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", border: "1px solid rgba(255,255,255,0.18)", cursor: "pointer" },
  error: { color: "#f87171", background: "rgba(248,113,113,0.1)", padding: "12px 14px", borderRadius: "10px", marginBottom: "18px" },
}; 