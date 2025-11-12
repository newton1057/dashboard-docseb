// src/data/koos.js
// Preguntas y metadatos para KOOS.

export const KOOS_SECTIONS = {
  symptoms: { key: "symptoms", title: "Síntomas", maxItems: 7 },
  pain: { key: "pain", title: "Dolor", maxItems: 9 },
  adl: { key: "adl", title: "Función — Vida diaria", maxItems: 17 },
  sport: { key: "sport", title: "Función — Deportes/Recreación", maxItems: 5 },
  qol: { key: "qol", title: "Calidad de vida", maxItems: 4 },
};

export const KOOS_OPTIONS_0_4 = [
  { label: "Nunca / Ninguno / En absoluto", value: 0 },
  { label: "Rara vez / Leve / Ligeramente / Mensual", value: 1 },
  { label: "A veces / Moderado / Semanal", value: 2 },
  { label: "A menudo / Severo / Diario", value: 3 },
  { label: "Siempre / Extremo / Constante / Totalmente", value: 4 },
];

const baseQuestion = (id, section, text) => ({
  id,
  section,
  text,
  type: "radio",
  options: KOOS_OPTIONS_0_4,
});

export const KOOS_QUESTIONS = [
  baseQuestion("S1", "symptoms", "¿Tiene hinchazón en la rodilla?"),
  baseQuestion("S2", "symptoms", "¿Crujido/chasquido o ruido al mover la rodilla?"),
  baseQuestion("S3", "symptoms", "¿Se bloquea o se 'engancha' la rodilla al moverse?"),
  baseQuestion("S4", "symptoms", "¿Puede enderezar completamente la rodilla?"),
  baseQuestion("S5", "symptoms", "¿Puede doblar completamente la rodilla?"),
  baseQuestion("S6", "symptoms", "Rigidez después de despertarse por la mañana."),
  baseQuestion("S7", "symptoms", "Rigidez tras estar sentado/tumbado/descansando."),

  baseQuestion("P1", "pain", "¿Con qué frecuencia experimenta dolor de rodilla?"),
  baseQuestion("P2", "pain", "Dolor al girar o pivotar sobre su rodilla."),
  baseQuestion("P3", "pain", "Dolor al enderezar completamente la rodilla."),
  baseQuestion("P4", "pain", "Dolor al doblar completamente la rodilla."),
  baseQuestion("P5", "pain", "Dolor al caminar sobre superficie plana."),
  baseQuestion("P6", "pain", "Dolor al subir o bajar escaleras."),
  baseQuestion("P7", "pain", "Dolor por la noche en la cama."),
  baseQuestion("P8", "pain", "Dolor al estar sentado o acostado."),
  baseQuestion("P9", "pain", "Dolor al estar de pie."),

  baseQuestion("A1", "adl", "Bajar escaleras."),
  baseQuestion("A2", "adl", "Subir escaleras."),
  baseQuestion("A3", "adl", "Levantarse de una silla."),
  baseQuestion("A4", "adl", "Estar de pie."),
  baseQuestion("A5", "adl", "Agacharse hasta el suelo."),
  baseQuestion("A6", "adl", "Caminar sobre superficie plana."),
  baseQuestion("A7", "adl", "Entrar o salir de un coche."),
  baseQuestion("A8", "adl", "Ir de compras."),
  baseQuestion("A9", "adl", "Ponerse calcetines/medias."),
  baseQuestion("A10", "adl", "Levantarse de la cama."),
  baseQuestion("A11", "adl", "Quitarse calcetines/medias."),
  baseQuestion("A12", "adl", "Estar acostado en la cama."),
  baseQuestion("A13", "adl", "Entrar o salir de la ducha/bañera."),
  baseQuestion("A14", "adl", "Estar sentado."),
  baseQuestion("A15", "adl", "Sentarse/levantarse del inodoro."),
  baseQuestion("A16", "adl", "Tareas domésticas pesadas."),
  baseQuestion("A17", "adl", "Tareas domésticas ligeras."),

  baseQuestion("SP1", "sport", "Ponerse en cuclillas."),
  baseQuestion("SP2", "sport", "Correr."),
  baseQuestion("SP3", "sport", "Saltar."),
  baseQuestion("SP4", "sport", "Girar/pivotar sobre la rodilla lesionada."),
  baseQuestion("SP5", "sport", "Arrodillarse."),

  baseQuestion("Q1", "qol", "Frecuencia con la que es consciente del problema de rodilla."),
  baseQuestion("Q2", "qol", "¿Ha modificado su estilo de vida por la rodilla?"),
  baseQuestion("Q3", "qol", "Preocupación por falta de confianza en su rodilla."),
  baseQuestion("Q4", "qol", "Dificultad general con su rodilla."),
];
