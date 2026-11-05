import { apiFetch } from "../api";
import React, { useEffect, useState } from "react";
import { DashboardShell, ApprovalTable, DetailPanel } from "./DashboardShared";
import "../styles/common.css";

const MANAGER_FIELDS = [
  { label: "Roll No", key: "roll_no" },
  { label: "Department", key: "department" },
  { label: "Year", key: "year" },
  { label: "Leave Type", key: "leave_type" },
  { label: "Reason", key: "reason" },
  { label: "Out Time", key: "out_time" },
  { label: "In Time", key: "in_time" },
];

function ManagerDashboard({onLogout}) {
  const [leaves, setLeaves] = useState([]);
  const [view, setView] = useState("pending");
  const [selected, setSelected] = useState(null);

  const fetchLeaves = async (type = "pending") => {
    setView(type);
    const res = await apiFetch(`/leave/manager/?status=${type}`);
    if (!res) return;  // apiFetch already handles 401 and redirects
    const data = await res.json();
    setLeaves(data);
  };

  useEffect(() => { fetchLeaves("pending"); }, []);

  const takeAction = async (id, action, comment) => {
  await apiFetch(`/leave/manager/action/${id}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, comment }),
  });
  alert("Action submitted successfully!");
  fetchLeaves(view);
};

  const logout = async () => {
    await fetch(`${process.env.REACT_APP_API_URL}/accounts/logout/`, {
      method: "POST",
      credentials: "include",
    });
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <DashboardShell role="manager" roleLabel="Manager Portal" onLogout={logout}>
      <div className="page-header">
        <h1>Hostel Manager Dashboard</h1>
        <p>Oversee and action hostel leave requests</p>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Pending Review", status: "pending", icon: "⏳", color: "#FFFBEB", border: "#FDE68A", text: "#D97706" },
          { label: "Approved", status: "approved", icon: "✅", color: "#ECFDF5", border: "#A7F3D0", text: "#059669" },
          { label: "Rejected", status: "rejected", icon: "❌", color: "#FEF2F2", border: "#FECACA", text: "#DC2626" },
        ].map((s) => (
          <div
            key={s.status}
            onClick={() => fetchLeaves(s.status)}
            style={{
              flex: 1, padding: "16px 20px", borderRadius: 14, cursor: "pointer",
              background: view === s.status ? s.color : "#fff",
              border: `1.5px solid ${view === s.status ? s.border : "#E2E8F0"}`,
              transition: "all 0.2s",
              boxShadow: view === s.status ? `0 4px 12px ${s.border}88` : "none",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 12, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
            <div style={{ fontSize: 11, color: s.text, marginTop: 4, fontWeight: 600 }}>
              {view === s.status ? `${leaves.length} records` : "Click to view"}
            </div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="tab-bar">
        {["pending", "approved", "rejected"].map((t) => (
          <button key={t} className={`tab-btn ${view === t ? "active" : ""}`} onClick={() => fetchLeaves(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>
            {view === "pending" ? "⏳" : view === "approved" ? "✅" : "❌"} {view.charAt(0).toUpperCase() + view.slice(1)} Requests
          </h3>
          <span className={`badge ${view === "pending" ? "badge-pending" : view === "approved" ? "badge-approved" : "badge-rejected"}`}>
            {leaves.length} total
          </span>
        </div>
        <div style={{ padding: "0 0 8px" }}>
          <ApprovalTable
            leaves={leaves}
            view={view}
            onAction={takeAction}
            onSelect={setSelected}
          />
        </div>
      </div>

      <DetailPanel selected={selected} onClose={() => setSelected(null)} fields={MANAGER_FIELDS} />
    </DashboardShell>
  );
}

export default ManagerDashboard;
