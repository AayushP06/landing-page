import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CATEGORIES = ["Food & Dining", "Software", "Travel", "Supplies", "Marketing", "Utilities", "Other"];
const COLORS = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

const today = () => new Date().toISOString().split("T")[0];
const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const initialData = [
  { id: 1, name: "Notion Pro", category: "Software", amount: 1200, date: today() },
  { id: 2, name: "Team Lunch", category: "Food & Dining", amount: 3800, date: today() },
  { id: 3, name: "AWS Bill", category: "Utilities", amount: 17500, date: today() },
  { id: 4, name: "Office Supplies", category: "Supplies", amount: 1850, date: today() },
];

const Card = ({ children, style = {} }) => (
  <div style={{ background: "#ffffff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0", ...style }}>
    {children}
  </div>
);

const Label = ({ children }) => (
  <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{children}</div>
);

export default function App() {
  const [purchases, setPurchases] = useState(initialData);
  const [form, setForm] = useState({ name: "", category: CATEGORIES[0], amount: "", date: today() });
  const [aiInsight, setAiInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [nextId, setNextId] = useState(5);

  const todayStr = today();
  const todayTotal = useMemo(() => purchases.filter(p => p.date === todayStr).reduce((s, p) => s + +p.amount, 0), [purchases]);
  const weekTotal = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return purchases.filter(p => new Date(p.date) >= d).reduce((s, p) => s + +p.amount, 0);
  }, [purchases]);
  const allTotal = useMemo(() => purchases.reduce((s, p) => s + +p.amount, 0), [purchases]);

  const catData = useMemo(() => {
    const map = {};
    purchases.forEach(p => { map[p.category] = (map[p.category] || 0) + +p.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value: +value.toFixed(2) }));
  }, [purchases]);

  const topCat = catData.reduce((a, b) => b.value > a.value ? b : a, { name: "—", value: 0 });

  const handleAdd = () => {
    if (!form.name || !form.amount || isNaN(form.amount)) return;
    setPurchases(prev => [...prev, { ...form, amount: +form.amount, id: nextId }]);
    setNextId(n => n + 1);
    setForm({ name: "", category: CATEGORIES[0], amount: "", date: today() });
  };

  const handleDelete = (id) => setPurchases(prev => prev.filter(p => p.id !== id));

  const getInsight = async () => {
    setAiLoading(true);
    setAiInsight("");
    const summary = catData.map(c => `${c.name}: ${fmt(c.value)}`).join(", ");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a business spending analyst for an Indian company. Here is a summary of purchases totaling ${fmt(allTotal)}: ${summary}. Give 3 concise, actionable insights about spending patterns, savings opportunities, or cost flags. Use INR (₹) for amounts. Use bullet points. Under 120 words.`
          }]
        })
      });
      const data = await res.json();
      setAiInsight(data.content?.[0]?.text || "No insight returned.");
    } catch {
      setAiInsight("Failed to fetch insight. Please try again.");
    }
    setAiLoading(false);
  };

  const inputStyle = {
    width: "100%", background: "#f9fafb", border: "1px solid #e5e7eb",
    borderRadius: 8, padding: "9px 12px", color: "#111827", fontSize: 14,
    boxSizing: "border-box", outline: "none", transition: "border 0.2s"
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f6f9", fontFamily: "'Inter', system-ui, sans-serif", padding: "28px 32px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>₹</div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111827" }}>SpendBoard</h1>
          </div>
          <p style={{ margin: "4px 0 0 46px", color: "#9ca3af", fontSize: 13 }}>Business Expense Tracker</p>
        </div>
        <div style={{ display: "flex", gap: 6, background: "#e9edf2", padding: 4, borderRadius: 10 }}>
          {[["dashboard", "Dashboard"], ["log", "Add & Log"]].map(([t, l]) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 13, transition: "all 0.15s",
              background: activeTab === t ? "#ffffff" : "transparent",
              color: activeTab === t ? "#6366f1" : "#6b7280",
              boxShadow: activeTab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
            }}>{l}</button>
          ))}
        </div>
      </div>

      {activeTab === "dashboard" && (
        <>
          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
            {[
              { label: "Today's Spend", value: fmt(todayTotal), icon: "📅", accent: "#6366f1" },
              { label: "7-Day Total", value: fmt(weekTotal), icon: "📆", accent: "#0ea5e9" },
              { label: "All Time", value: fmt(allTotal), icon: "💼", accent: "#10b981" },
              { label: "Top Category", value: topCat.name, sub: fmt(topCat.value), icon: "🏆", accent: "#f59e0b" },
            ].map(c => (
              <Card key={c.label} style={{ borderLeft: `4px solid ${c.accent}`, padding: "18px 20px" }}>
                <Label>{c.label}</Label>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginTop: 6 }}>{c.value}</div>
                {c.sub && <div style={{ fontSize: 12, color: c.accent, fontWeight: 600, marginTop: 2 }}>{c.sub}</div>}
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 20 }}>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 16 }}>Spend by Category</div>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={catData} barCategoryGap="35%">
                  <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13 }} formatter={v => fmt(v)} cursor={{ fill: "#f3f4f6" }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 16 }}>Distribution</div>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={75} innerRadius={38}>
                    {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13 }} formatter={v => fmt(v)} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#6b7280" }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* AI Insight */}
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: aiInsight ? 14 : 0 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>AI Spending Insights</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Powered by Claude</div>
              </div>
              <button onClick={getInsight} disabled={aiLoading} style={{
                padding: "9px 20px", borderRadius: 8, border: "none", cursor: aiLoading ? "not-allowed" : "pointer",
                fontWeight: 700, fontSize: 13, background: aiLoading ? "#e5e7eb" : "linear-gradient(135deg, #6366f1, #0ea5e9)",
                color: aiLoading ? "#9ca3af" : "#fff", transition: "opacity 0.2s"
              }}>{aiLoading ? "Analyzing…" : "Analyze Spending"}</button>
            </div>
            {aiInsight && <div style={{ color: "#374151", fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap", borderTop: "1px solid #f0f0f0", paddingTop: 14 }}>{aiInsight}</div>}
            {!aiInsight && <div style={{ fontSize: 13, color: "#d1d5db", marginTop: 10 }}>Click "Analyze Spending" to get AI-powered insights on your expenses.</div>}
          </Card>
        </>
      )}

      {activeTab === "log" && (
        <>
          {/* Add Form */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 18 }}>Add New Purchase</div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1.2fr auto", gap: 12, alignItems: "end" }}>
              {[
                { key: "name", label: "Item Name", type: "text", placeholder: "e.g. Office Chair" },
                { key: "date", label: "Date", type: "date" },
                { key: "amount", label: "Amount (₹)", type: "number", placeholder: "0.00" },
              ].map(f => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <input type={f.type} placeholder={f.placeholder} value={form[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    style={inputStyle} />
                </div>
              ))}
              <div>
                <Label>Category</Label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={handleAdd} style={{
                background: "linear-gradient(135deg, #6366f1, #0ea5e9)", border: "none", borderRadius: 8,
                padding: "10px 22px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap"
              }}>+ Add</button>
            </div>
          </Card>

          {/* Table */}
          <Card style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>Transactions</span>
              <span style={{ marginLeft: 8, background: "#f3f4f6", color: "#6b7280", borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 600 }}>{purchases.length}</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Item", "Category", "Date", "Amount", ""].map((h, i) => (
                    <th key={i} style={{ padding: "10px 20px", textAlign: i >= 3 ? "right" : "left", fontSize: 11, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...purchases].reverse().map((p, idx) => {
                  const ci = CATEGORIES.indexOf(p.category) % COLORS.length;
                  return (
                    <tr key={p.id} style={{ borderTop: "1px solid #f3f4f6", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "13px 20px", fontSize: 14, fontWeight: 600, color: "#111827" }}>{p.name}</td>
                      <td style={{ padding: "13px 20px" }}>
                        <span style={{ background: COLORS[ci] + "18", color: COLORS[ci], borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{p.category}</span>
                      </td>
                      <td style={{ padding: "13px 20px", fontSize: 13, color: "#6b7280" }}>{p.date}</td>
                      <td style={{ padding: "13px 20px", fontSize: 14, fontWeight: 700, color: "#111827", textAlign: "right" }}>{fmt(p.amount)}</td>
                      <td style={{ padding: "13px 20px", textAlign: "right" }}>
                        <button onClick={() => handleDelete(p.id)} style={{ background: "none", border: "1px solid #fee2e2", borderRadius: 6, cursor: "pointer", color: "#ef4444", fontSize: 12, padding: "3px 10px", fontWeight: 600 }}>Remove</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
