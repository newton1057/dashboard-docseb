// src/pages/Dashboard.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ButterflyIcon } from "../utils/icons";
import DashboardMain from "./main";
import ChatMain from "./chat";
import ExpedientesMain from "./expedientes";
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
  "https://demo-ai-448238488830.northamerica-south1.run.app/modelsAI/conversations";
const CONVERSATION_DETAIL_ENDPOINT =
  "https://demo-ai-448238488830.northamerica-south1.run.app/modelsAI/conversation";
const DELETE_CONVERSATION_ENDPOINT =
  "https://delete-chat-448238488830.northamerica-south1.run.app";
const LOOKER_EMBED_URL =
  "https://lookerstudio.google.com/embed/reporting/1a6767f6-18d9-48e7-a247-2e9131b7378a/page/9F1bF";

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

const getConversationType = (conversation) => {
  const rawType =
    typeof conversation?.type === "string" ? conversation.type.trim().toLowerCase() : "";
  if (rawType === "general" || rawType === "specific") {
    return rawType;
  }

  const sessionId = typeof conversation?.session_id === "string" ? conversation.session_id : "";
  if (sessionId.includes("@")) {
    return "specific";
  }
  return "general";
};

const shouldShowConversationSessionId = (conversation) => {
  if (!conversation) return false;
  if (getConversationType(conversation) === "general") return false;
  const sessionId =
    typeof conversation.session_id === "string" ? conversation.session_id.trim() : "";
  return Boolean(sessionId);
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
  const [chatInstanceKey, setChatInstanceKey] = useState(0);
  const [hoveredConversationId, setHoveredConversationId] = useState(null);
  const [openConversationOptionsId, setOpenConversationOptionsId] = useState(null);
  const [deletingConversationId, setDeletingConversationId] = useState(null);
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

  const loadConversations = useCallback(() => {
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
  }, []);

  useEffect(() => {
    loadConversations();

    return () => {
      conversationAbortControllerRef.current?.abort();
    };
  }, [loadConversations]);

  useEffect(() => {
    setHoveredConversationId(null);
    setOpenConversationOptionsId(null);
  }, [conversations]);

  useEffect(() => {
    if (!openConversationOptionsId) return undefined;

    const handleOutsideClick = (event) => {
      const target = event.target;
      if (target instanceof Element) {
        if (target.closest('[data-conversation-options="true"]')) {
          return;
        }
      }
      setOpenConversationOptionsId(null);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [openConversationOptionsId]);

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

  const resetChatView = () => {
    conversationDetailAbortRef.current?.abort();
    conversationDetailAbortRef.current = null;
    setSelectedSessionId(null);
    setSelectedConversationHistory(null);
    setConversationDetailError(null);
    setIsConversationDetailLoading(false);
    setChatInstanceKey((value) => value + 1);
  };

  const handleDeleteConversation = async (sessionId) => {
    if (!sessionId || deletingConversationId) return;

    setConversationsError(null);
    setDeletingConversationId(sessionId);

    try {
      const url = new URL(DELETE_CONVERSATION_ENDPOINT);
      url.searchParams.set("session_id", sessionId);
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      if (selectedSessionId === sessionId) {
        resetChatView();
      }

      setOpenConversationOptionsId(null);
      loadConversations();
    } catch (error) {
      console.error("No se pudo eliminar la conversación:", error);
      setConversationsError("No se pudo borrar el chat seleccionado.");
    } finally {
      setDeletingConversationId((value) => (value === sessionId ? null : value));
    }
  };

  const handleSidebarSectionClick = (sectionKey) => {
    if (sectionKey === "chat") {
      setActiveSection("chat");
      resetChatView();
      return;
    }
    setActiveSection(sectionKey);
  };

  const renderMainContent = () => {
    if (activeSection === "dashboard") {
      return (
        <div
          style={{
            height: "100%",
            borderTop: `1px solid ${palette.border}`,
            borderLeft: `1px solid ${palette.border}`,
            background:
              "radial-gradient(1200px 800px at 20% -120%, rgba(210,242,82,0.18), transparent 65%), linear-gradient(180deg, rgba(3,23,24,0.85) 0%, rgba(3,23,24,0.65) 100%)",
            display: "flex",
            flexDirection: "column",
            padding: 0,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              flex: 1,
              width: "100%",
              overflow: "hidden",
              border: `1px solid ${palette.border}`,
              boxShadow: "0 25px 60px rgba(0,0,0,0.55)",
              background: "rgba(2,10,11,0.92)",
              display: "flex",
              position: "relative",
              isolation: "isolate",
            }}
          >
            <iframe
              title="Dashboard Looker Studio"
              src={LOOKER_EMBED_URL}
              allowFullScreen
              style={{
                flex: 1,
                width: "100%",
                height: "100%",
                minHeight: 620,
                border: "none",
                display: "block",
                transform: "scale(1.02)",
              }}
            />
          </div>
        </div>
      );
    }

    if (activeSection === "formularios") {
      return <DashboardMain palette={palette} />;
    }

    if (activeSection === "expedientes") {
      return <ExpedientesMain palette={palette} />;
    }

    return (
      <ChatMain
        key={selectedSessionId || `new-${chatInstanceKey}`}
        palette={palette}
        sessionIdOverride={selectedSessionId}
        initialHistory={selectedConversationHistory}
        requestType="general"
      />
    );
  };

  return (
    <div className="full-screen-dashboard">
      <div
        style={{
          width: "100vw",
          height: "100dvh",
          display: "grid",
          gridTemplateColumns: "16% 1fr",
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
                fontSize: 11,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: palette.textMuted,
                padding: "8px 10px",
              }}
            >
              General
            </div>
            {[
              { key: "dashboard", label: "Dashboard" },
              { key: "formularios", label: "Formularios" },
              { key: "expedientes", label: "Expedientes" },
              { key: "chat", label: "Chat" },
            ].map((item) => {
              const isActive = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSidebarSectionClick(item.key)}
                  aria-current={isActive ? "page" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    fontSize: 14,
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
              padding: "0 0 24px",
              gap: 12,
              minHeight: 0,
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: palette.textMuted,
                padding: "4px 10px",
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
              paddingRight: 0,
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

              {conversations.map((conversation, index) => {
                const preview = getConversationPreview(
                  conversation?.conversationHistory
                );
                const title = preview.title;
                const subtitle = preview.subtitle;
                const isSelected =
                  selectedSessionId === conversation?.session_id;
                const isDisabled = !conversation?.session_id;
                const isLoadingCurrent =
                  isConversationDetailLoading && isSelected;
                const showSessionId =
                  shouldShowConversationSessionId(conversation);
                const sessionIdValue =
                  typeof conversation?.session_id === "string"
                    ? conversation.session_id.trim()
                    : "";
                const conversationKey =
                  sessionIdValue || `conversation-${index}`;
                const isHovered = hoveredConversationId === conversationKey;
                const isMenuOpen = openConversationOptionsId === conversationKey;
                const showOptionsButton = isHovered || isMenuOpen;
                const baseBackground = isSelected
                  ? "rgba(210,242,82,0.08)"
                  : "rgba(3,23,24,0.85)";
                const hoverBackground = isSelected
                  ? "rgba(210,242,82,0.12)"
                  : "rgba(233,255,208,0.08)";
                const sessionIdLabel = showSessionId
                  ? sessionIdValue || "ID desconocido"
                  : null;
                const isDeletingConversation =
                  deletingConversationId === sessionIdValue;
                const canDeleteConversation = Boolean(sessionIdValue);
                return (
                  <div
                    key={conversationKey}
                    onMouseEnter={() => setHoveredConversationId(conversationKey)}
                    onMouseLeave={() => setHoveredConversationId(null)}
                    style={{ position: "relative", width: "100%" }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleConversationClick(conversation?.session_id)
                      }
                      disabled={isDisabled}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 0,
                      background: isHovered ? hoverBackground : baseBackground,
                      border: "none",
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
                        width: "100%",
                      }}
                    >
                      {showSessionId && (
                        <div
                          style={{
                            fontSize: 12,
                            letterSpacing: 0.5,
                            color: "rgba(233,255,208,0.7)",
                          }}
                        >
                          {sessionIdLabel}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: palette.text,
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {title}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "rgba(233,255,208,0.7)",
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {subtitle}
                      </div>
                    </button>
                    <div
                      data-conversation-options="true"
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 8,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 6,
                        pointerEvents: showOptionsButton ? "auto" : "none",
                        zIndex: 2,
                      }}
                    >
                      <button
                        type="button"
                        aria-label="Opciones del chat"
                        onClick={(event) => {
                          event.stopPropagation();
                          event.preventDefault();
                          setOpenConversationOptionsId((value) =>
                            value === conversationKey ? null : conversationKey
                          );
                        }}
                        tabIndex={showOptionsButton ? 0 : -1}
                        style={{
                          width: 28,
                          height: 28,
                          padding: 0,
                          borderRadius: "50%",
                          border: `1px solid ${palette.border}`,
                          background: palette.bg1,
                          color: palette.text,
                          fontSize: 16,
                          fontWeight: 700,
                          lineHeight: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          opacity: showOptionsButton ? 1 : 0,
                          transform: showOptionsButton
                            ? "translateY(0)"
                            : "translateY(-4px)",
                          transition: "opacity 0.2s ease, transform 0.2s ease",
                          boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
                        }}
                      >
                        ⋮
                      </button>
                      {isMenuOpen && (
                        <div
                          style={{
                            minWidth: 140,
                            padding: 6,
                            borderRadius: 12,
                            background: palette.surface,
                            border: `1px solid ${palette.border}`,
                            boxShadow: "0 18px 40px rgba(0,0,0,0.45)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                          }}
                        >
                          <button
                            type="button"
                            disabled={
                              !canDeleteConversation || isDeletingConversation
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              event.preventDefault();
                              if (!canDeleteConversation || isDeletingConversation) {
                                return;
                              }
                              handleDeleteConversation(sessionIdValue);
                            }}
                            style={{
                              width: "100%",
                              border: "none",
                              borderRadius: 8,
                              padding: "8px 10px",
                              background: "transparent",
                              color: palette.text,
                              fontSize: 13,
                              fontWeight: 600,
                              textAlign: "left",
                              cursor:
                                !canDeleteConversation || isDeletingConversation
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                !canDeleteConversation || isDeletingConversation
                                  ? 0.6
                                  : 1,
                              transition: "background 0.2s ease, color 0.2s ease, opacity 0.2s ease",
                            }}
                          >
                            {isDeletingConversation ? "Borrando..." : "Borrar chat"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
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
                  src="https://firebasestorage.googleapis.com/v0/b/imadata-demo.firebasestorage.app/o/icons%2Flogo01.png?alt=media&token=25c74df8-1dc7-4fc1-b271-5305656466aa"
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
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
}
