import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import HealthPage from "./pages/HealthPage";
import RecordsPage from "./pages/RecordsPage";
import UploadPage from "./pages/UploadPage";

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  padding: "8px 10px",
  borderRadius: 6,
  textDecoration: "none",
  color: isActive ? "white" : "#0f172a",
  background: isActive ? "#0f172a" : "transparent",
  border: "1px solid #e2e8f0",
});

export default function App() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <header style={{ padding: 16, borderBottom: "1px solid #e2e8f0" }}>
        <nav style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <NavLink to="/health" style={linkStyle}>
            Health
          </NavLink>
          <NavLink to="/upload" style={linkStyle}>
            Upload
          </NavLink>
          <NavLink to="/records" style={linkStyle}>
            Records
          </NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Navigate to="/upload" replace />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/records" element={<RecordsPage />} />
        <Route path="*" element={<div style={{ padding: 24 }}>Not found</div>} />
      </Routes>
    </div>
  );
}
