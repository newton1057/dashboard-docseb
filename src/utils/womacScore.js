// src/utils/womacScore.js
// Utilidades para puntuar WOMAC.

const MAX = { pain: 20, stiffness: 8, function: 68, total: 96 };

export function computeWomacScores(answers = {}, questions = []) {
  const scores = { pain: 0, stiffness: 0, function: 0 };
  let answered = 0;

  for (const q of questions) {
    const value = answers[q.id];
    if (typeof value === "number") {
      scores[q.section] += value;
      answered += 1;
    }
  }

  const total = scores.pain + scores.stiffness + scores.function;
  const normalized = {
    pain: Math.round((scores.pain / MAX.pain) * 100),
    stiffness: Math.round((scores.stiffness / MAX.stiffness) * 100),
    function: Math.round((scores.function / MAX.function) * 100),
    total: Math.round((total / MAX.total) * 100),
  };

  return {
    scores,
    normalized,
    total,
    maxTotal: MAX.total,
    answered,
    maxAnswered: questions.length,
  };
}

export function severityLabel(pct) {
  if (pct === 0) return { label: "Ninguno", color: "#16a34a" };
  if (pct <= 25) return { label: "Leve", color: "#22c55e" };
  if (pct <= 50) return { label: "Moderado", color: "#ca8a04" };
  if (pct <= 75) return { label: "Severo", color: "#ea580c" };
  return { label: "Muy severo", color: "#dc2626" };
}
