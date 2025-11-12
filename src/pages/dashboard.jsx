// src/pages/Dashboard.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ButterflyIcon } from "../utils/icons";
import DashboardMain from "./main";
import ChatMain from "./chat";

const palette = {
  bg1: "#031718",
  bg2: "#0B2A2B",
  surface: "rgba(3, 23, 24, 0.85)",
  border: "rgba(210, 242, 82, 0.15)",
  accent: "#D2F252",
  text: "#E9FFD0",
  textMuted: "#bfe6a8",
  ink: "#082323",
  danger: "#ff6b6b",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("formularios");
  const avatarRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        avatarRef.current &&
        !avatarRef.current.contains(event.target) &&
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    setIsMenuOpen(false);
    navigate("/login");
  };

  return (
    <div className="full-screen-dashboard">
      <div
        style={{
          width: "100vw",
          minHeight: "100dvh",
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          background:
            "radial-gradient(1200px 600px at 120% -20%, rgba(210,242,82,0.10) 0%, transparent 60%), linear-gradient(135deg, #031718, #0B2A2B 60%)",
          color: palette.text,
        }}
      >
        {/* Sidebar */}
        <aside
          style={{
            position: "relative",
            borderRight: `1px solid ${palette.border}`,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "16px 16px",
              gap: 10,
            }}
          >
            <ButterflyIcon width="28px" />
          </div>

          <div
            style={{
              marginTop: 8,
              display: "grid",
              gap: 0,
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: palette.textMuted,
                padding: "8px 10px",
              }}
            >
              General
            </div>
            {[
              { key: "formularios", label: "Formularios" },
              { key: "chat", label: "Chat" },
            ].map((item) => {
              const isActive = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveSection(item.key)}
                  aria-current={isActive ? "page" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    fontWeight: 700,
                    color: isActive ? palette.ink : palette.text,
                    background: isActive ? palette.accent : "transparent",
                    border: "none",
                    borderRadius: 0,
                    cursor: isActive ? "default" : "pointer",
                    transition: "background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: "64px 1fr",
            minWidth: 0,
          }}
        >
          {/* Topbar */}
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 24px",
              borderBottom: `1px solid ${palette.border}`,
              background: "rgba(3,23,24,0.55)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div />
            <div style={{ position: "relative" }}>
              <button
                ref={avatarRef}
                onClick={() => setIsMenuOpen((value) => !value)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: palette.accent,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: isMenuOpen
                    ? "0 0 0 2px rgba(210, 242, 82, 0.35)"
                    : "none",
                  transition: "box-shadow 0.15s ease",
                }}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
              >
                <img
                  src="https://images.unsplash.com/photo-1525130413817-d45c1d127c42?auto=format&fit=crop&w=200&h=200&q=80"
                  alt="Perfil demo"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              </button>

              {isMenuOpen && (
                <div
                  ref={menuRef}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 10px)",
                    right: 0,
                    minWidth: 160,
                    background: palette.surface,
                    border: `1px solid ${palette.border}`,
                    borderRadius: 8,
                    padding: 8,
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                    zIndex: 10,
                  }}
                >
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "none",
                      borderRadius: 6,
                      background: "transparent",
                      color: palette.text,
                      fontWeight: 600,
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Contenido movido a su propio componente */}
          {activeSection === "formularios" ? (
            <DashboardMain palette={palette} />
          ) : (
            <ChatMain palette={palette} />
          )}
        </div>
      </div>
    </div>
  );
}
