import React, { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { DashboardShell, DetailPanel } from "./DashboardShared";
import "../styles/common.css";
import { apiFetch } from "../api";

const API = "https://easy-exit-backend-1.onrender.com";

const WARDEN_FIELDS = [
  { label: "Roll No",          key: "roll_no" },
  { label: "Department",       key: "department" },
  { label: "Year",             key: "year" },
  { label: "Hostel",           key: "hostel_no" },
  { label: "Room No",          key: "room_no" },
  { label: "Personal Contact", key: "personal_contact" },
  { label: "Parent Contact",   key: "parent_contact" },
  { label: "Leave Type",       key: "leave_type" },
  { label: "Reason",           key: "reason" },
  { label: "Out Time",         key: "out_time" },
  { label: "In Time",          key: "in_time" },
];

/* ── helpers ── */
const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "2-digit", month: "short",
        hour: "2-digit", minute: "2-digit", hour12: true,
      })
    : null;

const today = () => new Date().toISOString().slice(0, 10);

/* ════════════════════════════════════════════════════════════
   LIVE OUTSIDE TAB — All students currently outside hostel
════════════════════════════════════════════════════════════ */
function LiveOutside() {
  const [data, setData]       = useState({ out_count:0, out_overdue_count:0, not_reported_count:0, out_records:[], not_reported:[] });
  const [loading, setLoading] = useState(false);
  const [hostel, setHostel]   = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);
  const [activeCard, setActiveCard]   = useState(null); // null | "all" | "confirmed" | "overdue" | "not_scanned" 

  const fetchLive = async (h = hostel) => {
    setLoading(true);
    let url = `${API}/leave/warden/live_outside/`;
    if (h) url += `?hostel=${h}`;
    try {
      
      const res = await apiFetch(url.replace(API, ""));
      if (!res) return;

      if (res.status === 401) { window.location.href = "/"; return; }
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchLive();
    const interval = setInterval(() => fetchLive(), 60000);
    return () => clearInterval(interval);
  }, []);

  const totalNotReturned = data.out_count + data.not_reported_count;

  // Shared table for student rows
  const StudentRow = ({ r, i, showPlanned }) => (
    <tr key={r.leave_id} style={{ background: r.overdue ? "#FFFBEB" : undefined }}>
      <td style={{ color:"#94A3B8", fontSize:12 }}>{i+1}</td>
      <td>
        <div style={{ fontWeight:600, fontSize:13, color:"#0F172A" }}>{r.name}</div>
        <div style={{ fontSize:11, color:"#94A3B8" }}>{r.department} · {r.year}</div>
      </td>
      <td style={{ fontWeight:600, color:"#0D9488", fontSize:13 }}>{r.roll_no}</td>
      <td style={{ fontSize:13, color:"#64748B" }}>{r.hostel_no} / {r.room_no}</td>
      <td>
        <div style={{ fontSize:12, color:"#374151" }}>📱 {r.personal_contact || "—"}</div>
        <div style={{ fontSize:11, color:"#94A3B8" }}>👨‍👩‍👦 {r.parent_contact || "—"}</div>
      </td>
      <td><span className="badge badge-pending">{r.leave_type==="gate"?"🚪 Gate":"🏠 Home"}</span></td>
      {showPlanned ? (
        <>
          <td>
            <div style={{ fontSize:13, fontWeight:600, color:"#DC2626" }}>{fmt(r.planned_out)}</div>
            <div style={{ fontSize:11, color:"#94A3B8" }}>Planned out</div>
          </td>
          <td>
            <span style={{ fontSize:13, fontWeight:700, color:"#C2410C", fontFamily:"'Nunito',sans-serif" }}>
              {r.since_planned}
            </span>
          </td>
          <td>
            <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#FFF7ED", color:"#C2410C", border:"1.5px solid #FED7AA", borderRadius:20, padding:"3px 12px", fontSize:12, fontWeight:700 }}>
              ⚠️ Not Scanned
            </span>
          </td>
        </>
      ) : (
        <>
          <td>
            <div style={{ fontSize:13, fontWeight:600, color:"#DC2626" }}>{fmt(r.scanned_out_at)}</div>
            {r.overdue && <div style={{ fontSize:11, color:"#C2410C", marginTop:2 }}>📅 Previous day</div>}
          </td>
          <td>
            <span style={{ fontSize:14, fontWeight:700, color: r.overdue ? "#C2410C" : "#DC2626", fontFamily:"'Nunito',sans-serif" }}>
              {r.time_out}
            </span>
          </td>
          <td>
            {r.overdue
              ? <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#FFF7ED", color:"#C2410C", border:"1.5px solid #FED7AA", borderRadius:20, padding:"3px 12px", fontSize:12, fontWeight:700 }}>🚨 Overdue</span>
              : <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#FEF2F2", color:"#DC2626", border:"1.5px solid #FECACA", borderRadius:20, padding:"3px 12px", fontSize:12, fontWeight:700 }}>🔴 Outside</span>
            }
          </td>
        </>
      )}
    </tr>
  );

  const TableHeader = ({ showPlanned }) => (
    <thead>
      <tr>
        <th>#</th><th>Student</th><th>Roll No</th><th>Hostel / Room</th>
        <th>Contact</th><th>Pass Type</th>
        <th>{showPlanned ? "Planned Out Time" : "🔴 Went Out"}</th>
        <th>{showPlanned ? "Overdue Since" : "⏱ Time Outside"}</th>
        <th>Status</th>
      </tr>
    </thead>
  );

  return (
    <div>
      {/* ── STAT CARDS ── */}
      <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
        {[
          { key:"all",         label:"Total Not Returned",  count:totalNotReturned,        icon:"🏃", bg:"#EFF6FF", border:"#BFDBFE", text:"#1D4ED8" },
          { key:"confirmed",   label:"Outside (Confirmed)", count:data.out_count,          icon:"🔴", bg:"#FEF2F2", border:"#FECACA", text:"#DC2626" },
          { key:"overdue",     label:"Overdue (Prev Days)", count:data.out_overdue_count,  icon:"🚨", bg:"#FFF7ED", border:"#FED7AA", text:"#C2410C" },
          { key:"not_scanned", label:"Not Scanned at Gate", count:data.not_reported_count, icon:"⚠️", bg:"#FEFCE8", border:"#FEF08A", text:"#A16207" },
        ].map((s) => {
          const isActive = activeCard === s.key;
          return (
            <div
              key={s.key}
              onClick={() => setActiveCard(isActive ? null : s.key)}
              style={{
                flex:"1 1 140px", padding:"18px 20px", borderRadius:16,
                background: isActive ? s.bg : "#fff",
                border: `2px solid ${isActive ? s.text : s.border}`,
                cursor:"pointer",
                transform: isActive ? "translateY(-3px)" : "none",
                boxShadow: isActive ? `0 8px 24px ${s.border}` : "none",
                transition:"all 0.2s",
                position:"relative",
              }}
            >
              {isActive && (
                <div style={{ position:"absolute", top:10, right:12, fontSize:11, fontWeight:700, color:s.text, background:"rgba(255,255,255,0.8)", borderRadius:20, padding:"2px 8px" }}>
                  ✓ Filtered
                </div>
              )}
              <div style={{ fontSize:26, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontSize:32, fontWeight:900, fontFamily:"'Nunito',sans-serif", color:s.text, lineHeight:1 }}>{s.count}</div>
              <div style={{ fontSize:11, color:"#94A3B8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginTop:6 }}>{s.label}</div>
              <div style={{ fontSize:10, color: isActive ? s.text : "#CBD5E1", marginTop:4, fontWeight:600 }}>
                {isActive ? "Click to clear" : "Click to filter"}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CONTROLS ── */}
      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:20, flexWrap:"wrap" }}>
        <input placeholder="Filter by hostel..." value={hostel}
          onChange={(e) => setHostel(e.target.value)}
          style={{ padding:"9px 14px", border:"1.5px solid #E2E8F0", borderRadius:9, fontSize:13, fontFamily:"'Inter',sans-serif", background:"#F8FAFC", outline:"none", minWidth:180 }}
        />
        <button className="btn btn-primary" onClick={() => fetchLive(hostel)}>Apply</button>
        <button className="btn btn-ghost"   onClick={() => { setHostel(""); fetchLive(""); }}>Clear</button>
        <button className="btn btn-ghost" onClick={() => fetchLive(hostel)} style={{ marginLeft:"auto" }}>🔄 Refresh</button>
        {lastRefresh && (
          <span style={{ fontSize:11, color:"#94A3B8", display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ width:7, height:7, borderRadius:"50%", background:"#10B981", display:"inline-block", animation:"pulse 2s infinite" }} />
            Live · Updated {lastRefresh.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
          </span>
        )}
      </div>

      {loading && <div className="empty-state"><div className="icon">⏳</div><p>Loading live data…</p></div>}

      {!loading && totalNotReturned === 0 && (
        <div className="empty-state">
          <div className="icon">🏠</div>
          <p style={{ fontWeight:600, color:"#059669", fontSize:15 }}>All students are inside the hostel!</p>
        </div>
      )}

      {!loading && (() => {
        // Compute which rows to show based on activeCard
        // null = show all (default, no card clicked)
        let outRows = data.out_records;
        let notRows = data.not_reported;

        if (activeCard === "confirmed")   { notRows = []; }
        else if (activeCard === "overdue") { outRows = outRows.filter(r => r.overdue); notRows = []; }
        else if (activeCard === "not_scanned") { outRows = []; }
        // "all" and null show everything

        const showOut = outRows.length > 0;
        const showNot = notRows.length > 0;

        return (
          <>
            {showOut && (
              <div className="card" style={{ padding:0, overflow:"hidden", marginBottom:20 }}>
                <div style={{ padding:"16px 24px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <h3 style={{ margin:0, display:"flex", alignItems:"center", gap:8 }}>
                    🔴 Confirmed Outside
                    <span style={{ width:9, height:9, borderRadius:"50%", background:"#EF4444", display:"inline-block", boxShadow:"0 0 0 3px rgba(239,68,68,0.2)" }} />
                  </h3>
                  <span className="badge badge-rejected">{outRows.length} students</span>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table className="styled-table">
                    <TableHeader showPlanned={false} />
                    <tbody>{outRows.map((r,i) => <StudentRow key={r.leave_id} r={r} i={i} showPlanned={false} />)}</tbody>
                  </table>
                </div>
              </div>
            )}

            {showNot && (
              <div className="card" style={{ padding:0, overflow:"hidden", border:"2px solid #FEF08A" }}>
                <div style={{ padding:"16px 24px", borderBottom:"1px solid #FEF9C3", display:"flex", justifyContent:"space-between", alignItems:"center", background:"#FEFCE8" }}>
                  <div>
                    <h3 style={{ margin:0, color:"#A16207", display:"flex", alignItems:"center", gap:8 }}>⚠️ Not Scanned at Gate</h3>
                    <p style={{ margin:"4px 0 0", fontSize:12, color:"#854D0E" }}>
                      These students have an approved pass and their planned out time has passed — but they never scanned at the gate.
                    </p>
                  </div>
                  <span style={{ background:"#FEFCE8", color:"#A16207", border:"1.5px solid #FEF08A", borderRadius:20, padding:"4px 14px", fontSize:13, fontWeight:700, whiteSpace:"nowrap" }}>
                    {notRows.length} students
                  </span>
                </div>
                <div style={{ overflowX:"auto" }}>
                  <table className="styled-table">
                    <TableHeader showPlanned={true} />
                    <tbody>{notRows.map((r,i) => <StudentRow key={r.leave_id} r={r} i={i} showPlanned={true} />)}</tbody>
                  </table>
                </div>
              </div>
            )}

            {!showOut && !showNot && totalNotReturned > 0 && activeCard && (
              <div className="empty-state">
                <div className="icon">📭</div>
                <p>No students found for this filter.</p>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   STUDENT TRACKING TAB
════════════════════════════════════════════════════════════ */
function StudentTracking() {
  const [dateRecords, setDateRecords]     = useState([]);
  const [overdue, setOverdue]             = useState([]);
  const [returnedLate, setReturnedLate]   = useState([]);   // NEW
  const [loading, setLoading]             = useState(false);
  const [date, setDate]                   = useState(today());
  const [hostel, setHostel]               = useState("");
  const [rollNo, setRollNo]               = useState("");
  const [scanFilter, setScanFilter]       = useState("all");
  const [summary, setSummary]             = useState({ out:0, returned:0, not_scanned:0, overdue:0, returned_late:0 });

  const fetchTracking = async (d=date, h=hostel, sf=scanFilter, rn=rollNo) => {
    setLoading(true);
    let url = `${API}/leave/warden/tracking/?date=${d}`;
    if (h)            url += `&hostel=${encodeURIComponent(h)}`;
    if (sf !== "all") url += `&status=${sf}`;
    if (rn)           url += `&roll_no=${encodeURIComponent(rn)}`;
    try {
      const res = await apiFetch(url.replace(API, ""));
      if (!res) return;
      if (res.status === 401) { window.location.href = "/login"; return; }  
      const data = await res.json();
      setDateRecords(data.date_records || []);
      setOverdue(data.overdue || []);
      setReturnedLate(data.returned_late || []);            // NEW
      setSummary(data.summary || { out:0, returned:0, not_scanned:0, overdue:0, returned_late:0 });
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchTracking(); }, []);

  const scanBadge = (r) => {
    if (r.overdue)                return <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#FFF7ED", color:"#C2410C", border:"1.5px solid #FED7AA", borderRadius:20, padding:"3px 12px", fontSize:12, fontWeight:700 }}>🚨 Overdue · {r.overdue_since}</span>;
    if (r.scan_status==="out")      return <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#FEF2F2", color:"#DC2626", border:"1.5px solid #FECACA", borderRadius:20, padding:"3px 12px", fontSize:12, fontWeight:700 }}>🔴 Currently Out</span>;
    if (r.scan_status==="returned") return <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#ECFDF5", color:"#059669", border:"1.5px solid #A7F3D0", borderRadius:20, padding:"3px 12px", fontSize:12, fontWeight:700 }}>🟢 Returned</span>;
    return                               <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#F8FAFC", color:"#94A3B8", border:"1.5px solid #E2E8F0", borderRadius:20, padding:"3px 12px", fontSize:12, fontWeight:700 }}>⚪ Not Scanned</span>;
  };

  const TrackingTable = ({ rows, showOutDate }) => (
    <div style={{ overflowX:"auto" }}>
      <table className="styled-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Student</th>
            <th>Roll No</th>
            <th>Hostel / Room</th>
            <th>Pass Type</th>
            {showOutDate && <th>📅 Out Date</th>}
            <th>🔴 Out Time</th>
            <th>🟢 In Time</th>
            <th>Duration</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.leave_id} style={{ background: r.overdue ? "#FFFBEB" : undefined }}>
              <td style={{ color:"#94A3B8", fontSize:12 }}>{i+1}</td>
              <td>
                <div style={{ fontWeight:600, fontSize:13, color:"#0F172A" }}>{r.name}</div>
                <div style={{ fontSize:11, color:"#94A3B8" }}>{r.department} · {r.year}</div>
              </td>
              <td style={{ fontWeight:600, color:"#0D9488", fontSize:13 }}>{r.roll_no}</td>
              <td style={{ fontSize:13, color:"#64748B" }}>{r.hostel_no} / {r.room_no}</td>
              <td><span className="badge badge-pending">{r.leave_type==="gate"?"🚪 Gate":"🏠 Home"}</span></td>
              {showOutDate && (
                <td style={{ fontSize:12, color:"#C2410C", fontWeight:600 }}>
                  {r.scanned_out_at ? new Date(r.scanned_out_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : "—"}
                </td>
              )}
              <td>{fmt(r.scanned_out_at) ? <span style={{ fontSize:13, fontWeight:600, color:"#DC2626" }}>{fmt(r.scanned_out_at)}</span> : <span style={{ fontSize:12, color:"#94A3B8" }}>—</span>}</td>
              <td>{fmt(r.scanned_in_at)  ? <span style={{ fontSize:13, fontWeight:600, color:"#059669" }}>{fmt(r.scanned_in_at)}</span>  : <span style={{ fontSize:12, color:"#94A3B8" }}>—</span>}</td>
              <td>{r.duration ? <span style={{ fontSize:13, fontWeight:600, color:"#0D9488" }}>⏱ {r.duration}</span> : <span style={{ fontSize:12, color:"#94A3B8" }}>—</span>}</td>
              <td>{scanBadge(r)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  return (
    <div>
      {/* ── SUMMARY CARDS ── */}
      <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
        {[
          { label:"Currently Out",    count:summary.out,           icon:"🔴", bg:"#FEF2F2", border:"#FECACA", text:"#DC2626",  filter:"out" },
          { label:"Returned",         count:summary.returned,      icon:"🟢", bg:"#ECFDF5", border:"#A7F3D0", text:"#059669",  filter:"in" },
          { label:"Awaiting Scan",    count:summary.not_scanned,   icon:"⚪", bg:"#F8FAFC", border:"#E2E8F0", text:"#64748B",  filter:"pending_scan" },
          { label:"Overdue (out)",    count:summary.overdue,       icon:"🚨", bg:"#FFF7ED", border:"#FED7AA", text:"#C2410C",  filter:"overdue" },
          { label:"Returned Late",    count:summary.returned_late, icon:"🕐", bg:"#FDF4FF", border:"#E9D5FF", text:"#7C3AED",  filter:"returned_late" },
        ].map((s) => (
          <div key={s.filter} onClick={() => setScanFilter(s.filter===scanFilter?"all":s.filter)}
            style={{ flex:"1 1 120px", padding:"16px 18px", borderRadius:14, cursor:"pointer",
              background:scanFilter===s.filter?s.bg:"#fff",
              border:`1.5px solid ${scanFilter===s.filter?s.border:"#E2E8F0"}`,
              transition:"all 0.2s",
              boxShadow:scanFilter===s.filter?`0 4px 12px ${s.border}88`:"none" }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontSize:26, fontWeight:800, fontFamily:"'Nunito',sans-serif", color:s.text }}>{s.count}</div>
            <div style={{ fontSize:11, color:"#94A3B8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px", marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── FILTER BAR ── */}
      <div className="filter-bar" style={{ marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.5px", alignSelf:"center" }}>📅 Filter</div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, fontWeight:600, color:"#94A3B8" }}>Date</label>
          <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} style={{ minWidth:160 }} />
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, fontWeight:600, color:"#94A3B8" }}>Roll No</label>
          <input placeholder="e.g. 22A91A" value={rollNo} onChange={(e) => setRollNo(e.target.value)} style={{ minWidth:130 }} />
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, fontWeight:600, color:"#94A3B8" }}>Hostel</label>
          <input placeholder="All hostels" value={hostel} onChange={(e) => setHostel(e.target.value)} />
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          <label style={{ fontSize:11, fontWeight:600, color:"#94A3B8" }}>Status</label>
          <select value={scanFilter} onChange={(e) => setScanFilter(e.target.value)} style={{ minWidth:140 }}>
            <option value="all">All</option>
            <option value="out">Currently Out</option>
            <option value="in">Returned</option>
            <option value="pending_scan">Awaiting Scan</option>
            <option value="overdue">Overdue Only</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{ alignSelf:"flex-end" }} onClick={() => fetchTracking(date, hostel, scanFilter, rollNo)}>Search</button>
        <button className="btn btn-ghost"   style={{ alignSelf:"flex-end" }} onClick={() => { setDate(today()); setHostel(""); setScanFilter("all"); setRollNo(""); fetchTracking(today(), "", "all", ""); }}>Reset</button>
      </div>

      {loading && <div className="empty-state"><div className="icon">⏳</div><p>Loading…</p></div>}

      {!loading && (
        <>
          {/* ── 🚨 OVERDUE SECTION — students still outside from previous days ── */}
          {overdue.length > 0 && scanFilter !== "in" && scanFilter !== "pending_scan" && scanFilter !== "returned_late" && (
            <div className="card" style={{ padding:0, overflow:"hidden", marginBottom:20, border:"2px solid #FED7AA" }}>
              <div style={{ padding:"16px 24px", borderBottom:"1px solid #FEF3C7", display:"flex", justifyContent:"space-between", alignItems:"center", background:"#FFFBEB" }}>
                <div>
                  <h3 style={{ margin:0, color:"#C2410C", display:"flex", alignItems:"center", gap:8 }}>
                    🚨 Overdue Students — Not Yet Returned
                  </h3>
                  <p style={{ margin:"4px 0 0", fontSize:12, color:"#92400E" }}>
                    These students went out before {fmtDate(date)} and have not returned yet.
                  </p>
                </div>
                <span style={{ background:"#FEF2F2", color:"#DC2626", border:"1.5px solid #FECACA", borderRadius:20, padding:"4px 14px", fontSize:13, fontWeight:700 }}>
                  {overdue.length} student{overdue.length > 1 ? "s" : ""}
                </span>
              </div>
              <TrackingTable rows={overdue} showOutDate={true} />
            </div>
          )}

          {/* ── 🕐 RETURNED LATE SECTION — were overdue but have since returned ── */}
          {returnedLate.length > 0 && (scanFilter === "all" || scanFilter === "returned_late") && (
            <div className="card" style={{ padding:0, overflow:"hidden", marginBottom:20, border:"2px solid #E9D5FF" }}>
              <div style={{ padding:"16px 24px", borderBottom:"1px solid #F3E8FF", display:"flex", justifyContent:"space-between", alignItems:"center", background:"#FDF4FF" }}>
                <div>
                  <h3 style={{ margin:0, color:"#7C3AED", display:"flex", alignItems:"center", gap:8 }}>
                    🕐 Returned Late
                  </h3>
                  <p style={{ margin:"4px 0 0", fontSize:12, color:"#6D28D9" }}>
                    These students went out before {fmtDate(date)} but have since returned. Their late return is recorded here.
                  </p>
                </div>
                <span style={{ background:"#F3E8FF", color:"#7C3AED", border:"1.5px solid #E9D5FF", borderRadius:20, padding:"4px 14px", fontSize:13, fontWeight:700 }}>
                  {returnedLate.length} student{returnedLate.length > 1 ? "s" : ""}
                </span>
              </div>
              <TrackingTable rows={returnedLate} showOutDate={true} />
            </div>
          )}

          {/* ── DATE RECORDS SECTION ── */}
          {scanFilter !== "overdue" && scanFilter !== "returned_late" && (
            <div className="card" style={{ padding:0, overflow:"hidden" }}>
              <div style={{ padding:"18px 24px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <h3 style={{ margin:0 }}>
                  📋 Movement on{" "}
                  <span style={{ color:"#0D9488" }}>{fmtDate(date)}</span>
                </h3>
                <span className="badge badge-pending">{dateRecords.length} records</span>
              </div>
              {dateRecords.length === 0
                ? <div className="empty-state"><div className="icon">📭</div><p>No movement records found for this date.</p></div>
                : <TrackingTable rows={dateRecords} showOutDate={false} />
              }
            </div>
          )}

          {/* Overdue-only view empty state */}
          {scanFilter === "overdue" && overdue.length === 0 && (
            <div className="empty-state"><div className="icon">✅</div><p>No overdue students. All students have returned!</p></div>
          )}

          {/* Returned late empty state */}
          {scanFilter === "returned_late" && returnedLate.length === 0 && (
            <div className="empty-state"><div className="icon">✅</div><p>No late returns recorded for this period.</p></div>
          )}
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   WARDEN DASHBOARD
════════════════════════════════════════════════════════════ */
function WardenDashboard() {
  const [activeTab, setActiveTab]   = useState("approvals");
  const [leaves, setLeaves]         = useState([]);
  const [view, setView]             = useState("pending");
  const [selected, setSelected]     = useState(null);
  const [qrToken, setQrToken]       = useState(null);
  const [filters, setFilters]       = useState({ year:"", hostel:"", branch:"", start:"", end:"", roll_no:"" });

  const fetchLeaves = async (type = view) => {
    setView(type);
    try{
      let url = `${API}/leave/warden/?status=${type}`;
      Object.entries(filters).forEach(([k, v]) => { if (v) url += `&${k}=${encodeURIComponent(v)}`; });
      const res = await apiFetch(`/leave/warden/?status=${type}`);
      if (!res) return;

      const data = await res.json();
      setLeaves(Array.isArray(data) ? data : []);
    } catch(e) {
    setLeaves([]);
    }
  };

  useEffect(() => { fetchLeaves("pending"); }, []);

  const takeAction = async (id, action) => {
  const res = await apiFetch(`/leave/warden/action/${id}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, comment: "" }),
  });
  if (!res) return;
  const data = await res.json();
  if (data.token) setQrToken(data.token);
  else alert(data.message || "Action completed");
  fetchLeaves("pending");
};

  const logout = async () => {
    await fetch(`${API}/accounts/logout/`, { method:"POST", credentials:"include" });
    window.location.reload();
  };

  return (
    <DashboardShell role="warden" roleLabel="Warden Portal" onLogout={logout}>

      {/* PAGE HEADER */}
      <div className="page-header">
        <h1>Warden Dashboard</h1>
        <p>Manage leave approvals and track student movements in real time</p>
      </div>

      {/* MAIN TABS */}
      <div className="tab-bar" style={{ marginBottom:28 }}>
        <button className={`tab-btn ${activeTab === "approvals" ? "active" : ""}`} onClick={() => setActiveTab("approvals")}>
          📋 Leave Approvals
        </button>
        <button className={`tab-btn ${activeTab === "live" ? "active" : ""}`} onClick={() => setActiveTab("live")} style={{ position:"relative" }}>
          🏃 Live Outside
          {activeTab !== "live" && <span style={{ position:"absolute", top:4, right:4, width:8, height:8, borderRadius:"50%", background:"#10B981", border:"2px solid #fff" }} />}
        </button>
        <button className={`tab-btn ${activeTab === "tracking" ? "active" : ""}`} onClick={() => setActiveTab("tracking")}>
          📍 Date Tracking
        </button>
      </div>

      {/* ── APPROVALS TAB ── */}
      {activeTab === "approvals" && (
        <>
          {/* STAT CARDS */}
          <div style={{ display:"flex", gap:16, marginBottom:24 }}>
            {[
              { label:"Pending Review", status:"pending",  icon:"⏳", color:"#FFFBEB", border:"#FDE68A", text:"#D97706" },
              { label:"Approved",       status:"approved", icon:"✅", color:"#ECFDF5", border:"#A7F3D0", text:"#059669" },
              { label:"Rejected",       status:"rejected", icon:"❌", color:"#FEF2F2", border:"#FECACA", text:"#DC2626" },
            ].map((s) => (
              <div
                key={s.status}
                onClick={() => fetchLeaves(s.status)}
                style={{
                  flex:1, padding:"16px 20px", borderRadius:14, cursor:"pointer",
                  background: view === s.status ? s.color : "#fff",
                  border:`1.5px solid ${view === s.status ? s.border : "#E2E8F0"}`,
                  transition:"all 0.2s",
                  boxShadow: view === s.status ? `0 4px 12px ${s.border}88` : "none",
                }}
              >
                <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
                <div style={{ fontSize:12, color:"#94A3B8", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>{s.label}</div>
                <div style={{ fontSize:11, color:s.text, marginTop:4, fontWeight:600 }}>
                  {view === s.status ? `${leaves.length} records` : "Click to view"}
                </div>
              </div>
            ))}
          </div>

          {/* FILTER BAR */}
          <div className="filter-bar">
            <div style={{ fontSize:12, fontWeight:700, color:"#64748B", textTransform:"uppercase", letterSpacing:"0.5px", alignSelf:"center" }}>🔍 Filters</div>
            <input placeholder="Roll No" value={filters.roll_no} onChange={(e) => setFilters({...filters, roll_no:e.target.value})} />
            <input placeholder="Year"    value={filters.year}    onChange={(e) => setFilters({...filters, year:e.target.value})} />
            <input placeholder="Hostel"  value={filters.hostel}  onChange={(e) => setFilters({...filters, hostel:e.target.value})} />
            <input placeholder="Branch"  value={filters.branch}  onChange={(e) => setFilters({...filters, branch:e.target.value})} />
            <input type="date" value={filters.start} onChange={(e) => setFilters({...filters, start:e.target.value})} title="From date" />
            <input type="date" value={filters.end}   onChange={(e) => setFilters({...filters, end:e.target.value})}   title="To date" />
            <button className="btn btn-primary" onClick={() => fetchLeaves(view)}>Apply</button>
            <button className="btn btn-ghost"   onClick={() => { setFilters({ year:"", hostel:"", branch:"", start:"", end:"", roll_no:"" }); fetchLeaves(view); }}>Clear</button>
          </div>

          {/* STATUS TABS */}
          <div className="tab-bar">
            {["pending","approved","rejected"].map((t) => (
              <button key={t} className={`tab-btn ${view === t ? "active" : ""}`} onClick={() => fetchLeaves(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* LEAVE TABLE */}
          <div className="card" style={{ padding:0, overflow:"hidden" }}>
            <div style={{ padding:"18px 24px", borderBottom:"1px solid #F1F5F9", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <h3 style={{ margin:0 }}>
                {view === "pending" ? "⏳" : view === "approved" ? "✅" : "❌"} {view.charAt(0).toUpperCase() + view.slice(1)} Requests
              </h3>
              <span className={`badge ${view === "pending" ? "badge-pending" : view === "approved" ? "badge-approved" : "badge-rejected"}`}>
                {leaves.length} total
              </span>
            </div>
            <div style={{ padding:"0 0 8px", overflowX:"auto" }}>
              {leaves.length === 0 ? (
                <div className="empty-state"><div className="icon">📭</div><p>No {view} requests found.</p></div>
              ) : (
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Roll No</th>
                      <th>Leave Type</th>
                      <th>Hostel</th>
                      <th>Reason</th>
                      {view === "pending" && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.map((l, i) => (
                      <tr key={l.id}>
                        <td style={{ color:"#94A3B8", fontSize:12 }}>{i + 1}</td>
                        <td><span className="roll-link" onClick={() => setSelected(l)}>{l.roll_no}</span></td>
                        <td><span className="badge badge-pending">{l.leave_type === "gate" ? "🚪 Gate" : "🏠 Home"}</span></td>
                        <td style={{ fontSize:13, color:"#64748B" }}>{l.hostel_no || "—"}</td>
                        <td style={{ fontSize:13, color:"#475569", maxWidth:180 }}>{l.reason}</td>
                        {view === "pending" && (
                          <td>
                            <div className="action-btns">
                              <button className="btn btn-success" onClick={() => takeAction(l.id, "approve")}>✅ Approve & QR</button>
                              <button className="btn btn-danger"  onClick={() => takeAction(l.id, "reject")}>❌ Reject</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <DetailPanel selected={selected} onClose={() => setSelected(null)} fields={WARDEN_FIELDS} />
        </>
      )}

      {/* ── LIVE OUTSIDE TAB ── */}
      {activeTab === "live" && <LiveOutside />}

      {/* ── DATE TRACKING TAB ── */}
      {activeTab === "tracking" && <StudentTracking />}

      {/* QR MODAL */}
      {qrToken && (
        <div className="overlay" onClick={() => setQrToken(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>✅ QR Code Generated</h3>
            <p style={{ fontSize:13, color:"#64748B", marginBottom:16 }}>Leave approved! Share this QR code with the student.</p>
            <div style={{ padding:16, background:"#F0FDF9", borderRadius:12, display:"inline-block", marginBottom:20 }}>
              <QRCodeCanvas value={qrToken} size={200} fgColor="#0F172A" />
            </div>
            <button className="btn btn-ghost" style={{ width:"100%" }} onClick={() => setQrToken(null)}>Close</button>
          </div>
        </div>
      )}

    </DashboardShell>
  );
}

export default WardenDashboard;