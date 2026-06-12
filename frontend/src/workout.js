import { useState } from "react";
const API = "http://127.0.0.1:8000";

const dayColors = {
  "Gym": { bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.25)", badge: "#a78bfa", badgeBg: "rgba(167,139,250,0.15)" },
  "Home": { bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.25)", badge: "#4ade80", badgeBg: "rgba(74,222,128,0.15)" },
  "Rest": { bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.06)", badge: "#888", badgeBg: "rgba(255,255,255,0.05)" },
};

const focusEmojis = {
  "chest": "💪", "back": "🏋️", "legs": "🦵", "shoulders": "🔝",
  "arms": "💪", "cardio": "🏃", "rest": "😴", "core": "🎯",
  "full": "⚡", "upper": "💪", "lower": "🦵", "hiit": "🔥",
};

const getFocusEmoji = (focus = "") => {
  const lower = focus.toLowerCase();
  for (const [key, emoji] of Object.entries(focusEmojis)) {
    if (lower.includes(key)) return emoji;
  }
  return "🏋️";
};

export default function Workout({ token, onBack, userGoal }) {
  const [form, setForm] = useState({
    goal: userGoal || "muscle_gain",
    days_per_week: 4,
    workout_type: "both",
    fitness_level: "beginner",
  });
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDay, setSelectedDay] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setPlan(null);
    try {
      const res = await fetch(`${API}/workout-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          goal: form.goal,
          days_per_week: parseInt(form.days_per_week),
          workout_type: form.workout_type,
          fitness_level: form.fitness_level,
        }),
      });
      const data = await res.json();
      if (res.ok) { setPlan(data); setSelectedDay(0); }
      else setError("❌ Failed to generate plan");
    } catch { setError("❌ Server error"); }
    setLoading(false);
  };

  const selectedDayData = plan?.days?.[selectedDay];
  const typeStyle = dayColors[selectedDayData?.type] || dayColors["Rest"];

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={onBack}>← Back</button>
          <div>
            <h1 style={s.title}>Workout Plan</h1>
            <p style={s.subtitle}>AI-powered weekly training</p>
          </div>
        </div>
      </div>

      {/* Form */}
      {!plan && (
        <div style={s.formCard}>
          <p style={s.formTitle}>⚡ Generate Your Plan</p>

          <div style={s.grid2}>
            <div style={s.inputGroup}>
              <label style={s.label}>Your Goal</label>
              <select style={s.select} value={form.goal}
                onChange={e => setForm({ ...form, goal: e.target.value })}>
                <option value="muscle_gain">💪 Muscle Gain</option>
                <option value="weight_loss">🔥 Weight Loss</option>
                <option value="maintenance">⚖️ Maintenance</option>
              </select>
            </div>

            <div style={s.inputGroup}>
              <label style={s.label}>Fitness Level</label>
              <select style={s.select} value={form.fitness_level}
                onChange={e => setForm({ ...form, fitness_level: e.target.value })}>
                <option value="beginner">🌱 Beginner</option>
                <option value="intermediate">⚡ Intermediate</option>
                <option value="advanced">🔥 Advanced</option>
              </select>
            </div>

            <div style={s.inputGroup}>
              <label style={s.label}>Workout Type</label>
              <select style={s.select} value={form.workout_type}
                onChange={e => setForm({ ...form, workout_type: e.target.value })}>
                <option value="gym">🏋️ Gym</option>
                <option value="home">🏠 Home</option>
                <option value="both">🔀 Both</option>
              </select>
            </div>

            <div style={s.inputGroup}>
              <label style={s.label}>Days Per Week: <b style={{ color: "#a78bfa" }}>{form.days_per_week}</b></label>
              <input type="range" min="2" max="6" value={form.days_per_week}
                onChange={e => setForm({ ...form, days_per_week: e.target.value })}
                style={s.slider} />
              <div style={s.sliderLabels}>
                <span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
              </div>
            </div>
          </div>

          {error && <p style={s.error}>{error}</p>}

          <button style={s.generateBtn} onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <span style={s.loadingInner}>
                <span style={s.spinnerSm} /> AI is building your plan...
              </span>
            ) : "⚡ Generate Workout Plan"}
          </button>
        </div>
      )}

      {/* Plan */}
      {plan && (
        <>
          {/* Regenerate Button */}
          <div style={s.planHeader}>
            <div>
              <p style={s.planTitle}>Your Weekly Plan</p>
              <p style={s.planSub}>{form.days_per_week} workout days • {form.fitness_level} level</p>
            </div>
            <button style={s.regenBtn} onClick={() => setPlan(null)}>🔄 Regenerate</button>
          </div>

          {/* Day Tabs */}
          <div style={s.dayTabs}>
            {plan.days.map((day, i) => {
              const isRest = day.type === "Rest";
              const isActive = selectedDay === i;
              return (
                <button key={i} className="day-tab" style={{
                  ...s.dayTab,
                  background: isActive ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.03)",
                  border: isActive ? "1px solid rgba(167,139,250,0.4)" : "1px solid rgba(255,255,255,0.06)",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.4)",
                }} onClick={() => setSelectedDay(i)}>
                  <span style={{ fontSize: "18px" }}>{isRest ? "😴" : getFocusEmoji(day.focus)}</span>
                  <span style={s.dayTabName}>{day.day?.slice(0, 3)}</span>
                  {isRest
                    ? <span style={s.restPill}>Rest</span>
                    : <span style={{ ...s.restPill, background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}>Active</span>
                  }
                </button>
              );
            })}
          </div>

          {/* Selected Day Detail */}
          {selectedDayData && (
            <div style={{ ...s.dayDetail, background: typeStyle.bg, border: `1px solid ${typeStyle.border}` }}>
              <div style={s.dayDetailTop}>
                <div>
                  <div style={s.dayDetailHeader}>
                    <span style={{ fontSize: "32px" }}>{getFocusEmoji(selectedDayData.focus)}</span>
                    <div>
                      <p style={s.dayDetailName}>{selectedDayData.name}</p>
                      <p style={s.dayDetailDay}>{selectedDayData.day}</p>
                    </div>
                  </div>
                </div>
                <div style={s.dayMeta}>
                  <span style={{ ...s.typeBadge, background: typeStyle.badgeBg, color: typeStyle.badge }}>
                    {selectedDayData.type === "Gym" ? "🏋️" : selectedDayData.type === "Home" ? "🏠" : "😴"} {selectedDayData.type}
                  </span>
                  {selectedDayData.duration && selectedDayData.type !== "Rest" && (
                    <span style={s.durationBadge}>⏱️ {selectedDayData.duration}</span>
                  )}
                </div>
              </div>

              {selectedDayData.focus && selectedDayData.type !== "Rest" && (
                <div style={s.focusTag}>
                  <span style={s.focusLabel}>FOCUS</span>
                  <span style={s.focusValue}>{selectedDayData.focus}</span>
                </div>
              )}

              {selectedDayData.type === "Rest" ? (
                <div style={s.restBox}>
                  <p style={{ fontSize: "48px", margin: "0 0 12px" }}>😴</p>
                  <p style={s.restTitle}>Rest & Recover</p>
                  <p style={s.restSub}>Your muscles grow during rest. Stay hydrated, eat well, and sleep 7-8 hours.</p>
                </div>
              ) : (
                <div style={s.exerciseList}>
                  <p style={s.exerciseTitle}>EXERCISES</p>
                  {selectedDayData.exercises?.split(',').map((ex, i) => (
                    <div key={i} style={s.exerciseItem} className="exercise-item">
                      <span style={s.exerciseNum}>{i + 1}</span>
                      <span style={s.exerciseText}>{ex.trim()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Week Overview */}
          <div style={s.overviewCard}>
            <p style={s.cardLabel}>WEEK AT A GLANCE</p>
            <div style={s.overviewGrid}>
              {plan.days.map((day, i) => (
                <div key={i} style={{
                  ...s.overviewItem,
                  background: selectedDay === i ? "rgba(167,139,250,0.1)" : "rgba(255,255,255,0.03)",
                  border: selectedDay === i ? "1px solid rgba(167,139,250,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer",
                }} onClick={() => setSelectedDay(i)}>
                  <p style={s.overviewDay}>{day.day?.slice(0, 3)}</p>
                  <p style={{ fontSize: "20px", margin: "4px 0" }}>{day.type === "Rest" ? "😴" : getFocusEmoji(day.focus)}</p>
                  <p style={s.overviewFocus}>{day.type === "Rest" ? "Rest" : day.focus?.split(" ")[0]}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #0f0726 0%, #1a1040 50%, #0f0726 100%)", padding: "32px 36px", fontFamily: "'Segoe UI', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" },
  headerLeft: { display: "flex", alignItems: "center", gap: "16px" },
  backBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", padding: "8px 16px", borderRadius: "10px", cursor: "pointer", fontSize: "14px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#fff", margin: 0 },
  subtitle: { color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: 0 },
  formCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "28px", backdropFilter: "blur(10px)" },
  formTitle: { color: "#fff", fontSize: "18px", fontWeight: "600", margin: "0 0 24px" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { color: "rgba(255,255,255,0.4)", fontSize: "12px", letterSpacing: "0.8px", textTransform: "uppercase" },
  select: { padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px", outline: "none" },
  slider: { width: "100%", accentColor: "#a78bfa", cursor: "pointer" },
  sliderLabels: { display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.2)", fontSize: "11px" },
  error: { color: "#f87171", fontSize: "13px", margin: "0 0 16px" },
  generateBtn: { width: "100%", padding: "14px", borderRadius: "12px", background: "linear-gradient(135deg, #a78bfa, #7c3aed)", color: "#fff", fontWeight: "600", fontSize: "16px", border: "none", cursor: "pointer" },
  loadingInner: { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" },
  spinnerSm: { width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block" },
  planHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  planTitle: { color: "#fff", fontSize: "20px", fontWeight: "700", margin: 0 },
  planSub: { color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: "4px 0 0" },
  regenBtn: { padding: "10px 20px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", fontSize: "13px", cursor: "pointer" },
  dayTabs: { display: "flex", gap: "10px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" },
  dayTab: { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "12px 16px", borderRadius: "14px", cursor: "pointer", minWidth: "80px", transition: "all 0.2s" },
  dayTabName: { fontSize: "13px", fontWeight: "600" },
  restPill: { fontSize: "10px", padding: "2px 8px", borderRadius: "20px", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" },
  dayDetail: { borderRadius: "20px", padding: "28px", marginBottom: "20px", backdropFilter: "blur(10px)" },
  dayDetailTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  dayDetailHeader: { display: "flex", alignItems: "center", gap: "14px" },
  dayDetailName: { color: "#fff", fontSize: "20px", fontWeight: "700", margin: 0 },
  dayDetailDay: { color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: "4px 0 0" },
  dayMeta: { display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" },
  typeBadge: { padding: "5px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" },
  durationBadge: { padding: "5px 14px", borderRadius: "20px", fontSize: "13px", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" },
  focusTag: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", padding: "10px 14px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" },
  focusLabel: { color: "rgba(255,255,255,0.3)", fontSize: "11px", letterSpacing: "1px" },
  focusValue: { color: "#fff", fontSize: "14px", fontWeight: "600" },
  restBox: { textAlign: "center", padding: "32px 0" },
  restTitle: { color: "#fff", fontSize: "20px", fontWeight: "700", margin: "0 0 8px" },
  restSub: { color: "rgba(255,255,255,0.35)", fontSize: "14px", lineHeight: "1.6", maxWidth: "320px", margin: "0 auto" },
  exerciseList: { display: "flex", flexDirection: "column", gap: "10px" },
  exerciseTitle: { color: "rgba(255,255,255,0.3)", fontSize: "11px", letterSpacing: "1.5px", margin: "0 0 12px" },
  exerciseItem: { display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", background: "rgba(255,255,255,0.04)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)" },
  exerciseNum: { width: "24px", height: "24px", borderRadius: "50%", background: "rgba(167,139,250,0.2)", color: "#a78bfa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", flexShrink: 0 },
  exerciseText: { color: "rgba(255,255,255,0.8)", fontSize: "14px" },
  overviewCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", padding: "24px" },
  cardLabel: { color: "rgba(255,255,255,0.3)", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", margin: "0 0 16px" },
  overviewGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "10px" },
  overviewItem: { borderRadius: "12px", padding: "12px 8px", textAlign: "center", transition: "all 0.2s" },
  overviewDay: { color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: "600", margin: 0 },
  overviewFocus: { color: "rgba(255,255,255,0.3)", fontSize: "10px", margin: 0 },
};