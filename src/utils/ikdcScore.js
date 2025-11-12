// src/utils/ikdcScore.js
// Utilidad para calcular la puntuación final del IKDC.

export function computeIkdcScore(answers = {}, questions = []) {
  const scorable = questions.filter((q) => !q.excludeFromScore);
  const answeredScorable = scorable.filter((q) => answers[q.id] !== undefined);
  const isValid = answeredScorable.length >= 16; // mínimo 16/18 respondidas (≥90%)

  if (!isValid) {
    return { valid: false, score: 0, maxPossible: 0, answered: answeredScorable.length };
  }

  const sum = answeredScorable.reduce((acc, q) => acc + Number(answers[q.id] || 0), 0);

  const maxPossible = scorable.reduce((acc, q) => {
    if (q.type === "radio" && Array.isArray(q.options)) {
      const maxOpt = Math.max(...q.options.map((o) => o.value));
      return acc + maxOpt;
    }
    if (q.type === "scale10") {
      return acc + (q.max ?? 10);
    }
    return acc;
  }, 0);

  const score = (sum / maxPossible) * 100;
  return {
    valid: true,
    score: Math.round(score),
    maxPossible,
    answered: answeredScorable.length,
  };
}
