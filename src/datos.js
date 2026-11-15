// Colecciones en memoria. Se cargan tres talleres y tres inscripciones al arrancar.
export const talleres = [
  { id: 1, titulo: "Introducción a Docker", categoria: "sistemas", plazas: 20, nivel: "inicial" },
  { id: 2, titulo: "Desarrollo web con Express", categoria: "web", plazas: 2, nivel: "avanzado" },
  { id: 3, titulo: "Diseño de interfaces con Figma", categoria: "diseno", plazas: 1, nivel: "inicial" }
];

export const inscripciones = [
  { id: 1, tallerId: 1, nombre: "Curro Ximénez", email: "currox@example.com" },
  { id: 2, tallerId: 2, nombre: "Ana García", email: "ana@example.com" },
  { id: 3, tallerId: 3, nombre: "Luis Pérez", email: "luis@example.com" }
];
