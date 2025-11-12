// src/utils/koosScore.js
// Cálculo de subescalas KOOS normalizadas 0-100.

const SUBSCALE_MAX = {
  symptoms: 7,
  pain: 9,
  adl: 17,
  sport: 5,
  qol: 4,
};

export function computeKoosScores(answers = {}, questions = []) {
  const buckets = {
    symptoms: [],
    pain: [],
    adl: [],
    sport: [],
    qol: [],
  };

  for (const q of questions) {
    const val = answers[q.id];
    if (val === null || val === undefined || Number.isNaN(Number(val))) continue;
    const section = q.section;
    if (buckets[section]) buckets[section].push(Number(val));
  }

  const calc = (section) => {
    const answered = buckets[section].length;
    const required = Math.ceil((SUBSCALE_MAX[section] ?? answered) / 2);
    const valid = answered >= required && answered > 0;
    if (!valid) return { valid: false, score: null, answered };
    const sum = buckets[section].reduce((acc, cur) => acc + cur, 0);
    const denom = 4 * answered;
    const score = +(100 - (sum * 100) / denom).toFixed(1);
    return { valid: true, score, answered };
  };

  return {
    symptoms: calc("symptoms"),
    pain: calc("pain"),
    adl: calc("adl"),
    sport: calc("sport"),
    qol: calc("qol"),
  };
}
