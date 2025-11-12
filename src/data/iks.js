// src/data/iks.js
// Opciones y metadatos para el formulario IKS.

export const IKS_PAIN_OPTIONS = [
  { label: "Ninguno", value: 50 },
  { label: "Leve u ocasional", value: 45 },
  { label: "Sólo en las escaleras", value: 40 },
  { label: "Al caminar y en escaleras", value: 30 },
  { label: "Moderado, ocasional", value: 20 },
  { label: "Moderado, permanente", value: 10 },
  { label: "Intenso", value: 0 },
];

export const IKS_STABILITY_AP_OPTIONS = [
  { label: "< 5 mm", value: 10 },
  { label: "5 – 10 mm", value: 5 },
  { label: "> 10 mm", value: 0 },
];

export const IKS_STABILITY_ML_OPTIONS = [
  { label: "< 5°", value: 15 },
  { label: "6° – 9°", value: 10 },
  { label: "10° – 14°", value: 0 },
];

export const IKS_WALK_OPTIONS = [
  { label: "Ilimitado", value: 50 },
  { label: "≈ 1000 m", value: 40 },
  { label: "500 – 1000 m", value: 30 },
  { label: "< 500 m", value: 20 },
  { label: "Sólo en el domicilio", value: 10 },
  { label: "Incapacidad", value: 0 },
];

export const IKS_STAIRS_OPTIONS = [
  { label: "Sube/baja normal", value: 50 },
  { label: "Sube normal, baja con rampa", value: 40 },
  { label: "Sube y baja con rampa", value: 30 },
  { label: "Sube con rampa y baja asimétrica", value: 15 },
  { label: "Sube y baja asimétricas", value: 10 },
  { label: "Imposibles", value: 0 },
];

export const IKS_AIDS_DEDUCTIONS = [
  { label: "Sin bastón", value: 0 },
  { label: "Un bastón", value: -5 },
  { label: "Dos bastones", value: -10 },
  { label: "Bastón inglés o andador", value: -20 },
];

export const IKS_SECTIONS = {
  knee: {
    title: "Rodilla (IKS Knee Score)",
    instruction: "Componentes positivos y deducciones para el puntaje de rodilla.",
  },
  function: {
    title: "Capacidad funcional (IKS Function Score)",
    instruction: "Evaluación de marcha, escaleras y uso de ayudas.",
  },
};
