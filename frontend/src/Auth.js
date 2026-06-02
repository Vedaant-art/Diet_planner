import { useState } from "react";

const API = "http://127.0.0.1:8000";

function Auth({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Registered! Please login.");
        setTab("login");
      } else {
        setMessage("❌ " + data.detail);
      }
    } catch {
      setMessage("❌ Server error");
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          username: form.email,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.access_token);
        onLogin(data.access_token);
      } else {
        setMessage("❌ " + data.detail);
      }
    } catch {
      setMessage("❌ Server error");
    }
    setLoading(false);
  };

  return (
    <div style={styles.card}>
      <h1 style={styles.title}>🥗 BMI Calculator</h1>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={tab === "login" ? styles.activeTab : styles.tab}
          onClick={() => { setTab("login"); setMessage(""); }}
        >
          Login
        </button>
        <button
          style={tab === "register" ? styles.activeTab : styles.tab}
          onClick={() => { setTab("register"); setMessage(""); }}
        >
          Register
        </button>
      </div>

      {/* Form */}
      <div style={styles.form}>
        {tab === "register" && (
          <input
            style={styles.input}
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
          />
        )}
        <input
          style={styles.input}
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          style={styles.input}
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />

        {message && <p style={styles.message}>{message}</p>}

        <button
          style={styles.button}
          onClick={tab === "login" ? handleLogin : handleRegister}
          disabled={loading}
        >
          {loading ? "Please wait..." : tab === "login" ? "Login" : "Register"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "#1a1a1a",
    padding: "40px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 0 30px rgba(0,0,0,0.5)",
  },
  title: {
    textAlign: "center",
    marginBottom: "24px",
    fontSize: "24px",
    color: "#4ade80",
  },
  tabs: {
    display: "flex",
    marginBottom: "24px",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #333",
  },
  tab: {
    flex: 1,
    padding: "10px",
    background: "#0f0f0f",
    color: "#888",
    border: "none",
    fontSize: "15px",
  },
  activeTab: {
    flex: 1,
    padding: "10px",
    background: "#4ade80",
    color: "#000",
    border: "none",
    fontSize: "15px",
    fontWeight: "bold",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #333",
    background: "#0f0f0f",
    color: "#fff",
    fontSize: "15px",
  },
  button: {
    padding: "12px",
    borderRadius: "8px",
    background: "#4ade80",
    color: "#000",
    fontWeight: "bold",
    fontSize: "16px",
    border: "none",
    marginTop: "4px",
  },
  message: {
    textAlign: "center",
    fontSize: "14px",
    color: "#aaa",
  },
};

export default Auth;