import { useState, useRef, useEffect } from "react";

const API = "http://127.0.0.1:8000";

const SYSTEM_PROMPT = `You are NutriAI Assistant, a friendly and expert health, fitness, and nutrition coach. 
You ONLY answer questions related to:
- Nutrition, diet, and food
- Fitness, exercise, and workouts
- Weight management and BMI
- Health and wellness
- Supplements and vitamins
- Indian food and diet culture

If asked anything outside these topics, politely redirect to health/fitness topics.
Keep responses concise, friendly, and actionable. Use emojis to make it engaging.
Always give practical, safe advice and recommend consulting a doctor for medical issues.`;

export default function Assistant({ token }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hey! 👋 I'm your NutriAI Assistant. Ask me anything about health, fitness, or nutrition!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          system: SYSTEM_PROMPT,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Try again! 🙏" }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Server error. Please try again! 🙏" }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      {/* Chat Window */}
      {open && (
        <div style={s.window}>
          {/* Header */}
          <div style={s.header}>
            <div style={s.headerLeft}>
              <div style={s.avatarDot} />
              <div>
                <p style={s.headerTitle}>NutriAI Assistant</p>
                <p style={s.headerSub}>Health & Fitness Expert</p>
              </div>
            </div>
            <div style={s.headerActions}>
              <button style={s.iconBtn} onClick={() => setMessages([{
                role: "assistant",
                content: "Hey! 👋 I'm your NutriAI Assistant. Ask me anything about health, fitness, or nutrition!",
              }])} title="Clear chat">🗑️</button>
              <button style={s.iconBtn} onClick={() => setOpen(false)}>✕</button>
            </div>
          </div>

          {/* Messages */}
          <div style={s.messages}>
            {messages.map((msg, i) => (
              <div key={i} style={{ ...s.msgRow, justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                {msg.role === "assistant" && (
                  <div style={s.botAvatar}>🧬</div>
                )}
                <div style={msg.role === "user" ? s.userBubble : s.botBubble}>
                  <p style={s.msgText}>{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ ...s.msgRow, justifyContent: "flex-start" }}>
                <div style={s.botAvatar}>🧬</div>
                <div style={s.botBubble}>
                  <div style={s.typingDots}>
                    <span style={{ ...s.dot, animationDelay: "0s" }} />
                    <span style={{ ...s.dot, animationDelay: "0.2s" }} />
                    <span style={{ ...s.dot, animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={s.inputArea}>
            <textarea
              ref={inputRef}
              style={s.input}
              placeholder="Ask about health, fitness, nutrition..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />
            <button style={{ ...s.sendBtn, opacity: input.trim() ? 1 : 0.4 }}
              onClick={sendMessage} disabled={!input.trim() || loading}>
              ➤
            </button>
          </div>
          <p style={s.footer}>Press Enter to send • Shift+Enter for new line</p>
        </div>
      )}

      {/* Floating Button */}
      <button style={s.fab} onClick={() => setOpen(!open)} className="btn-primary">
        {open ? "✕" : "🧬"}
        {!open && <span style={s.fabLabel}>Ask AI</span>}
      </button>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        .dot-anim {
          animation: bounce 1.2s infinite;
        }
      `}</style>
    </>
  );
}

const s = {
  window: {
    position: "fixed", bottom: "90px", right: "24px", width: "360px",
    height: "500px", background: "linear-gradient(135deg, #0f0726, #1a1040)",
    border: "1px solid rgba(167,139,250,0.25)", borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(167,139,250,0.1)",
    display: "flex", flexDirection: "column", zIndex: 1000,
    animation: "fadeIn 0.3s ease",
    backdropFilter: "blur(20px)",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "10px" },
  avatarDot: {
    width: "36px", height: "36px", borderRadius: "50%",
    background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "18px",
  },
  headerTitle: { color: "#fff", fontSize: "14px", fontWeight: "700", margin: 0 },
  headerSub: { color: "rgba(255,255,255,0.3)", fontSize: "11px", margin: 0 },
  headerActions: { display: "flex", gap: "8px" },
  iconBtn: {
    background: "transparent", border: "none", color: "rgba(255,255,255,0.4)",
    fontSize: "14px", cursor: "pointer", padding: "4px 8px", borderRadius: "6px",
  },
  messages: {
    flex: 1, overflowY: "auto", padding: "16px",
    display: "flex", flexDirection: "column", gap: "12px",
  },
  msgRow: { display: "flex", alignItems: "flex-end", gap: "8px" },
  botAvatar: {
    width: "28px", height: "28px", borderRadius: "50%",
    background: "rgba(167,139,250,0.15)", display: "flex",
    alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0,
  },
  userBubble: {
    background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
    padding: "10px 14px", borderRadius: "16px 16px 4px 16px",
    maxWidth: "75%",
  },
  botBubble: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
    padding: "10px 14px", borderRadius: "16px 16px 16px 4px",
    maxWidth: "75%",
  },
  msgText: { color: "#fff", fontSize: "13px", lineHeight: "1.6", margin: 0, whiteSpace: "pre-wrap" },
  typingDots: { display: "flex", gap: "4px", alignItems: "center", padding: "2px 0" },
  dot: {
    width: "6px", height: "6px", borderRadius: "50%",
    background: "rgba(167,139,250,0.6)", display: "inline-block",
    animation: "bounce 1.2s infinite",
  },
  inputArea: {
    display: "flex", gap: "8px", padding: "12px 16px",
    borderTop: "1px solid rgba(255,255,255,0.06)", alignItems: "flex-end",
  },
  input: {
    flex: 1, background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px",
    color: "#fff", fontSize: "13px", padding: "10px 14px",
    resize: "none", outline: "none", fontFamily: "'Segoe UI', sans-serif",
    maxHeight: "80px",
  },
  sendBtn: {
    width: "38px", height: "38px", borderRadius: "10px",
    background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
    color: "#fff", border: "none", fontSize: "16px",
    cursor: "pointer", flexShrink: 0,
  },
  footer: { color: "rgba(255,255,255,0.2)", fontSize: "10px", textAlign: "center", padding: "0 16px 10px" },
  fab: {
    position: "fixed", bottom: "24px", right: "24px",
    background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
    border: "none", borderRadius: "50px", color: "#fff",
    fontSize: "20px", cursor: "pointer", zIndex: 1001,
    display: "flex", alignItems: "center", gap: "8px",
    padding: "14px 20px", boxShadow: "0 8px 32px rgba(124,58,237,0.4)",
  },
  fabLabel: { fontSize: "14px", fontWeight: "600" },
};