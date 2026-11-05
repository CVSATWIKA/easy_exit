import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import "../styles/common.css";

/* ─── SETTINGS PANEL (reused from DashboardShared logic) ─── */
function SettingsPanel({ open, onClose }) {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword]         = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading]                 = React.useState(false);
  const [error, setError]                     = React.useState("");
  const [success, setSuccess]                 = React.useState("");
  const [showCurrent, setShowCurrent]         = React.useState(false);
  const [showNew, setShowNew]                 = React.useState(false);
  const [showConfirm, setShowConfirm]         = React.useState(false);

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
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });

      if (res.status === 401) {
        window.location.href = "/";
        return;
      }

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to change password."); }
      else { reset(); setSuccess("Password changed successfully!"); }
    } catch { setError("Could not reach server. Please try again."); }
    finally { setLoading(false); }
  };

  const inputStyle = { width:"100%", padding:"10px 40px 10px 14px", border:"1.5px solid #E2E8F0", borderRadius:10, fontSize:14, fontFamily:"'Inter',sans-serif", color:"#0F172A", background:"#F8FAFC", outline:"none", transition:"border 0.2s" };

  const PwdField = ({ label, value, onChange, show, onToggle }) => (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6 }}>{label}</label>
      <div style={{ position:"relative" }}>
        <input type={show?"text":"password"} value={value} onChange={onChange} style={inputStyle} required />
        <button type="button" onClick={onToggle} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:16, color:"#94A3B8", padding:0 }}>{show?"🙈":"👁️"}</button>
      </div>
    </div>
  );

  return (
    <>
      <div onClick={handleClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.45)", backdropFilter:"blur(3px)", zIndex:200, opacity:open?1:0, pointerEvents:open?"auto":"none", transition:"opacity 0.3s" }} />
      <div style={{ position:"fixed", top:0, right:0, width:380, height:"100vh", background:"#fff", zIndex:201, transform:open?"translateX(0)":"translateX(100%)", transition:"transform 0.35s cubic-bezier(0.4,0,0.2,1)", display:"flex", flexDirection:"column", boxShadow:"-8px 0 40px rgba(0,0,0,0.15)", overflowY:"auto" }}>
        <div style={{ background:"linear-gradient(135deg,#0F172A 0%,#1E293B 100%)", padding:"28px 24px 24px", position:"relative" }}>
          <button onClick={handleClose} style={{ position:"absolute", top:16, right:16, background:"rgba(255,255,255,0.1)", border:"none", color:"#fff", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          <div style={{ width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,#0D9488,#2DD4BF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, marginBottom:14, border:"3px solid rgba(45,212,191,0.4)" }}>⚙️</div>
          <div style={{ color:"#fff", fontFamily:"'Nunito',sans-serif", fontSize:20, fontWeight:800 }}>Settings</div>
          <div style={{ marginTop:6, display:"inline-block", background:"rgba(45,212,191,0.15)", border:"1px solid rgba(45,212,191,0.3)", borderRadius:20, padding:"3px 12px", fontSize:11, fontWeight:700, color:"#2DD4BF", letterSpacing:"1px", textTransform:"uppercase" }}>Account</div>
        </div>
        <div style={{ padding:24, flex:1 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"1px", marginBottom:20 }}>Change Password</div>
          <form onSubmit={handleChangePassword}>
            <PwdField label="Current Password"      value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} show={showCurrent} onToggle={()=>setShowCurrent(!showCurrent)} />
            <PwdField label="New Password"           value={newPassword}     onChange={(e)=>setNewPassword(e.target.value)}     show={showNew}     onToggle={()=>setShowNew(!showNew)} />
            <PwdField label="Confirm New Password"   value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} show={showConfirm} onToggle={()=>setShowConfirm(!showConfirm)} />
            {newPassword && (
              <div style={{ marginBottom:16, padding:"10px 14px", background:"#F0FDF9", borderRadius:10, border:"1px solid #A7F3D0", fontSize:12 }}>
                <div style={{ fontWeight:600, marginBottom:4, color:"#0D9488" }}>Password strength:</div>
                {[{rule:"At least 8 characters",pass:newPassword.length>=8},{rule:"Contains a number",pass:/[0-9]/.test(newPassword)},{rule:"Contains uppercase letter",pass:/[A-Z]/.test(newPassword)},{rule:"Contains special character",pass:/[^a-zA-Z0-9]/.test(newPassword)}].map(({rule,pass})=>(
                  <div key={rule} style={{ display:"flex", gap:6, color:pass?"#059669":"#94A3B8", marginTop:3 }}><span>{pass?"✅":"○"}</span><span>{rule}</span></div>
                ))}
              </div>
            )}
            {error   && <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"12px 14px", color:"#DC2626", fontSize:13, marginBottom:16 }}>⚠️ {error}</div>}
            {success && <div style={{ background:"#ECFDF5", border:"1px solid #A7F3D0", borderRadius:10, padding:"12px 14px", color:"#059669", fontSize:13, marginBottom:16 }}>✅ {success}</div>}
            <button type="submit" disabled={loading} style={{ width:"100%", padding:14, background:"linear-gradient(135deg,#0D9488,#0F766E)", color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:700, fontFamily:"'Nunito',sans-serif", cursor:loading?"not-allowed":"pointer", opacity:loading?0.7:1, boxShadow:"0 4px 14px rgba(13,148,136,0.35)" }}>
              {loading?"Changing…":"🔒 Change Password"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

/* ─── PROFILE SLIDE-IN PANEL ─── */
function ProfilePanel({ open, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    fetch(`${process.env.REACT_APP_API_URL}/accounts/profile/`, { credentials: "include" })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setProfile(d))
      .catch(() => setError("Could not load profile. Please try again."))
      .finally(() => setLoading(false));
  }, [open]);

  // Handles flat or nested response shapes
  const get = (key) => {
    if (!profile) return "—";
    return profile[key] ?? profile?.profile?.[key] ?? profile?.student_profile?.[key] ?? "—";
  };

  const fields = [
    { label: "Full Name",        key: "full_name",        icon: "👤" },
    { label: "Roll No",          key: "roll_no",           icon: "🎓" },
    { label: "Email",            key: "email",             icon: "📧" },
    { label: "Department",       key: "department",        icon: "🏛️" },
    { label: "Year",             key: "year",              icon: "📅" },
    { label: "Class",            key: "class_name",        icon: "🏫" },
    { label: "Hostel No",        key: "hostel_no",         icon: "🏠" },
    { label: "Room No",          key: "room_no",           icon: "🚪" },
    { label: "Personal Contact", key: "personal_contact",  icon: "📱" },
    { label: "Parent Contact",   key: "parent_contact",    icon: "👨‍👩‍👦" },
  ];

  const displayName = profile
    ? (get("full_name") !== "—" ? get("full_name") : (profile.username || "Student"))
    : "Student";

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.45)", backdropFilter:"blur(3px)", zIndex:200, opacity:open?1:0, pointerEvents:open?"auto":"none", transition:"opacity 0.3s" }} />

      {/* Slide panel */}
      <div style={{ position:"fixed", top:0, right:0, width:360, height:"100vh", background:"#fff", zIndex:201, transform:open?"translateX(0)":"translateX(100%)", transition:"transform 0.35s cubic-bezier(0.4,0,0.2,1)", display:"flex", flexDirection:"column", boxShadow:"-8px 0 40px rgba(0,0,0,0.15)", overflowY:"auto" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#0F172A 0%,#1E293B 100%)", padding:"28px 24px 24px", position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"rgba(255,255,255,0.1)", border:"none", color:"#fff", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>

          {profile?.photo
            ? <img src={profile.photo} alt="profile" style={{ width:72, height:72, borderRadius:"50%", border:"3px solid #2DD4BF", objectFit:"cover", marginBottom:14, display:"block" }} />
            : <div style={{ width:72, height:72, borderRadius:"50%", background:"linear-gradient(135deg,#0D9488,#2DD4BF)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, marginBottom:14, border:"3px solid rgba(45,212,191,0.4)" }}>🎓</div>
          }

          <div style={{ color:"#fff", fontFamily:"'Nunito',sans-serif", fontSize:20, fontWeight:800 }}>
            {loading ? "Loading…" : displayName}
          </div>
          <div style={{ marginTop:6, display:"inline-block", background:"rgba(45,212,191,0.15)", border:"1px solid rgba(45,212,191,0.3)", borderRadius:20, padding:"3px 12px", fontSize:11, fontWeight:700, color:"#2DD4BF", letterSpacing:"1px", textTransform:"uppercase" }}>
            Student
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:24, flex:1 }}>
          {loading && (
            <div style={{ textAlign:"center", padding:"40px 0", color:"#94A3B8" }}>
              <div style={{ fontSize:32, marginBottom:12 }}>⏳</div>
              <p style={{ fontSize:14 }}>Loading profile…</p>
            </div>
          )}
          {error && (
            <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:12, padding:16, color:"#DC2626", fontSize:14, textAlign:"center" }}>
              ⚠️ {error}
            </div>
          )}
          {profile && !loading && (
            <>
              <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"1px", marginBottom:16 }}>Profile Information</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {fields.map(({ label, key, icon }) => {
                  const val = get(key);
                  if (val === "—") return null;
                  return (
                    <div key={key} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 14px", borderRadius:12, background:"#F8FAFC", border:"1px solid #F1F5F9" }}>
                      <span style={{ fontSize:18, flexShrink:0, marginTop:1 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:"#94A3B8", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:2 }}>{label}</div>
                        <div style={{ fontSize:14, fontWeight:600, color:"#0F172A" }}>{val}</div>
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

/* ─── MONTHLY QUOTA METER ─── */
function QuotaMeter({ quota }) {
  if (!quota) return null;

  const QuotaBar = ({ label, icon, used, limit, color }) => {
    const remaining = Math.max(0, limit - used);
    const pct       = Math.min(100, (used / limit) * 100);
    const exhausted = remaining === 0;

    return (
      <div style={{
        flex: "1 1 180px",
        padding: "14px 16px",
        borderRadius: 14,
        background: exhausted ? "#FEF2F2" : "#F0FDF9",
        border: `1.5px solid ${exhausted ? "#FECACA" : "#A7F3D0"}`,
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:18 }}>{icon}</span>
            <span style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>{label}</span>
          </div>
          <span style={{
            fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:20,
            background: exhausted ? "#FEE2E2" : "#DCFCE7",
            color: exhausted ? "#DC2626" : "#059669",
          }}>
            {exhausted ? "EXHAUSTED" : `${remaining} left`}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ height:8, borderRadius:8, background:"#E2E8F0", overflow:"hidden", marginBottom:6 }}>
          <div style={{
            height:"100%", borderRadius:8, width:`${pct}%`,
            background: exhausted
              ? "linear-gradient(90deg,#F87171,#DC2626)"
              : pct >= 50
                ? "linear-gradient(90deg,#FBBF24,#F59E0B)"
                : `linear-gradient(90deg,${color},${color}cc)`,
            transition: "width 0.4s ease",
          }} />
        </div>

        <div style={{ fontSize:12, color:"#64748B" }}>
          {used} of {limit} used this month
        </div>
      </div>
    );
  };

  return (
    <div style={{
      background: "#fff",
      border: "1.5px solid #E2E8F0",
      borderRadius: 16,
      padding: "16px 20px",
      marginBottom: 20,
    }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#0F172A" }}>
          📊 Monthly Pass Quota
        </div>
        <div style={{ fontSize:11, color:"#94A3B8", fontWeight:600 }}>
          {quota.month} · Unused passes don't carry over
        </div>
      </div>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        <QuotaBar
          label="Gate Pass"
          icon="🚪"
          used={quota.gate.used}
          limit={quota.gate.limit}
          color="#0D9488"
        />
        <QuotaBar
          label="Home Pass"
          icon="🏠"
          used={quota.home.used}
          limit={quota.home.limit}
          color="#7C3AED"
        />
      </div>
    </div>
  );
}

/* ─── STUDENT DASHBOARD ─── */
function StudentDashboard({onLogout}) {
  const [form, setForm] = useState({ leave_type: "gate", reason: "", out_time: "", in_time: "" });
  const [leaves, setLeaves] = useState([]);
  const [quota, setQuota]   = useState(null);   // { gate, home, month }
  const [selectedQR, setSelectedQR] = useState(null);
  const [activeTab, setActiveTab] = useState("apply");
  const [profileOpen, setProfileOpen]   = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyPage, setHistoryPage]   = useState(1);
  const ROWS_PER_PAGE = 10;

  // Current datetime string in local timezone for min attribute
  const nowLocal = () =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString().slice(0, 16);

  // Check if selected out_time is a Sunday (weekday === 0 in JS is Sunday)
  const isSunday = form.out_time
    ? new Date(form.out_time).getDay() === 0
    : false;

  // Is the selected leave type quota-exhausted?
  const isQuotaExhausted = quota
    ? quota[form.leave_type]?.remaining === 0
    : false;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const updated = { ...f, [name]: value };
      // When leave_type or out_time changes, re-validate in_time
      if (name === "leave_type" || name === "out_time") {
        updated.in_time = ""; // clear in_time so user picks a valid one
      }
      return updated;
    });
  };

  // Compute the min allowed value for in_time based on leave type + out_time
  const getInTimeMin = () => {
    if (!form.out_time) return nowLocal();
    if (form.leave_type === "gate") {
      // Same day: in_time must be after out_time (at least 1 min later)
      const outDate = new Date(form.out_time);
      outDate.setMinutes(outDate.getMinutes() + 1);
      return new Date(outDate.getTime() - new Date().getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16);
    } else {
      // Home pass: in_time date must be strictly after out_time date (next day min)
      const outDate = new Date(form.out_time);
      outDate.setDate(outDate.getDate() + 1);
      outDate.setHours(0, 0, 0, 0);
      return new Date(outDate.getTime() - new Date().getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16);
    }
  };

  // Compute the max allowed value for in_time for gate pass (same date, end of day)
  const getInTimeMax = () => {
    if (form.leave_type === "gate" && form.out_time) {
      const outDate = new Date(form.out_time);
      outDate.setHours(23, 59, 0, 0);
      return new Date(outDate.getTime() - new Date().getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16);
    }
    return undefined;
  };

  const submitLeave = async () => {
    // Quota check on the frontend (server enforces it too)
    if (isQuotaExhausted) {
      const label = form.leave_type === "gate" ? "Gate Pass" : "Home Pass";
      const limit = quota[form.leave_type].limit;
      alert(`❌ You have used all ${limit} ${label}(s) allowed this month (${quota.month}).\n\nUnused passes do not carry over — your quota resets on the 1st of next month.`);
      return;
    }

    // Frontend validation
    if (!form.reason.trim()) {
      alert("Please enter a reason for your leave."); return;
    }
    if (!form.out_time || !form.in_time) {
      alert("Please select both Out Time and In Time."); return;
    }
    const out = new Date(form.out_time);
    const inn = new Date(form.in_time);
    if (inn <= out) {
      alert("In Time must be after Out Time."); return;
    }
    if (form.leave_type === "gate") {
      const outDay = out.toDateString();
      const inDay  = inn.toDateString();
      if (outDay !== inDay) {
        alert("For a Gate Pass, Out Time and In Time must be on the same date."); return;
      }
    }
    if (form.leave_type === "home") {
      if (inn.toDateString() === out.toDateString()) {
        alert("For a Home Pass, In Time must be on a date after the Out Time date."); return;
      }
    }
    try {
      const res  = await fetch(`${process.env.REACT_APP_API_URL}/leave/create/`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok) {
        // Handle quota-exceeded error returned by the server
        if (json.quota_exceeded) {
          const label = json.leave_type === "gate" ? "Gate Pass" : "Home Pass";
          alert(`❌ Monthly quota exceeded!\n\nYou can apply for at most ${json.limit} ${label}(s) per month. You have used ${json.used}/${json.limit} this month.\n\nUnused passes do not carry over to the next month.`);
        } else {
          alert(`Error: ${json.error || "Something went wrong."}`);
        }
        return;
      }

      // Update quota state with the fresh values returned by the server
      if (json.quota) setQuota(json.quota);

      if (json.sunday_fasttrack) {
        alert("✅ Leave submitted! Since it's a Sunday (holiday), your request has been sent directly to the Warden — no HOD or Manager approval needed.");
      } else {
        alert("✅ Leave request submitted successfully!");
      }
      fetchLeaves();
      setActiveTab("history");
    } catch { alert("Error submitting leave"); }
  };

  const fetchLeaves = async () => {
    const res  = await fetch(`${process.env.REACT_APP_API_URL}/leave/my/`, { credentials: "include" });
    const data = await res.json();
    // Backend now returns { leaves: [...], quota: {...} }
    setLeaves(data.leaves ?? data);   // graceful fallback for old shape
    if (data.quota) setQuota(data.quota);
  };

  useEffect(() => { fetchLeaves(); }, []);
  useEffect(() => { setHistoryPage(1); }, [leaves]);

  const logout = async () => {
    await fetch(`${process.env.REACT_APP_API_URL}/accounts/logout/`, {
      method: "POST",
      credentials: "include",
    });
    localStorage.clear();
    sessionStorage.clear(); // ✅ clear session ID so App.js shows login
    window.location.href = window.location.origin; // ✅ redirect to homepage (or login page) after logout
  };

  const statusBadge = (status) => {
    const map = {
      pending_hod:     { cls: "badge-pending",  label: "⏳ Pending HOD" },
      pending_manager: { cls: "badge-pending",  label: "⏳ Pending Manager" },
      pending_warden:  { cls: "badge-pending",  label: "⏳ Pending Warden" },
      approved:        { cls: "badge-approved", label: "✅ Approved" },
      out:             { cls: "badge-rejected", label: "🔴 Out" },
      in:              { cls: "badge-approved", label: "🟢 Returned" },
      hod_rejected:    { cls: "badge-rejected", label: "❌ Rejected by HOD" },
      manager_rejected:{ cls: "badge-rejected", label: "❌ Rejected by Manager" },
      warden_rejected: { cls: "badge-rejected", label: "❌ Rejected by Warden" },
    };
    const s = map[status] || { cls: "badge-pending", label: status };
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
  };

  return (
    <div className="dashboard-root">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-badge">Easy Exit</div>
          <h2>Easy<span>Exit</span></h2>
          <div className="sidebar-role">Student Portal</div>
        </div>
        <nav className="sidebar-nav">
          <button className={`sidebar-btn ${activeTab === "apply" ? "active" : ""}`} onClick={() => setActiveTab("apply")}>📝 Apply Leave</button>
          <button className={`sidebar-btn ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>📋 My Requests</button>
          <button className="sidebar-btn" onClick={() => setProfileOpen(true)}>👤 Profile</button>
        </nav>
        <div className="sidebar-footer">
          <button className="sidebar-btn" onClick={() => setSettingsOpen(true)}>⚙️ Settings</button>
          <button className="sidebar-btn logout" onClick={logout}>🚪 Logout</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        <div className="page-header">
          <h1>{activeTab === "apply" ? "Apply for Leave" : "My Leave Requests"}</h1>
          <p>{activeTab === "apply" ? "Submit a new outpass or home pass request" : "Track the status of your leave applications"}</p>
        </div>

        {activeTab === "apply" && (
          <div>
            {/* ── Quota meter (always visible on Apply tab) ── */}
            <QuotaMeter quota={quota} />

            <div className="card">
              <h3>📝 New Leave Request</h3>

              {/* Quota-exhausted warning banner */}
              {isQuotaExhausted && (
                <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"14px 16px", background:"#FEF2F2", border:"1.5px solid #FECACA", borderRadius:12, marginBottom:16 }}>
                  <span style={{ fontSize:22, flexShrink:0 }}>🚫</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#DC2626", marginBottom:2 }}>
                      Monthly Quota Exhausted
                    </div>
                    <div style={{ fontSize:12, color:"#B91C1C" }}>
                      You have used all your{" "}
                      {form.leave_type === "gate"
                        ? `${quota?.gate?.limit} Gate Pass(es)`
                        : `${quota?.home?.limit} Home Pass(es)`}{" "}
                      for {quota?.month}. Unused passes do not carry over — your quota resets on the 1st of next month.
                    </div>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Leave Type</label>
                  <select name="leave_type" onChange={handleChange} value={form.leave_type}>
                    <option value="gate">🚪 Gate Pass {quota ? `(${quota.gate.remaining}/${quota.gate.limit} remaining)` : ""}</option>
                    <option value="home">🏠 Home Pass {quota ? `(${quota.home.remaining}/${quota.home.limit} remaining)` : ""}</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ flex:"1 1 100%" }}>
                  <label>Reason</label>
                  <textarea
                    name="reason"
                    placeholder="Describe the reason for your leave... (required)"
                    onChange={handleChange}
                    value={form.reason}
                    rows={3}
                    required
                    disabled={isQuotaExhausted}
                    style={{ opacity: isQuotaExhausted ? 0.5 : 1, cursor: isQuotaExhausted ? "not-allowed" : "auto" }}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Out Time</label>
                  <input
                    type="datetime-local"
                    name="out_time"
                    value={form.out_time}
                    min={nowLocal()}
                    disabled={isQuotaExhausted}
                    onChange={handleChange}
                    style={{ opacity: isQuotaExhausted ? 0.5 : 1, cursor: isQuotaExhausted ? "not-allowed" : "auto" }}
                  />
                </div>
                <div className="form-group">
                  <label>
                    In Time
                    {form.leave_type === "gate" && form.out_time && (
                      <span style={{ marginLeft:8, fontSize:11, color:"#0D9488", fontWeight:600 }}>
                        (same day as out)
                      </span>
                    )}
                    {form.leave_type === "home" && form.out_time && (
                      <span style={{ marginLeft:8, fontSize:11, color:"#7C3AED", fontWeight:600 }}>
                        (must be next day or later)
                      </span>
                    )}
                  </label>
                  <input
                    type="datetime-local"
                    name="in_time"
                    value={form.in_time}
                    min={getInTimeMin()}
                    max={getInTimeMax()}
                    disabled={!form.out_time || isQuotaExhausted}
                    onChange={handleChange}
                    style={{ opacity: (form.out_time && !isQuotaExhausted) ? 1 : 0.5, cursor: (form.out_time && !isQuotaExhausted) ? "auto" : "not-allowed" }}
                  />
                  {!form.out_time && (
                    <span style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>Select Out Time first</span>
                  )}
                </div>
              </div>
              {/* Sunday fast-track notice */}
              {isSunday && !isQuotaExhausted && (
                <div style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"14px 16px", background:"#EFF6FF", border:"1.5px solid #BFDBFE", borderRadius:12, marginBottom:12 }}>
                  <span style={{ fontSize:22, flexShrink:0 }}>🎉</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#1D4ED8", marginBottom:2 }}>Sunday — Holiday Fast Track!</div>
                    <div style={{ fontSize:12, color:"#3B82F6" }}>
                      Since your out time falls on a Sunday, this request will skip HOD and Manager approval and go directly to the Warden.
                    </div>
                  </div>
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={submitLeave}
                style={{ marginTop:8, opacity: isQuotaExhausted ? 0.5 : 1, cursor: isQuotaExhausted ? "not-allowed" : "pointer" }}
                disabled={isQuotaExhausted}
              >
                🚀 Submit Leave Request
              </button>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="card">
            <h3>📋 Leave History</h3>
            {leaves.length === 0 ? (
              <div className="empty-state"><div className="icon">📭</div><p>No leave requests yet. Apply for your first leave!</p></div>
            ) : (() => {
              const totalPages     = Math.ceil(leaves.length / ROWS_PER_PAGE);
              const paginatedLeaves = leaves.slice((historyPage - 1) * ROWS_PER_PAGE, historyPage * ROWS_PER_PAGE);
              const btnBase = { borderRadius:8, border:"1.5px solid #E2E8F0", fontSize:13, fontWeight:600, cursor:"pointer" };
              const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - historyPage) <= 1)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, []);
              return (
                <>
                  <table className="styled-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Reason</th>
                        <th>🚶 Out Time</th>
                        <th>🏠 In Time</th>
                        <th>Status</th>
                        <th>Comments / QR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLeaves.map((l) => {
                        const fmt = (iso) => iso ? new Date(iso).toLocaleString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" }) : null;
                        const outTime = fmt(l.scanned_out_at);
                        const inTime  = fmt(l.scanned_in_at);
                        return (
                          <tr key={l.id}>
                            <td><span className="badge badge-pending">{l.leave_type === "gate" ? "🚪 Gate" : "🏠 Home"}</span></td>
                            <td style={{ maxWidth:180, fontSize:13 }}>{l.reason}</td>
                            <td>
                              {outTime
                                ? <div style={{ fontSize:13, fontWeight:600, color:"#DC2626" }}>🔴 {outTime}</div>
                                : <span style={{ fontSize:12, color:"#94A3B8" }}>Not scanned yet</span>
                              }
                            </td>
                            <td>
                              {inTime
                                ? <div style={{ fontSize:13, fontWeight:600, color:"#059669" }}>🟢 {inTime}</div>
                                : <span style={{ fontSize:12, color:"#94A3B8" }}>Not scanned yet</span>
                              }
                            </td>
                            <td>{statusBadge(l.status)}</td>
                            <td>
                              {l.comment
                                ? <span style={{ fontSize:13, color:"#374151" }}>💬 {l.comment}</span>
                                : <span style={{ fontSize:12, color:"#94A3B8" }}>No comments yet</span>
                              }
                              {l.qr_token && (
                                <div style={{ marginTop:8 }}>
                                  <button className="btn btn-primary" style={{ padding:"6px 14px", fontSize:12 }} onClick={() => setSelectedQR(l.qr_token)}>📱 View QR Code</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* PAGINATION BAR */}
                  {totalPages > 1 && (
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 4px", borderTop:"1px solid #F1F5F9", marginTop:8 }}>
                      <div style={{ fontSize:13, color:"#64748B" }}>
                        Showing <strong>{(historyPage - 1) * ROWS_PER_PAGE + 1}</strong>–<strong>{Math.min(historyPage * ROWS_PER_PAGE, leaves.length)}</strong> of <strong>{leaves.length}</strong>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <button onClick={() => setHistoryPage((p) => p - 1)} disabled={historyPage === 1}
                          style={{ ...btnBase, padding:"6px 12px", background: historyPage === 1 ? "#F8FAFC" : "#fff", color: historyPage === 1 ? "#CBD5E1" : "#0F172A", cursor: historyPage === 1 ? "not-allowed" : "pointer" }}>
                          ← Prev
                        </button>
                        {pages.map((p, idx) =>
                          p === "..." ? (
                            <span key={`e${idx}`} style={{ padding:"0 4px", color:"#94A3B8", fontSize:13 }}>…</span>
                          ) : (
                            <button key={p} onClick={() => setHistoryPage(p)}
                              style={{ ...btnBase, width:34, height:34, borderColor: historyPage === p ? "#0D9488" : "#E2E8F0", background: historyPage === p ? "#0D9488" : "#fff", color: historyPage === p ? "#fff" : "#0F172A", fontWeight: historyPage === p ? 700 : 400 }}>
                              {p}
                            </button>
                          )
                        )}
                        <button onClick={() => setHistoryPage((p) => p + 1)} disabled={historyPage === totalPages}
                          style={{ ...btnBase, padding:"6px 12px", background: historyPage === totalPages ? "#F8FAFC" : "#fff", color: historyPage === totalPages ? "#CBD5E1" : "#0F172A", cursor: historyPage === totalPages ? "not-allowed" : "pointer" }}>
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </main>

      {/* QR POPUP */}
      {selectedQR && (
        <div className="overlay" onClick={() => setSelectedQR(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>📱 Your QR Pass</h3>
            <div style={{ padding:16, background:"#F0FDF9", borderRadius:12, display:"inline-block", marginBottom:20 }}>
              <QRCodeCanvas value={selectedQR} size={200} fgColor="#0F172A" />
            </div>
            <p style={{ fontSize:13, color:"#64748B", marginBottom:20 }}>Show this QR code to the security guard at the gate</p>
            <button className="btn btn-ghost" style={{ width:"100%" }} onClick={() => setSelectedQR(null)}>Close</button>
          </div>
        </div>
      )}

      {/* PROFILE PANEL */}
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* SETTINGS PANEL */}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default StudentDashboard;
