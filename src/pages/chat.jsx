// src/pages/Chat.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import { FiCopy, FiImage, FiFilePlus, FiFileText, FiX } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import "./chat.css";

const API_URL =
  "https://demo-ai-448238488830.northamerica-south1.run.app/modelsAI/message";
const SESSION_ID_LENGTH = 8;
const SESSION_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const TYPING_STEP = 2;
const TYPING_INTERVAL = 35;

const toDataPayload = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const normalized = Object.entries(value).reduce((acc, [key, val]) => {
    if (val !== undefined) {
      acc[key] = val;
    }
    return acc;
  }, {});

  return Object.keys(normalized).length > 0 ? normalized : null;
};

const generateSessionId = () => {
  let id = "";
  for (let i = 0; i < SESSION_ID_LENGTH; i += 1) {
    const index = Math.floor(Math.random() * SESSION_CHARSET.length);
    id += SESSION_CHARSET.charAt(index);
  }
  return id;
};

const getTextFromParts = (parts) =>
  Array.isArray(parts)
    ? parts
      .map((part) =>
        typeof part?.text === "string" ? part.text.trim() : ""
      )
      .filter(Boolean)
      .join("\n")
    : "";

const isImageMime = (value) =>
  typeof value === "string" && value.toLowerCase().startsWith("image/");

const extractFileNameFromUri = (uri) => {
  if (!uri) return "";
  try {
    const parsed = new URL(uri);
    const pathname = parsed.pathname || "";
    const name = pathname.split("/").filter(Boolean).pop() || "";
    return decodeURIComponent(name);
  } catch {
    const fallbackName =
      uri
        .split("?")[0]
        .split("#")[0]
        .split("/")
        .filter(Boolean)
        .pop() || "";
    try {
      return decodeURIComponent(fallbackName);
    } catch {
      return fallbackName;
    }
  }
};

const buildAttachmentFromFileData = (fileData, baseId, index) => {
  if (!fileData?.fileUri) return null;
  const mimeType =
    typeof fileData.mimeType === "string" ? fileData.mimeType : "";
  const url = fileData.fileUri;
  return {
    id: `${baseId}-file-${index}`,
    kind: isImageMime(mimeType) ? "image" : "file",
    mimeType,
    url,
    name: extractFileNameFromUri(url) || "Archivo adjunto",
  };
};

const buildAttachmentFromInlineData = (inlineData, baseId, index) => {
  const dataString =
    typeof inlineData?.data === "string" ? inlineData.data : "";
  if (!dataString) return null;
  const mimeType =
    typeof inlineData.mimeType === "string" ? inlineData.mimeType : "";
  const isAlreadyDataUrl = dataString.startsWith("data:");
  const url = isAlreadyDataUrl
    ? dataString
    : `data:${mimeType || "application/octet-stream"};base64,${dataString}`;

  return {
    id: `${baseId}-inline-${index}`,
    kind: isImageMime(mimeType) ? "image" : "file",
    mimeType,
    url,
    name: "Archivo adjunto",
  };
};

const getAttachmentsFromParts = (parts, baseId) => {
  if (!Array.isArray(parts)) return [];
  const attachments = [];

  parts.forEach((part, index) => {
    const attachmentFromFileData = buildAttachmentFromFileData(
      part?.fileData,
      baseId,
      index
    );
    if (attachmentFromFileData) {
      attachments.push(attachmentFromFileData);
      return;
    }

    const attachmentFromInline = buildAttachmentFromInlineData(
      part?.inlineData,
      baseId,
      index
    );
    if (attachmentFromInline) {
      attachments.push(attachmentFromInline);
    }
  });

  return attachments;
};

const getMessageParts = (parts, baseId) => ({
  text: getTextFromParts(parts),
  attachments: getAttachmentsFromParts(parts, baseId),
});

const mapLocalAttachments = (images, files) => {
  const imageItems = Array.isArray(images) ? images : [];
  const fileItems = Array.isArray(files) ? files : [];

  return [
    ...imageItems.map((item, index) => ({
      id: item.id || `local-image-${index}`,
      kind: "image",
      mimeType: item.file?.type || "image/jpeg",
      url: item.url || "",
      name: item.name || "Imagen adjunta",
    })),
    ...fileItems.map((item, index) => ({
      id: item.id || `local-file-${index}`,
      kind: "file",
      mimeType: item.file?.type || "",
      url: item.url || "",
      name: item.name || "Archivo adjunto",
    })),
  ];
};

const buildMessagesFromHistory = (history) => {
  if (!Array.isArray(history)) return [];
  const timestamp = Date.now();

  return history
    .map((entry, index) => {
      const normalizedRole =
        entry?.role === "model"
          ? "assistant"
          : entry?.role === "user"
            ? "user"
            : null;
      if (!normalizedRole) return null;

      const { text, attachments } = getMessageParts(
        entry?.parts,
        `${normalizedRole}-${timestamp}-${index}`
      );

      return {
        id: `${normalizedRole}-${timestamp}-${index}`,
        role: normalizedRole,
        content: text,
        attachments,
        status: "complete",
      };
    })
    .filter(Boolean);
};

const getLastAssistantIndex = (items) => {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (items[index]?.role === "assistant") {
      return index;
    }
  }
  return -1;
};

const findAssistantIndex = (items, preferredId = null) => {
  if (preferredId) {
    const directIndex = items.findIndex(
      (msg) => msg.id === preferredId && msg.role === "assistant"
    );
    if (directIndex >= 0) return directIndex;
  }
  return getLastAssistantIndex(items);
};

const updateAssistantMessage = (setState, preferredId, updater) => {
  setState((prev) => {
    const next = [...prev];
    const targetIndex = findAssistantIndex(next, preferredId);
    if (targetIndex < 0) return prev;
    next[targetIndex] = updater(next[targetIndex], targetIndex);
    return next;
  });
};

const normalizeEmail = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed && trimmed !== "—" ? trimmed : null;
};

export default function ChatMain({
  palette,
  appearance = "Oscuro",
  contextData = null,
  sessionIdOverride = null,
  initialHistory = null,
  requestType = null,
  requestEmail = null,
}) {
  const initialMessages = useMemo(
    () => buildMessagesFromHistory(initialHistory),
    [initialHistory]
  );
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [sessionId, setSessionId] = useState(() =>
    sessionIdOverride || generateSessionId()
  );
  const [inputContainerHeight, setInputContainerHeight] = useState(0);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const typingIntervalRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputContainerRef = useRef(null);
  const plusMenuWrapperRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fade dinámico
  const scrollAreaRef = useRef(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const clearTypingInterval = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  const clearTypingTimeout = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    setMessages(initialMessages);
    setIsThinking(false);
    clearTypingInterval();
    clearTypingTimeout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessages]);

  useEffect(() => {
    if (!copiedMessageId) return undefined;
    const timer = setTimeout(() => setCopiedMessageId(null), 1200);
    return () => clearTimeout(timer);
  }, [copiedMessageId]);

  useEffect(() => {
    if (sessionIdOverride && sessionIdOverride !== sessionId) {
      setSessionId(sessionIdOverride);
    }
  }, [sessionIdOverride, sessionId]);

  useEffect(() => {
    const handleResize = () => {
      if (inputContainerRef.current) {
        setInputContainerHeight(inputContainerRef.current.offsetHeight);
      }
    };

    handleResize();

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }

    return undefined;
  }, []);

  const updateScrollFades = () => {
    const el = scrollAreaRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;

    // Si no hay overflow, ocultamos difuminados
    if (scrollHeight <= clientHeight + 1) {
      if (showTopFade) setShowTopFade(false);
      if (showBottomFade) setShowBottomFade(false);
      return;
    }

    const nextShowTop = scrollTop > 4;
    const nextShowBottom = scrollTop + clientHeight < scrollHeight - 4;

    if (nextShowTop !== showTopFade) setShowTopFade(nextShowTop);
    if (nextShowBottom !== showBottomFade) setShowBottomFade(nextShowBottom);
  };

  useEffect(() => {
    return () => {
      // Limpia URLs creadas para imágenes cuando se desmontan o cambian
      imagePreviews.forEach((item) => {
        if (item?.url) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [imagePreviews]);

  // Limpia timers de tipeo al desmontar el componente
  useEffect(() => {
    return () => {
      clearTypingInterval();
      clearTypingTimeout();
    };
  }, []);

  useEffect(() => {
    if (!isPlusMenuOpen) return undefined;

    const handleClickOutside = (event) => {
      if (
        plusMenuWrapperRef.current &&
        !plusMenuWrapperRef.current.contains(event.target)
      ) {
        setIsPlusMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPlusMenuOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    updateScrollFades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleSubmit = () => {
    const trimmed = inputValue.trim();

    if (!trimmed || isThinking) return;

    const pendingAttachments = mapLocalAttachments(
      imagePreviews,
      filePreviews
    );
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      status: "sent",
      attachments: pendingAttachments,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    triggerAssistantResponse(trimmed);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleAddImages = () => {
    setIsPlusMenuOpen(false);
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  };

  const handleAddFiles = () => {
    setIsPlusMenuOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImagesSelected = (event) => {
    const { files } = event.target;
    if (!files || files.length === 0) return;
    const allowed = Array.from(files).filter((file) => {
      const name = file.name?.toLowerCase() || "";
      return file.type === "image/jpeg" || name.endsWith(".jpg") || name.endsWith(".jpeg");
    });
    if (allowed.length === 0) {
      event.target.value = "";
      return;
    }
    const mapped = allowed.map((file, index) => ({
      id: `${file.name}-${Date.now()}-${index}`,
      name: file.name,
      url: URL.createObjectURL(file),
      file,
    }));
    setImagePreviews((prev) => [...prev, ...mapped]);
    // Clear to allow re-selecting the same file later
    event.target.value = "";
  };

  const handleFilesSelected = (event) => {
    const { files } = event.target;
    if (!files || files.length === 0) return;
    const mapped = Array.from(files).map((file, index) => ({
      id: `${file.name}-${Date.now()}-${index}`,
      name: file.name,
      file,
    }));
    setFilePreviews((prev) => [...prev, ...mapped]);
    event.target.value = "";
  };

  const handleRemoveImage = (id) => {
    setImagePreviews((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.url) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleRemoveFile = (id) => {
    setFilePreviews((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAttachments = () => {
    setImagePreviews((prev) => {
      prev.forEach((item) => {
        if (item?.url) {
          URL.revokeObjectURL(item.url);
        }
      });
      return [];
    });
    setFilePreviews([]);
  };

  const triggerAssistantResponse = async (userContent) => {
    const assistantId = `assistant-${Date.now()}`;
    setIsThinking(true);
    setMessages((prev) => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        attachments: [],
        status: "thinking",
      },
    ]);

    let isAnimatingResponse = false;
    let requestSucceeded = false;

    try {
      const dataPayload = toDataPayload(contextData);
      const normalizedType =
        typeof requestType === "string" ? requestType.trim() : "";
      const typeValue = normalizedType || null;
      const normalizedSpecificEmail =
        typeValue === "specific"
          ? normalizeEmail(requestEmail) ||
          normalizeEmail(contextData?.email) ||
          normalizeEmail(contextData?.info?.email)
          : null;
      const filesToSend = [...imagePreviews, ...filePreviews]
        .map((item) => item?.file)
        .filter(Boolean);
      const hasUploads = filesToSend.length > 0;

      let requestBody;
      let requestHeaders;

      if (hasUploads) {
        const formData = new FormData();
        formData.append("message", userContent);
        formData.append("session_id", sessionId);
        if (typeValue) formData.append("type", typeValue);
        if (typeValue === "specific" && normalizedSpecificEmail) {
          formData.append("email", normalizedSpecificEmail);
        }
        if (dataPayload) {
          formData.append("data", JSON.stringify(dataPayload));
        }
        filesToSend.forEach((file) => {
          formData.append("files", file);
        });
        requestBody = formData;
        requestHeaders = undefined;
      } else {
        const payload = {
          message: userContent,
          session_id: sessionId,
          ...(typeValue ? { type: typeValue } : {}),
          ...(typeValue === "specific" ? { email: normalizedSpecificEmail } : {}),
          ...(dataPayload ? { data: dataPayload } : {}),
        };
        requestBody = JSON.stringify(payload);
        requestHeaders = { "Content-Type": "application/json" };
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: requestHeaders,
        body: requestBody,
      });

      if (!response.ok) {
        throw new Error(`Solicitud fallida con estado ${response.status}`);
      }

      const data = await response.json();
      const historyMessages = buildMessagesFromHistory(
        data?.conversationHistory
      );

      if (historyMessages.length) {
        const lastAssistantIndex = getLastAssistantIndex(historyMessages);

        if (lastAssistantIndex >= 0) {
          const assistantText =
            typeof historyMessages[lastAssistantIndex]?.content === "string"
              ? historyMessages[lastAssistantIndex].content
              : "";
          const shouldAnimateTyping = assistantText.trim().length > 0;

          historyMessages[lastAssistantIndex] = {
            ...historyMessages[lastAssistantIndex],
            id: assistantId,
            content: shouldAnimateTyping ? "" : assistantText,
            status: shouldAnimateTyping ? "typing" : "complete",
          };

          setMessages(historyMessages);
          requestSucceeded = true;

          if (shouldAnimateTyping) {
            isAnimatingResponse = true;
            // Aseguramos que el state ya esté aplicado antes de animar
            setTimeout(() => {
              try {
                startTypingResponse(assistantId, assistantText);
              } catch (err) {
                console.error("No se pudo iniciar animación de tipeo:", err);
                updateAssistantMessage(
                  setMessages,
                  assistantId,
                  (msg) => ({
                    ...msg,
                    content: assistantText,
                    status: "complete",
                  })
                );
                setIsThinking(false);
              }
            }, 0);
          } else {
            setIsThinking(false);
          }

          return;
        }

        setMessages(historyMessages);
        requestSucceeded = true;
        return;
      }

      const fallbackText =
        typeof data?.message === "string" && data.message.trim()
          ? data.message.trim()
          : "No pude obtener la respuesta, intenta nuevamente.";

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: fallbackText, status: "complete" }
            : msg
        )
      );
      requestSucceeded = true;
    } catch (error) {
      console.error("Error fetching assistant response:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
              ...msg,
              content:
                "Ocurrió un error al comunicarse con la IA. Intenta otra vez.",
              status: "complete",
            }
            : msg
        )
      );
    } finally {
      if (requestSucceeded) {
        clearAttachments();
      }
      if (!isAnimatingResponse) {
        setIsThinking(false);
      }
    }
  };

  const startTypingResponse = (messageId, text) => {
    clearTypingInterval();
    clearTypingTimeout();

    const safeText = typeof text === "string" ? text : String(text || "");
    if (!safeText) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: "", status: "complete" }
            : msg
        )
      );
      setIsThinking(false);
      return;
    }

    let index = 0;
    const fallbackMs = Math.min(
      Math.max(safeText.length * TYPING_INTERVAL + 1200, 4000),
      20000
    );

    typingTimeoutRef.current = setTimeout(() => {
      updateAssistantMessage(setMessages, messageId, (msg) => ({
        ...msg,
        content: safeText,
        status: "complete",
      }));
      clearTypingInterval();
      clearTypingTimeout();
      setIsThinking(false);
    }, fallbackMs);

    typingIntervalRef.current = setInterval(() => {
      index += TYPING_STEP;

      updateAssistantMessage(setMessages, messageId, (msg) => ({
        ...msg,
        content: safeText.slice(0, index),
        status: index >= safeText.length ? "complete" : "typing",
      }));

      if (index >= safeText.length) {
        clearTypingInterval();
        clearTypingTimeout();
        setIsThinking(false);
      }
    }, TYPING_INTERVAL);

    // Salvaguarda extra: si por alguna razón no se actualiza status, lo forzamos
    setTimeout(() => {
      updateAssistantMessage(setMessages, messageId, (msg) => {
        if (msg.status === "complete") return msg;
        return { ...msg, content: safeText, status: "complete" };
      });
      clearTypingInterval();
      clearTypingTimeout();
      setIsThinking(false);
    }, Math.min(fallbackMs + 1000, 22000));
  };

  const hasMessages = messages.length > 0;
  const inputOverlapOffset = hasMessages
    ? Math.max(inputContainerHeight - 24, 120)
    : 0;
  const chatBottomPadding = hasMessages
    ? inputOverlapOffset + 32
    : 72;
  const inputContainerMargin = hasMessages
    ? `-${inputOverlapOffset}px auto 0`
    : "0 auto";
  const isLight = appearance === "Claro";
  const chatBackground = isLight
    ? "radial-gradient(1200px 800px at 20% -120%, rgba(58,92,47,0.16), transparent 65%), linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(232,244,217,0.86) 100%)"
    : "radial-gradient(1200px 800px at 20% -120%, rgba(210,242,82,0.18), transparent 65%), linear-gradient(180deg, rgba(3,23,24,0.85) 0%, rgba(3,23,24,0.65) 100%)";
  const heroTitleColor = isLight ? "#0b2b2b" : palette.text;
  const heroSubtitleColor = isLight ? "rgba(11,43,43,0.7)" : "rgba(233,255,208,0.7)";
  const promptCardBg = isLight ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.05)";
  const promptCardBorder = isLight ? "rgba(14,36,27,0.12)" : palette.border;
  const promptTitleColor = isLight ? "#0b2b2b" : "rgba(233,255,208,0.75)";
  const promptTextColor = isLight ? "rgba(11,43,43,0.7)" : "rgba(233,255,208,0.85)";
  const inputBackground = isLight ? "linear-gradient(135deg, rgba(255,255,255,0.94), rgba(240,249,227,0.94))" : (palette.bg2 || "#0B2A2B");
  const inputBorder = isLight ? "rgba(14,36,27,0.14)" : palette.border;
  const inputShadow = isLight
    ? "0 18px 45px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.8)"
    : "0 15px 35px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)";
  const chatPlaceholder = isLight ? "rgba(11,43,43,0.45)" : "rgba(210, 242, 82, 0.4)";
  const sendButtonBg = isLight ? "#0b2b2b" : palette.accent;
  const sendButtonColor = isLight ? palette.accent : palette.ink;
  const plusButtonBg = isLight ? "#0b2b2b" : palette.accent;
  const plusButtonColor = isLight ? palette.accent : palette.ink;
  const userBubbleBg = isLight ? "rgba(11,43,43,0.08)" : "rgba(210,242,82,0.15)";
  const modelBubbleBg = isLight ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.05)";
  const userBorder = isLight ? "rgba(11,43,43,0.18)" : "rgba(210,242,82,0.35)";
  const modelBorder = isLight ? "rgba(11,43,43,0.12)" : palette.border;
  const bubbleTextColor = isLight ? "#0b2b2b" : "rgba(233,255,208,0.92)";
  const markdownColor = isLight ? "rgba(11,43,43,0.9)" : "rgba(233,255,208,0.95)";
  const markdownStrong = isLight ? "#0b2b2b" : "#f1ff9f";
  const markdownHeading = isLight ? "#0b2b2b" : "#f8ffcf";
  const markdownMuted = isLight ? "rgba(11,43,43,0.65)" : "rgba(233,255,208,0.75)";
  const bubbleShadow = isLight ? "0 18px 42px rgba(0,0,0,0.16)" : "0 18px 40px rgba(0,0,0,0.32)";
  const copyBadgeBg = isLight ? "rgba(11,43,43,0.08)" : "rgba(255,255,255,0.08)";
  const copyBadgeBorder = isLight ? "rgba(11,43,43,0.15)" : "rgba(255,255,255,0.12)";
  const copyBadgeColor = isLight ? "#0b2b2b" : palette.text;

  const quickPrompts = [
    {
      title: "El modelo sigue aprendiendo",
      detail: "Todavía puede equivocarse o no entender del todo el contexto. Tu uso nos ayuda a mejorarlo.",
    },
    {
      title: "Ayúdanos a mejorar",
      detail: "Si ves una respuesta confusa o incorrecta, no olvides reportárnoslo o dejarnos tus comentarios.",
    },
    {
      title: "Entre más contexto, mejor",
      detail: "Agrega ejemplos, datos y lo que quieres lograr para que las respuestas sean más útiles y precisas.",
    }
  ];

  const handleScroll = () => {
    updateScrollFades();
  };

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 32,
        padding: "32px clamp(24px, 5vw, 80px) 48px",
        height: "100%",
        minHeight: 0,
        flex: 1,
        boxSizing: "border-box",
        background: chatBackground,
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
          minHeight: 0,
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
              flex: 1,
              minHeight: 0,
            }}
          >
            <div
              className="chat-scroll-wrapper"
              style={{
                position: "relative",
                paddingRight: 8,
                display: "flex",
                flexDirection: "column",
                flex: 1,
                minHeight: 0,
              }}
            >
              <div
                ref={scrollAreaRef}
                className="chat-scroll-area"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  paddingRight: 48,
                  paddingLeft: 48,      // 👈 nuevo: aire lateral
                  paddingTop: 4,
                  paddingBottom: chatBottomPadding,   // espacio extra para el input flotante
                }}
                onScroll={handleScroll}
              >
                <>
                  {messages.map((msg) => {
                    const isUser = msg.role === "user";
                    const bubbleColor = isUser ? userBubbleBg : modelBubbleBg;
                    const borderColor = isUser ? userBorder : modelBorder;
                    const label = msg.status === "thinking" ? "Pensando..." : "";
                    const typingHint =
                    !isUser && msg.status === "typing"
                      ? label
                        ? " escribe…"
                        : "Escribiendo…"
                      : "";
                  const shouldShowLabel = label || typingHint;
                  const attachments = Array.isArray(msg.attachments)
                    ? msg.attachments
                    : [];
                  const hasAttachments = attachments.length > 0;
                  const rawContent =
                    typeof msg.content === "string" ? msg.content : "";
                  const hasText = Boolean(rawContent.trim());
                  const placeholderText =
                    !hasText && !hasAttachments
                      ? rawContent ||
                        (msg.status === "thinking" || msg.status === "typing"
                          ? "…"
                          : "")
                      : "";
                  const textToRender = hasText ? rawContent : placeholderText;
                  const shouldRenderText = Boolean(textToRender);
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
                          padding: "16px 18px",
                          borderRadius: 18,
                          background: bubbleColor,
                          border: `1px solid ${borderColor}`,
                          lineHeight: 1.6,
                          fontSize: 14,
                          color: bubbleTextColor,
                          boxShadow: bubbleShadow,
                          backdropFilter: "blur(3px)",
                          WebkitBackdropFilter: "blur(3px)",
                        }}
                      >
                        {shouldRenderText &&
                          (isUser ? (
                            <span style={{ whiteSpace: "pre-wrap" }}>
                              {textToRender}
                            </span>
                          ) : (
                            <div
                              className="chat-markdown"
                              style={{
                                color: markdownColor,
                                "--markdown-color": markdownColor,
                                "--markdown-strong": markdownStrong,
                                "--markdown-heading": markdownHeading,
                                "--markdown-muted": markdownMuted,
                              }}
                            >
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {textToRender}
                              </ReactMarkdown>
                            </div>
                          ))}
                        {hasAttachments && (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 12,
                              marginTop: shouldRenderText ? 12 : 0,
                            }}
                          >
                            {attachments.map((attachment, attachmentIndex) => {
                              const hasUrl = Boolean(attachment?.url);
                              const attachmentId =
                                attachment?.id ||
                                `${msg.id}-attachment-${attachmentIndex}`;
                              const name =
                                attachment?.name ||
                                (attachment?.kind === "image"
                                  ? "Imagen adjunta"
                                  : "Archivo adjunto");
                              const renderAsImage =
                                (attachment?.kind === "image" ||
                                  isImageMime(attachment?.mimeType)) &&
                                hasUrl;
                              const cardBorder = `1px solid ${borderColor}`;
                              const commonShadow =
                                "0 10px 25px rgba(0,0,0,0.28)";

                              if (renderAsImage) {
                                const imageContent = (
                                  <div
                                    style={{
                                      position: "relative",
                                      width: 160,
                                      height: 160,
                                      borderRadius: 14,
                                      overflow: "hidden",
                                      border: cardBorder,
                                      background: "rgba(255,255,255,0.04)",
                                      boxShadow: commonShadow,
                                    }}
                                  >
                                    <img
                                      src={attachment.url}
                                      alt="Imagen adjunta"
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                      }}
                                    />
                                  </div>
                                );
                                return hasUrl ? (
                                  <a
                                    key={attachmentId}
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ textDecoration: "none" }}
                                  >
                                    {imageContent}
                                  </a>
                                ) : (
                                  <div key={attachmentId}>{imageContent}</div>
                                );
                              }

                              const fileLabel = "Documento PDF";
                              const fileCard = (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "10px 12px",
                                    borderRadius: 12,
                                    border: cardBorder,
                                    background: "rgba(255,255,255,0.04)",
                                    color: palette.text,
                                    boxShadow: commonShadow,
                                    minWidth: 0,
                                    width: "fit-content",
                                    maxWidth: "100%",
                                  }}
                                >
                                  <FiFileText
                                    aria-hidden="true"
                                    style={{ fontSize: 18 }}
                                  />
                                  <div
                                    style={{
                                      flex: 1,
                                      fontSize: 13,
                                      fontWeight: 700,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                    title={fileLabel}
                                  >
                                    {fileLabel}
                                  </div>
                                </div>
                              );
                              return hasUrl ? (
                                <a
                                  key={attachmentId}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ textDecoration: "none" }}
                                >
                                  {fileCard}
                                </a>
                              ) : (
                                <div key={attachmentId}>{fileCard}</div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    {!isUser && shouldRenderText && (
                      <div style={{ marginTop: 8, display: "flex" }}>
                        <button
                          type="button"
                            onClick={() => {
                              if (navigator?.clipboard?.writeText) {
                                navigator.clipboard
                                  .writeText(textToRender)
                                  .then(() => setCopiedMessageId(msg.id))
                                  .catch(() => setCopiedMessageId(msg.id));
                              } else {
                                setCopiedMessageId(msg.id);
                              }
                            }}
                            style={{
                              border: `1px solid ${copyBadgeBorder}`,
                              background: copyBadgeBg,
                              color: copyBadgeColor,
                              fontSize: 12,
                              fontWeight: 700,
                              padding: "0 10px",
                              borderRadius: 999,
                              cursor: "pointer",
                              boxShadow: isLight
                                ? "0 8px 18px rgba(0,0,0,0.12)"
                                : "0 10px 22px rgba(0,0,0,0.25)",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              minWidth: 36,
                              height: 32,
                              transition: "transform 0.08s ease, box-shadow 0.15s ease",
                            }}
                            aria-label="Copiar mensaje"
                          >
                            <FiCopy
                              aria-hidden="true"
                              style={{
                                fontSize: 16,
                                color: copiedMessageId === msg.id ? palette.accent : copyBadgeColor,
                                transition: "color 0.15s ease",
                              }}
                            />
                          </button>
                      </div>
                    )}
                  </div>
                );
              })}
                  <div ref={messagesEndRef} />
                </>
            </div>

              {showTopFade && (
                <div className="chat-scroll-fade chat-scroll-fade--top" />
              )}
              {showBottomFade && (
                <div className="chat-scroll-fade chat-scroll-fade--bottom" />
              )}
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
                  color: heroTitleColor,
                }}
              >
                ¿En qué puedo ayudar?
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: heroSubtitleColor,
                  maxWidth: 620,
                  margin: "0 auto",
                  lineHeight: 1.2,
                }}
              >
                Cuéntame qué necesitas y te ayudo al instante:<br />ideas, textos,
                resúmenes y respuestas claras a tus dudas.
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
                    background: promptCardBg,
                    border: `1px solid ${promptCardBorder}`,
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    boxShadow: isLight ? "0 12px 30px rgba(0,0,0,0.18)" : "0 15px 40px rgba(0,0,0,0.25)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: 1.2,
                      color: promptTitleColor,
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: promptTextColor,
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
        ref={inputContainerRef}
        style={{
          position: "relative",
          zIndex: 5,
          width: "100%",
          maxWidth: 880,
          margin: inputContainerMargin,
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {(imagePreviews.length > 0 || filePreviews.length > 0) && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 12,
            }}
          >
            {imagePreviews.map((item) => (
              <div
                key={item.id}
                style={{
                  position: "relative",
                  width: 86,
                  height: 86,
                  borderRadius: 14,
                  overflow: "hidden",
                  border: `1px solid ${palette.border}`,
                  background: "rgba(255,255,255,0.04)",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.28)",
                }}
              >
                <img
                  src={item.url}
                  alt={item.name || "imagen seleccionada"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(item.id)}
                  aria-label="Eliminar imagen"
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 24,
                    height: 24,
                    minWidth: 24,
                    minHeight: 24,
                    aspectRatio: "1 / 1",
                    borderRadius: "50%",
                    border: `1px solid ${palette.border}`,
                    background: "rgba(3,23,24,0.92)",
                    color: palette.text,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    appearance: "none",
                    WebkitAppearance: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
                    lineHeight: 1,
                  }}
                >
                  <FiX aria-hidden="true" style={{ fontSize: 13, strokeWidth: 3 }} />
                </button>
              </div>
            ))}
            {filePreviews.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: `1px solid ${palette.border}`,
                  background: "rgba(255,255,255,0.04)",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.28)",
                  color: palette.text,
                  maxWidth: 240,
                }}
              >
                <FiFileText aria-hidden="true" style={{ fontSize: 18 }} />
                <div
                  style={{
                    flex: 1,
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={item.name}
                >
                  {item.name || "Archivo PDF"}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(item.id)}
                  aria-label="Eliminar archivo"
                  style={{
                    width: 24,
                    height: 24,
                    minWidth: 24,
                    minHeight: 24,
                    aspectRatio: "1 / 1",
                    borderRadius: "50%",
                    border: `1px solid ${palette.border}`,
                    background: "rgba(3,23,24,0.92)",
                    color: palette.text,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                    appearance: "none",
                    WebkitAppearance: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  <FiX aria-hidden="true" style={{ fontSize: 13, strokeWidth: 3 }} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div
          style={{
            borderRadius: 28,
            border: `1px solid ${inputBorder}`,
            background: inputBackground,
            boxShadow: inputShadow,
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            ref={plusMenuWrapperRef}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <input
              type="file"
              ref={imageInputRef}
              accept="image/jpeg"
              multiple
              onChange={handleImagesSelected}
              style={{ display: "none" }}
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf"
              multiple
              onChange={handleFilesSelected}
              style={{ display: "none" }}
            />
            <button
              type="button"
              aria-label="abrir opciones"
              onClick={() => setIsPlusMenuOpen((value) => !value)}
              disabled={isThinking}
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                border: "none",
                aspectRatio: "1 / 1",
                padding: 0,
                background: plusButtonBg,
                color: plusButtonColor,
                fontWeight: 700,
                fontSize: 20,
                lineHeight: 1,
                cursor: isThinking ? "not-allowed" : "pointer",
                opacity: isThinking ? 0.5 : 1,
                boxShadow: isLight
                  ? "0 10px 24px rgba(11,43,43,0.25)"
                  : "0 10px 25px rgba(210,242,82,0.35)",
                transition: "opacity 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              +
            </button>
            {isPlusMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: "calc(100% + 10px)",
                  minWidth: 200,
                  padding: 8,
                  borderRadius: 12,
                  background: palette.surface || "rgba(3,23,24,0.85)",
                  border: `1px solid ${palette.border}`,
                  boxShadow: "0 16px 30px rgba(0,0,0,0.35)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  zIndex: 5,
                }}
              >
                <button
                  type="button"
                  onClick={handleAddImages}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 12px",
                    background: "transparent",
                    color: palette.text,
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "background 0.2s ease, color 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    whiteSpace: "nowrap",
                  }}
                >
                  <FiImage
                    aria-hidden="true"
                    style={{ fontSize: 16, color: palette.text }}
                  />
                  Añadir imágenes
                </button>
                <button
                  type="button"
                  onClick={handleAddFiles}
                  style={{
                    width: "100%",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 12px",
                    background: "transparent",
                    color: palette.text,
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "background 0.2s ease, color 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    whiteSpace: "nowrap",
                  }}
                >
                  <FiFilePlus
                    aria-hidden="true"
                    style={{ fontSize: 16, color: palette.text }}
                  />
                  Añadir archivos
                </button>
              </div>
            )}
          </div>
          <textarea
            className="chat-input"
            placeholder="Pregunta lo que quieras"
            style={{
              "--chat-placeholder-color": chatPlaceholder,
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
              aspectRatio: "1 / 1",
              padding: 0,
            background: sendButtonBg,
            color: sendButtonColor,
            fontWeight: 700,
            fontSize: 14,
            cursor:
              !inputValue.trim() || isThinking ? "not-allowed" : "pointer",
            opacity: !inputValue.trim() || isThinking ? 0.5 : 1,
            boxShadow: isLight
              ? "0 10px 24px rgba(11,43,43,0.25)"
              : "0 10px 25px rgba(210,242,82,0.35)",
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
