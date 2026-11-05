import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import HODDashboard from "./pages/HODDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import WardenDashboard from "./pages/WardenDashboard";
import SecurityScan from "./pages/SecurityScan";
import { apiFetch } from "./api";

function App() {
  const [role, setRole] = useState(null); // ✅ survive refresh
  const [checking, setChecking] = useState(true);

  useEffect(() => {
  apiFetch("/accounts/profile/")
    .then(res => {
      if (!res) return; // 401 handled → redirect
      return res.json();
    })
    .then(data => {
      if (data?.role) {
        setRole(data.role);
      }
    })
    .catch(() => {})
    .finally(() => setChecking(false));
    }, []);

  const handleLogin = (userRole) => {
    setRole(userRole);
  };

  const handleLogout = () => {
    setRole(null);
  };

  if (checking) return <p>Loading...</p>;
  if (!role) return <Login onLogin={handleLogin} />;
  if (role === "student") return <StudentDashboard onLogout={handleLogout} />;
  if (role === "hod") return <HODDashboard onLogout={handleLogout} />;
  if (role === "manager") return <ManagerDashboard onLogout={handleLogout} />;
  if (role === "warden") return <WardenDashboard onLogout={handleLogout} />;
  if (role === "security") return <SecurityScan onLogout={handleLogout} />;

  return <p>Unknown role</p>;
}

export default App;