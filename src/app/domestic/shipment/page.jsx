"use client"
import { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────
// Config
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
// Constants
// ─────────────────────────────────────────────────────────────
const COURIERS = [
  { value: "", label: "All Couriers" },
  { value: "TTE Basic Surface",   label: "TTE Basic Surface" },
  { value: "TTE Advance Surface", label: "TTE Advance Surface" },
  { value: "TTE Advance Air",     label: "TTE Advance Air" },
  { value: "TTE Premium Surface", label: "TTE Premium Surface" },
  { value: "TTE Premium Air",     label: "TTE Premium Air" },
];

const SHIPMENT_TYPES = [
  { value: "", label: "All Types" },
  { value: "FORWARD", label: "Forward" },
  { value: "REVERSE", label: "Reverse" },
];

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "created",             label: "Created" },
  { value: "new",                 label: "New" },
  { value: "picked",              label: "Picked" },
  { value: "ofd",                 label: "Out for Delivery" },
  { value: "delivered",           label: "Delivered" },
  { value: "cancelled",           label: "Cancelled" },
  { value: "rts",                 label: "Return Initiated" },
  { value: "rts_d",               label: "Returned" },
  { value: "lost",                label: "Lost" },
  { value: "on_hold",             label: "On Hold" },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d) =>
  new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const statusMeta = (s) => {
  const map = {
    delivered:  { bg: "#14532d", color: "#4ade80" },
    picked:     { bg: "#1e3a5f", color: "#60a5fa" },
    ofd:        { bg: "#1e3a5f", color: "#93c5fd" },
    new:        { bg: "#1c1917", color: "#a8a29e" },
    created:    { bg: "#1c1917", color: "#a8a29e" },
    cancelled:  { bg: "#450a0a", color: "#fca5a5" },
    rts:        { bg: "#422006", color: "#fb923c" },
    rts_d:      { bg: "#422006", color: "#fdba74" },
    lost:       { bg: "#450a0a", color: "#f87171" },
    on_hold:    { bg: "#3b2a00", color: "#fcd34d" },
  };
  return map[s] || { bg: "#1f2937", color: "#9ca3af" };
};

const StatusPill = ({ status }) => {
  const m = statusMeta(status);
  const label = STATUSES.find((s) => s.value === status)?.label || status;
  return (
    <span style={{ background: m.bg, color: m.color, padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: "capitalize", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
};

const TypePill = ({ type }) => (
  <span style={{
    background: type === "FORWARD" ? "rgba(59,130,246,0.12)" : "rgba(168,85,247,0.12)",
    color: type === "FORWARD" ? "#60a5fa" : "#c084fc",
    padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: "monospace"
  }}>
    {type}
  </span>
);

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const s = {
  page:      { minHeight: "100vh", background: "#0D0F12", color: "#E8ECF0", fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14 },
  topbar:    { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 56, borderBottom: "1px solid #252A33", background: "#13161B" },
  logoWrap:  { display: "flex", alignItems: "center", gap: 10 },
  logoBox:   { width: 28, height: 28, background: "#3B82F6", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: "#fff" },
  logoText:  { fontWeight: 700, fontSize: 15, letterSpacing: -0.3 },
  logoBadge: { fontSize: 11, color: "#4E5A67", marginLeft: 8 },
  nav:       { display: "flex", gap: 4 },
  navLink:   (active) => ({ padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer", border: "none", background: active ? "#1D2535" : "transparent", color: active ? "#3B82F6" : "#8B95A1", textDecoration: "none", display: "inline-block" }),
  main:      { maxWidth: 1400, margin: "0 auto", padding: "28px 32px" },
  h1:        { fontSize: 22, fontWeight: 700, letterSpacing: -0.4, color: "#fff", marginBottom: 4 },
  subhead:   { fontSize: 13, color: "#8B95A1" },
  statGrid:  { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 },
  statCard:  { background: "#13161B", border: "1px solid #252A33", borderRadius: 10, padding: "16px 18px" },
  statLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#4E5A67", fontWeight: 600, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: -0.5 },
  statSub:   { fontSize: 11, color: "#8B95A1", marginTop: 2 },
  card:      { background: "#13161B", border: "1px solid #252A33", borderRadius: 10 },
  btn:       (v = "primary") => ({
    display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px",
    borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: "pointer", border: "none",
    background: v === "primary" ? "#3B82F6" : "#1A1E25", color: v === "ghost" ? "#8B95A1" : "#fff",
    whiteSpace: "nowrap",
  }),
  select:    { background: "#1A1E25", border: "1px solid #252A33", borderRadius: 7, padding: "8px 12px", color: "#E8ECF0", fontSize: 13, cursor: "pointer", outline: "none" },
  input:     { background: "#1A1E25", border: "1px solid #252A33", borderRadius: 7, padding: "8px 12px", color: "#E8ECF0", fontSize: 13, outline: "none" },
  th:        { padding: "10px 14px", background: "#1A1E25", color: "#4E5A67", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600, textAlign: "left", borderBottom: "1px solid #252A33", whiteSpace: "nowrap" },
  td:        { padding: "11px 14px", borderBottom: "1px solid #1A1E25", color: "#C9D1D9", verticalAlign: "middle" },
  tableWrap: { overflowX: "auto" },
  table:     { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  emptyState:{ textAlign: "center", padding: "60px 20px", color: "#4E5A67" },
  spinner:   { display: "inline-block", width: 16, height: 16, border: "2px solid #252A33", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.6s linear infinite" },
  error:     { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, padding: "10px 14px", color: "#f87171", fontSize: 13, marginBottom: 16 },
  modal:     { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 },
  modalBox:  { background: "#13161B", border: "1px solid #252A33", borderRadius: 12, width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "auto" },
  modalHead: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #252A33", position: "sticky", top: 0, background: "#13161B", zIndex: 1 },
  closeBtn:  { background: "none", border: "none", color: "#8B95A1", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 2 },
  codebox:   { background: "#0D0F12", borderRadius: 6, padding: "10px 12px", fontFamily: "monospace", fontSize: 12, color: "#A5D6FF", wordBreak: "break-all" },
  pager:     { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderTop: "1px solid #252A33" },
};

// ─────────────────────────────────────────────────────────────
// Shipment Detail Modal
// ─────────────────────────────────────────────────────────────
function ShipmentDetailModal({ shipment, partnerName, onClose }) {
  const addr = (a) => [a?.name, a?.address, a?.city, a?.state, a?.pincode].filter(Boolean).join(", ");
  const row = (label, value, mono = false) => value ? (
    <div style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid #1A1E25" }}>
      <div style={{ width: 140, flexShrink: 0, fontSize: 12, color: "#4E5A67", textTransform: "uppercase", letterSpacing: 0.6, paddingTop: 1 }}>{label}</div>
      <div style={{ flex: 1, color: "#E8ECF0", fontFamily: mono ? "monospace" : "inherit", fontSize: mono ? 12 : 13, wordBreak: "break-all" }}>{value}</div>
    </div>
  ) : null;

  return (
    <div style={s.modal} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={s.modalBox}>
        <div style={s.modalHead}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Shipment Details</div>
            <div style={{ fontSize: 12, color: "#8B95A1", marginTop: 2, fontFamily: "monospace" }}>{shipment.awb}</div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>
        <div style={{ padding: "0 24px 4px" }}>

          {/* Status + type row */}
          <div style={{ display: "flex", gap: 10, padding: "16px 0", borderBottom: "1px solid #1A1E25", alignItems: "center" }}>
            <StatusPill status={shipment.status} />
            <TypePill type={shipment.shipmentType} />
            <span style={{ fontSize: 12, color: "#8B95A1", marginLeft: "auto" }}>{fmtDate(shipment.createdAt)}</span>
          </div>

          {/* Key fields */}
          {row("Partner", partnerName)}
          {row("Reference No", shipment.referenceNumber, true)}
          {row("AWB", shipment.awb, true)}
          {row("Tracking No", shipment.trackingNumber, true)}
          {row("Courier", shipment.courier)}
          {row("Weight", shipment.weight ? `${shipment.weight} kg` : null)}
          {row("Amount Charged", shipment.amountCharged ? fmt(shipment.amountCharged) : null)}

          {/* Addresses */}
          <div style={{ marginTop: 16, marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#4E5A67", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600, marginBottom: 10 }}>Addresses</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[["Pickup", shipment.pickupAddress], ["Delivery", shipment.deliveryAddress]].map(([label, a]) => (
                <div key={label} style={{ background: "#0D0F12", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, color: "#4E5A67", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
                  <div style={{ fontWeight: 600, color: "#fff", marginBottom: 2 }}>{a?.name}</div>
                  <div style={{ fontSize: 12, color: "#8B95A1", lineHeight: 1.5 }}>
                    {[a?.mobile, a?.address, a?.city, a?.state, a?.pincode].filter(Boolean).join(" · ")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shadowfax order id */}
          {shipment.shadowfaxOrderId && (
            <div style={{ marginTop: 12, marginBottom: 16 }}>
              {row("Carrier Order ID", shipment.shadowfaxOrderId, true)}
            </div>
          )}
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid #252A33", display: "flex", justifyContent: "flex-end" }}>
          <button style={s.btn("ghost")} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Shipments Page
// ─────────────────────────────────────────────────────────────
export default function Shipments() {
  const [partners, setPartners]     = useState([]);
  const [shipments, setShipments]   = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [detail, setDetail]         = useState(null);
  const [page, setPage]             = useState(1);
  const LIMIT = 20;

  const [filters, setFilters] = useState({
    partnerId: "",
    shipmentType: "",
    courier: "",
    status: "",
    search: "",       // AWB or reference number
  });

  const partnerMap = useRef({});

  // Load partners for filter dropdown
  useEffect(() => {
    api("/api/domestic-admin/partners")
      .then((d) => {
        setPartners(d.data || []);
        partnerMap.current = Object.fromEntries((d.data || []).map((p) => [p._id, p]));
      })
      .catch(() => {});
  }, []);

  // Load shipments — calls each active partner's own credentials
  // In production you'd have an admin-level /api/domestic-admin/shipment endpoint;
  // this version aggregates across all partners client-side using stored credentials.
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Build query for each partner separately and merge
      const activePartners = partners.filter((p) => p.isActive);
      if (activePartners.length === 0) { setShipments([]); setTotal(0); setLoading(false); return; }

      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filters.shipmentType) params.set("shipmentType", filters.shipmentType);
      if (filters.status)       params.set("status", filters.status);

      const results = await Promise.allSettled(
        activePartners.map((p) =>
          fetch(`${BASE}/api/domestic/shipments?${params}`, {
            headers: { "x-api-key": p.apiKey, "x-api-secret": p.apiSecret },
          }).then((r) => r.json()).then((d) => ({ ...d, _partnerId: p._id }))
        )
      );

      let all = [];
      results.forEach((r) => {
        if (r.status === "fulfilled" && r.value.success) {
          all = all.concat((r.value.shipments || []).map((sh) => ({ ...sh, _partnerId: r.value._partnerId })));
        }
      });

      // Client-side filter by courier, search
      if (filters.courier) all = all.filter((sh) => sh.courier === filters.courier);
      if (filters.search)  all = all.filter((sh) =>
        sh.awb?.toLowerCase().includes(filters.search.toLowerCase()) ||
        sh.referenceNumber?.toLowerCase().includes(filters.search.toLowerCase())
      );
      if (filters.partnerId) all = all.filter((sh) => sh._partnerId === filters.partnerId);

      // Sort newest first
      all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setTotal(all.length);
      setShipments(all);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [partners, page, filters]);

  useEffect(() => { if (partners.length > 0) load(); }, [load, partners]);

  const setFilter = (k) => (e) => { setFilters((f) => ({ ...f, [k]: e.target.value })); setPage(1); };

  const clearFilters = () => { setFilters({ partnerId: "", shipmentType: "", courier: "", status: "", search: "" }); setPage(1); };
  const hasFilters = Object.values(filters).some(Boolean);

  // Stats derived from loaded data
  const stats = {
    total: shipments.length,
    forward: shipments.filter((s) => s.shipmentType === "FORWARD").length,
    reverse: shipments.filter((s) => s.shipmentType === "REVERSE").length,
    delivered: shipments.filter((s) => s.status === "delivered").length,
    revenue: shipments.reduce((a, s) => a + (s.amountCharged || 0), 0),
  };

  const paginated = shipments.slice((page - 1) * LIMIT, page * LIMIT);
  const totalPages = Math.ceil(shipments.length / LIMIT);

  return (
    <div style={s.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box} select:focus,input:focus{border-color:#3B82F6!important;outline:none} tr:hover td{background:#0a0c0f}`}</style>

      {/* Topbar */}
      <div style={s.topbar}>
        <div style={s.logoWrap}>
          <div style={s.logoBox}>TE</div>
          <span style={s.logoText}>TraceExpress</span>
          <span style={s.logoBadge}>/ Domestic Admin</span>
        </div>
        <nav style={s.nav}>
          <a href="/domestic/partner" style={s.navLink(false)}>Partners</a>
          <a href="/domestic/shipment" style={s.navLink(true)}>Shipments</a>
        </nav>
      </div>

      <div style={s.main}>
        {/* Stats */}
        <div style={s.statGrid}>
          {[
            { label: "Total Shipments", value: stats.total, sub: "Loaded" },
            { label: "Forward", value: stats.forward, sub: "Seller → Customer" },
            { label: "Reverse", value: stats.reverse, sub: "Customer → Seller" },
            { label: "Delivered", value: stats.delivered, sub: "Successfully" },
            { label: "Revenue", value: fmt(stats.revenue), sub: "Amount charged" },
          ].map((st) => (
            <div key={st.label} style={s.statCard}>
              <div style={s.statLabel}>{st.label}</div>
              <div style={s.statValue}>{st.value}</div>
              <div style={s.statSub}>{st.sub}</div>
            </div>
          ))}
        </div>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={s.h1}>Shipments</div>
            <div style={s.subhead}>All bookings across every partner, in real time.</div>
          </div>
          <button style={s.btn("ghost")} onClick={load}>↻ Refresh</button>
        </div>

        {error && <div style={s.error}>{error}</div>}

        {/* Filter bar */}
        <div style={{ background: "#13161B", border: "1px solid #252A33", borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <input
              style={{ ...s.input, minWidth: 200, flex: 1 }}
              placeholder="Search AWB or Reference No…"
              value={filters.search}
              onChange={setFilter("search")}
            />
            <select style={s.select} value={filters.partnerId} onChange={setFilter("partnerId")}>
              <option value="">All Partners</option>
              {partners.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            <select style={s.select} value={filters.shipmentType} onChange={setFilter("shipmentType")}>
              {SHIPMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select style={s.select} value={filters.courier} onChange={setFilter("courier")}>
              {COURIERS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select style={s.select} value={filters.status} onChange={setFilter("status")}>
              {STATUSES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
            </select>
            {hasFilters && (
              <button style={{ ...s.btn("ghost"), color: "#f87171" }} onClick={clearFilters}>✕ Clear</button>
            )}
          </div>
          {hasFilters && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#8B95A1" }}>
              Showing {shipments.length} result{shipments.length !== 1 ? "s" : ""}
              {filters.partnerId && ` · Partner: ${partners.find((p) => p._id === filters.partnerId)?.name}`}
              {filters.shipmentType && ` · Type: ${filters.shipmentType}`}
              {filters.courier && ` · Courier: ${filters.courier}`}
              {filters.status && ` · Status: ${filters.status}`}
              {filters.search && ` · Search: "${filters.search}"`}
            </div>
          )}
        </div>

        {/* Table */}
        <div style={s.card}>
          <div style={s.tableWrap}>
            {loading ? (
              <div style={{ padding: 56, textAlign: "center" }}><span style={s.spinner} /></div>
            ) : paginated.length === 0 ? (
              <div style={s.emptyState}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
                <div style={{ fontWeight: 600, color: "#8B95A1", marginBottom: 4 }}>No shipments found</div>
                <div style={{ fontSize: 13, color: "#4E5A67" }}>
                  {hasFilters ? "Try clearing the filters." : "Shipments will appear here once partners start booking."}
                </div>
                {hasFilters && <button style={{ ...s.btn("ghost"), marginTop: 14 }} onClick={clearFilters}>Clear Filters</button>}
              </div>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    {["AWB / Reference", "Partner", "Type", "Courier", "From", "To", "Weight", "Amount", "Status", "Date"].map((h) => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((sh) => {
                    const partner = partnerMap.current[sh._partnerId];
                    return (
                      <tr key={sh._id} style={{ cursor: "pointer" }} onClick={() => setDetail({ shipment: sh, partnerName: partner?.name || "—" })}>
                        <td style={s.td}>
                          <div style={{ fontFamily: "monospace", fontWeight: 600, color: "#60a5fa", fontSize: 12 }}>{sh.awb || "—"}</div>
                          <div style={{ fontSize: 11, color: "#4E5A67", marginTop: 2 }}>{sh.referenceNumber}</div>
                        </td>
                        <td style={s.td}>
                          <div style={{ fontWeight: 500, color: "#E8ECF0" }}>{partner?.name || "—"}</div>
                        </td>
                        <td style={s.td}><TypePill type={sh.shipmentType} /></td>
                        <td style={{ ...s.td, color: "#8B95A1", fontSize: 12 }}>{sh.courier || "—"}</td>
                        <td style={s.td}>
                          <div style={{ fontWeight: 500 }}>{sh.pickupAddress?.city || "—"}</div>
                          <div style={{ fontSize: 11, color: "#4E5A67" }}>{sh.pickupAddress?.pincode}</div>
                        </td>
                        <td style={s.td}>
                          <div style={{ fontWeight: 500 }}>{sh.deliveryAddress?.city || "—"}</div>
                          <div style={{ fontSize: 11, color: "#4E5A67" }}>{sh.deliveryAddress?.pincode}</div>
                        </td>
                        <td style={{ ...s.td, color: "#8B95A1" }}>{sh.weight ? `${sh.weight} kg` : "—"}</td>
                        <td style={{ ...s.td, fontWeight: 600, color: "#4ade80" }}>{sh.amountCharged ? fmt(sh.amountCharged) : "—"}</td>
                        <td style={s.td}><StatusPill status={sh.status} /></td>
                        <td style={{ ...s.td, color: "#8B95A1", fontSize: 12, whiteSpace: "nowrap" }}>{fmtDate(sh.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div style={s.pager}>
              <span style={{ fontSize: 13, color: "#8B95A1" }}>
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, shipments.length)} of {shipments.length}
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={s.btn("ghost")} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const pg = i + 1;
                  return (
                    <button key={pg} onClick={() => setPage(pg)}
                      style={{ ...s.btn("ghost"), background: pg === page ? "#1D2535" : "transparent", color: pg === page ? "#3B82F6" : "#8B95A1", padding: "7px 12px" }}>
                      {pg}
                    </button>
                  );
                })}
                <button style={s.btn("ghost")} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {detail && (
        <ShipmentDetailModal
          shipment={detail.shipment}
          partnerName={detail.partnerName}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}