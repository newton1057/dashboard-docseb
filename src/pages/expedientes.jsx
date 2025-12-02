import { useState, useEffect, useMemo } from "react";
import { jsPDF } from "jspdf";
import Skeleton from "../components/Skeleton";

const RECORDS_ENDPOINT = "https://demo-get-medicalrecords-json-448238488830.northamerica-south1.run.app";

function EyeIcon({ size = 18, color = "currentColor" }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ display: "block" }}>
            <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-2.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill={color} />
        </svg>
    );
}

function PrintIcon({ size = 18, color = "currentColor" }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ display: "block" }}>
            <path
                d="M7 6h10V4.5A1.5 1.5 0 0 0 15.5 3h-7A1.5 1.5 0 0 0 7 4.5V6ZM7 17.5A1.5 1.5 0 0 0 8.5 19h7a1.5 1.5 0 0 0 1.5-1.5V14H7v3.5ZM6 8.5A1.5 1.5 0 0 0 4.5 10v4A1.5 1.5 0 0 0 6 15.5h1.5V13h9v2.5H18A1.5 1.5 0 0 0 19.5 14v-4A1.5 1.5 0 0 0 18 8.5H6Zm0-1h12A2.5 2.5 0 0 1 20.5 10v4A2.5 2.5 0 0 1 18 16.5h-.5V19a2.5 2.5 0 0 1-2.5 2.5h-7A2.5 2.5 0 0 1 5.5 19v-2.5H6A2.5 2.5 0 0 1 3.5 14v-4A2.5 2.5 0 0 1 6 7.5Z"
                fill={color}
            />
            <circle cx="17" cy="11" r="1" fill={color} />
        </svg>
    );
}

function DotsIcon({ size = 18, color = "currentColor" }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ display: "block" }}>
            <circle cx="6" cy="12" r="1.6" fill={color} />
            <circle cx="12" cy="12" r="1.6" fill={color} />
            <circle cx="18" cy="12" r="1.6" fill={color} />
        </svg>
    );
}

function XIcon({ size = 18, color = "currentColor" }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ display: "block" }}>
            <path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3 1.4 1.4Z" fill={color} />
        </svg>
    );
}

const getLatestEncounterReason = (encounters) => {
    if (!Array.isArray(encounters) || encounters.length === 0) return "—";

    const getTimestamp = (encounter) => {
        const raw = encounter?.period?.start || encounter?.period?.end || "";
        const parsed = Date.parse(raw);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const sorted = [...encounters].sort((a, b) => getTimestamp(b) - getTimestamp(a));

    for (const encounter of sorted) {
        const reasonText =
            typeof encounter?.reason?.reason_text === "string"
                ? encounter.reason.reason_text.trim()
                : "";
        if (reasonText) return reasonText;

        const codes = Array.isArray(encounter?.reason?.reason_codes)
            ? encounter.reason.reason_codes
            : [];
        const codeDisplay = codes.find(
            (code) => typeof code?.display === "string" && code.display.trim(),
        );
        if (codeDisplay?.display) return codeDisplay.display.trim();
    }

    return "—";
};

const getPatientName = (patient) => {
    if (!patient?.name) return "Paciente sin nombre";
    const given = Array.isArray(patient.name.given) ? patient.name.given.join(" ") : "";
    const family = patient.name.family || "";
    const full = `${given} ${family}`.trim();
    return full || "Paciente sin nombre";
};

const formatDate = (value) => {
    if (!value) return "—";
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) return value;
    return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
};

const formatPhone = (telecom) => {
    if (!Array.isArray(telecom)) return "—";
    const phone = telecom.find((item) => item?.system === "phone" && item?.value)?.value;
    return phone || "—";
};

const formatEmergencyContacts = (contacts) => {
    if (!Array.isArray(contacts) || contacts.length === 0) return ["Sin contactos de emergencia"];
    return contacts.map((contact) => {
        const name = contact?.name || "Contacto sin nombre";
        const relationship = contact?.relationship ? `(${contact.relationship})` : "";
        const phone = contact?.telecom?.[0]?.value ? ` • ${contact.telecom[0].value}` : "";
        return `${name} ${relationship}${phone}`.trim();
    });
};

export default function ExpedientesMain({ palette, appearance = "Oscuro" }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [detailsModal, setDetailsModal] = useState(null);
    const [openRowMenu, setOpenRowMenu] = useState(null);
    const isLight = appearance === "Claro";
    const tableBackground = isLight ? "rgba(255,255,255,0.85)" : "rgba(3,23,24,0.30)";
    const rowBgEven = isLight ? "rgba(14,36,27,0.08)" : "rgba(3,23,24,0.20)";
    const rowBgOdd = isLight ? "rgba(14,36,27,0.14)" : "rgba(3,23,24,0.30)";
    const rowMenuBackground = isLight ? "rgba(255,255,255,0.98)" : "rgba(3,23,24,0.95)";
    const rowMenuShadow = isLight ? "0 16px 40px rgba(0,0,0,0.22)" : "0 24px 50px rgba(0,0,0,0.45)";
    const searchBackground = isLight ? "rgba(255,255,255,0.92)" : "rgba(3,23,24,0.65)";
    const searchBorder = isLight ? "rgba(14,36,27,0.18)" : palette.border;
    const searchPlaceholder = isLight ? "#0b2b2b" : "rgba(210, 242, 82, 0.5)";
    const skeletonBackground = isLight ? "rgba(14,36,27,0.12)" : "rgba(255,255,255,0.1)";
    const overlayBackground = isLight ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.6)";
    const modalBackground = isLight ? "rgba(255,255,255,0.96)" : palette.bg1;
    const modalHeaderBackground = isLight
        ? "linear-gradient(180deg, rgba(14,36,27,0.08), rgba(14,36,27,0.04))"
        : "linear-gradient(180deg, rgba(3,23,24,0.65), rgba(3,23,24,0.35))";
    const modalCloseBackground = isLight ? "rgba(14,36,27,0.08)" : "rgba(3,23,24,0.65)";

    useEffect(() => {
        let active = true;

        const fetchRecords = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(RECORDS_ENDPOINT);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const data = await response.json();
                if (!active) return;
                if (!data?.ok) {
                    throw new Error("La API respondió sin ok");
                }

                const records = Array.isArray(data.records) ? data.records : [];
                setRows(records);
            } catch (err) {
                if (!active) return;
                console.error("Error al cargar expedientes", err);
                setError("No se pudieron cargar los expedientes.");
                setRows([]);
            } finally {
                if (active) setLoading(false);
            }
        };

        fetchRecords();

        return () => {
            active = false;
        };
    }, []);

    // Close menu on click outside
    useEffect(() => {
        if (!openRowMenu) return undefined;
        const doc = typeof document !== "undefined" ? document : null;
        const win = typeof window !== "undefined" ? window : null;
        if (!doc || !win) return undefined;

        const handleClickOutside = (event) => {
            const isTrigger = event.target.closest?.('[data-row-menu-trigger="true"]');
            const isPanel = event.target.closest?.('[data-row-menu-panel="true"]');
            if (!isTrigger && !isPanel) {
                setOpenRowMenu(null);
            }
        };
        const handleCloseOnMove = () => setOpenRowMenu(null);

        doc.addEventListener("mousedown", handleClickOutside);
        win.addEventListener("resize", handleCloseOnMove);
        win.addEventListener("scroll", handleCloseOnMove, true);

        return () => {
            doc.removeEventListener("mousedown", handleClickOutside);
            win.removeEventListener("resize", handleCloseOnMove);
            win.removeEventListener("scroll", handleCloseOnMove, true);
        };
    }, [openRowMenu]);

    const filteredRows = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return rows;
        return rows.filter((row) => {
            const name = row.patient?.name ? `${row.patient.name.given.join(" ")} ${row.patient.name.family}`.toLowerCase() : "";
            return name.includes(term);
        });
    }, [rows, searchTerm]);

    const toggleRowActionsMenu = (row, target) => {
        if (!target) return;
        setOpenRowMenu((prev) => {
            if (prev?.rowId === row.id) return null;
            const rect = target.getBoundingClientRect();
            const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 0;
            const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 0;

            return {
                rowId: row.id,
                rowData: row,
                anchorRect: {
                    top: rect.top,
                    bottom: rect.bottom,
                    left: rect.left,
                    right: rect.right,
                    width: rect.width,
                    height: rect.height,
                },
                viewport: {
                    width: viewportWidth,
                    height: viewportHeight,
                },
            };
        });
    };

    const rowMenuPosition = openRowMenu
        ? (() => {
            const width = 160;
            const gutter = 12;
            const viewportWidth =
                openRowMenu.viewport?.width ??
                (typeof window !== "undefined" ? window.innerWidth : 0);
            const viewportHeight =
                openRowMenu.viewport?.height ??
                (typeof window !== "undefined" ? window.innerHeight : 0);
            const safeViewportWidth = viewportWidth || width + gutter * 2;
            const safeViewportHeight =
                viewportHeight || openRowMenu.anchorRect.bottom + 8 + 60;
            const desiredLeft = openRowMenu.anchorRect.right - width;
            const left = Math.max(
                gutter,
                Math.min(safeViewportWidth - gutter - width, desiredLeft),
            );
            const desiredTop = openRowMenu.anchorRect.bottom + 8;
            const top = Math.max(
                gutter,
                Math.min(safeViewportHeight - gutter - 10, desiredTop),
            );
            return { left, top, width };
        })()
        : null;

    const handlePrintRecord = (record) => {
  if (!record) return;

  const accentHex = palette?.accent || "#D2F252";
  const textMain = "#9fb7ae";
  const textMuted = "#6f8a84";
  const dataColor = "#031718";
  const surfaceDark = "#031718";

  const hexToRgb = (hex) => {
    const sanitized = String(hex || "").replace("#", "");
    const expanded =
      sanitized.length === 3
        ? sanitized
            .split("")
            .map((c) => c + c)
            .join("")
        : sanitized;

    const r = parseInt(expanded.slice(0, 2), 16);
    const g = parseInt(expanded.slice(2, 4), 16);
    const b = parseInt(expanded.slice(4, 6), 16);
    return { r, g, b };
  };

  const mixHex = (hexA, hexB, t = 0.5) => {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
    const r = clamp(a.r + (b.r - a.r) * t);
    const g = clamp(a.g + (b.g - a.g) * t);
    const b2 = clamp(a.b + (b.b - a.b) * t);
    return (
      "#" +
      [r, g, b2]
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase()
    );
  };

  const setFillHex = (doc, hex) => {
    const { r, g, b } = hexToRgb(hex);
    doc.setFillColor(r, g, b);
  };

  const setDrawHex = (doc, hex) => {
    const { r, g, b } = hexToRgb(hex);
    doc.setDrawColor(r, g, b);
  };

  const normalizeGender = (g) => {
    const v = String(g || "").toLowerCase().trim();
    if (v === "male" || v === "m" || v === "masculino") return "Masculino";
    if (v === "female" || v === "f" || v === "femenino") return "Femenino";
    if (!v) return "—";
    return v.charAt(0).toUpperCase() + v.slice(1);
  };

  const normalizeStatus = (s) => {
    const v = String(s || "").toLowerCase().trim();
    if (!v) return "—";
    const map = {
      active: "Activo",
      inactive: "Inactivo",
      resolved: "Resuelto",
      remission: "Remisión",
      completed: "Completado",
      stopped: "Suspendido",
    };
    return map[v] || (v.charAt(0).toUpperCase() + v.slice(1));
  };

  const doc = new jsPDF();

  const L = {
    mx: 16,
    footerH: 16,

    headerFullH: 40,
    headerCompactH: 22,

    radius: 4,
    cardPadX: 10,
    cardPadY: 8,
    gap: 7,
    sectionGap: 12,
    accentBarW: 3,
  };

  const T = {
    h1: 16,
    h2: 12,
    h3: 10.5,
    label: 8.6,
    body: 10,
    bodySm: 9,
  };

  const LH = {
    sm: 4.4,
    md: 5.2,
  };

  const accentRgb = hexToRgb(accentHex);
  const headerRgb = hexToRgb(surfaceDark);

  const cardBg = mixHex(surfaceDark, "#FFFFFF", 0.94);
  const cardStroke = mixHex(surfaceDark, "#FFFFFF", 0.82);
  const divider = mixHex(surfaceDark, "#FFFFFF", 0.78);

  let pageWidth = doc.internal.pageSize.getWidth();
  let pageHeight = doc.internal.pageSize.getHeight();

  let pageNumber = 1;
  let currentHeaderMode = "full"; // "full" | "compact"
  let y = 52; // se recalcula por header

  const refreshDimensions = () => {
    pageWidth = doc.internal.pageSize.getWidth();
    pageHeight = doc.internal.pageSize.getHeight();
  };

  const contentWidth = () => pageWidth - L.mx * 2;

  const getStartYByHeaderMode = (mode) => (mode === "compact" ? 34 : 52);

  const drawCard = (x, y0, w, h, { accentLeft = true } = {}) => {
    setFillHex(doc, cardBg);
    setDrawHex(doc, cardStroke);
    doc.setLineWidth(0.35);
    doc.roundedRect(x, y0, w, h, L.radius, L.radius, "FD");

    if (accentLeft) {
      setFillHex(doc, accentHex);
      doc.rect(x, y0, L.accentBarW, h, "F");
    }
  };

  const drawPill = (text, xRight, yTop, { paddingX = 3, h = 6.5 } = {}) => {
    const label = String(text || "");
    if (!label || label === "—") return;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.6);
    const w = doc.getTextWidth(label) + paddingX * 2;

    setDrawHex(doc, mixHex(accentHex, "#FFFFFF", 0.18));
    doc.setLineWidth(0.35);
    doc.roundedRect(xRight - w, yTop, w, h, 2.2, 2.2, "S");

    doc.setTextColor(textMuted);
    doc.text(label, xRight - w + paddingX, yTop + 4.9);
  };

  const splitWithNewlines = (text, width) => {
    const raw = String(text || "").split("\n");
    const out = [];
    raw.forEach((p) => {
      const t = String(p || "").trim();
      if (!t) return;
      const lines = doc.splitTextToSize(t, width);
      lines.forEach((ln) => out.push(String(ln)));
    });
    return out.length ? out : ["—"];
  };

  const addFooter = () => {
    const patientName = getPatientName(record.patient);
    const patientId = record?.patient?.patient_id || "—";
    const left = `${patientName} · ${patientId}`;

    setDrawHex(doc, mixHex(accentHex, "#FFFFFF", 0.2));
    doc.setLineWidth(0.45);
    doc.line(L.mx, pageHeight - L.footerH, pageWidth - L.mx, pageHeight - L.footerH);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.8);
    doc.setTextColor(textMuted);
    doc.text(left, L.mx, pageHeight - 8.5);

    doc.setFontSize(9);
    doc.text(`Página ${pageNumber}`, pageWidth - L.mx, pageHeight - 8.5, { align: "right" });
  };

  const addHeader = (mode = "full") => {
    currentHeaderMode = mode;

    const patientName = getPatientName(record.patient);
    const patientId = record?.patient?.patient_id || "—";
    const generatedDate = new Date().toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const H = mode === "compact" ? L.headerCompactH : L.headerFullH;

    doc.setFillColor(headerRgb.r, headerRgb.g, headerRgb.b);
    doc.rect(0, 0, pageWidth, H, "F");

    doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.rect(0, H, pageWidth, 2, "F");

    if (mode === "full") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(T.h1);
      doc.setTextColor(accentHex);
      doc.text("Expediente médico", L.mx, 18);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(textMain);
      doc.text(patientName, L.mx, 28);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(textMuted);
      doc.text(`Generado el ${generatedDate}`, pageWidth - L.mx, 20, { align: "right" });

      const chipText = `ID: ${patientId}`;
      doc.setFontSize(9);
      const chipPadX = 3;
      const chipH = 6.5;
      const chipW = doc.getTextWidth(chipText) + chipPadX * 2;
      const chipX = L.mx;
      const chipY = 31;

      setDrawHex(doc, mixHex(accentHex, "#FFFFFF", 0.15));
      doc.setLineWidth(0.35);
      doc.roundedRect(chipX, chipY, chipW, chipH, 2.2, 2.2, "S");
      doc.setTextColor(textMuted);
      doc.text(chipText, chipX + chipPadX, chipY + 4.9);
    } else {
      // header compacto (páginas 2+)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.8);
      doc.setTextColor(textMain);
      doc.text(patientName, L.mx, 14);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(textMuted);
      doc.text(`ID: ${patientId}`, L.mx, 19);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(textMuted);
      doc.text(`Generado el ${generatedDate}`, pageWidth - L.mx, 14, { align: "right" });
    }

    y = getStartYByHeaderMode(mode);
  };

  const ensureSpace = (heightNeeded) => {
    const bottomLimit = pageHeight - (L.footerH + 6);
    if (y + heightNeeded > bottomLimit) {
      addFooter();
      doc.addPage();
      refreshDimensions();
      pageNumber += 1;
      addHeader("compact");
    }
  };

  const addSectionTitle = (title, subtitle) => {
    // Widow control: título + mínimo 1 card (aprox) deben caber
    const titleBlockH = 20;
    const minNext = 28;
    if (y > getStartYByHeaderMode(currentHeaderMode)) y += L.sectionGap;
    ensureSpace(titleBlockH + minNext);

    setFillHex(doc, accentHex);
    doc.rect(L.mx, y - 4.5, L.accentBarW, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(T.h2);
    doc.setTextColor(dataColor);
    doc.text(String(title || "").toUpperCase(), L.mx + L.accentBarW + 4, y);

    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(textMuted);
      doc.text(subtitle, L.mx + L.accentBarW + 4, y + 5);
      y += 11;
    } else {
      y += 8.5;
    }

    setDrawHex(doc, divider);
    doc.setLineWidth(0.25);
    doc.line(L.mx, y, pageWidth - L.mx, y);
    y += 6;
  };

  const addFieldCard = (label, value) => {
    const safeLabel = String(label || "");
    const safeValue = value ? String(value) : "—";

    const innerW = contentWidth() - L.cardPadX * 2 - L.accentBarW;
    const valueLines = splitWithNewlines(safeValue, innerW);

    const h =
      L.cardPadY +
      LH.sm +
      1.5 +
      valueLines.length * LH.md +
      L.cardPadY;

    ensureSpace(h + L.gap);
    drawCard(L.mx, y, contentWidth(), h, { accentLeft: true });

    const textX = L.mx + L.accentBarW + L.cardPadX;
    const labelY = y + L.cardPadY + LH.sm;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(T.label);
    doc.setTextColor(textMuted);
    doc.text(safeLabel, textX, labelY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(T.body);
    doc.setTextColor(dataColor);
    doc.text(valueLines, textX, labelY + 5.2);

    y += h + L.gap;
  };

  const addGridCard = (pairs, columns = 2) => {
    const cleanPairs = Array.isArray(pairs) ? pairs.filter((p) => p && p.label) : [];
    if (!cleanPairs.length) return;

    const w = contentWidth();
    const x0 = L.mx;

    const innerX = x0 + L.accentBarW + L.cardPadX;
    const innerW = w - L.accentBarW - L.cardPadX * 2;

    const colGap = 8;
    const colW = (innerW - colGap * (columns - 1)) / columns;

    const rows = [];
    for (let i = 0; i < cleanPairs.length; i += columns) {
      const row = cleanPairs.slice(i, i + columns);
      const measured = row.map((cell) => {
        const v = cell.value ? String(cell.value) : "—";
        const vLines = splitWithNewlines(v, colW);
        const cellH = LH.sm + 1.5 + vLines.length * LH.md;
        return { ...cell, vLines, cellH };
      });
      rows.push({ cells: measured, rowH: Math.max(...measured.map((m) => m.cellH)) });
    }

    const h =
      L.cardPadY +
      rows.reduce((sum, r) => sum + r.rowH, 0) +
      (rows.length - 1) * 4 +
      L.cardPadY;

    ensureSpace(h + L.gap);
    drawCard(x0, y, w, h, { accentLeft: true });

    let cy = y + L.cardPadY;

    rows.forEach((r) => {
      r.cells.forEach((cell, idx) => {
        const cx = innerX + idx * (colW + colGap);
        const labelY = cy + LH.sm;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(T.label);
        doc.setTextColor(textMuted);
        doc.text(String(cell.label), cx, labelY);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(T.bodySm);
        doc.setTextColor(dataColor);
        doc.text(cell.vLines, cx, labelY + 5.2);
      });

      cy += r.rowH + 4;
    });

    y += h + L.gap;
  };

  const addListItemCard = ({ title, metaRight, lines = [] }) => {
    const safeTitle = String(title || "Detalle");
    const w = contentWidth();
    const x0 = L.mx;

    const innerX = x0 + L.accentBarW + L.cardPadX;
    const innerW = w - L.accentBarW - L.cardPadX * 2;

    // bullets
    const bulletIndent = 4;
    const bulletW = innerW - bulletIndent;
    const prepared = [];
    (Array.isArray(lines) ? lines : [String(lines || "—")]).forEach((ln) => {
      const wraps = splitWithNewlines(String(ln || "").trim(), bulletW);
      wraps.forEach((wln, i) => {
        prepared.push({ text: wln, isFirst: i === 0 });
      });
    });

    const bodyLineCount = Math.max(1, prepared.length);
    const h =
      L.cardPadY +
      LH.md + // title line
      3 +
      bodyLineCount * LH.md +
      L.cardPadY;

    ensureSpace(h + L.gap);
    drawCard(x0, y, w, h, { accentLeft: true });

    const titleY = y + L.cardPadY + LH.md;

    // Title left
    doc.setFont("helvetica", "bold");
    doc.setFontSize(T.h3);
    doc.setTextColor(dataColor);
    doc.text(safeTitle, innerX, titleY);

    // Meta pill right (status / fecha)
    drawPill(metaRight, x0 + w - L.cardPadX, y + L.cardPadY - 0.5);

    // Body bullets
    doc.setFont("helvetica", "normal");
    doc.setFontSize(T.bodySm);
    doc.setTextColor(textMain);

    let by = titleY + 6.2;
    prepared.forEach((p) => {
      // bullet only for the first wrapped line of each bullet item
      if (p.isFirst) {
        doc.text("•", innerX, by);
        doc.text(p.text, innerX + bulletIndent, by);
      } else {
        doc.text(p.text, innerX + bulletIndent, by);
      }
      by += LH.md;
    });

    y += h + L.gap;
  };

  const addListCards = (items, emptyMessage = "Sin información") => {
    if (!items || items.length === 0) {
      addFieldCard("Sin datos", emptyMessage);
      return;
    }
    items.forEach((item) => {
      addListItemCard({
        title: item?.title || "Detalle",
        metaRight: item?.metaRight || "",
        lines: item?.lines || [item?.body || "—"],
      });
    });
  };

  // ========= Render =========
  addHeader("full");

  const patientName = getPatientName(record.patient);
  const doctorName = record.patient?.primary_care_provider?.name || "—";
  const mainReason = getLatestEncounterReason(record.prior_encounters);
  const mainDiagnosis = record.diagnoses?.[0]?.code?.display || "—";

  // Resumen
  addSectionTitle("Resumen", "Datos clave del expediente");
  addGridCard(
    [
      { label: "Paciente", value: patientName },
      { label: "Médico tratante", value: doctorName },
    ],
    2
  );
  addFieldCard("Motivo de consulta", mainReason);
  addFieldCard("Diagnóstico principal", mainDiagnosis);

  // Datos del paciente
  addSectionTitle("Datos del paciente", "Identificación y contacto");
  addGridCard(
    [
      { label: "ID de paciente", value: record.patient?.patient_id || "—" },
      { label: "Fecha de nacimiento", value: formatDate(record.patient?.birth_date) },
      { label: "Género", value: normalizeGender(record.patient?.gender) },
      { label: "Teléfono", value: formatPhone(record.patient?.telecom) },
    ],
    2
  );

  // Contactos de emergencia
  const emergencyContacts = formatEmergencyContacts(record.patient?.emergency_contact);
  addSectionTitle("Contacto de emergencia");
  addListCards(
    emergencyContacts.map((value, index) => ({
      title: `Contacto ${index + 1}`,
      metaRight: "",
      lines: splitWithNewlines(value, contentWidth() - 36),
    })),
    "No hay contactos de emergencia registrados."
  );

  // Diagnósticos
  const diagnosesList = Array.isArray(record.diagnoses) ? record.diagnoses : [];
  addSectionTitle("Diagnósticos activos");
  addListCards(
    diagnosesList.map((dx, index) => {
      const title = dx?.code?.display || `Diagnóstico ${index + 1}`;
      const status = normalizeStatus(dx?.clinical_status);
      const date = dx?.recorded_date ? formatDate(dx.recorded_date) : "";
      const metaRight = status && status !== "—" ? status : date;

      const lines = [
        dx?.recorded_date ? `Registrado: ${formatDate(dx.recorded_date)}` : null,
        dx?.clinical_status ? `Estado: ${normalizeStatus(dx.clinical_status)}` : null,
        dx?.notes ? `Notas: ${dx.notes}` : null,
      ].filter(Boolean);

      return { title, metaRight, lines: lines.length ? lines : ["—"] };
    }),
    "No hay diagnósticos activos registrados."
  );

  // Medicamentos
  const medications = Array.isArray(record.medications?.active) ? record.medications.active : [];
  addSectionTitle("Medicamentos");
  addListCards(
    medications.map((med, index) => {
      const title = med?.medication?.display || `Medicamento ${index + 1}`;
      const instr = med?.dosage_instructions?.[0]?.text || "";
      const status = normalizeStatus(med?.status);
      const metaRight = status && status !== "—" ? status : "";

      const lines = [
        instr ? `Indicaciones: ${instr}` : null,
        med?.authored_on ? `Prescrito: ${formatDate(med.authored_on)}` : null,
        med?.requester?.display ? `Indicado por: ${med.requester.display}` : null,
      ].filter(Boolean);

      return {
        title,
        metaRight,
        lines: lines.length ? lines : ["Sin instrucciones registradas."],
      };
    }),
    "No hay medicamentos activos registrados."
  );

  // Antecedentes (sub-cards)
  addSectionTitle("Antecedentes");

  const allergies = Array.isArray(record.antecedents?.allergies)
    ? record.antecedents.allergies.map((a) => {
        const manifestations = Array.isArray(a?.reaction?.[0]?.manifestation)
          ? a.reaction[0].manifestation.join(", ")
          : "";
        return `${a?.substance?.display || "Alergia"}${
          manifestations ? ` (${manifestations})` : ""
        }`;
      })
    : [];

  const surgical = Array.isArray(record.antecedents?.surgical_history)
    ? record.antecedents.surgical_history.map(
        (s) => `${s?.procedure || "Procedimiento"}${s?.date ? ` — ${formatDate(s.date)}` : ""}`
      )
    : [];

  const family = Array.isArray(record.antecedents?.family_history)
    ? record.antecedents.family_history.map(
        (f) => `${f?.relative || "Familiar"}: ${f?.condition || "—"}`
      )
    : [];

  const anyAntecedents = allergies.length || surgical.length || family.length;

  if (!anyAntecedents) {
    addFieldCard("Resumen de antecedentes", "No se registran antecedentes.");
  } else {
    if (allergies.length) {
      addListItemCard({
        title: "Alergias",
        metaRight: `${allergies.length}`,
        lines: allergies,
      });
    }
    if (surgical.length) {
      addListItemCard({
        title: "Antecedentes quirúrgicos",
        metaRight: `${surgical.length}`,
        lines: surgical,
      });
    }
    if (family.length) {
      addListItemCard({
        title: "Antecedentes familiares",
        metaRight: `${family.length}`,
        lines: family,
      });
    }
  }

  addFooter();

  const normalizedName = patientName.replace(/\s+/g, "_").toLowerCase();
  doc.save(`expediente-${normalizedName || record.id || "paciente"}.pdf`);
};



    // Styles
    const thStyle = (textAlign = "left") => ({
        position: "sticky",
        top: 0,
        zIndex: 1,
        padding: "12px 14px",
        textAlign,
        fontSize: 12,
        fontWeight: 800,
        color: palette.ink,
        background: palette.accent,
        borderBottom: `1px solid ${palette.border}`,
        borderRight: `1px solid ${palette.border}`,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    });

    const tdStyle = (textAlign = "left") => ({
        padding: "10px 14px",
        color: palette.text,
        borderRight: `1px solid ${palette.border}`,
        whiteSpace: "nowrap",
        fontSize: 13,
        textAlign,
        verticalAlign: "middle",
        overflow: "hidden",
        textOverflow: "ellipsis",
    });

    const TRUNCATE_STYLE = {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    };

    return (
        <main
            style={{
                padding: "24px 32px",
                display: "grid",
                gap: 18,
                alignContent: "start",
                justifyItems: "start",
                textAlign: "left",
                height: "100%",
                boxSizing: "border-box",
            }}
        >
            {/* Header */}
            <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <h1 style={{ fontSize: 24, margin: 0, fontWeight: 800, color: palette.text, textAlign: "left" }}>
                    Expedientes
                </h1>
                <input
                    type="search"
                    className="search-input"
                    placeholder="Buscar paciente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        width: 260,
                        padding: "10px 12px",
                        borderRadius: 10,
                        color: isLight ? "#0b2b2b" : palette.text,
                        fontSize: 13,
                        background: searchBackground,
                        border: `1px solid ${searchBorder}`,
                        boxShadow: isLight ? "0 12px 24px rgba(0,0,0,0.08)" : "none",
                        "--search-placeholder": searchPlaceholder,
                    }}
                />
            </div>

            {/* Table Container */}
            <div
                style={{
                    width: "100%",
                    border: `1px solid ${palette.border}`,
                    borderRadius: 12,
                    overflow: "hidden",
                    background: tableBackground,
                    boxShadow: isLight ? "0 18px 40px rgba(0,0,0,0.18)" : "0 18px 60px rgba(0,0,0,0.35)",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                <div style={{
                    flex: 1,
                    overflow: "auto",
                    maxHeight: "calc(100vh - 200px)",
                    scrollbarWidth: 'none', // Firefox
                    msOverflowStyle: 'none', // IE/Edge
                    WebkitOverflowScrolling: 'touch' // iOS smooth scrolling
                }}
                    className="hide-scrollbar"
                >
                    <table
                        style={{
                            width: "100%",
                            minWidth: "800px",
                            borderCollapse: "collapse",
                            tableLayout: "fixed",
                        }}
                    >
                        <colgroup>
                            <col style={{ width: "30%" }} />
                            <col style={{ width: "18%" }} />
                            <col style={{ width: "24%" }} />
                            <col style={{ width: "18%" }} />
                            <col style={{ width: "10%" }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th style={thStyle("left")}>Nombre del Paciente</th>
                                <th style={thStyle("left")}>Médico Tratante</th>
                                <th style={thStyle("left")}>Motivo de Consulta</th>
                                <th style={thStyle("left")}>Diagnóstico Principal</th>
                                <th style={thStyle("center")}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading &&
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`skeleton-${i}`} style={{ borderBottom: `1px solid ${palette.border}` }}>
                                        <td style={tdStyle()}><Skeleton height={20} borderRadius={4} style={{ backgroundColor: skeletonBackground }} /></td>
                                        <td style={tdStyle()}><Skeleton height={20} borderRadius={4} style={{ backgroundColor: skeletonBackground }} /></td>
                                        <td style={tdStyle()}><Skeleton height={20} borderRadius={4} style={{ backgroundColor: skeletonBackground }} /></td>
                                        <td style={tdStyle()}><Skeleton height={20} borderRadius={4} style={{ backgroundColor: skeletonBackground }} /></td>
                                        <td style={tdStyle()}><Skeleton height={20} borderRadius={4} style={{ backgroundColor: skeletonBackground }} /></td>
                                    </tr>
                                ))}

                            {!loading && error && (
                                <tr>
                                    <td colSpan={5} style={{ padding: 16, color: palette.danger, fontWeight: 700, textAlign: "center" }}>
                                        {error}
                                    </td>
                                </tr>
                            )}

                            {!loading && !error && filteredRows.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ padding: 16, color: palette.text, opacity: 0.8, fontStyle: "italic", textAlign: "center" }}>
                                        No se encontraron expedientes.
                                    </td>
                                </tr>
                            )}

                            {!loading && !error && filteredRows.map((row, idx) => {
                                const patientName = row.patient?.name ? `${row.patient.name.given.join(" ")} ${row.patient.name.family}` : "—";
                                const doctorName = row.patient?.primary_care_provider?.name || "—";
                                const reason = getLatestEncounterReason(row.prior_encounters);
                                const diagnosis = row.diagnoses?.[0]?.code?.display || "—";

                                return (
                                    <tr
                                        key={row.id}
                                        style={{
                                            background: idx % 2 === 0 ? rowBgEven : rowBgOdd,
                                            borderBottom: `1px solid ${palette.border}`,
                                        }}
                                    >
                                        <td style={tdStyle("left")}>
                                            <div style={TRUNCATE_STYLE}><strong>{patientName}</strong></div>
                                        </td>
                                        <td style={tdStyle("left")}>
                                            <div style={TRUNCATE_STYLE}>{doctorName}</div>
                                        </td>
                                        <td style={tdStyle("left")}>
                                            <div style={TRUNCATE_STYLE}>{reason}</div>
                                        </td>
                                        <td style={tdStyle("left")}>
                                            <div style={TRUNCATE_STYLE}>{diagnosis}</div>
                                        </td>
                                        <td style={tdStyle("center")}>
                                            <div style={{ display: "grid", placeItems: "center" }}>
                                                <button
                                                    data-row-menu-trigger="true"
                                                    onClick={(e) => toggleRowActionsMenu(row, e.currentTarget)}
                                                    style={{
                                                        background: "transparent",
                                                        border: "none",
                                                        cursor: "pointer",
                                                        color: isLight ? "#0b2b2b" : palette.textMuted,
                                                        padding: 0,
                                                        display: "grid",
                                                        placeItems: "center",
                                                    }}
                                                >
                                                    <DotsIcon color={isLight ? "#0b2b2b" : palette.accent} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Row Menu */}
            {openRowMenu && rowMenuPosition && (
                <div
                    data-row-menu-panel="true"
                    style={{
                        position: "fixed",
                        top: rowMenuPosition.top,
                        left: rowMenuPosition.left,
                        width: rowMenuPosition.width,
                        padding: 6,
                        borderRadius: 10,
                        border: `1px solid ${palette.border}`,
                        background: rowMenuBackground,
                        boxShadow: rowMenuShadow,
                        zIndex: 50,
                    }}
                >
                    <button
                        onClick={() => {
                            setDetailsModal(openRowMenu.rowData);
                            setOpenRowMenu(null);
                        }}
                        style={{
                            width: "100%",
                            border: "none",
                            background: "transparent",
                            color: palette.text,
                            textAlign: "left",
                            fontSize: 13,
                            fontWeight: 600,
                            padding: "8px 10px",
                            borderRadius: 8,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                        <EyeIcon size={16} /> Ver detalles
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            handlePrintRecord(openRowMenu.rowData);
                            setOpenRowMenu(null);
                        }}
                        style={{
                            width: "100%",
                            border: "none",
                            background: "transparent",
                            color: palette.text,
                            textAlign: "left",
                            fontSize: 13,
                            fontWeight: 600,
                            padding: "8px 10px",
                            borderRadius: 8,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                        <PrintIcon size={16} /> Imprimir
                    </button>
                </div>
            )}

            {/* Details Modal */}
            {detailsModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: overlayBackground,
                        backdropFilter: "blur(4px)",
                        display: "grid",
                        placeItems: "center",
                        zIndex: 10000,
                        padding: 24,
                    }}
                >
                    <div
                        style={{
                            background: modalBackground,
                            border: `1px solid ${palette.border}`,
                            borderRadius: 24,
                            width: "100%",
                            maxWidth: 800,
                            maxHeight: "90vh",
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: "0 30px 120px rgba(0,0,0,0.55)",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                padding: "14px 18px",
                                borderBottom: `1px solid ${palette.border}`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                background: modalHeaderBackground,
                            }}
                        >
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: palette.text }}>
                                Expediente Médico
                            </h3>
                            <button
                                onClick={() => setDetailsModal(null)}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    border: `1px solid ${palette.border}`,
                                    background: modalCloseBackground,
                                    color: palette.text,
                                    cursor: "pointer",
                                    display: "grid",
                                    placeItems: "center",
                                    padding: 0,
                                }}
                            >
                                <XIcon />
                            </button>
                        </div>
                        <div style={{ padding: 24, overflowY: "auto", flex: 1, color: palette.textMuted, fontSize: 14 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                                <div>
                                    <h4 style={{ color: palette.accent, marginTop: 0, fontWeight: 800 }}>Paciente</h4>
                                    <p><strong style={{ color: palette.text }}>Nombre:</strong> {detailsModal.patient?.name?.given.join(" ")} {detailsModal.patient?.name?.family}</p>
                                    <p><strong style={{ color: palette.text }}>ID:</strong> {detailsModal.patient?.patient_id}</p>
                                    <p><strong style={{ color: palette.text }}>Fecha Nacimiento:</strong> {detailsModal.patient?.birth_date}</p>
                                    <p><strong style={{ color: palette.text }}>Género:</strong> {detailsModal.patient?.gender}</p>
                                    <p><strong style={{ color: palette.text }}>Teléfono:</strong> {detailsModal.patient?.telecom?.find(t => t.system === 'phone')?.value || '—'}</p>
                                </div>
                                <div>
                                    <h4 style={{ color: palette.accent, marginTop: 0, fontWeight: 800 }}>Contacto de Emergencia</h4>
                                    {detailsModal.patient?.emergency_contact?.map((contact, i) => (
                                        <div key={i}>
                                            <p><strong style={{ color: palette.text }}>Nombre:</strong> {contact.name}</p>
                                            <p><strong style={{ color: palette.text }}>Relación:</strong> {contact.relationship}</p>
                                            <p><strong style={{ color: palette.text }}>Teléfono:</strong> {contact.telecom?.[0]?.value || '—'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <h4 style={{ color: palette.accent, fontWeight: 800 }}>Diagnósticos Activos</h4>
                                <ul style={{ paddingLeft: 20 }}>
                                    {detailsModal.diagnoses?.map((dx) => (
                                        <li key={dx.diagnosis_id} style={{ marginBottom: 8 }}>
                                            <strong style={{ color: palette.text }}>{dx.code?.display}</strong>
                                            <br />
                                            <span style={{ fontSize: 13 }}>Desde: {dx.recorded_date} | Estado: {dx.clinical_status}</span>
                                            <br />
                                            <span style={{ fontStyle: "italic" }}>{dx.notes}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <h4 style={{ color: palette.accent, fontWeight: 800 }}>Medicamentos Activos</h4>
                                <ul style={{ paddingLeft: 20 }}>
                                    {detailsModal.medications?.active?.map((med) => (
                                        <li key={med.medication_request_id} style={{ marginBottom: 8 }}>
                                            <strong style={{ color: palette.text }}>{med.medication?.display}</strong>
                                            <br />
                                            <span style={{ fontSize: 13 }}>{med.dosage_instructions?.[0]?.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h4 style={{ color: palette.accent, fontWeight: 800 }}>Antecedentes</h4>
                                <p><strong style={{ color: palette.text }}>Alergias:</strong> {detailsModal.antecedents?.allergies?.map(a => `${a.substance?.display} (${a.reaction?.[0]?.manifestation?.join(", ")})`).join("; ") || "Ninguna"}</p>
                                <p><strong style={{ color: palette.text }}>Quirúrgicos:</strong> {detailsModal.antecedents?.surgical_history?.map(s => `${s.procedure} (${s.date})`).join("; ") || "Ninguno"}</p>
                                <p><strong style={{ color: palette.text }}>Familiares:</strong> {detailsModal.antecedents?.family_history?.map(f => `${f.relative}: ${f.condition}`).join("; ") || "Ninguno"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
