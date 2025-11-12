// src/utils/lysholmTegner.js
// Funciones utilitarias para Lysholm-Tegner.

export function computeLysholmScore(answers = {}, questions = []) {
  const answered = questions.filter((q) => answers[q.id] !== undefined);
  const sum = answered.reduce((acc, q) => acc + Number(answers[q.id] || 0), 0);
  return { score: sum, max: 100, answeredCount: answered.length };
}

export function interpretLysholm(score) {
  if (score >= 84) return { label: "Muy bueno / Bueno", color: "#16a34a" };
  if (score >= 65) return { label: "Regular", color: "#ca8a04" };
  return { label: "Malo", color: "#dc2626" };
}

export function findTegnerLabel(value, tegnerQuestion) {
  const opt = (tegnerQuestion?.options ?? []).find((o) => o.value === value);
  return opt?.label ?? "";
}
