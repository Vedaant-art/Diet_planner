import { useState, useEffect } from "react";
import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";
import Progress from "./Progress";
import Workout from "./Workout";
const API = "http://127.0.0.1:8000";

const getCategoryColor = (category) => {
  const colors = {
    "Severely Underweight": "#a78bfa",
    "Underweight": "#818cf8",
    "Healthy": "#fff",
    "Overweight": "#fbbf24",
    "Obese": "#fb923c",
    "Severely Obese": "#f87171",
  };
  return colors[category] || "#fff";
};

const mealLabels = {
  breakfast: "🌅 Breakfast",
  morning_snack: "🍎 Morning Snack",
  lunch: "🍱 Lunch",
  evening_snack: "☕ Evening Snack",
  dinner: "🌙 Dinner",
};

export default function Dashboard({ token, onLogout, onNewPlan }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setData(json);
    } catch {
      setData({ has_plan: false });
    }
    setLoading(false);
  };

  if (loading) return (
    <div style={s.fullCenter}>
      <div style={s.spinner} />
      <p style={s.loadingText}>Loading your plan...</p>
    </div>
  );

  if (!data?.has_plan) return (
    <div style={s.fullCenter}>
      <div style={s.emptyBox}>
        <p style={{ fontSize: "56px" }}>🥗</p>
        <h2 style={s.emptyTitle}>No Plan Yet</h2>
        <p style={s.emptySubtitle}>Complete the BMI calculator to generate your personalized plan</p>
        <button style={s.primaryBtn} onClick={onNewPlan}>Get Started →</button>
      </div>
    </div>
  );

  const bmiData = [{ value: Math.min((data.bmi / 40) * 100, 100) }];

  return (
    <div style={s.layout}>

      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.logoWrap}>
          <span style={s.logoIcon}>🧬</span>
          <span style={s.logoText}>NutriPlan</span>
        </div>

        <nav style={s.navList}>
          {[
            { id: "overview", icon: "⚡", label: "Overview" },
            { id: "diet", icon: "🥗", label: "Diet Plan" },
            { id: "supplements", icon: "💊", label: "Supplements" },
            { id: "progress", icon: "📈", label: "Progress" },
            { id: "workout", icon: "💪", label: "Workout" },
          ].map(item => (
            <button key={item.id}
            className="nav-item"
              style={activeTab === item.id ? s.navItemActive : s.navItem}
              onClick={() => setActiveTab(item.id)}>
              <span style={s.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={s.sidebarFooter}>
          <div style={s.userChip}>
            <div style={s.avatarSm}>{data.user_name?.[0]?.toUpperCase()}</div>
            <div>
              <p style={s.chipName}>{data.user_name}</p>
              <p style={s.chipEmail}>{data.user_email?.split("@")[0]}@...</p>
            </div>
          </div>
          <button style={s.newPlanBtn} onClick={onNewPlan}>🔄 New Plan</button>
          <button style={s.logoutBtn} onClick={onLogout}>← Logout</button>
        </div>
      </aside>

      {/* Main */}
      <main style={s.main}>

        {/* Topbar */}
        <div style={s.topbar}>
          <div>
            <h1 style={s.pageTitle}>
              {activeTab === "overview" && "Health Overview"}
              {activeTab === "diet" && "Your Diet Plan"}
              {activeTab === "supplements" && "Supplements"}
              {activeTab === "progress" && (
                <Progress token={token} onBack={() => setActiveTab("overview")} userGoal={data.goal} />
              )}
              {activeTab === "workout" && (
                <Workout token={token} onBack={() => setActiveTab("overview")} userGoal={data.goal} />
              )}
            </h1>
            <p style={s.pageDate}>Last updated: {data.date_created}</p>
          </div>
          <div style={s.avatarLg}>{data.user_name?.[0]?.toUpperCase()}</div>
        </div>

        <div style={s.scrollArea}>

          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <>
              {/* Stat Cards */}
              <div style={s.grid4}>
                {[
                  { label: "Current Weight", value: `${data.weight} kg`, icon: "⚖️", sub: `Height: ${data.height} cm` },
                  { label: "Target Weight", value: `${data.target_weight} kg`, icon: "🎯", sub: `Change: ${data.weight_change > 0 ? "+" : ""}${data.weight_change} kg` },
                  { label: "Daily Calories", value: data.daily_calories, icon: "🔥", sub: data.deficit_surplus },
                  { label: "Timeline", value: `${data.timeline_weeks}w`, icon: "📅", sub: `Goal: ${data.goal?.replace("_", " ")}` },
                ].map((c, i) => (
                  <div key={i} style={s.statCard} className="stat-card">
         
                    <div style={s.statTop}>
                      <p style={s.statLabel}>{c.label}</p>
                      <span style={s.statIcon}>{c.icon}</span>
                    </div>
                    <p style={s.statValue}>{c.value}</p>
                    <p style={s.statSub}>{c.sub}</p>
                  </div>
                ))}
              </div>

              {/* Middle Row */}
              <div style={s.grid3}>

                {/* BMI Gauge */}
                <div style={s.card}>
                  <p style={s.cardLabel}>BODY MASS INDEX</p>
                  <div style={{ position: "relative", display: "flex", justifyContent: "center", marginTop: "8px" }}>
                    <RadialBarChart width={180} height={110} cx={90} cy={100}
                      innerRadius={65} outerRadius={90} startAngle={180} endAngle={0} data={bmiData}>
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background={{ fill: "rgba(255,255,255,0.05)" }}
                        dataKey="value" angleAxisId={0}
                        fill={getCategoryColor(data.bmi_category)} cornerRadius={4} />
                    </RadialBarChart>
                    <div style={s.gaugeCenter}>
                      <p style={s.gaugeNum}>{data.bmi}</p>
                      <p style={s.gaugeLabel}>BMI</p>
                    </div>
                  </div>
                  <p style={{ ...s.bmiCatText, color: getCategoryColor(data.bmi_category) }}>
                    {data.bmi_category}
                  </p>
                  <div style={s.bmiBar}>
                    {["#a78bfa", "#818cf8", "#ffffff", "#fbbf24", "#fb923c", "#f87171"].map((c, i) => (
                      <div key={i} style={{ flex: 1, height: "5px", borderRadius: "3px", background: c, opacity: i === ["Severely Underweight","Underweight","Healthy","Overweight","Obese","Severely Obese"].indexOf(data.bmi_category) ? 1 : 0.2 }} />
                    ))}
                  </div>
                </div>

                {/* Goal Card */}
                <div style={s.card}>
                  <p style={s.cardLabel}>YOUR GOAL</p>
                  <div style={s.rowList}>
                    {[
                      ["Current BMI", data.bmi],
                      ["Target BMI", data.target_bmi],
                      ["Weight Change", `${data.weight_change > 0 ? "+" : ""}${data.weight_change} kg`],
                      ["Calorie Shift", data.deficit_surplus],
                      ["Realistic", data.realistic === "Yes" ? "✅ Yes" : "⚠️ Challenging"],
                      ["Fitness Goal", data.goal?.replace("_", " ")],
                    ].map(([k, v], i) => (
                      <div key={i} style={s.rowItem}>
                        <span style={s.rowKey}>{k}</span>
                        <span style={s.rowVal}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Body Stats */}
                <div style={s.card}>
                  <p style={s.cardLabel}>BODY STATS</p>
                  <div style={s.rowList}>
                    {[
                      ["Age", `${data.age} years`],
                      ["Height", `${data.height} cm`],
                      ["Weight", `${data.weight} kg`],
                      ["Target Weight", `${data.target_weight} kg`],
                      ["Timeline", `${data.timeline_weeks} weeks`],
                      ["Budget", data.budget ? `₹${data.budget}/mo` : "No supplements"],
                    ].map(([k, v], i) => (
                      <div key={i} style={s.rowItem}>
                        <span style={s.rowKey}>{k}</span>
                        <span style={s.rowVal}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Advice */}
              {data.advice && (
                <div style={s.adviceCard}>
                  <div style={s.adviceLeft}>
                    <p style={s.adviceIcon}>💡</p>
                    <div>
                      <p style={s.adviceTitle}>AI Recommendation</p>
                      <p style={s.adviceText}>{data.advice}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── DIET PLAN ── */}
          {activeTab === "diet" && (
            <>
              <div style={s.dietGrid}>
                {data.meals && Object.entries(data.meals).map(([key, meal]) => (
                  <div key={key} style={s.mealCard} className="meal-card">
                    <div style={s.mealTop}>
                      <p style={s.mealType}>{mealLabels[key] || key}</p>
                      <span style={s.calPill}>{meal.calories} kcal</span>
                    </div>
                    <p style={s.mealName}>{meal.name}</p>
                    <div style={s.divider} />
                    <p style={s.mealIngr}>🥄 {meal.ingredients}</p>
                  </div>
                ))}
              </div>
              <div style={s.totalRow}>
                <span style={s.totalLabel}>Total Daily Calories</span>
                <span style={s.totalValue}>{data.total_calories} kcal</span>
              </div>
            </>
          )}

          {/* ── SUPPLEMENTS ── */}
          {activeTab === "supplements" && (
            <>
              {data.supplements && data.supplements.length > 0 ? (
                <div style={s.suppGrid}>
                  {data.supplements.map((supp, i) => (
                    <div key={i} style={s.suppCard}>
                      <div style={s.suppIconWrap}>💊</div>
                      <p style={s.suppName}>{supp.name}</p>
                      <p style={s.suppBrand}>{supp.brand}</p>
                      <div style={s.suppPills}>
                        <span style={s.costPill}>{supp.cost}</span>
                        <span style={s.dosePill}>{supp.dose}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={s.fullCenter}>
                  <div style={s.emptyBox}>
                    <p style={{ fontSize: "48px" }}>💊</p>
                    <h2 style={s.emptyTitle}>No Supplements</h2>
                    <p style={s.emptySubtitle}>You didn't add supplements to your plan</p>
                    <button style={s.primaryBtn} onClick={onNewPlan}>Create New Plan</button>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}

const purple = "#1a1040";
const card = "rgba(255,255,255,0.05)";
const border = "rgba(255,255,255,0.08)";

const s = {
  layout: { display: "flex", minHeight: "100vh", background: "linear-gradient(135deg, #0f0726 0%, #1a1040 50%, #0f0726 100%)", fontFamily: "'Segoe UI', sans-serif" },

  // Sidebar
  sidebar: { width: "240px", background: "rgba(255,255,255,0.03)", borderRight: `1px solid ${border}`, display: "flex", flexDirection: "column", padding: "28px 0", position: "fixed", height: "100vh", backdropFilter: "blur(10px)" },
  logoWrap: { display: "flex", alignItems: "center", gap: "10px", padding: "0 24px", marginBottom: "36px" },
  logoIcon: { fontSize: "24px" },
  logoText: { fontSize: "22px", fontWeight: "700", color: "#fff", letterSpacing: "-0.5px" },
  navList: { display: "flex", flexDirection: "column", gap: "4px", flex: 1, padding: "0 12px" },
  navItem: { display: "flex", alignItems: "center", gap: "12px", padding: "11px 16px", borderRadius: "10px", border: "none", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: "14px", cursor: "pointer", textAlign: "left", transition: "all 0.2s" },
  navItemActive: { display: "flex", alignItems: "center", gap: "12px", padding: "11px 16px", borderRadius: "10px", border: `1px solid ${border}`, background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: "14px", cursor: "pointer", textAlign: "left", fontWeight: "600" },
  navIcon: { fontSize: "16px" },
  sidebarFooter: { padding: "16px 16px", display: "flex", flexDirection: "column", gap: "8px" },
  userChip: { display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.05)", border: `1px solid ${border}`, marginBottom: "4px" },
  avatarSm: { width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #a78bfa, #7c3aed)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "14px", flexShrink: 0 },
  chipName: { color: "#fff", fontSize: "13px", fontWeight: "600", margin: 0 },
  chipEmail: { color: "rgba(255,255,255,0.4)", fontSize: "11px", margin: 0 },
  newPlanBtn: { padding: "10px", borderRadius: "10px", background: "linear-gradient(135deg, #a78bfa, #7c3aed)", color: "#fff", fontWeight: "600", fontSize: "13px", border: "none", cursor: "pointer" },
  logoutBtn: { padding: "10px", borderRadius: "10px", background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: "13px", border: `1px solid ${border}`, cursor: "pointer" },

  // Main
  main: { marginLeft: "240px", flex: 1, display: "flex", flexDirection: "column" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "28px 36px 0", marginBottom: "28px" },
  pageTitle: { fontSize: "28px", fontWeight: "700", color: "#fff", margin: 0 },
  pageDate: { color: "rgba(255,255,255,0.3)", fontSize: "13px", marginTop: "4px" },
  avatarLg: { width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg, #a78bfa, #7c3aed)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "18px" },
  scrollArea: { padding: "0 36px 36px", overflowY: "auto" },

  // Stat Cards
  grid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" },
  statCard: { background: card, border: `1px solid ${border}`, borderRadius: "16px", padding: "20px", backdropFilter: "blur(10px)" },
  statTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" },
  statLabel: { color: "rgba(255,255,255,0.4)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.8px", margin: 0 },
  statIcon: { fontSize: "20px" },
  statValue: { color: "#fff", fontSize: "24px", fontWeight: "700", margin: "0 0 4px" },
  statSub: { color: "rgba(255,255,255,0.35)", fontSize: "12px", margin: 0 },

  // 3 col grid
  grid3: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" },
  card: { background: card, border: `1px solid ${border}`, borderRadius: "16px", padding: "20px", backdropFilter: "blur(10px)" },
  cardLabel: { color: "rgba(255,255,255,0.3)", fontSize: "11px", letterSpacing: "1.5px", margin: "0 0 12px" },

  // BMI Gauge
  gaugeCenter: { position: "absolute", bottom: "0px", left: "50%", transform: "translateX(-50%)", textAlign: "center" },
  gaugeNum: { fontSize: "26px", fontWeight: "700", color: "#fff", margin: 0 },
  gaugeLabel: { fontSize: "11px", color: "rgba(255,255,255,0.3)", margin: 0 },
  bmiCatText: { textAlign: "center", fontWeight: "600", fontSize: "15px", marginTop: "10px" },
  bmiBar: { display: "flex", gap: "4px", marginTop: "12px" },

  // Row list
  rowList: { display: "flex", flexDirection: "column", gap: "0" },
  rowItem: { display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${border}` },
  rowKey: { color: "rgba(255,255,255,0.35)", fontSize: "13px" },
  rowVal: { color: "#fff", fontSize: "13px", fontWeight: "600" },

  // Advice
  adviceCard: { background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: "16px", padding: "20px" },
  adviceLeft: { display: "flex", gap: "16px", alignItems: "flex-start" },
  adviceIcon: { fontSize: "28px", margin: 0 },
  adviceTitle: { color: "#a78bfa", fontSize: "13px", fontWeight: "600", letterSpacing: "0.5px", margin: "0 0 6px" },
  adviceText: { color: "rgba(255,255,255,0.6)", fontSize: "14px", lineHeight: "1.7", margin: 0 },

  // Diet
  dietGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "16px" },
  mealCard: { background: card, border: `1px solid ${border}`, borderRadius: "16px", padding: "20px", backdropFilter: "blur(10px)" },
  mealTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  mealType: { color: "rgba(255,255,255,0.35)", fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", margin: 0 },
  calPill: { background: "rgba(167,139,250,0.15)", color: "#a78bfa", padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  mealName: { color: "#fff", fontSize: "15px", fontWeight: "600", margin: "0 0 10px" },
  divider: { height: "1px", background: border, margin: "10px 0" },
  mealIngr: { color: "rgba(255,255,255,0.35)", fontSize: "13px", lineHeight: "1.5", margin: 0 },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: card, borderRadius: "12px", border: `1px solid ${border}` },
  totalLabel: { color: "rgba(255,255,255,0.4)", fontSize: "14px" },
  totalValue: { color: "#fff", fontSize: "20px", fontWeight: "700" },

  // Supplements
  suppGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" },
  suppCard: { background: card, border: `1px solid ${border}`, borderRadius: "16px", padding: "24px", textAlign: "center", backdropFilter: "blur(10px)" },
  suppIconWrap: { fontSize: "36px", marginBottom: "12px" },
  suppName: { color: "#fff", fontSize: "15px", fontWeight: "600", margin: "0 0 4px" },
  suppBrand: { color: "rgba(255,255,255,0.35)", fontSize: "13px", margin: "0 0 12px" },
  suppPills: { display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" },
  costPill: { background: "rgba(167,139,250,0.15)", color: "#a78bfa", padding: "4px 10px", borderRadius: "20px", fontSize: "12px" },
  dosePill: { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", padding: "4px 10px", borderRadius: "20px", fontSize: "12px" },

  // Loading / Empty
  fullCenter: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0f0726 0%, #1a1040 50%, #0f0726 100%)" },
  spinner: { width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.1)", borderTop: "3px solid #a78bfa", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "16px" },
  loadingText: { color: "rgba(255,255,255,0.4)", fontSize: "15px" },
  emptyBox: { textAlign: "center", padding: "48px", maxWidth: "400px" },
  emptyTitle: { color: "#fff", fontSize: "24px", fontWeight: "700", margin: "16px 0 8px" },
  emptySubtitle: { color: "rgba(255,255,255,0.35)", fontSize: "14px", lineHeight: "1.6", margin: "0 0 24px" },
  primaryBtn: { padding: "12px 28px", borderRadius: "12px", background: "linear-gradient(135deg, #a78bfa, #7c3aed)", color: "#fff", fontWeight: "600", fontSize: "15px", border: "none", cursor: "pointer" },
};