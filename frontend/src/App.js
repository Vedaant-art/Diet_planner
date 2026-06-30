import { useState } from "react";
import Auth from "./Auth";
import BMI from "./BMI";
import Dashboard from "./Dashboard";
import Profile from "./Profile";
import Assistant from "./Assistant";
import "./App.css";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [view, setView] = useState("dashboard"); // "dashboard" | "planner" | "profile"

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  if (!token) return <Auth onLogin={(t) => { setToken(t); setView("dashboard"); }} />;

  if (view === "planner") return (
    <>
      <BMI token={token} onLogout={handleLogout} onDashboard={() => setView("dashboard")} />
      <Assistant token={token} />
    </>
  );

  if (view === "profile") return (
    <>
      <Profile token={token} onLogout={handleLogout} onBack={() => setView("dashboard")} />
      <Assistant token={token} />
    </>
  );

  return (
    <>
      <Dashboard
        token={token}
        onLogout={handleLogout}
        onNewPlan={() => setView("planner")}
        onProfile={() => setView("profile")}
      />
      <Assistant token={token} />
    </>
  );
}

export default App;