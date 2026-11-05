import React, { useState } from "react";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/accounts/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      localStorage.setItem("isLoggedIn", "true");  // ✅ set login flag so App.js shows dashboard
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      onLogin(data.role);
    } catch {
      setError("Backend not reachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Inter:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #F0FDF9; }

        .login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', sans-serif;
          background: #F0FDF9;
        }

        /* LEFT PANEL */
        .login-left {
          width: 55%;
          background: linear-gradient(145deg, #0F172A 0%, #0D9488 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px;
          position: relative;
          overflow: hidden;
        }
        .login-left::before {
          content: '';
          position: absolute;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
          top: -120px; left: -120px;
        }
        .login-left::after {
          content: '';
          position: absolute;
          width: 320px; height: 320px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          bottom: -80px; right: -60px;
        }
        .brand-badge {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 50px;
          padding: 6px 18px;
          color: #99F6E4;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 28px;
        }
        .brand-title {
          font-family: 'Nunito', sans-serif;
          font-size: 58px;
          font-weight: 900;
          color: #fff;
          line-height: 1.1;
          margin-bottom: 8px;
        }
        .brand-title span { color: #2DD4BF; }
        .brand-sub {
          color: #94A3B8;
          font-size: 16px;
          margin-bottom: 48px;
        }
        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
          max-width: 340px;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 14px;
          color: #CBD5E1;
          font-size: 14px;
        }
        .feature-icon {
          width: 36px; height: 36px;
          background: rgba(45,212,191,0.15);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        /* RIGHT PANEL */
        .login-right {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px;
          background: #F0FDF9;
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          background: #fff;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 4px 24px rgba(13,148,136,0.1), 0 1px 3px rgba(0,0,0,0.06);
          border: 1px solid #E2E8F0;
        }
        .login-card h2 {
          font-family: 'Nunito', sans-serif;
          font-size: 26px;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 6px;
        }
        .login-card p {
          color: #64748B;
          font-size: 14px;
          margin-bottom: 32px;
        }
        .form-group {
          margin-bottom: 18px;
        }
        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 7px;
        }
        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: #0F172A;
          background: #F8FAFC;
          outline: none;
          transition: border 0.2s, box-shadow 0.2s;
        }
        .form-group input:focus {
          border-color: #0D9488;
          box-shadow: 0 0 0 3px rgba(13,148,136,0.1);
          background: #fff;
        }
        .login-btn {
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
          margin-top: 8px;
          transition: opacity 0.2s, transform 0.1s;
          box-shadow: 0 4px 14px rgba(13,148,136,0.35);
        }
        .login-btn:hover { opacity: 0.92; transform: translateY(-1px); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .error-msg {
          margin-top: 14px;
          padding: 12px 16px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 10px;
          color: #DC2626;
          font-size: 13px;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-right { padding: 24px; }
        }
      `}</style>

      <div className="login-root">
        {/* LEFT BRANDING */}
        <div className="login-left">
          <div className="brand-badge">Hostel Management</div>
          <div className="brand-title">Easy<br /><span>Exit</span></div>
          <div className="brand-sub">Streamlined outpass management system</div>
          <div className="feature-list">
            {[
              { icon: "🎓", text: "Student leave request & QR pass" },
              { icon: "✅", text: "Multi-level approval workflow" },
              { icon: "📱", text: "Real-time QR code verification" },
              { icon: "📊", text: "Dashboard analytics for wardens" },
            ].map((f, i) => (
              <div className="feature-item" key={i}>
                <div className="feature-icon">{f.icon}</div>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="login-right">
          <div className="login-card">
            <h2>Welcome back 👋</h2>
            <p>Sign in to access your Easy Exit dashboard</p>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Username</label>
                <input
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button className="login-btn" type="submit" disabled={loading}>
                {loading ? "Signing in…" : "Sign In →"}
              </button>
            </form>

            {error && <div className="error-msg">⚠️ {error}</div>}
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
