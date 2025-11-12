// src/pages/Chat.jsx

import { useEffect, useRef, useState } from "react";

const PLACEHOLDER_RESPONSE =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vel lacus interdum, vulputate libero nec, sagittis neque.";
const THINKING_DELAY = 900;
const TYPING_STEP = 2;
const TYPING_INTERVAL = 35;

export default function ChatMain({ palette }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const timeoutsRef = useRef([]);
  const typingIntervalRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scheduleTimeout = (callback, delay) => {
    const timeoutId = setTimeout(() => {
      callback();
      timeoutsRef.current = timeoutsRef.current.filter((id) => id !== timeoutId);
    }, delay);
    timeoutsRef.current.push(timeoutId);
  };

  const clearAsyncRefs = () => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearAsyncRefs();
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = () => {
    const trimmed = inputValue.trim();

    if (!trimmed || isThinking) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      status: "sent",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    triggerAssistantResponse();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const triggerAssistantResponse = () => {
    setIsThinking(true);

    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        status: "thinking",
      },
    ]);

    scheduleTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId ? { ...msg, status: "typing" } : msg
        )
      );

      startTypingResponse(assistantId, PLACEHOLDER_RESPONSE);
    }, THINKING_DELAY);
  };

  const startTypingResponse = (messageId, text) => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    let index = 0;

    typingIntervalRef.current = setInterval(() => {
      index += TYPING_STEP;

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? {
                ...msg,
                content: text.slice(0, index),
                status:
                  index >= text.length ? "complete" : msg.status || "typing",
              }
            : msg
        )
      );

      if (index >= text.length) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        setIsThinking(false);
      }
    }, TYPING_INTERVAL);
  };

  const hasMessages = messages.length > 0;

  const quickPrompts = [
    {
      title: "Resumir documentos",
      detail: "Convierte PDFs extensos en puntos clave listos para compartir.",
    },
    {
      title: "Diseñar formularios",
      detail: "Pide un flujo adaptado a tu operación y recibe el esquema.",
    },
    {
      title: "Ideas de automatización",
      detail: "Descubre tareas repetitivas que puedes delegar a la IA.",
    },
  ];

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 32,
        padding: "32px clamp(24px, 5vw, 80px) 48px",
        background:
          "radial-gradient(1200px 800px at 20% -120%, rgba(210,242,82,0.18), transparent 65%), linear-gradient(180deg, rgba(3,23,24,0.85) 0%, rgba(3,23,24,0.65) 100%)",
        borderTop: `1px solid ${palette.border}`,
        borderLeft: `1px solid ${palette.border}`,
        color: palette.text,
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 80% 120%, rgba(210,242,82,0.15), transparent 45%)",
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      />

      <main
        style={{
          position: "relative",
          zIndex: 1,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: hasMessages ? "stretch" : "center",
          justifyContent: hasMessages ? "flex-start" : "center",
          gap: hasMessages ? 24 : 40,
          textAlign: hasMessages ? "left" : "center",
          padding: "0 12px",
        }}
      >
        {hasMessages ? (
          <div
            style={{
              width: "100%",
              maxWidth: 900,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: 24,
              padding: "12px 8px 0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
                maxHeight: "60vh",
                overflowY: "auto",
                paddingRight: 8,
              }}
            >
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                const bubbleColor = isUser
                  ? "rgba(210,242,82,0.15)"
                  : "rgba(255,255,255,0.05)";
                const borderColor = isUser
                  ? "rgba(210,242,82,0.35)"
                  : palette.border;
                const label = msg.status === "thinking" ? "Pensando..." : "";
                const typingHint =
                  !isUser && msg.status === "typing"
                    ? label
                      ? " escribe…"
                      : "Escribiendo…"
                    : "";
                const shouldShowLabel = label || typingHint;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      alignItems: isUser ? "flex-end" : "flex-start",
                    }}
                  >
                    {shouldShowLabel && (
                      <span
                        style={{
                          fontSize: 12,
                          letterSpacing: 0.4,
                          color: "rgba(233,255,208,0.65)",
                        }}
                      >
                        {label}
                        {typingHint}
                      </span>
                    )}
                    <div
                      style={{
                        maxWidth: "85%",
                        padding: "14px 16px",
                        borderRadius: 16,
                        background: bubbleColor,
                        border: `1px solid ${borderColor}`,
                        lineHeight: 1.6,
                        fontSize: 14,
                        color: "rgba(233,255,208,0.9)",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.content || "…"}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>
        ) : (
          <>
            <div>
              <p
                style={{
                  fontSize: "clamp(22px, 4vw, 36px)",
                  fontWeight: 700,
                  marginBottom: 12,
                }}
              >
                ¿En qué puedo ayudar, Edu?
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: "rgba(233,255,208,0.7)",
                  maxWidth: 620,
                  margin: "0 auto",
                  lineHeight: 1.6,
                }}
              >
                Describe lo que necesitas y me encargo de idear prompts,
                sintetizar información o construir flujos inteligentes para tu
                equipo.
              </p>
            </div>

            <div
              style={{
                width: "100%",
                maxWidth: 900,
                display: "grid",
                gap: 16,
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              }}
            >
              {quickPrompts.map((item) => (
                <div
                  key={item.title}
                  style={{
                    padding: "20px 18px",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${palette.border}`,
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    boxShadow: "0 15px 40px rgba(0,0,0,0.25)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: 1.2,
                      color: "rgba(233,255,208,0.75)",
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: "rgba(233,255,208,0.85)",
                    }}
                  >
                    {item.detail}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 880,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        <div
          style={{
            borderRadius: 28,
            border: `1px solid ${palette.border}`,
            background: "rgba(19,35,36,0.75)",
            boxShadow:
              "0 15px 35px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)",
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <textarea
            placeholder="Pregunta lo que quieras"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              resize: "none",
              color: palette.text,
              fontSize: 15,
              lineHeight: 1.4,
              fontFamily: "inherit",
              outline: "none",
            }}
            rows={1}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            aria-label="enviar prompt"
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isThinking}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "none",
              background: palette.accent,
              color: palette.ink,
              fontWeight: 700,
              fontSize: 14,
              cursor: !inputValue.trim() || isThinking ? "not-allowed" : "pointer",
              opacity: !inputValue.trim() || isThinking ? 0.5 : 1,
              boxShadow: "0 10px 25px rgba(210,242,82,0.35)",
              transition: "opacity 0.2s ease",
            }}
          >
            ↗
          </button>
        </div>

      </div>
    </div>
  );
}
