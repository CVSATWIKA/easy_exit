import React, { useState, useEffect } from "react";
import "../styles/common.css";

/* ─── PROFILE SLIDE-IN PANEL ─── */
function ProfilePanel({ open, onClose, role }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    fetch(`${process.env.REACT_APP_API_URL}/accounts/profile/`, { credentials: "include" })
      .then((res) => {
        if (res.status === 401) {
          window.location.href = "/";   // 🔥 redirect if not logged in
          return;
      }

        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((data) => setProfile(data))
      .catch(() => setError("Could not load profile. Please try again."))
      .finally(() => setLoading(false));
  }, [open]);

  // Fields based on role
  const isStudent = role === "student";

  const studentFields = [
    { label: "Full Name",        key: "full_name",         icon: "👤" },
    { label: "Roll No",          key: "roll_no",            icon: "🎓" },
    { label: "Email",            key: "email",              icon: "📧" },
    { label: "Department",       key: "department",         icon: "🏛️" },
    { label: "Year",             key: "year",               icon: "📅" },
    { label: "Class",            key: "class_name",         icon: "🏫" },
    { label: "Hostel No",        key: "hostel_no",          icon: "🏠" },
    { label: "Room No",          key: "room_no",            icon: "🚪" },
    { label: "Personal Contact", key: "personal_contact",   icon: "📱" },
    { label: "Parent Contact",   key: "parent_contact",     icon: "👨‍👩‍👦" },
  ];

  const staffFields = [
    { label: "Full Name",    key: "full_name",   icon: "👤" },
    { label: "Username",     key: "username",    icon: "🔖" },
    { label: "Email",        key: "email",       icon: "📧" },
    { label: "Department",   key: "department",  icon: "🏛️" },
    { label: "Role",         key: "role",        icon: "🎖️" },
  ];

  const fields = isStudent ? studentFields : staffFields;

  // Helper: get value — profile may be flat or nested under 'profile' key
  const getValue = (key) => {
    if (!profile) return "—";
    // Try top-level first, then nested profile object
    const val = profile[key] ?? profile?.profile?.[key] ?? profile?.student_profile?.[key];
    return val || "—";
  };

  const displayName = profile
    ? (profile.full_name || profile.username || profile.name || "—")
    : "—";

  const roleLabel = profile?.role
    ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
    : (role?.charAt(0).toUpperCase() + role?.slice(1)) || "User";

  return (
    <>
      {/* BACKDROP */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(15,23,42,0.45)",
          backdropFilter: "blur(3px)",
          zIndex: 200,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s",
        }}
      />

      {/* SLIDE PANEL */}
      <div style={{
        position: "fixed", top: 0, right: 0,
        width: "360px", height: "100vh",
        background: "#fff",
        zIndex: 201,
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
        overflowY: "auto",
      }}>

        {/* PANEL HEADER */}
        <div style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          padding: "28px 24px 24px",
          position: "relative",
        }}>
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 16,
              background: "rgba(255,255,255,0.1)", border: "none",
              color: "#fff", borderRadius: "8px",
              width: 32, height: 32, cursor: "pointer",
              fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >✕</button>

          {/* AVATAR */}
          {isStudent && profile?.photo ? (
            <img
              src={`${process.env.REACT_APP_API_URL}${profile.photo}`}
              alt="profile"
              style={{
                width: 72, height: 72, borderRadius: "50%",
                border: "3px solid #2DD4BF",
                objectFit: "cover", marginBottom: 14,
                display: "block",
              }}
            />
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "linear-gradient(135deg, #0D9488, #2DD4BF)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, marginBottom: 14,
              border: "3px solid rgba(45,212,191,0.4)",
            }}>
              {isStudent ? "🎓" : "👤"}
            </div>
          )}

          <div style={{ color: "#fff", fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 800 }}>
            {loading ? "Loading…" : displayName}
          </div>
          <div style={{
            marginTop: 6, display: "inline-block",
            background: "rgba(45,212,191,0.15)",
            border: "1px solid rgba(45,212,191,0.3)",
            borderRadius: 20, padding: "3px 12px",
            fontSize: 11, fontWeight: 700,
            color: "#2DD4BF", letterSpacing: "1px", textTransform: "uppercase",
          }}>
            {roleLabel}
          </div>
        </div>

        {/* PANEL BODY */}
        <div style={{ padding: "24px", flex: 1 }}>

          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <p style={{ fontSize: 14 }}>Loading profile…</p>
            </div>
          )}

          {error && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: 12, padding: "16px",
              color: "#DC2626", fontSize: 14, textAlign: "center",
            }}>
              ⚠️ {error}
            </div>
          )}

          {profile && !loading && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16 }}>
                Profile Information
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {fields.map(({ label, key, icon }) => {
                  const val = getValue(key);
                  if (val === "—" && key !== "email") return null; // hide empty optional fields
                  return (
                    <div key={key} style={{
                      display: "flex", alignItems: "flex-start", gap: 12,
                      padding: "12px 14px",
                      borderRadius: 12,
                      background: "#F8FAFC",
                      border: "1px solid #F1F5F9",
                      marginBottom: 6,
                    }}>
                      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 2 }}>
                          {label}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                          {val}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}


/* ─── SETTINGS SLIDE-IN PANEL ─── */
function SettingsPanel({ open, onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");
  const [success, setSuccess]                 = useState("");
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);

  const reset = () => {
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setError(""); setSuccess("");
    setShowCurrent(false); setShowNew(false); setShowConfirm(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (!currentPassword.trim()) { setError("Please enter your current password."); return; }
    if (newPassword.length < 8)  { setError("New password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("New passwords do not match."); return; }
    if (currentPassword === newPassword) { setError("New password must be different from current password."); return; }

    setLoading(true);
    try {
      const res = await fetch("/accounts/change-password/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to change password."); }
      else { setSuccess("✅ Password changed successfully!"); reset(); setSuccess("✅ Password changed successfully!"); }
    } catch { setError("Could not reach server. Please try again."); }
    finally { setLoading(false); }
  };

  const inputStyle = {
    width: "100%", padding: "10px 40px 10px 14px",
    border: "1.5px solid #E2E8F0", borderRadius: 10,
    fontSize: 14, fontFamily: "'Inter',sans-serif",
    color: "#0F172A", background: "#F8FAFC", outline: "none",
    transition: "border 0.2s, box-shadow 0.2s",
  };

  const PasswordField = ({ label, value, onChange, show, onToggle }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6 }}>{label}</label>
      <div style={{ position:"relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          style={inputStyle}
          required
        />
        <button
          type="button"
          onClick={onToggle}
          style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:"#94A3B8", padding:0 }}
        >
          {show ? "🙈" : "👁️"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div onClick={handleClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.45)", backdropFilter:"blur(3px)", zIndex:200, opacity:open?1:0, pointerEvents:open?"auto":"none", transition:"opacity 0.3s" }} />

      {/* Panel */}
      <div style={{ position:"fixed", top:0, right:0, width:380, height:"100vh", background:"#fff", zIndex:201, transform:open?"translateX(0)":"translateX(100%)", transition:"transform 0.35s cubic-bezier(0.4,0,0.2,1)", display:"flex", flexDirection:"column", boxShadow:"-8px 0 40px rgba(0,0,0,0.15)", overflowY:"auto" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#0F172A 0%,#1E293B 100%)", padding:"28px 24px 24px", position:"relative" }}>
          <button onClick={handleClose} style={{ position:"absolute", top:16, right:16, background:"rgba(255,255,255,0.1)", border:"none", color:"#fff", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          <div style={{ width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,#0D9488,#2DD4BF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, marginBottom:14, border:"3px solid rgba(45,212,191,0.4)" }}>⚙️</div>
          <div style={{ color:"#fff", fontFamily:"'Nunito',sans-serif", fontSize:20, fontWeight:800 }}>Settings</div>
          <div style={{ marginTop:6, display:"inline-block", background:"rgba(45,212,191,0.15)", border:"1px solid rgba(45,212,191,0.3)", borderRadius:20, padding:"3px 12px", fontSize:11, fontWeight:700, color:"#2DD4BF", letterSpacing:"1px", textTransform:"uppercase" }}>Account</div>
        </div>

        {/* Body */}
        <div style={{ padding:24, flex:1 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"1px", marginBottom:20 }}>Change Password</div>

          <form onSubmit={handleChangePassword}>
            <PasswordField
              label="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              show={showCurrent}
              onToggle={() => setShowCurrent(!showCurrent)}
            />
            <PasswordField
              label="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              show={showNew}
              onToggle={() => setShowNew(!showNew)}
            />
            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              show={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
            />

            {/* Password strength hint */}
            {newPassword && (
              <div style={{ marginBottom:16, padding:"10px 14px", background:"#F0FDF9", borderRadius:10, border:"1px solid #A7F3D0", fontSize:12, color:"#0F172A" }}>
                <div style={{ fontWeight:600, marginBottom:4, color:"#0D9488" }}>Password strength:</div>
                {[
                  { rule:"At least 8 characters",           pass: newPassword.length >= 8 },
                  { rule:"Contains a number",                pass: /\d/.test(newPassword) },
                  { rule:"Contains uppercase letter",        pass: /[A-Z]/.test(newPassword) },
                  { rule:"Contains special character",       pass: /[^a-zA-Z0-9]/.test(newPassword) },
                ].map(({ rule, pass }) => (
                  <div key={rule} style={{ display:"flex", alignItems:"center", gap:6, color: pass ? "#059669" : "#94A3B8", marginTop:3 }}>
                    <span>{pass ? "✅" : "○"}</span><span>{rule}</span>
                  </div>
                ))}
              </div>
            )}

            {error   && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"12px 14px", color:"#DC2626", fontSize:13, marginBottom:16 }}>⚠️ {error}</div>}
            {success && <div style={{ background:"#ECFDF5", border:"1px solid #A7F3D0", borderRadius:10, padding:"12px 14px", color:"#059669", fontSize:13, marginBottom:16 }}>{success}</div>}

            <button
              type="submit"
              disabled={loading}
              style={{ width:"100%", padding:14, background:"linear-gradient(135deg,#0D9488,#0F766E)", color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:700, fontFamily:"'Nunito',sans-serif", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, boxShadow:"0 4px 14px rgba(13,148,136,0.35)", transition:"opacity 0.2s" }}
            >
              {loading ? "Changing…" : "🔒 Change Password"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

/**
 * Shared layout shell for HOD / Manager / Warden dashboards
 * Props: role, roleLabel, children, onLogout
 */
export function DashboardShell({ role, roleLabel, children, onLogout }) {
  const [profileOpen, setProfileOpen]   = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="dashboard-root">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-badge">Easy Exit</div>
          <h2>Easy<span>Exit</span></h2>
          <div className="sidebar-role">{roleLabel}</div>
        </div>
        <nav className="sidebar-nav">
          <button className="sidebar-btn active">📊 Dashboard</button>
          <button className="sidebar-btn" onClick={() => setProfileOpen(true)}>👤 Profile</button>
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-btn" onClick={() => setSettingsOpen(true)}>⚙️ Settings</button>
          <button className="sidebar-btn logout" onClick={onLogout}>🚪 Logout</button>
        </div>
      </aside>
      <main className="main-content">{children}</main>

      <ProfilePanel  open={profileOpen}  onClose={() => setProfileOpen(false)}  role={role} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

/**
 * Reusable approval table with comment + approve/reject + pagination
 * Props: leaves, view, onAction, onSelect
 */
export function ApprovalTable({ leaves, view, onAction, onSelect, extraColumns }) {
  const [comments, setComments]       = React.useState({});
  const [currentPage, setCurrentPage] = React.useState(1);
  const ROWS_PER_PAGE = 10;

  // Reset to page 1 whenever the list changes (tab switch / refresh)
  React.useEffect(() => { setCurrentPage(1); }, [leaves]);

  const setComment   = (id, val) => setComments((c) => ({ ...c, [id]: val }));
  const totalPages   = Math.ceil(leaves.length / ROWS_PER_PAGE);
  const paginated    = leaves.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const btnBase = { borderRadius: 8, border: "1.5px solid #E2E8F0", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" };

  const PaginationBar = () => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
      .reduce((acc, p, idx, arr) => {
        if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
        acc.push(p);
        return acc;
      }, []);
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 20px", borderTop:"1px solid #F1F5F9" }}>
        <div style={{ fontSize:13, color:"#64748B" }}>
          Showing <strong>{(currentPage - 1) * ROWS_PER_PAGE + 1}</strong>–<strong>{Math.min(currentPage * ROWS_PER_PAGE, leaves.length)}</strong> of <strong>{leaves.length}</strong> records
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <button onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}
            style={{ ...btnBase, padding:"6px 12px", background: currentPage === 1 ? "#F8FAFC" : "#fff", color: currentPage === 1 ? "#CBD5E1" : "#0F172A", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}>
            ← Prev
          </button>
          {pages.map((p, idx) =>
            p === "..." ? (
              <span key={`e${idx}`} style={{ padding:"0 4px", color:"#94A3B8", fontSize:13 }}>…</span>
            ) : (
              <button key={p} onClick={() => setCurrentPage(p)}
                style={{ ...btnBase, width:34, height:34, borderColor: currentPage === p ? "#0D9488" : "#E2E8F0", background: currentPage === p ? "#0D9488" : "#fff", color: currentPage === p ? "#fff" : "#0F172A", fontWeight: currentPage === p ? 700 : 400 }}>
                {p}
              </button>
            )
          )}
          <button onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages}
            style={{ ...btnBase, padding:"6px 12px", background: currentPage === totalPages ? "#F8FAFC" : "#fff", color: currentPage === totalPages ? "#CBD5E1" : "#0F172A", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}>
            Next →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ overflowX: "auto" }}>
      {leaves.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <p>No {view} requests found.</p>
        </div>
      ) : (
        <>
          <table className="styled-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Roll No</th>
                <th>Leave Type</th>
                <th>Reason</th>
                {extraColumns?.map((c) => <th key={c}>{c}</th>)}
                {(view === "pending" || view === "rejected") && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.map((l, i) => (
                <tr key={l.id}>
                  <td style={{ color: "#94A3B8", fontSize: 12 }}>{(currentPage - 1) * ROWS_PER_PAGE + i + 1}</td>
                  <td>
                    <span className="roll-link" onClick={() => onSelect(l)}>{l.roll_no}</span>
                  </td>
                  <td>
                    <span className="badge badge-pending">{l.leave_type === "gate" ? "🚪 Gate" : "🏠 Home"}</span>
                  </td>
                  <td style={{ fontSize: 13, color: "#475569", maxWidth: 200 }}>{l.reason}</td>
                  {extraColumns?.map((col) => (
                    <td key={col} style={{ fontSize: 13 }}>{l[col.toLowerCase()] || "—"}</td>
                  ))}
                  {(view === "pending" || view === "rejected") && (
                    <td>
                      <div className="action-cell">
                        <textarea
                          className="comment-input"
                          placeholder="Add a comment (optional)..."
                          value={comments[l.id] || ""}
                          onChange={(e) => setComment(l.id, e.target.value)}
                          rows={2}
                        />
                        <div className="action-btns">
                          <button className="btn btn-success" onClick={() => onAction(l.id, "approve", comments[l.id] || "")}>
                            ✅ Approve
                          </button>
                          {view === "pending" && (
                            <button className="btn btn-danger" onClick={() => onAction(l.id, "reject", comments[l.id] || "")}>
                              ❌ Reject
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationBar />
        </>
      )}
    </div>
  );
}

/**
 * Reusable detail panel
 */
export function DetailPanel({ selected, onClose, fields }) {
  if (!selected) return null;
  return (
    <div className="detail-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #F1F5F9" }}>
        <h3 style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>👤 Student Details</h3>
        <button className="btn btn-ghost" onClick={onClose}>✕ Close</button>
      </div>
      <div className="detail-grid">
        {fields.map(({ label, key }) => (
          <div className="detail-item" key={key}>
            <label>{label}</label>
            <span>{selected[key] || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
