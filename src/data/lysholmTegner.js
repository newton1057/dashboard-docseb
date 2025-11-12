// src/data/lysholmTegner.js
// Preguntas y opciones para Lysholm y Tegner.

export const lysholmQuestions = [
  {
    id: "limp",
    title: "Cojera",
    type: "radio",
    options: [
      { label: "Ninguna", value: 5 },
      { label: "Leve u ocasional", value: 3 },
      { label: "Acentuada y constante", value: 0 },
    ],
  },
  {
    id: "support",
    title: "Apoyo",
    type: "radio",
    options: [
      { label: "Ninguno", value: 5 },
      { label: "Bastón o muleta", value: 2 },
      { label: "Bipedestación imposible", value: 0 },
    ],
  },
  {
    id: "locking",
    title: "Bloqueo y enganche",
    type: "radio",
    options: [
      { label: "Ninguno", value: 15 },
      { label: "Enganche sin bloqueo", value: 10 },
      { label: "Bloqueo ocasional", value: 6 },
      { label: "Bloqueo frecuente", value: 2 },
      { label: "Bloqueo persistente durante el exámen", value: 0 },
    ],
  },
  {
    id: "instability",
    title: 'Inestabilidad (sensación de que la rodilla "falla")',
    type: "radio",
    options: [
      { label: "Ninguna debilidad", value: 25 },
      { label: "Rara vez durante ejercicio intenso", value: 20 },
      { label: "Frecuente durante ejercicios intensos o que impiden la actividad deportiva", value: 15 },
      { label: "Ocasional en la vida cotidiana", value: 10 },
      { label: "Frecuente en la vida cotidiana", value: 5 },
      { label: "A cada paso", value: 0 },
    ],
  },
  {
    id: "pain",
    title: "Dolor",
    type: "radio",
    options: [
      { label: "Ninguno", value: 25 },
      { label: "Inconstante o leve durante ejercicios intensos", value: 20 },
      { label: "Intenso durante ejercicios intensos", value: 15 },
      { label: "Intenso tras una marcha > 2 km", value: 10 },
      { label: "Intenso tras una marcha < 2 km", value: 5 },
      { label: "Constante", value: 0 },
    ],
  },
  {
    id: "swelling",
    title: "Hinchazón",
    type: "radio",
    options: [
      { label: "Ninguna", value: 10 },
      { label: "Durante ejercicios intensos", value: 6 },
      { label: "Durante actividades comunes", value: 2 },
      { label: "Constante", value: 0 },
    ],
  },
  {
    id: "stairs",
    title: "Subida de escaleras",
    type: "radio",
    options: [
      { label: "Normal", value: 10 },
      { label: "Dificultad leve", value: 6 },
      { label: "Un peldaño a la vez", value: 2 },
      { label: "Imposible", value: 0 },
    ],
  },
  {
    id: "squatting",
    title: "Ponerse en cuclillas",
    type: "radio",
    options: [
      { label: "Sin dificultad", value: 5 },
      { label: "Dificultad leve", value: 4 },
      { label: "No por encima de 90°", value: 2 },
      { label: "Imposible", value: 0 },
    ],
  },
];

export const tegnerQuestion = {
  id: "tegner",
  title: "Escala de Actividad de Tegner",
  type: "radio",
  options: [
    { label: "Nivel 10: Competición nacional/internacional (fútbol)", value: 10 },
    { label: "Nivel 9: Competición nivel inferior (fútbol, hockey, gimnasia)", value: 9 },
    { label: "Nivel 8: Competición (squash, bádminton, salto, esquí)", value: 8 },
    { label: "Nivel 7: Competición (tenis, carrera, motocross, balonmano, básquet)", value: 7 },
    { label: "Nivel 6: Recreo (fútbol, hockey, squash, atletismo, cross)", value: 6 },
    { label: "Nivel 5: Recreo (tenis, bádminton, balonmano, básquet, esquí, jogging)", value: 5 },
    { label: "Nivel 4: Competición (ciclismo)", value: 4 },
    { label: "Nivel 3: Recreación (jogging 2/semana en suelo irregular)", value: 3 },
    { label: "Nivel 2: Trabajo pesado (construcción, etc.)", value: 2 },
    { label: "Nivel 1: Recreo (ciclismo, jogging en terreno plano)", value: 1 },
    { label: "Nivel 0: Actividad moderada / trabajo ligero / sedentario", value: 0 },
  ],
};
