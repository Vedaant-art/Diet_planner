import { useState, useEffect, useRef } from "react";

const API = "http://127.0.0.1:8000";

export default function Profile({ token, onLogout, onBack }) {
  const [activeTab, setActiveTab] = useState("account");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Password change
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState("");

  // Notifications (UI only)
  const [notifs, setNotifs] = useState({
    dailyReminder: true,
    weeklyReport: true,
    aiTips: false,
  });

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchUser(); }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setUser(data);
      setEditName(data.name);
    } catch {}
    setLoading(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage("❌ Image too large. Max 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage("");
    try {
      const body = { name: editName };
      if (avatarPreview) body.avatar = avatarPreview;

      const res = await fetch(`${API}/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setMessage("✅ Profile updated!");
        fetchUser();
        setAvatarPreview(null);
      } else {
        setMessage("❌ Failed to update");
      }
    } catch {
      setMessage("❌ Server error");
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (pwForm.newPw !== pwForm.confirm) {
      setPwMessage("❌ Passwords don't match");
      return;
    }
    if (pwForm.newPw.length < 6) {
      setPwMessage("❌ Password must be at least 6 characters");
      return;
    }
    setPwLoading(true);
    setPwMessage("");
    try {
      const res = await fetch(`${API}/change-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: pwForm.current, new_password: pwForm.newPw }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMessage("✅ Password changed!");
        setPwForm({ current: "", newPw: "", confirm: "" });
      } else {
        setPwMessage("❌ " + data.detail);
      }
    } catch {
      setPwMessage("❌ Server error");
    }
    setPwLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      await fetch(`${API}/delete-account`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      onLogout();
    } catch {}
    setDeleting(false);
  };

  if (loading) return (
    <div style={s.fullCenter}>
      <div style={s.spinner} />
    </div>
  );

  const displayAvatar = avatarPreview || user?.avatar;

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>← Back</button>
        <div>
          <h1 style={s.title}>Settings</h1>
          <p style={s.subtitle}>Manage your account and preferences</p>
        </div>
      </div>

      <div style={s.layout}>
        {/* Sidebar tabs */}
        <div style={s.tabsCol}>
          {[
            { id: "account", icon: "👤", label: "Account" },
            { id: "notifications", icon: "🔔", label: "Notifications" },
            { id: "privacy", icon: "🔒", label: "Privacy" },
          ].map(tab => (
            <button key={tab.id} className="nav-item"
              style={activeTab === tab.id ? s.tabActive : s.tab}
              onClick={() => setActiveTab(tab.id)}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
          <div style={s.divider} />
          <button style={s.logoutTab} onClick={onLogout}>🚪 Sign Out</button>
          <button style={s.exitTab} onClick={() => window.close() || (window.location.href = "about:blank")}>
            ⏻ Exit App
          </button>
        </div>

        {/* Content */}
        <div style={s.content}>

          {/* ACCOUNT TAB */}
          {activeTab === "account" && (
            <div style={s.card} className="fade-in">
              <p style={s.cardTitle}>Account Details</p>

              <div style={s.avatarSection}>
                <div style={s.avatarWrap} onClick={() => fileInputRef.current?.click()}>
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="avatar" style={s.avatarImg} />
                  ) : (
                    <div style={s.avatarFallback}>{user?.name?.[0]?.toUpperCase()}</div>
                  )}
                  <div style={s.avatarOverlay}>📷</div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={handleAvatarChange} />
                <div>
                  <p style={s.avatarHint}>Click to upload a new photo</p>
                  <p style={s.avatarSub}>JPG, PNG (max 2MB)</p>
                </div>
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Full Name</label>
                <input style={s.input} value={editName} onChange={e => setEditName(e.target.value)} />
              </div>

              <div style={s.formGroup}>
                <label style={s.label}>Email Address</label>
                <input style={{ ...s.input, opacity: 0.5 }} value={user?.email} disabled />
                <p style={s.fieldNote}>Email cannot be changed</p>
              </div>

              {message && <p style={s.message}>{message}</p>}

              <button style={s.saveBtn} className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>

              <div style={s.divider} />

              <p style={s.cardTitle}>Change Password</p>
              <div style={s.formGroup}>
                <label style={s.label}>Current Password</label>
                <input style={s.input} type="password" value={pwForm.current}
                  onChange={e => setPwForm({ ...pwForm, current: e.target.value })} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>New Password</label>
                <input style={s.input} type="password" value={pwForm.newPw}
                  onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Confirm New Password</label>
                <input style={s.input} type="password" value={pwForm.confirm}
                  onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
              </div>

              {pwMessage && <p style={s.message}>{pwMessage}</p>}

              <button style={s.saveBtn} className="btn-primary" onClick={handleChangePassword} disabled={pwLoading}>
                {pwLoading ? "Updating..." : "Change Password"}
              </button>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div style={s.card} className="fade-in">
              <p style={s.cardTitle}>Notification Preferences</p>

              {[
                { key: "dailyReminder", label: "Daily Check-in Reminder", desc: "Get reminded to log your weight daily" },
                { key: "weeklyReport", label: "Weekly Progress Report", desc: "Receive a summary of your weekly progress" },
                { key: "aiTips", label: "AI Tips & Suggestions", desc: "Get personalized health tips from your AI assistant" },
              ].map(item => (
                <div key={item.key} style={s.toggleRow} className="hover-card">
                  <div>
                    <p style={s.toggleLabel}>{item.label}</p>
                    <p style={s.toggleDesc}>{item.desc}</p>
                  </div>
                  <div className="toggle"
                    style={{ ...s.toggle, background: notifs[item.key] ? "#a78bfa" : "#333" }}
                    onClick={() => setNotifs({ ...notifs, [item.key]: !notifs[item.key] })}>
                    <div style={{ ...s.toggleDot, transform: notifs[item.key] ? "translateX(24px)" : "translateX(2px)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PRIVACY TAB */}
          {activeTab === "privacy" && (
            <div style={s.card} className="fade-in">
              <p style={s.cardTitle}>Privacy & Data</p>
              <p style={s.privacyText}>
                We store your health data (BMI, diet plans, progress logs, chat history) securely to provide personalized recommendations.
                You can delete all your data and your account permanently at any time.
              </p>

              <div style={s.dangerZone}>
                <p style={s.dangerTitle}>⚠️ Danger Zone</p>
                <p style={s.dangerDesc}>
                  This will permanently delete your account and all associated data including BMI history,
                  diet plans, progress logs, and chat history. This action cannot be undone.
                </p>

                {!showDeleteConfirm ? (
                  <button style={s.deleteBtn} onClick={() => setShowDeleteConfirm(true)}>
                    🗑️ Delete My Account
                  </button>
                ) : (
                  <div style={s.confirmBox} className="fade-in">
                    <p style={s.confirmText}>Type <b style={{ color: "#f87171" }}>DELETE</b> to confirm:</p>
                    <input style={s.input} value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE" />
                    <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                      <button style={s.cancelBtn} onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}>
                        Cancel
                      </button>
                      <button style={{ ...s.deleteBtn, opacity: deleteConfirmText === "DELETE" ? 1 : 0.4, flex: 1 }}
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== "DELETE" || deleting}>
                        {deleting ? "Deleting..." : "Permanently Delete"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const border = "rgba(255,255,255,0.08)";
const card = "rgba(255,255,255,0.04)";

const s = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #0f0726 0%, #1a1040 50%, #0f0726 100%)", padding: "32px 36px", fontFamily: "'Segoe UI', sans-serif" },
  fullCenter: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0f0726, #1a1040)" },
  spinner: { width: "40px", height: "40px", border: "3px solid rgba(255,255,255,0.1)", borderTop: "3px solid #a78bfa", borderRadius: "50%" },
  header: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" },
  backBtn: { background: "transparent", border: `1px solid ${border}`, color: "rgba(255,255,255,0.4)", padding: "8px 16px", borderRadius: "10px", cursor: "pointer", fontSize: "14px" },
  title: { fontSize: "28px", fontWeight: "700", color: "#fff", margin: 0 },
  subtitle: { color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: 0 },
  layout: { display: "flex", gap: "24px" },
  tabsCol: { width: "220px", display: "flex", flexDirection: "column", gap: "4px" },
  tab: { display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "12px", border: "none", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: "14px", cursor: "pointer", textAlign: "left" },
  tabActive: { display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "12px", border: `1px solid ${border}`, background: "rgba(167,139,250,0.1)", color: "#fff", fontSize: "14px", cursor: "pointer", textAlign: "left", fontWeight: "600" },
  divider: { height: "1px", background: border, margin: "12px 0" },
  logoutTab: { display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "12px", border: `1px solid ${border}`, background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: "14px", cursor: "pointer", textAlign: "left" },
  exitTab: { display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(248,113,113,0.2)", background: "rgba(248,113,113,0.05)", color: "#f87171", fontSize: "14px", cursor: "pointer", textAlign: "left", marginTop: "8px" },
  content: { flex: 1 },
  card: { background: card, border: `1px solid ${border}`, borderRadius: "20px", padding: "28px", backdropFilter: "blur(10px)" },
  cardTitle: { color: "#fff", fontSize: "18px", fontWeight: "700", margin: "0 0 20px" },
  avatarSection: { display: "flex", alignItems: "center", gap: "20px", marginBottom: "28px" },
  avatarWrap: { position: "relative", width: "80px", height: "80px", borderRadius: "50%", cursor: "pointer", flexShrink: 0 },
  avatarImg: { width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" },
  avatarFallback: { width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #a78bfa, #7c3aed)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: "700" },
  avatarOverlay: { position: "absolute", bottom: "0", right: "0", width: "28px", height: "28px", borderRadius: "50%", background: "#1a1040", border: `2px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" },
  avatarHint: { color: "#fff", fontSize: "14px", fontWeight: "600", margin: "0 0 4px" },
  avatarSub: { color: "rgba(255,255,255,0.3)", fontSize: "12px", margin: 0 },
  formGroup: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "18px" },
  label: { color: "rgba(255,255,255,0.4)", fontSize: "12px", letterSpacing: "0.8px", textTransform: "uppercase" },
  input: { padding: "12px 16px", borderRadius: "12px", border: `1px solid ${border}`, background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: "14px", outline: "none", width: "100%" },
  fieldNote: { color: "rgba(255,255,255,0.25)", fontSize: "11px", margin: "2px 0 0" },
  message: { color: "#a78bfa", fontSize: "13px", margin: "0 0 12px" },
  saveBtn: { padding: "12px 24px", borderRadius: "12px", background: "linear-gradient(135deg, #a78bfa, #7c3aed)", color: "#fff", fontWeight: "600", fontSize: "14px", border: "none", cursor: "pointer" },
  toggleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "14px", border: `1px solid ${border}`, marginBottom: "12px" },
  toggleLabel: { color: "#fff", fontSize: "14px", fontWeight: "600", margin: "0 0 4px" },
  toggleDesc: { color: "rgba(255,255,255,0.3)", fontSize: "12px", margin: 0 },
  toggle: { width: "48px", height: "26px", borderRadius: "13px", cursor: "pointer", position: "relative" },
  toggleDot: { position: "absolute", top: "3px", width: "20px", height: "20px", background: "#fff", borderRadius: "50%", transition: "transform 0.3s" },
  privacyText: { color: "rgba(255,255,255,0.5)", fontSize: "14px", lineHeight: "1.7", margin: "0 0 24px" },
  dangerZone: { background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "16px", padding: "20px" },
  dangerTitle: { color: "#f87171", fontSize: "15px", fontWeight: "700", margin: "0 0 8px" },
  dangerDesc: { color: "rgba(255,255,255,0.4)", fontSize: "13px", lineHeight: "1.6", margin: "0 0 16px" },
  deleteBtn: { padding: "12px 20px", borderRadius: "12px", background: "rgba(248,113,113,0.15)", color: "#f87171", fontWeight: "600", fontSize: "14px", border: "1px solid rgba(248,113,113,0.3)", cursor: "pointer" },
  confirmBox: { marginTop: "8px" },
  confirmText: { color: "rgba(255,255,255,0.5)", fontSize: "13px", margin: "0 0 8px" },
  cancelBtn: { padding: "12px 20px", borderRadius: "12px", background: "transparent", border: `1px solid ${border}`, color: "rgba(255,255,255,0.4)", fontSize: "14px", cursor: "pointer" },
};