// src/pages/Dashboard.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ButterflyIcon } from "../utils/icons";
import DashboardMain from "./main";
import ChatMain from "./chat";
import { clearSession, isSessionValid, markSessionStart } from "../utils/auth";

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

const CONVERSATIONS_ENDPOINT =
  "https://docseb-ai-229745866329.northamerica-south1.run.app/modelsAI/conversations";
const CONVERSATION_DETAIL_ENDPOINT =
  "https://docseb-ai-229745866329.northamerica-south1.run.app/modelsAI/conversation";

const extractTextFromParts = (parts) => {
  if (!Array.isArray(parts)) {
    return "";
  }

  for (const part of parts) {
    if (typeof part?.text === "string") {
      const trimmed = part.text.trim();
      if (trimmed) return trimmed;
    }
  }

  return "";
};

const getConversationPreview = (history) => {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      title: "Chat sin mensajes",
      subtitle: "Aún no hay actividad registrada.",
    };
  }

  const firstUserEntry = history.find((entry) => entry?.role === "user");
  const firstUserText = extractTextFromParts(firstUserEntry?.parts);

  let latestText = "";
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const text = extractTextFromParts(history[index]?.parts);
    if (text) {
      latestText = text;
      break;
    }
  }

  return {
    title: firstUserText || "Chat sin título",
    subtitle:
      latestText && latestText !== firstUserText
        ? latestText
        : "Sin mensajes recientes.",
  };
};

const truncateText = (text, maxLength = 80) => {
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("formularios");
  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversationsError, setConversationsError] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedConversationHistory, setSelectedConversationHistory] =
    useState(null);
  const [isConversationDetailLoading, setIsConversationDetailLoading] =
    useState(false);
  const [conversationDetailError, setConversationDetailError] = useState(null);
  const avatarRef = useRef(null);
  const conversationAbortControllerRef = useRef(null);
  const conversationDetailAbortRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isSessionValid()) {
      navigate("/login", { replace: true });
      return;
    }
    markSessionStart();
  }, [navigate, isSessionValid, markSessionStart]);

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

  useEffect(
    () => () => {
      conversationDetailAbortRef.current?.abort();
    },
    []
  );

  useEffect(() => {
    conversationAbortControllerRef.current?.abort();
    const controller = new AbortController();
    conversationAbortControllerRef.current = controller;

    async function fetchConversations() {
      setIsLoadingConversations(true);
      setConversationsError(null);

      try {
        const response = await fetch(CONVERSATIONS_ENDPOINT, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();
        const list = Array.isArray(data?.conversations)
          ? data.conversations
          : [];
        setConversations(list);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("No se pudieron obtener las conversaciones:", error);
        setConversations([]);
        setConversationsError("No se pudieron cargar los chats.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingConversations(false);
        }
      }
    }

    fetchConversations();

    return () => {
      controller.abort();
    };
  }, []);

  const handleLogout = () => {
    setIsMenuOpen(false);
    clearSession();
    navigate("/login");
  };

  const handleConversationClick = (sessionId) => {
    if (!sessionId) return;

    setActiveSection("chat");
    setSelectedSessionId(sessionId);
    setConversationDetailError(null);

    conversationDetailAbortRef.current?.abort();
    const controller = new AbortController();
    conversationDetailAbortRef.current = controller;
    setIsConversationDetailLoading(true);

    fetch(CONVERSATION_DETAIL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        const history = Array.isArray(data?.conversationHistory)
          ? data.conversationHistory
          : [];
        const normalizedId = data?.session_id || sessionId;
        setSelectedSessionId(normalizedId);
        setSelectedConversationHistory(history);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("No se pudo cargar la conversación seleccionada:", error);
        setConversationDetailError("No se pudo abrir el chat seleccionado.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsConversationDetailLoading(false);
        }
      });
  };

  return (
    <div className="full-screen-dashboard">
      <div
        style={{
          width: "100vw",
          height: "100dvh",
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          background:
            "radial-gradient(1200px 600px at 120% -20%, rgba(210,242,82,0.10) 0%, transparent 60%), linear-gradient(135deg, #031718, #0B2A2B 60%)",
          color: palette.text,
          overflow: "hidden",
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
            minHeight: 0,
            height: "100%",
            overflow: "hidden",
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

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "0 12px 24px",
              gap: 12,
              minHeight: 0,
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: 12,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: palette.textMuted,
                padding: "4px 0",
                textAlign: "left",
              }}
            >
              Conversaciones
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                paddingRight: 6,
                minHeight: 0,
              }}
            >
              {isLoadingConversations && (
                <div
                  style={{
                    fontSize: 12,
                    color: palette.textMuted,
                    padding: "4px 2px",
                  }}
                >
                  Cargando chats...
                </div>
              )}

              {conversationsError && !isLoadingConversations && (
                <div
                  style={{
                    fontSize: 12,
                    color: palette.danger,
                    padding: "4px 2px",
                    lineHeight: 1.4,
                  }}
                >
                  {conversationsError}
                </div>
              )}

              {conversationDetailError && (
                <div
                  style={{
                    fontSize: 12,
                    color: palette.danger,
                    padding: "4px 2px",
                    lineHeight: 1.4,
                  }}
                >
                  {conversationDetailError}
                </div>
              )}

              {!isLoadingConversations &&
                !conversationsError &&
                conversations.length === 0 && (
                  <div
                    style={{
                      fontSize: 12,
                      color: palette.textMuted,
                      padding: "4px 2px",
                    }}
                  >
                    No hay conversaciones disponibles.
                  </div>
                )}

              {conversations.map((conversation) => {
                const preview = getConversationPreview(
                  conversation?.conversationHistory
                );
                const title = truncateText(preview.title, 42);
                const subtitle = truncateText(preview.subtitle, 90);
                const isSelected =
                  selectedSessionId === conversation?.session_id;
                const isDisabled = !conversation?.session_id;
                const isLoadingCurrent =
                  isConversationDetailLoading && isSelected;
                return (
                  <button
                    key={conversation?.session_id}
                    type="button"
                    onClick={() =>
                      handleConversationClick(conversation?.session_id)
                    }
                    disabled={isDisabled}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 14,
                      background: isSelected
                        ? "rgba(210,242,82,0.08)"
                        : "rgba(3,23,24,0.85)",
                      border: `1px solid ${
                        isSelected ? palette.accent : palette.border
                      }`,
                      boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      textAlign: "left",
                      cursor: isDisabled ? "default" : "pointer",
                      opacity: isLoadingCurrent ? 0.65 : 1,
                      transition: "background 0.2s ease, border 0.2s ease",
                      font: "inherit",
                      color: "inherit",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        letterSpacing: 0.5,
                        color: "rgba(233,255,208,0.7)",
                      }}
                    >
                      {conversation?.session_id || "ID desconocido"}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: palette.text,
                        lineHeight: 1.4,
                      }}
                    >
                      {title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(233,255,208,0.7)",
                        lineHeight: 1.4,
                      }}
                    >
                      {subtitle}
                    </div>
                  </button>
                );
              })}

              {isConversationDetailLoading && (
                <div
                  style={{
                    fontSize: 12,
                    color: palette.textMuted,
                    padding: "2px",
                  }}
                >
                  Abriendo chat seleccionado...
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main */}
        <div
          style={{
            display: "grid",
            gridTemplateRows: "64px 1fr",
            minWidth: 0,
            minHeight: 0,
            height: "100%",
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
            <ChatMain
              palette={palette}
              sessionIdOverride={selectedSessionId}
              initialHistory={selectedConversationHistory}
              requestType="general"
            />
          )}
        </div>
      </div>
    </div>
  );
}
