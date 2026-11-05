import { apiFetch } from "../api";
import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import "../styles/common.css";

function SecurityScan() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 }, false);

    scanner.render(
      async (decodedText) => {
        scanner.clear();
        setScanning(false);
        try {
          const res = await apiFetch(`/qr/scan/${decodedText}/`);
          if (!res) return;
          const data = await res.json();
          if (!res.ok) { setError(data.error || "Scan failed"); return; }
          setResult(data);
        } catch { setError("Backend not reachable"); }
      },
      () => {}
    );

    return () => { scanner.clear().catch(() => {}); };
  }, []);

  const reset = () => {
    setResult(null);
    setError("");
    setScanning(true);
    window.location.reload();
  };

  const logout = async () => {
  await fetch(`${process.env.REACT_APP_API_URL}/accounts/logout/`, {
    method: "POST",
    credentials: "include"
  });

  localStorage.clear();
  sessionStorage.clear();

  window.location.href = "/";
};


  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F0FDF9; font-family: 'Inter', sans-serif; }

        .security-root {
          min-height: 100vh;
          background: #F0FDF9;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .security-header {
          width: 100%;
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
          padding: 20px 32px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        .security-header-logo {
          font-family: 'Nunito', sans-serif;
          font-size: 22px;
          font-weight: 900;
          color: #fff;
        }
        .security-header-logo span { color: #2DD4BF; }
        .security-header-badge {
          background: rgba(45,212,191,0.15);
          border: 1px solid rgba(45,212,191,0.3);
          border-radius: 20px;
          padding: 4px 14px;
          font-size: 12px;
          font-weight: 600;
          color: #2DD4BF;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .logout-btn {
          margin-left: auto;
          padding: 8px 18px;
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.35);
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          color: #FCA5A5;
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          letter-spacing: 0.3px;
        }
        .logout-btn:hover {
          background: rgba(239,68,68,0.28);
          color: #fff;
        }

        .security-content {
          width: 100%;
          max-width: 560px;
          padding: 40px 24px;
        }

        .scan-card {
          background: #fff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(13,148,136,0.1), 0 1px 3px rgba(0,0,0,0.06);
          border: 1px solid #E2E8F0;
          margin-bottom: 20px;
        }
        .scan-card-header {
          padding: 20px 24px;
          border-bottom: 1px solid #F1F5F9;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .scan-card-header h2 {
          font-family: 'Nunito', sans-serif;
          font-size: 20px;
          font-weight: 800;
          color: #0F172A;
        }
        .scan-indicator {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.2);
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(16,185,129,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(16,185,129,0.1); }
        }
        .scan-body { padding: 24px; display: flex; justify-content: center; }

        #qr-reader { width: 100% !important; max-width: 340px; border-radius: 12px; overflow: hidden; }

        .result-card {
          background: #fff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(16,185,129,0.12), 0 1px 3px rgba(0,0,0,0.06);
          border: 2px solid #A7F3D0;
          margin-bottom: 20px;
        }
        .result-header {
          background: linear-gradient(135deg, #10B981, #059669);
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .result-header h3 { font-family: 'Nunito', sans-serif; font-size: 20px; font-weight: 800; color: #fff; }
        .verified-badge { background: rgba(255,255,255,0.2); border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 600; color: #fff; }

        .result-body { padding: 24px; display: flex; gap: 20px; align-items: flex-start; }
        .result-photo {
          width: 100px; height: 100px;
          border-radius: 14px;
          border: 3px solid #A7F3D0;
          object-fit: cover;
          flex-shrink: 0;
        }
        .result-photo-placeholder {
          width: 100px; height: 100px;
          border-radius: 14px;
          background: #F0FDF9;
          border: 2px dashed #A7F3D0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          flex-shrink: 0;
        }
        .result-details { flex: 1; }
        .result-detail-row { display: flex; gap: 8px; margin-bottom: 10px; }
        .result-detail-row label { font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.5px; min-width: 90px; padding-top: 2px; }
        .result-detail-row span { font-size: 14px; font-weight: 600; color: #0F172A; }

        .info-card {
          background: #fff;
          border-radius: 20px;
          padding: 24px;
          border: 1px solid #E2E8F0;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .info-card p { font-size: 14px; color: #475569; }

        .error-card {
          background: #FEF2F2;
          border-radius: 20px;
          overflow: hidden;
          border: 2px solid #FECACA;
          margin-bottom: 20px;
        }
        .error-header {
          background: linear-gradient(135deg, #EF4444, #DC2626);
          padding: 16px 24px;
        }
        .error-header h3 { font-family: 'Nunito', sans-serif; font-size: 18px; font-weight: 800; color: #fff; }
        .error-body { padding: 20px 24px; }
        .error-body p { color: #DC2626; font-weight: 600; font-size: 15px; }

        .reset-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #0D9488, #0F766E);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Nunito', sans-serif;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(13,148,136,0.35);
          transition: opacity 0.2s;
        }
        .reset-btn:hover { opacity: 0.9; }
      `}</style>

      <div className="security-root">
        {/* HEADER */}
        <header className="security-header">
          <div className="security-header-logo">Easy<span>Exit</span></div>
          <div className="security-header-badge">Security Gate</div>
          <button className="logout-btn" onClick={logout}>⎋ Logout</button>
        </header>

        <div className="security-content">
          {/* SCANNER */}
          {scanning && (
            <div className="scan-card">
              <div className="scan-card-header">
                <div className="scan-indicator" />
                <h2>Scan QR Pass</h2>
              </div>
              <div className="scan-body">
                <div id="qr-reader" />
              </div>
            </div>
          )}

          {/* SUCCESS RESULT */}
          {result?.student && (
            <div className="result-card">
              <div className="result-header">
                <h3>✅ Student Verified</h3>
                <div className="verified-badge">AUTHORIZED</div>
              </div>
              <div className="result-body">
                {result.student.photo
                  ? <img src={result.student.photo}alt="student" className="result-photo" />
                  : <div className="result-photo-placeholder">👤</div>
                }
                <div className="result-details">
                  {[
                    { label: "Name", val: result.student.name },
                    { label: "Roll No", val: result.student.roll_no },
                    { label: "Hostel", val: result.student.hostel_no },
                    { label: "Room", val: result.student.room_no },
                  ].map(({ label, val }) => (
                    <div className="result-detail-row" key={label}>
                      <label>{label}</label>
                      <span>{val || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* INFO MESSAGE */}
          {result?.message && (
            <div className="info-card">
              <p>ℹ️ {result.message}</p>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="error-card">
              <div className="error-header"><h3>⚠️ Scan Failed</h3></div>
              <div className="error-body"><p>{error}</p></div>
            </div>
          )}

          {/* RESET */}
          {(result || error) && (
            <button className="reset-btn" onClick={reset}>🔄 Scan Again</button>
          )}
        </div>
      </div>
    </>
  );
}

export default SecurityScan;