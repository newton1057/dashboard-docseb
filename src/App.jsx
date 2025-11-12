// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import Login from "./pages/login";
import "./App.css";

// Puedes dejar Home aquí mismo
function Home() {
  return (
    <div style={{ padding: 24 }}>
      <h1>🏠 Home</h1>
      <p>Selecciona una ruta:</p>
      <nav>
        <ul>
          <li><Link to="/dashboard">Ir a /dashboard</Link></li>
          <li><Link to="/login">Ir a /login</Link></li>
        </ul>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<div style={{ padding: 24 }}><h1>404</h1><p>Página no encontrada</p></div>} />
      </Routes>
    </Router>
  );
}
