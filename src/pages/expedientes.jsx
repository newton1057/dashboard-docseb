import { useState, useEffect, useMemo } from "react";
import Skeleton from "../components/Skeleton";

const RECORDS_ENDPOINT = "https://demo-get-medicalrecords-json-448238488830.northamerica-south1.run.app";

function EyeIcon({ size = 18, color = "currentColor" }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" style={{ display: "block" }}>
            <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-2.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill={color} />
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

export default function ExpedientesMain({ palette }) {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [detailsModal, setDetailsModal] = useState(null);
    const [openRowMenu, setOpenRowMenu] = useState(null);

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
                        color: palette.text,
                        fontSize: 13,
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
                    background: "rgba(3,23,24,0.30)",
                    boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
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
                                        <td style={tdStyle()}><Skeleton height={20} borderRadius={4} /></td>
                                        <td style={tdStyle()}><Skeleton height={20} borderRadius={4} /></td>
                                        <td style={tdStyle()}><Skeleton height={20} borderRadius={4} /></td>
                                        <td style={tdStyle()}><Skeleton height={20} borderRadius={4} /></td>
                                        <td style={tdStyle()}><Skeleton height={20} borderRadius={4} /></td>
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
                                            background: idx % 2 === 0 ? "rgba(3,23,24,0.20)" : "rgba(3,23,24,0.30)",
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
                                                        color: palette.textMuted,
                                                        padding: 0,
                                                        display: "grid",
                                                        placeItems: "center",
                                                    }}
                                                >
                                                    <DotsIcon color={palette.accent} />
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
                        background: "rgba(3,23,24,0.95)",
                        boxShadow: "0 24px 50px rgba(0,0,0,0.45)",
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
                </div>
            )}

            {/* Details Modal */}
            {detailsModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(4px)",
                        display: "grid",
                        placeItems: "center",
                        zIndex: 10000,
                        padding: 24,
                    }}
                >
                    <div
                        style={{
                            background: palette.bg1,
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
                                background: "linear-gradient(180deg, rgba(3,23,24,0.65), rgba(3,23,24,0.35))",
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
                                    background: "rgba(3,23,24,0.65)",
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
