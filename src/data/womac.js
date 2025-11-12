// src/data/womac.js
// Preguntas y metadatos para WOMAC.

export const WOMAC_OPTIONS = [
  { label: "Ninguno/a", value: 0 },
  { label: "Poco/a", value: 1 },
  { label: "Bastante", value: 2 },
  { label: "Mucho/a", value: 3 },
  { label: "Muchísimo/a", value: 4 },
];

export const SECTION_HEADINGS = {
  pain: {
    title: "Apartado A: Dolor",
    instruction: "Indique cuánto DOLOR ha notado en los últimos 2 días en cada situación.",
    questionPrefix: "¿Cuánto dolor tiene…?",
  },
  stiffness: {
    title: "Apartado B: Rigidez",
    instruction: "Indique cuánta RIGIDEZ (no dolor) ha notado en los últimos 2 días.",
    questionPrefix: "¿Cuánta rigidez nota…?",
  },
  function: {
    title: "Apartado C: Capacidad Funcional",
    instruction: "Indique cuánta dificultad ha notado en los últimos 2 días al realizar:",
    questionPrefix: "¿Qué grado de dificultad tiene al…?",
  },
};

export const WOMAC_QUESTIONS = [
  { id: "pain_1", section: "pain", type: "radio", text: "Andar por un terreno llano.", options: WOMAC_OPTIONS },
  { id: "pain_2", section: "pain", type: "radio", text: "Subir o bajar escaleras.", options: WOMAC_OPTIONS },
  { id: "pain_3", section: "pain", type: "radio", text: "Por la noche en la cama.", options: WOMAC_OPTIONS },
  { id: "pain_4", section: "pain", type: "radio", text: "Estar sentado o tumbado.", options: WOMAC_OPTIONS },
  { id: "pain_5", section: "pain", type: "radio", text: "Estar de pie.", options: WOMAC_OPTIONS },
  { id: "stiffness_1", section: "stiffness", type: "radio", text: "Después de despertarse por la mañana.", options: WOMAC_OPTIONS },
  { id: "stiffness_2", section: "stiffness", type: "radio", text: "Tras estar sentado, tumbado o descansando.", options: WOMAC_OPTIONS },
  { id: "function_1", section: "function", type: "radio", text: "Bajar las escaleras.", options: WOMAC_OPTIONS },
  { id: "function_2", section: "function", type: "radio", text: "Subir las escaleras.", options: WOMAC_OPTIONS },
  { id: "function_3", section: "function", type: "radio", text: "Levantarse después de estar sentado.", options: WOMAC_OPTIONS },
  { id: "function_4", section: "function", type: "radio", text: "Estar de pie.", options: WOMAC_OPTIONS },
  { id: "function_5", section: "function", type: "radio", text: "Agacharse para coger algo del suelo.", options: WOMAC_OPTIONS },
  { id: "function_6", section: "function", type: "radio", text: "Andar por un terreno llano.", options: WOMAC_OPTIONS },
  { id: "function_7", section: "function", type: "radio", text: "Entrar y salir de un coche.", options: WOMAC_OPTIONS },
  { id: "function_8", section: "function", type: "radio", text: "Ir de compras.", options: WOMAC_OPTIONS },
  { id: "function_9", section: "function", type: "radio", text: "Ponerse las medias o calcetines.", options: WOMAC_OPTIONS },
  { id: "function_10", section: "function", type: "radio", text: "Levantarse de la cama.", options: WOMAC_OPTIONS },
  { id: "function_11", section: "function", type: "radio", text: "Quitarse las medias o calcetines.", options: WOMAC_OPTIONS },
  { id: "function_12", section: "function", type: "radio", text: "Estar tumbado en la cama.", options: WOMAC_OPTIONS },
  { id: "function_13", section: "function", type: "radio", text: "Entrar y salir de la ducha/bañera.", options: WOMAC_OPTIONS },
  { id: "function_14", section: "function", type: "radio", text: "Estar sentado.", options: WOMAC_OPTIONS },
  { id: "function_15", section: "function", type: "radio", text: "Sentarse y levantarse del retrete.", options: WOMAC_OPTIONS },
  { id: "function_16", section: "function", type: "radio", text: "Hacer tareas domésticas pesadas.", options: WOMAC_OPTIONS },
  { id: "function_17", section: "function", type: "radio", text: "Hacer tareas domésticas ligeras.", options: WOMAC_OPTIONS },
];
