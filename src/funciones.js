/** Devuelve las plazas que quedan para un taller. */
export function obtenerPlazasRestantes(taller, inscripciones) {
  if (!taller || !Array.isArray(inscripciones)) return 0;
  const ocupadas = inscripciones.filter((inscripcion) => inscripcion.tallerId === taller.id).length;
  return Math.max(0, taller.plazas - ocupadas);
}

/** Indica si un correo ya está inscrito en un taller (sin distinguir mayúsculas). */
export function estaInscrito(tallerId, email, inscripciones) {
  const correo = String(email ?? "").trim().toLowerCase();
  return inscripciones.some((inscripcion) =>
    inscripcion.tallerId === tallerId && inscripcion.email.toLowerCase() === correo
  );
}

/** Valida los datos recibidos. No depende de req ni de res. */
export function validarInscripcion(datos) {
  const nombre = String(datos?.nombre ?? "").trim();
  const email = String(datos?.email ?? "").trim().toLowerCase();
  const errores = {};

  if (nombre.length < 2 || nombre.length > 80) {
    errores.nombre = "El nombre debe tener entre 2 y 80 caracteres.";
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errores.email = "Introduce un correo electrónico válido.";
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores,
    datos: { nombre, email }
  };
}

/** Convierte un identificador de URL en entero positivo seguro o devuelve null. */
export function convertirId(valor) {
  if (typeof valor !== "string" || !/^\d+$/.test(valor)) return null;
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
