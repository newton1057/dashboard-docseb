// src/pages/Dashboard.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ButterflyIcon } from "../utils/icons";
import DashboardMain from "./main";
import ChatMain from "./chat";
import ExpedientesMain from "./expedientes";
import { clearSession, isSessionValid, markSessionStart } from "../utils/auth";

const paletteDark = {
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

const paletteLight = {
  bg1: "#F7FFEC",
  bg2: "#E5F2D5",
  surface: "rgba(255, 255, 255, 0.92)",
  border: "rgba(8, 35, 35, 0.14)",
  accent: "#D2F252",
  text: "#0E241B",
  textMuted: "#3E5A45",
  ink: "#0E241B",
  danger: "#d75c5c",
};

function SettingsIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      <path
        d="M10.25 4.56a2 2 0 0 1 3.5 0l.34.63a1 1 0 0 0 1.04.5l.72-.12a2 2 0 0 1 2.27 1.56l.16.71a1 1 0 0 0 .73.75l.69.17a2 2 0 0 1 1.3 2.52l-.22.68a1 1 0 0 0 .29 1.05l.54.52a2 2 0 0 1 0 2.94l-.54.52a1 1 0 0 0-.29 1.05l.22.68a2 2 0 0 1-1.3 2.52l-.69.17a1 1 0 0 0-.73.75l-.16.71a2 2 0 0 1-2.27 1.56l-.72-.12a1 1 0 0 0-1.04.5l-.34.63a2 2 0 0 1-3.5 0l-.34-.63a1 1 0 0 0-1.04-.5l-.72.12a2 2 0 0 1-2.27-1.56l-.16-.71a1 1 0 0 0-.73-.75l-.69-.17a2 2 0 0 1-1.3-2.52l.22-.68a1 1 0 0 0-.29-1.05l-.54-.52a2 2 0 0 1 0-2.94l.54-.52a1 1 0 0 0 .29-1.05l-.22-.68a2 2 0 0 1 1.3-2.52l.69-.17a1 1 0 0 0 .73-.75l.16-.71a2 2 0 0 1 2.27-1.56l.72.12a1 1 0 0 0 1.04-.5l.34-.63ZM12 9.5A4.5 4.5 0 1 0 12 18.5 4.5 4.5 0 0 0 12 9.5Z"
        fill={color}
      />
    </svg>
  );
}

function UserIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      <circle cx="12" cy="8" r="3.25" stroke={color} strokeWidth="1.5" />
      <path
        d="M6.75 18.5c0-2.35 2.35-4.25 5.25-4.25s5.25 1.9 5.25 4.25"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const TogglePill = ({ on, palette, resolvedAppearance }) => {
  const trackColor = on
    ? resolvedAppearance === "Claro"
      ? "rgba(210,242,82,0.55)"
      : "rgba(210,242,82,0.35)"
    : resolvedAppearance === "Claro"
      ? "rgba(14,36,27,0.12)"
      : "rgba(233,255,208,0.08)";
  const thumbColor = on
    ? palette.accent
    : resolvedAppearance === "Claro"
      ? "#9fb6a5"
      : "#9ebaa0";
  const borderColor =
    resolvedAppearance === "Claro" ? "rgba(14,36,27,0.18)" : "rgba(233,255,208,0.15)";
  return (
    <div
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        background: trackColor,
        border: `1px solid ${borderColor}`,
        display: "flex",
        alignItems: "center",
        padding: 2,
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: thumbColor,
          transform: `translateX(${on ? 18 : 0}px)`,
          transition: "transform 0.18s ease",
          boxShadow: on ? "0 0 0 2px rgba(210,242,82,0.18)" : "none",
        }}
      />
    </div>
  );
};

function LogoutIcon({ size = 16, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      <path
        d="M13 4.5A1.5 1.5 0 0 0 11.5 3h-6A1.5 1.5 0 0 0 4 4.5v15A1.5 1.5 0 0 0 5.5 21h6A1.5 1.5 0 0 0 13 19.5V18h-1.5v1.5h-6v-15h6V6H13V4.5Z"
        fill={color}
      />
      <path
        d="m15.5 8.44 4 4-4 4-1.06-1.06L16.88 13H9v-1.5h7.88l-2.44-2.38L15.5 8.44Z"
        fill={color}
      />
    </svg>
  );
}

const CONVERSATIONS_ENDPOINT =
  "https://demo-ai-448238488830.northamerica-south1.run.app/modelsAI/conversations";
const CONVERSATION_DETAIL_ENDPOINT =
  "https://demo-ai-448238488830.northamerica-south1.run.app/modelsAI/conversation";
const DELETE_CONVERSATION_ENDPOINT =
  "https://delete-chat-448238488830.northamerica-south1.run.app";
const LOOKER_EMBED_URL =
  "https://lookerstudio.google.com/embed/reporting/1a6767f6-18d9-48e7-a247-2e9131b7378a/page/9F1bF";
const APPEARANCE_STORAGE_KEY = "appearancePreference";

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("general");
  const [openSettingsDropdown, setOpenSettingsDropdown] = useState(null);
  const [appearanceSelection, setAppearanceSelection] = useState(() => {
    try {
      const stored = localStorage.getItem(APPEARANCE_STORAGE_KEY);
      if (stored === "Claro" || stored === "Oscuro" || stored === "Sistema") {
        return stored;
      }
    } catch (error) {
      console.warn("No se pudo leer apariencia almacenada", error);
    }
    return "Sistema";
  });
  const [systemAppearance, setSystemAppearance] = useState("Oscuro");
  const [activeSection, setActiveSection] = useState("formularios");
  const [conversations, setConversations] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [conversationsError, setConversationsError] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedConversationHistory, setSelectedConversationHistory] =
    useState(null);
  const [chatInstanceKey, setChatInstanceKey] = useState(0);
  const [hoveredConversationId, setHoveredConversationId] = useState(null);
  const [hoveredSidebarKey, setHoveredSidebarKey] = useState(null);
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

  const handleOpenSettings = () => {
    setSettingsTab("general");
    setIsSettingsOpen(true);
    setIsMenuOpen(false);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
    setOpenSettingsDropdown(null);
  };

  const resolvedAppearance =
    appearanceSelection === "Sistema" ? systemAppearance : appearanceSelection;
  const palette = resolvedAppearance === "Claro" ? paletteLight : paletteDark;
  const accentGlow =
    resolvedAppearance === "Claro" ? "rgba(58,92,47,0.18)" : "rgba(210,242,82,0.10)";
  const appBackground = `radial-gradient(1200px 600px at 120% -20%, ${accentGlow} 0%, transparent 60%), linear-gradient(135deg, ${palette.bg1}, ${palette.bg2} 60%)`;
  const dashboardBackground = `radial-gradient(1200px 800px at 20% -120%, ${accentGlow}, transparent 65%), linear-gradient(180deg, ${palette.surface} 0%, ${palette.bg1} 100%)`;
  const topbarBackground =
    resolvedAppearance === "Claro" ? "rgba(255,255,255,0.78)" : "rgba(3,23,24,0.55)";
  const iframeBackground =
    resolvedAppearance === "Claro" ? "rgba(255,255,255,0.9)" : "rgba(2,10,11,0.92)";
  const overlayBackground =
    resolvedAppearance === "Claro" ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.55)";
  const modalShellBackground =
    resolvedAppearance === "Claro"
      ? "linear-gradient(145deg, rgba(245,255,236,0.96), rgba(232,244,217,0.92))"
      : "linear-gradient(145deg, rgba(10,16,15,0.96), rgba(9,21,19,0.92))";
  const modalLeftBackground =
    resolvedAppearance === "Claro" ? "rgba(8,35,35,0.04)" : "rgba(233,255,208,0.04)";
const modalContentBackground =
  resolvedAppearance === "Claro" ? "rgba(255,255,255,0.9)" : "rgba(3,23,24,0.88)";
const dropdownSurface =
  resolvedAppearance === "Claro" ? "rgba(255,255,255,0.98)" : "rgba(3,23,24,0.96)";
const controlSurface =
  resolvedAppearance === "Claro" ? "rgba(14,36,27,0.06)" : "rgba(233,255,208,0.06)";
const controlActiveSurface =
  resolvedAppearance === "Claro" ? "rgba(58,92,47,0.12)" : "rgba(210,242,82,0.18)";

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const update = () => setSystemAppearance(media.matches ? "Claro" : "Oscuro");
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // Guardar preferencia cuando cambia
  useEffect(() => {
    try {
      localStorage.setItem(APPEARANCE_STORAGE_KEY, appearanceSelection);
    } catch (error) {
      console.warn("No se pudo guardar apariencia", error);
    }
  }, [appearanceSelection]);

  useEffect(() => {
    if (!isSettingsOpen) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape") {
        handleCloseSettings();
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isSettingsOpen]);

  useEffect(() => {
    if (!openSettingsDropdown) return undefined;
    const handleClickOutside = (event) => {
      const isDropdown = event.target.closest?.("[data-settings-dropdown='true']");
      if (!isDropdown) {
        setOpenSettingsDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openSettingsDropdown]);

  const renderMainContent = () => {
    if (activeSection === "dashboard") {
      return (
        <div
          style={{
            height: "100%",
            borderTop: `1px solid ${palette.border}`,
            borderLeft: `1px solid ${palette.border}`,
            background: dashboardBackground,
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
              background: iframeBackground,
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
      return <DashboardMain palette={palette} appearance={resolvedAppearance} />;
    }

    if (activeSection === "expedientes") {
      return <ExpedientesMain palette={palette} appearance={resolvedAppearance} />;
    }

    return (
      <ChatMain
        key={selectedSessionId || `new-${chatInstanceKey}`}
        palette={palette}
        appearance={resolvedAppearance}
        sessionIdOverride={selectedSessionId}
        initialHistory={selectedConversationHistory}
        requestType="general"
      />
    );
  };

  const settingsTabs = [
    { key: "general", label: "General", Icon: SettingsIcon },
    { key: "cuenta", label: "Cuenta", Icon: UserIcon },
  ];

  const settingsContent = {
    general: [
      {
        key: "appearance",
        label: "Apariencia",
        value: "Sistema",
        options: ["Sistema", "Claro", "Oscuro"],
      },
      {
        key: "notifications",
        label: "Notificaciones",
        type: "toggle",
        on: true,
        hint: "Muestra alertas cuando se actualizan los paneles o chats.",
      },
    ],
    cuenta: [
      { key: "email", label: "Correo de sesión", value: "demo@demo.com" },
      { key: "role", label: "Rol", value: "Administrador" },
    ],
  };

  return (
    <>
      <div className="full-screen-dashboard">
        <div
          style={{
            width: "100vw",
            height: "100dvh",
            display: "grid",
            gridTemplateColumns: "16% 1fr",
            background: appBackground,
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
              const isHovered = hoveredSidebarKey === item.key;
              const baseBackground = isActive ? palette.accent : "transparent";
              const hoverBackground = isActive
                ? palette.accent
                : "rgba(233,255,208,0.08)";
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSidebarSectionClick(item.key)}
                  aria-current={isActive ? "page" : undefined}
                  onMouseEnter={() => setHoveredSidebarKey(item.key)}
                  onMouseLeave={() => setHoveredSidebarKey(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    fontSize: 14,
                    fontWeight: 700,
                    color: isActive ? palette.ink : palette.text,
                    background: isHovered ? hoverBackground : baseBackground,
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
                  ? resolvedAppearance === "Claro"
                    ? "rgba(58,92,47,0.12)"
                    : "rgba(210,242,82,0.08)"
                  : resolvedAppearance === "Claro"
                    ? "rgba(8,35,35,0.04)"
                    : "rgba(3,23,24,0.85)";
                const hoverBackground = isSelected
                  ? resolvedAppearance === "Claro"
                    ? "rgba(58,92,47,0.16)"
                    : "rgba(210,242,82,0.12)"
                  : resolvedAppearance === "Claro"
                    ? "rgba(8,35,35,0.08)"
                    : "rgba(233,255,208,0.08)";
                const titleColor = resolvedAppearance === "Claro" ? "#0b2b2b" : palette.text;
                const subtitleColor =
                  resolvedAppearance === "Claro" ? "rgba(11,43,43,0.65)" : "rgba(233,255,208,0.7)";
                const sessionIdColor =
                  resolvedAppearance === "Claro" ? "rgba(11,43,43,0.6)" : "rgba(233,255,208,0.7)";
                const cardShadow =
                  resolvedAppearance === "Claro"
                    ? "0 10px 24px rgba(0,0,0,0.16)"
                    : "0 12px 30px rgba(0,0,0,0.35)";
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
                        boxShadow: cardShadow,
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
                            color: sessionIdColor,
                          }}
                        >
                          {sessionIdLabel}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: titleColor,
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
                          color: subtitleColor,
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
              background: topbarBackground,
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
                    onClick={handleOpenSettings}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      border: "none",
                      borderRadius: 6,
                      background: "transparent",
                      color: palette.text,
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <SettingsIcon size={16} color={palette.text} />
                    <span style={{ fontSize: 13, lineHeight: 1.2 }}>
                      Configuración
                    </span>
                  </button>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      border: "none",
                      borderRadius: 6,
                      background: "transparent",
                      color: palette.text,
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <LogoutIcon size={16} color={palette.text} />
                    <span style={{ fontSize: 13, lineHeight: 1.2 }}>Cerrar sesión</span>
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

      {isSettingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={handleCloseSettings}
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
            background: overlayBackground,
            backdropFilter: "blur(6px)",
            zIndex: 100,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(100%, 920px)",
              height: "min(88vh, 760px)",
              display: "grid",
              gridTemplateColumns: "220px 1fr",
              background: modalShellBackground,
              borderRadius: 16,
              border: `1px solid ${palette.border}`,
              boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
              overflow: "hidden",
              color: palette.text,
            }}
          >
            <div
              style={{
                background: modalLeftBackground,
                borderRight: `1px solid ${palette.border}`,
                padding: "14px 0 12px 0",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  padding: "6px 12px 10px",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: palette.textMuted,
                    letterSpacing: 0.3,
                  }}
                >
                  Preferencias
                </div>
              </div>

              {settingsTabs.map(({ key, label, Icon }) => {
                const isActive = settingsTab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSettingsTab(key)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 0,
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      textAlign: "left",
                      color: palette.text,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                      background: isActive
                        ? "rgba(210,242,82,0.16)"
                        : "transparent",
                      borderLeft: isActive ? `3px solid ${palette.accent}` : "3px solid transparent",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <Icon size={16} color={palette.text} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                padding: "18px 16px 14px 16px",
                background: modalContentBackground,
                overflow: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 12,
                  paddingBottom: 12,
                  marginBottom: 8,
                  borderBottom: "1px solid rgba(233,255,208,0.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    paddingLeft: 4,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: palette.textMuted,
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                      marginLeft: 0,
                    }}
                  >
                    {settingsTabs.find((item) => item.key === settingsTab)?.label || "General"}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, marginTop: 2 }}>
                    Preferencias rápidas
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 2 }}>
                {(settingsContent[settingsTab] || []).map((row, index, arr) => {
                  const isLast = index === arr.length - 1;
                  const currentValue =
                    row.key === "appearance" ? appearanceSelection : row.value;
                  return (
                    <div
                      key={row.key}
                      style={{
                        padding: "12px 4px",
                        borderBottom: isLast ? "none" : "1px solid rgba(233,255,208,0.06)",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "flex-start",
                        gap: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          flex: 1,
                          minWidth: 0,
                          textAlign: "left",
                        }}
                      >
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{row.label}</div>
                        {row.hint && (
                          <div style={{ fontSize: 12, color: palette.textMuted, maxWidth: 520 }}>
                            {row.hint}
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          whiteSpace: "nowrap",
                          marginLeft: "auto",
                        }}
                      >
                        {row.type === "toggle" ? (
                          <TogglePill
                            on={row.on}
                            palette={palette}
                            resolvedAppearance={resolvedAppearance}
                          />
                        ) : row.options ? (
                          <div
                            data-settings-dropdown="true"
                            style={{ position: "relative", display: "flex" }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenSettingsDropdown((prev) =>
                                  prev === row.key ? null : row.key
                                )
                              }
                              style={{
                                fontSize: 13,
                                color: palette.text,
                                background: controlSurface,
                                border: `1px solid ${palette.border}`,
                                borderRadius: 10,
                                padding: "8px 12px",
                                minWidth: 140,
                                textAlign: "center",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                              }}
                            >
                              <span>{currentValue}</span>
                              <span style={{ fontSize: 11, opacity: 0.8 }}>▾</span>
                            </button>
                            {openSettingsDropdown === row.key && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "calc(100% + 6px)",
                                  right: 0,
                                  minWidth: 180,
                                  background: dropdownSurface,
                                  border: `1px solid ${palette.border}`,
                                  borderRadius: 10,
                                  boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
                                  padding: 6,
                                  display: "grid",
                                  gap: 4,
                                  zIndex: 5,
                                }}
                              >
                                {row.options.map((option) => {
                                  const isActive = option === currentValue;
                                  return (
                                    <button
                                      key={option}
                                      type="button"
                                      onClick={() => {
                                        setAppearanceSelection(option);
                                        setOpenSettingsDropdown(null);
                                      }}
                                      style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "8px 10px",
                                        borderRadius: 8,
                                        border: "none",
                                        cursor: "pointer",
                                        background: isActive ? controlActiveSurface : "transparent",
                                        color: palette.text,
                                        fontSize: 13,
                                        fontWeight: isActive ? 700 : 600,
                                      }}
                                    >
                                      {option}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: 13,
                              color: palette.text,
                              background: controlSurface,
                              border: `1px solid ${palette.border}`,
                              borderRadius: 10,
                              padding: "8px 12px",
                              minWidth: 120,
                              textAlign: "center",
                            }}
                          >
                            {row.value}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
