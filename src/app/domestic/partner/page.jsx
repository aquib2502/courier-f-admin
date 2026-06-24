"use client"
import { useState, useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────
// Config — change BASE to your actual admin API base URL
// ─────────────────────────────────────────────────────────────
const BASE = process.env.NEXT_PUBLIC_API_URL;

const api = async (path, options = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

// ─────────────────────────────────────────────────────────────
// Tiny helpers
// ─────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d) =>
  new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const TypePill = ({ type }) => {
  const map = {
    CREDIT: { bg: "#14532d", color: "#4ade80", text: "Credit" },
    DEBIT:  { bg: "#1e1b4b", color: "#818cf8", text: "Debit"  },
    REFUND: { bg: "#422006", color: "#fb923c", text: "Refund" },
  };
  const s = map[type] || { bg: "#1f2937", color: "#9ca3af", text: type };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: "monospace", letterSpacing: 0.5 }}>
      {s.text}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// Styles (all inline so the file is self-contained)
// ─────────────────────────────────────────────────────────────
const s = {
  page:       { minHeight: "100vh", background: "#0D0F12", color: "#E8ECF0", fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14 },
  topbar:     { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 56, borderBottom: "1px solid #252A33", background: "#13161B" },
  logoWrap:   { display: "flex", alignItems: "center", gap: 10 },
  logoBox:    { width: 28, height: 28, background: "#3B82F6", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: "#fff" },
  logoText:   { fontWeight: 700, fontSize: 15, letterSpacing: -0.3 },
  logoBadge:  { fontSize: 11, color: "#4E5A67", marginLeft: 8 },
  nav:        { display: "flex", gap: 4 },
  navLink:    (active) => ({ padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "none", background: active ? "#1D2535" : "transparent", color: active ? "#3B82F6" : "#8B95A1", textDecoration: "none", display: "inline-block" }),
  main:       { maxWidth: 1280, margin: "0 auto", padding: "32px 32px" },
  pageHead:   { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 },
  h1:         { fontSize: 22, fontWeight: 700, letterSpacing: -0.4, color: "#fff", marginBottom: 4 },
  subhead:    { fontSize: 13, color: "#8B95A1" },
  btn:        (variant = "primary") => ({
    display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px",
    borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: "pointer", border: "none",
    background: variant === "primary" ? "#3B82F6" : variant === "danger" ? "#EF4444" : "#1A1E25",
    color: variant === "ghost" ? "#8B95A1" : "#fff",
    transition: "opacity 0.15s",
  }),
  card:       { background: "#13161B", border: "1px solid #252A33", borderRadius: 10 },
  statGrid:   { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 },
  statCard:   { background: "#13161B", border: "1px solid #252A33", borderRadius: 10, padding: "18px 20px" },
  statLabel:  { fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#4E5A67", fontWeight: 600, marginBottom: 6 },
  statValue:  { fontSize: 24, fontWeight: 700, color: "#fff", letterSpacing: -0.5 },
  statSub:    { fontSize: 12, color: "#8B95A1", marginTop: 2 },
  tableWrap:  { overflowX: "auto" },
  table:      { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th:         { padding: "10px 14px", background: "#1A1E25", color: "#4E5A67", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, textAlign: "left", borderBottom: "1px solid #252A33", whiteSpace: "nowrap" },
  td:         { padding: "12px 14px", borderBottom: "1px solid #1A1E25", color: "#C9D1D9", verticalAlign: "middle" },
  input:      { background: "#1A1E25", border: "1px solid #252A33", borderRadius: 7, padding: "9px 12px", color: "#E8ECF0", fontSize: 13, width: "100%", outline: "none" },
  label:      { fontSize: 12, fontWeight: 600, color: "#8B95A1", marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: 0.6 },
  formRow:    { marginBottom: 16 },
  modal:      { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 },
  modalBox:   { background: "#13161B", border: "1px solid #252A33", borderRadius: 12, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto" },
  modalHead:  { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #252A33" },
  modalTitle: { fontSize: 16, fontWeight: 700, color: "#fff" },
  modalBody:  { padding: "24px" },
  modalFoot:  { padding: "16px 24px", borderTop: "1px solid #252A33", display: "flex", justifyContent: "flex-end", gap: 10 },
  closeBtn:   { background: "none", border: "none", color: "#8B95A1", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 2 },
  badge:      (on) => ({ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: on ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color: on ? "#4ade80" : "#f87171" }),
  codebox:    { background: "#0D0F12", border: "1px solid #252A33", borderRadius: 7, padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: "#A5D6FF", wordBreak: "break-all", lineHeight: 1.7 },
  copyBtn:    { background: "#1A1E25", border: "1px solid #252A33", borderRadius: 5, padding: "4px 10px", color: "#8B95A1", cursor: "pointer", fontSize: 11, fontWeight: 600 },
  emptyState: { textAlign: "center", padding: "60px 20px", color: "#4E5A67" },
  spinner:    { display: "inline-block", width: 16, height: 16, border: "2px solid #252A33", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.6s linear infinite" },
  error:      { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 16 },
  success:    { background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 7, padding: "10px 14px", color: "#4ade80", fontSize: 13, marginBottom: 16 },
};

// ─────────────────────────────────────────────────────────────
// Create Partner Modal
// ─────────────────────────────────────────────────────────────
function CreatePartnerModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: "", initialWalletBalance: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const copy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  const submit = async () => {
    if (!form.name.trim()) return setError("Partner name is required");
    setLoading(true);
    setError("");
    try {
      const res = await api("/api/domestic-admin/add-partner", {
        method: "POST",
        body: JSON.stringify({ 
          name: form.name, 
          initialWalletBalance: Number(form.initialWalletBalance) || 0,
          email: form.email.trim() || undefined,
          password: form.password || undefined
        }),
      });
      setCreated(res.data);
      onCreated?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.modal} onClick={(e) => e.target === e.currentTarget && !created && onClose()}>
      <div style={s.modalBox}>
        <div style={s.modalHead}>
          <span style={s.modalTitle}>{created ? "Partner Created" : "Add Partner"}</span>
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>
        <div style={s.modalBody}>
          {created ? (
            <>
              <div style={{ ...s.success, marginBottom: 20 }}>Partner <strong>{created.name}</strong> created successfully. Save these credentials now — the secret cannot be shown again.</div>
              {[["API Key", created.apiKey], ["API Secret", created.apiSecret]].map(([label, val]) => (
                <div key={label} style={s.formRow}>
                  <label style={s.label}>{label}</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ ...s.codebox, flex: 1 }}>{val}</div>
                    <button style={s.copyBtn} onClick={() => copy(val, label)}>
                      {copied === label ? "✓" : "Copy"}
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
                {[["Wallet Balance", fmt(created.walletBalance)], ["Status", created.isActive ? "Active" : "Inactive"]].map(([k, v]) => (
                  <div key={k} style={{ background: "#0D0F12", borderRadius: 7, padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, color: "#4E5A67", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{k}</div>
                    <div style={{ fontWeight: 600, color: "#fff" }}>{v}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {error && <div style={s.error}>{error}</div>}
              <div style={s.formRow}>
                <label style={s.label}>Partner Name <span style={{ color: "#EF4444" }}>*</span></label>
                <input style={s.input} placeholder="e.g. Acme Logistics" value={form.name} onChange={set("name")} onKeyDown={(e) => e.key === "Enter" && submit()} />
              </div>
              <div style={s.formRow}>
                <label style={s.label}>Initial Wallet Balance (₹)</label>
                <input style={s.input} type="number" placeholder="0" value={form.initialWalletBalance} onChange={set("initialWalletBalance")} />
              </div>
              <div style={s.formRow}>
                <label style={s.label}>Email Address (For Website Login)</label>
                <input style={s.input} type="email" placeholder="e.g. partner@example.com" value={form.email} onChange={set("email")} />
              </div>
              <div style={s.formRow}>
                <label style={s.label}>Password</label>
                <input style={s.input} type="password" placeholder="Min 6 characters" value={form.password} onChange={set("password")} />
              </div>
            </>
          )}
        </div>
        <div style={s.modalFoot}>
          {created ? (
            <button style={s.btn()} onClick={onClose}>Done</button>
          ) : (
            <>
              <button style={s.btn("ghost")} onClick={onClose}>Cancel</button>
              <button style={s.btn()} onClick={submit} disabled={loading}>
                {loading ? <span style={s.spinner} /> : null} Create Partner
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Credit Wallet Modal
// ─────────────────────────────────────────────────────────────
function CreditWalletModal({ partner, onClose, onCredited }) {
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!amount || Number(amount) <= 0) return setError("Enter a valid amount");
    setLoading(true);
    setError("");
    try {
      await api("/api/domestic-admin/credit-wallet", {
        method: "POST",
        body: JSON.stringify({ partnerId: partner._id, amount: Number(amount), remarks: remarks || "Manual credit" }),
      });
      onCredited?.();
      onClose();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div style={s.modal} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ ...s.modalBox, maxWidth: 420 }}>
        <div style={s.modalHead}>
          <span style={s.modalTitle}>Credit Wallet — {partner.name}</span>
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>
        <div style={s.modalBody}>
          {error && <div style={s.error}>{error}</div>}
          <div style={{ background: "#0D0F12", borderRadius: 8, padding: "12px 14px", marginBottom: 20, display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#8B95A1", fontSize: 13 }}>Current Balance</span>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#4ade80" }}>{fmt(partner.walletBalance)}</span>
          </div>
          <div style={s.formRow}>
            <label style={s.label}>Amount (₹) <span style={{ color: "#EF4444" }}>*</span></label>
            <input style={s.input} type="number" placeholder="e.g. 5000" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div style={s.formRow}>
            <label style={s.label}>Remarks</label>
            <input style={s.input} placeholder="e.g. Recharge for June" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
        </div>
        <div style={s.modalFoot}>
          <button style={s.btn("ghost")} onClick={onClose}>Cancel</button>
          <button style={{ ...s.btn(), background: "#16a34a" }} onClick={submit} disabled={loading}>
            {loading ? <span style={s.spinner} /> : null} Add ₹{amount || "0"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Ledger Modal
// ─────────────────────────────────────────────────────────────
function LedgerModal({ partner, onClose }) {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wallet endpoint returns recentTransactions — we use the partner's own key
    // For admin view we'd call a dedicated endpoint; using wallet endpoint as proxy
    fetch(`${BASE}/api/domestic/wallet`, {
      headers: { "x-api-key": partner.apiKey, "x-api-secret": partner.apiSecret },
    })
      .then((r) => r.json())
      .then((d) => { setLedger(d.recentTransactions || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [partner]);

  return (
    <div style={s.modal} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ ...s.modalBox, maxWidth: 680 }}>
        <div style={s.modalHead}>
          <div>
            <div style={s.modalTitle}>Wallet Ledger — {partner.name}</div>
            <div style={{ fontSize: 12, color: "#8B95A1", marginTop: 2 }}>Last 10 transactions</div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>
        <div style={{ padding: "0" }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: "center" }}><span style={s.spinner} /></div>
          ) : ledger.length === 0 ? (
            <div style={s.emptyState}>No transactions yet</div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {["Type", "Amount", "Balance After", "Remarks", "Date"].map((h) => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((t) => (
                    <tr key={t._id}>
                      <td style={s.td}><TypePill type={t.type} /></td>
                      <td style={{ ...s.td, fontWeight: 600, color: t.type === "DEBIT" ? "#818cf8" : t.type === "CREDIT" ? "#4ade80" : "#fb923c" }}>
                        {t.type === "DEBIT" ? "−" : "+"}{fmt(t.amount)}
                      </td>
                      <td style={{ ...s.td, fontFamily: "monospace" }}>{fmt(t.balanceAfter)}</td>
                      <td style={{ ...s.td, color: "#8B95A1", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.remarks}</td>
                      <td style={{ ...s.td, color: "#8B95A1", whiteSpace: "nowrap" }}>{fmtDate(t.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div style={s.modalFoot}>
          <button style={s.btn("ghost")} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Partners Page
// ─────────────────────────────────────────────────────────────
export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creditTarget, setCreditTarget] = useState(null);
  const [ledgerTarget, setLedgerTarget] = useState(null);
  const [toggling, setToggling] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const d = await api("/api/domestic-admin/partners");
      setPartners(d.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (p) => {
    setToggling(p._id);
    try {
      await api(`/api/domestic-admin/toggle-partner/${p._id}`, { method: "PATCH" });
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setToggling(null);
    }
  };

  const filtered = partners.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const stats = {
    total: partners.length,
    active: partners.filter((p) => p.isActive).length,
    totalWallet: partners.reduce((a, p) => a + (p.walletBalance || 0), 0),
    inactive: partners.filter((p) => !p.isActive).length,
  };

  return (
    <div style={s.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} * { box-sizing: border-box; } input:focus { border-color: #3B82F6 !important; outline: none; }`}</style>

      {/* Topbar */}
      <div style={s.topbar}>
        <div style={s.logoWrap}>
          <div style={s.logoBox}>TE</div>
          <span style={s.logoText}>TraceExpress</span>
          <span style={s.logoBadge}>/ Domestic Admin</span>
        </div>
        <nav style={s.nav}>
          <a href="/domestic/partner" style={s.navLink(true)}>Partners</a>
          <a href="/domestic/shipment" style={s.navLink(false)}>Shipments</a>
        </nav>
      </div>

      <div style={s.main}>
        {/* Stats */}
        <div style={s.statGrid}>
          {[
            { label: "Total Partners", value: stats.total, sub: "Registered" },
            { label: "Active", value: stats.active, sub: "Accepting bookings" },
            { label: "Inactive", value: stats.inactive, sub: "Access suspended" },
            { label: "Total Wallet Value", value: fmt(stats.totalWallet), sub: "Across all partners" },
          ].map((st) => (
            <div key={st.label} style={s.statCard}>
              <div style={s.statLabel}>{st.label}</div>
              <div style={s.statValue}>{st.value}</div>
              <div style={s.statSub}>{st.sub}</div>
            </div>
          ))}
        </div>

        {/* Page header */}
        <div style={s.pageHead}>
          <div>
            <div style={s.h1}>Partners</div>
            <div style={s.subhead}>Manage API access and wallet balances for each partner.</div>
          </div>
          <button style={s.btn()} onClick={() => setShowCreate(true)}>+ Add Partner</button>
        </div>

        {error && <div style={s.error}>{error}</div>}

        {/* Toolbar */}
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <input style={{ ...s.input, maxWidth: 300 }} placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button style={s.btn("ghost")} onClick={load}>↻ Refresh</button>
        </div>

        {/* Table */}
        <div style={s.card}>
          <div style={s.tableWrap}>
            {loading ? (
              <div style={{ padding: 48, textAlign: "center" }}><span style={s.spinner} /></div>
            ) : filtered.length === 0 ? (
              <div style={s.emptyState}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🤝</div>
                <div style={{ fontWeight: 600, color: "#8B95A1", marginBottom: 6 }}>No partners yet</div>
                <div style={{ fontSize: 13, color: "#4E5A67", marginBottom: 16 }}>Create your first partner to get started.</div>
                <button style={s.btn()} onClick={() => setShowCreate(true)}>+ Add Partner</button>
              </div>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    {["Partner", "API Key", "Wallet Balance", "Status", "Created", "Actions"].map((h) => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p._id} style={{ transition: "background 0.1s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#0D0F12")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <td style={s.td}>
                        <div style={{ fontWeight: 600, color: "#fff" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#4E5A67", marginTop: 2, fontFamily: "monospace" }}>{p._id}</div>
                      </td>
                      <td style={s.td}>
                        <div style={{ fontFamily: "monospace", fontSize: 12, color: "#8B95A1" }}>
                          {p.apiKey?.slice(0, 18)}…
                        </div>
                      </td>
                      <td style={s.td}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: p.walletBalance > 500 ? "#4ade80" : p.walletBalance > 0 ? "#fbbf24" : "#f87171" }}>
                          {fmt(p.walletBalance || 0)}
                        </div>
                      </td>
                      <td style={s.td}><span style={s.badge(p.isActive)}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />{p.isActive ? "Active" : "Inactive"}</span></td>
                      <td style={{ ...s.td, color: "#8B95A1", whiteSpace: "nowrap" }}>{fmtDate(p.createdAt)}</td>
                      <td style={s.td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={{ ...s.btn("ghost"), padding: "5px 10px", fontSize: 12 }} onClick={() => setLedgerTarget(p)}>Ledger</button>
                          <button style={{ ...s.btn("ghost"), padding: "5px 10px", fontSize: 12, color: "#4ade80" }} onClick={() => setCreditTarget(p)}>Credit</button>
                          <button
                            style={{ ...s.btn("ghost"), padding: "5px 10px", fontSize: 12, color: p.isActive ? "#f87171" : "#4ade80" }}
                            onClick={() => toggle(p)}
                            disabled={toggling === p._id}>
                            {toggling === p._id ? <span style={s.spinner} /> : p.isActive ? "Suspend" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showCreate && <CreatePartnerModal onClose={() => setShowCreate(false)} onCreated={load} />}
      {creditTarget && <CreditWalletModal partner={creditTarget} onClose={() => setCreditTarget(null)} onCredited={load} />}
      {ledgerTarget && <LedgerModal partner={ledgerTarget} onClose={() => setLedgerTarget(null)} />}
    </div>
  );
}