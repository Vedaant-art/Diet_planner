import { useState } from "react";
import Auth from "./Auth";
import BMI from "./BMI";
import Dashboard from "./Dashboard";
import "./App.css";
import Assistant from "./Assistant";
function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [view, setView] = useState("dashboard"); // "dashboard" or "planner"

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  if (!token) return <Auth onLogin={(t) => { setToken(t); setView("dashboard"); }} />;

  if (view === "planner") {
    return (
      <>
        <BMI 
          token={token}
          onLogout={handleLogout}
          onDashboard={() => setView("dashboard")}
        />
        {token && <Assistant token={token} />}
      </>
    );
  }

  return (
    <>
      <Dashboard
        token={token}
        onLogout={handleLogout}
        onNewPlan={() => setView("planner")}
      />
      {token && <Assistant token={token} />}
    </>
  );
}

export default App;