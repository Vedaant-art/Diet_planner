import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const API = "http://127.0.0.1:8000";

const moods = [
  { value: "great", emoji: "🔥", label: "Impressive" },
  { value: "good", emoji: "😊", label: "Good" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "bad", emoji: "😔", label: "Bad" },
];

const statusColors = {
  "On Track": "#a78bfa",
  "Ahead": "#4ade80",
  "Behind": "#f87171",
  "Just Started": "#fbbf24",
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "rgba(20,10,50,0.95)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: "10px", padding: "10px 14px" }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", margin: "0 0 4px" }}>{label}</p>
        <p style={{ color: "#a78bfa", fontSize: "16px", fontWeight: "700", margin: 0 }}>{payload[0].value} kg</p>
      </div>
    );
  }
  return null;
};

export default function Progress({ token, onBack }) {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logForm, setLogForm] = useState({ weight: "", mood: "", notes: "" });
  const [logging, setLogging] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState("");
  const [showLog, setShowLog] = useState(false);

  useEffect(() => { fetchProgress(); }, []);

  const fetchProgress = async () => {
    try {
      const res = await fetch(`${API}/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setProgressData(json);
    } catch {
      setProgressData({ has_logs: false });
    }
    setLoading(false);
  };

  const handleLog = async () => {
    if (!logForm.weight) { setError("Please enter your weight"); return; }
    setLogging(true);
    setError("");
    try {
      const res = await fetch(`${API}/log-weight`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          weight: parseFloat(logForm.weight),
          mood: logForm.mood || null,
          notes: logForm.notes || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.ai_analysis) setAiResult(data.ai_analysis);
        setLogForm({ weight: "", mood: "", notes: "" });
        setShowLog(false);
        fetchProgress();
      } else {
        setError("❌ Failed to log weight");
      }
    } catch {
      setError("❌ Server error");
    }
    setLogging(false);
  };

  if (loading) return (
    <div style={s.fullCenter}>
      <div style={s.spinner} />
      <p style={s.loadText}>Loading progress...</p>
    </div>
  );

  const chartData = progressData?.logs?.map(l => ({
    date: l.date?.slice(5),
    weight: l.weight,
    mood: l.mood,
  })) || [];

  const streak = progressData?.total_logs || 0;
  const startW = progressData?.start_weight;
  const currentW = progressData?.current_weight;
  const targetW = progressData?.target_weight;
  const progressPct = startW && targetW && currentW
    ? Math.min(100, Math.max(0, Math.round(Math.abs(currentW - startW) / Math.abs(targetW - startW) * 100)))
    : 0;

  const lastLog = progressData?.logs?.[progressData.logs.length - 1];

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={onBack}>← Back</button>
          <div>
            <h1 style={s.title}>Progress Tracker</h1>
            <p style={s.subtitle}>Your daily weight journey</p>
          </div>
        </div>
        <button style={s.logBtn} onClick={() => setShowLog(!showLog)}>
          {showLog ? "✕ Cancel" : "＋ Log Today"}
        </button>
      </div>

      {/* Log Form */}
      {showLog && (
        <div style={s.logCard}>
          <p style={s.logTitle}>📝 Today's Check-in</p>

          <div style={s.logRow}>
            <div style={s.inputGroup}>
              <label style={s.label}>Weight (kg)</label>
              <input style={s.input} type="number" placeholder="e.g. 74.5"
                value={logForm.weight}
                onChange={e => setLogForm({ ...logForm, weight: e.target.value })} />
            </div>
          </div>

          <div style={s.inputGroup}>
            <label style={s.label}>How are you feeling?</label>
            <div style={s.moodRow}>
              {moods.map(m => (
                <button key={m.value} className="mood-btn"
                  style={logForm.mood === m.value ? s.moodBtnActive : s.moodBtn}
                  onClick={() => setLogForm({ ...logForm, mood: m.value })}>
                  <span style={{ fontSize: "24px" }}>{m.emoji}</span>
                  <span style={{ fontSize: "12px", marginTop: "4px" }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={s.inputGroup}>
            <label style={s.label}>Notes (optional)</label>
            <textarea style={s.textarea} placeholder="How was your day? Any struggles or wins?"
              value={logForm.notes}
              onChange={e => setLogForm({ ...logForm, notes: e.target.value })} />
          </div>

          {error && <p style={s.error}>{error}</p>}

          <button style={s.submitBtn} onClick={handleLog} disabled={logging}>
            {logging ? "🤖 AI is analyzing..." : "Save Today's Log"}
          </button>
        </div>
      )}

      {/* AI Feedback */}
      {aiResult && (
        <div style={s.aiCard}>
          <div style={s.aiTop}>
            <span style={{ fontSize: "24px" }}>🤖</span>
            <div>
              <p style={s.aiLabel}>AI Coach Feedback</p>
              <span style={{ ...s.statusBadge, background: `${statusColors[aiResult.status]}22`, color: statusColors[aiResult.status] || "#a78bfa" }}>
                {aiResult.status}
              </span>
            </div>
          </div>
          <p style={s.aiFeedback}>{aiResult.feedback}</p>
          {aiResult.tip && (
            <div style={s.tipBox}>
              <span style={s.tipIcon}>💡</span>
              <p style={s.tipText}>{aiResult.tip}</p>
            </div>
          )}
        </div>
      )}

      {/* Stats Row */}
      <div style={s.statsRow}>
        {/* Streak */}
        <div style={s.streakCard}>
          <div style={s.streakRing}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(167,139,250,0.1)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#a78bfa"
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${Math.min(streak * 10, 264)} 264`}
                transform="rotate(-90 50 50)" />
            </svg>
            <div style={s.streakCenter}>
              <p style={s.streakNum}>{streak}</p>
              <p style={s.streakLabel}>days</p>
            </div>
          </div>
          <p style={s.streakTitle}>🔥 Streak</p>
          <p style={s.streakSub}>Keep it going!</p>
        </div>

        {/* Progress Ring */}
        <div style={s.streakCard}>
          <div style={s.streakRing}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(74,222,128,0.1)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#4ade80"
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(progressPct / 100) * 264} 264`}
                transform="rotate(-90 50 50)" />
            </svg>
            <div style={s.streakCenter}>
              <p style={{ ...s.streakNum, color: "#4ade80" }}>{progressPct}%</p>
            </div>
          </div>
          <p style={s.streakTitle}>🎯 Goal Progress</p>
          <p style={s.streakSub}>{startW} → {targetW} kg</p>
        </div>

        {/* Weight Summary */}
        <div style={{ ...s.streakCard, flex: 2, alignItems: "flex-start" }}>
          <p style={s.cardLabel}>WEIGHT SUMMARY</p>
          <div style={s.weightSummary}>
            {[
              { label: "Start", value: `${startW} kg`, color: "#fbbf24" },
              { label: "Current", value: `${currentW} kg`, color: "#a78bfa" },
              { label: "Target", value: `${targetW} kg`, color: "#4ade80" },
              { label: "Remaining", value: `${Math.abs(((targetW - currentW) || 0)).toFixed(1)} kg`, color: "#f87171" },
            ].map((item, i) => (
              <div key={i} style={s.weightItem}>
                <p style={s.weightLabel}>{item.label}</p>
                <p style={{ ...s.weightValue, color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Last mood */}
          {lastLog?.mood && (
            <div style={s.lastMood}>
              <p style={s.cardLabel}>LAST MOOD</p>
              <p style={{ fontSize: "28px" }}>
                {moods.find(m => m.value === lastLog.mood)?.emoji}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div style={s.chartCard}>
          <div style={s.chartHeader}>
            <div>
              <p style={s.cardLabel}>WEIGHT OVER TIME</p>
              <p style={s.chartSub}>{chartData.length} entries logged</p>
            </div>
            {targetW && <span style={s.targetPill}>Target: {targetW} kg</span>}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
                domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              {targetW && <ReferenceLine y={targetW} stroke="#4ade80" strokeDasharray="4 4" strokeOpacity={0.5} />}
              <Line type="monotone" dataKey="weight" stroke="#a78bfa" strokeWidth={3}
                dot={{ fill: "#a78bfa", strokeWidth: 0, r: 5 }}
                activeDot={{ r: 7, fill: "#fff", stroke: "#a78bfa", strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log History */}
      {progressData?.logs?.length > 0 && (
        <div style={s.historyCard}>
          <p style={s.cardLabel}>LOG HISTORY</p>
          <div style={s.historyList}>
            {[...progressData.logs].reverse().slice(0, 7).map((log, i) => (
              <div key={i} style={s.historyItem}>
                <div style={s.historyLeft}>
                  <span style={{ fontSize: "20px" }}>
                    {moods.find(m => m.value === log.mood)?.emoji || "📅"}
                  </span>
                  <div>
                    <p style={s.historyDate}>{log.date}</p>
                    {log.notes && <p style={s.historyNote}>{log.notes}</p>}
                  </div>
                </div>
                <span style={s.historyWeight}>{log.weight} kg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!progressData?.has_logs && !showLog && (
        <div style={s.emptyBox}>
          <p style={{ fontSize: "56px" }}>📊</p>
          <h2 style={s.emptyTitle}>No logs yet!</h2>
          <p style={s.emptySub}>Start logging your daily weight to track your progress</p>
          <button style={s.logBtn} onClick={() => setShowLog(true)}>＋ Log Today's Weight</button>
        </div>
      )}

    </div>
  );
}

const border = "rgba(255,255,255,0.08)";
const card = "rgba(255,255,255,0.04)";

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #0f0726 0%, #1a1040 50%, #0f0726 100%)", padding: "32px 36px", fontFamily: "'Segoe UI', sans-serif" },
  fullCenter: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0f0726, #1a1040)" },
  spinner: { width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.1)", borderTop: "3px solid #a78bfa", borderRadius: "50%", marginBottom: "16px" },
  loadText: { color: "rgba(255,255,255,0.4)", fontSize: "15px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" },
  headerLeft: { display: "flex", alignItems: "center", gap: "16px" },
  backBtn: { background: "transparent", border: `1px solid ${border}`, color: "rgba(255,255,255,0.4)", padding: "8px 16px", borderRadius: "10px", cursor: "pointer", fontSize: "14px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#fff", margin: 0 },
  subtitle: { color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: 0 },
  logBtn: { padding: "12px 24px", borderRadius: "12px", background: "linear-gradient(135deg, #a78bfa, #7c3aed)", color: "#fff", fontWeight: "600", fontSize: "14px", border: "none", cursor: "pointer" },
  logCard: { background: card, border: `1px solid rgba(167,139,250,0.2)`, borderRadius: "20px", padding: "24px", marginBottom: "20px", backdropFilter: "blur(10px)" },
  logTitle: { color: "#fff", fontSize: "16px", fontWeight: "600", margin: "0 0 20px" },
  logRow: { display: "flex", gap: "16px", marginBottom: "16px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px", flex: 1, marginBottom: "16px" },
  label: { color: "rgba(255,255,255,0.4)", fontSize: "12px", letterSpacing: "0.8px", textTransform: "uppercase" },
  input: { padding: "12px 16px", borderRadius: "12px", border: `1px solid ${border}`, background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "15px", outline: "none" },
  textarea: { padding: "12px 16px", borderRadius: "12px", border: `1px solid ${border}`, background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px", outline: "none", resize: "none", height: "80px", fontFamily: "'Segoe UI', sans-serif" },
  moodRow: { display: "flex", gap: "10px" },
  moodBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 8px", borderRadius: "12px", border: `1px solid ${border}`, background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", cursor: "pointer", gap: "4px" },
  moodBtnActive: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 8px", borderRadius: "12px", border: "1px solid rgba(167,139,250,0.5)", background: "rgba(167,139,250,0.1)", color: "#fff", cursor: "pointer", gap: "4px" },
  error: { color: "#f87171", fontSize: "13px", margin: "0 0 12px" },
  submitBtn: { width: "100%", padding: "13px", borderRadius: "12px", background: "linear-gradient(135deg, #a78bfa, #7c3aed)", color: "#fff", fontWeight: "600", fontSize: "15px", border: "none", cursor: "pointer" },
  aiCard: { background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "20px", padding: "24px", marginBottom: "20px" },
  aiTop: { display: "flex", gap: "14px", alignItems: "flex-start", marginBottom: "14px" },
  aiLabel: { color: "#a78bfa", fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase", margin: "0 0 6px" },
  statusBadge: { padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  aiFeedback: { color: "rgba(255,255,255,0.7)", fontSize: "14px", lineHeight: "1.7", margin: "0 0 12px" },
  tipBox: { display: "flex", gap: "10px", alignItems: "flex-start", background: "rgba(255,255,255,0.04)", padding: "12px", borderRadius: "10px" },
  tipIcon: { fontSize: "18px" },
  tipText: { color: "rgba(255,255,255,0.5)", fontSize: "13px", lineHeight: "1.5", margin: 0 },
  statsRow: { display: "flex", gap: "16px", marginBottom: "20px" },
  streakCard: { background: card, border: `1px solid ${border}`, borderRadius: "20px", padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", backdropFilter: "blur(10px)", flex: 1 },
  streakRing: { position: "relative", marginBottom: "12px" },
  streakCenter: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" },
  streakNum: { fontSize: "22px", fontWeight: "700", color: "#a78bfa", margin: 0 },
  streakLabel: { fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: 0 },
  streakTitle: { color: "#fff", fontSize: "14px", fontWeight: "600", margin: "0 0 4px" },
  streakSub: { color: "rgba(255,255,255,0.3)", fontSize: "12px", margin: 0 },
  cardLabel: { color: "rgba(255,255,255,0.3)", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", margin: "0 0 14px" },
  weightSummary: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", width: "100%" },
  weightItem: { background: "rgba(255,255,255,0.04)", padding: "12px", borderRadius: "10px", border: `1px solid ${border}` },
  weightLabel: { color: "rgba(255,255,255,0.3)", fontSize: "11px", margin: "0 0 4px" },
  weightValue: { fontSize: "16px", fontWeight: "700", margin: 0 },
  lastMood: { marginTop: "16px", width: "100%" },
  chartCard: { background: card, border: `1px solid ${border}`, borderRadius: "20px", padding: "24px", marginBottom: "20px", backdropFilter: "blur(10px)" },
  chartHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" },
  chartSub: { color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: 0 },
  targetPill: { background: "rgba(74,222,128,0.1)", color: "#4ade80", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  historyCard: { background: card, border: `1px solid ${border}`, borderRadius: "20px", padding: "24px", backdropFilter: "blur(10px)" },
  historyList: { display: "flex", flexDirection: "column", gap: "0" },
  historyItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${border}` },
  historyLeft: { display: "flex", alignItems: "center", gap: "12px" },
  historyDate: { color: "#fff", fontSize: "14px", fontWeight: "600", margin: 0 },
  historyNote: { color: "rgba(255,255,255,0.3)", fontSize: "12px", margin: "2px 0 0" },
  historyWeight: { color: "#a78bfa", fontSize: "16px", fontWeight: "700" },
  emptyBox: { textAlign: "center", padding: "60px 20px" },
  emptyTitle: { color: "#fff", fontSize: "24px", fontWeight: "700", margin: "16px 0 8px" },
  emptySub: { color: "rgba(255,255,255,0.3)", fontSize: "14px", margin: "0 0 24px" },
};