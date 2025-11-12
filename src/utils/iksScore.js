// src/utils/iksScore.js
// Utilidades para calcular IKS Knee & Function Score.

export function pointsFromFlexion(flexDeg) {
  if (typeof flexDeg !== "number" || Number.isNaN(flexDeg)) return 0;
  if (flexDeg >= 125) return 25;
  const loss = Math.max(0, 125 - flexDeg);
  const steps = Math.floor(loss / 5);
  return Math.max(0, 25 - steps);
}

export function deductionFromFlexionContracture(deg) {
  if (!deg || deg <= 0) return 0;
  if (deg <= 10) return -2;
  if (deg <= 15) return -5;
  if (deg <= 20) return -10;
  return -15;
}

export function deductionFromActiveExtensionDeficit(deg) {
  if (!deg || deg <= 0) return 0;
  if (deg < 11) return -5;
  if (deg <= 20) return -10;
  return -15;
}

export function deductionFromAlignment({ degrees, other }) {
  if (other) return -20;
  if (degrees == null || Number.isNaN(Number(degrees))) return 0;
  const d = Number(degrees);
  if (d >= 5 && d <= 10) return 0;
  if (d >= 0 && d < 5) return -3 * (5 - d);
  if (d > 10 && d <= 15) return -3 * (d - 10);
  return -20;
}

export function clamp01to100(x) {
  return Math.max(0, Math.min(100, x));
}

export function computeIksScores(input = {}) {
  const mobilityPts = pointsFromFlexion(input.flexDeg);
  const stabilityPts = (input.apPts ?? 0) + (input.mlPts ?? 0);
  const kneePositive = (input.painPts ?? 0) + mobilityPts + stabilityPts;

  const kneeDeductions =
    deductionFromFlexionContracture(input.contractureDeg ?? 0) +
    deductionFromActiveExtensionDeficit(input.extDefDeg ?? 0) +
    deductionFromAlignment(input.align || { degrees: null, other: false });

  const kneeScore = clamp01to100(kneePositive + kneeDeductions);

  const functionRaw = (input.walkPts ?? 0) + (input.stairsPts ?? 0) + (input.aidsDeduction ?? 0);
  const functionScore = clamp01to100(functionRaw);

  return {
    mobilityPts,
    stabilityPts,
    kneePositive,
    kneeDeductions,
    kneeScore,
    functionScore,
  };
}
