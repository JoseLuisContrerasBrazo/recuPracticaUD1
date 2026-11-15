import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { talleres, inscripciones } from "./datos.js";
import { obtenerPlazasRestantes, estaInscrito, validarInscripcion, convertirId } from "./funciones.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// Middleware propio de registro: se coloca primero para registrar también los estáticos.
app.use((req, res, next) => {
  const fecha = new Date().toLocaleString("es-ES", { hour12: false });
  console.log(`[${fecha}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.urlencoded({ extended: false }));

function prepararTaller(taller) {
  const plazasRestantes = obtenerPlazasRestantes(taller, inscripciones);
  let estadoPlazas;
  if (plazasRestantes === 0) estadoPlazas = "Completo";
  else if (plazasRestantes === 1) estadoPlazas = "Última plaza disponible";
  else estadoPlazas = `${plazasRestantes} plazas disponibles`;
  return { ...taller, plazasRestantes, estadoPlazas };
}

function obtenerMensaje(req) {
  const mensaje = req.query.mensaje === "ok" ? "Inscripción realizada correctamente." : null;
  return mensaje;
}

app.get("/", (req, res) => res.redirect(303, "/talleres"));

// Catálogo: filtros por categoría, nivel y disponibilidad.
app.get("/talleres", (req, res) => {
  const { categoria = "", nivel = "", disponibles = "" } = req.query;
  let resultado = talleres.filter((taller) => {
    const coincideCategoria = !categoria || taller.categoria === categoria;
    const coincideNivel = !nivel || taller.nivel === nivel;
    const tienePlazas = disponibles !== "true" || obtenerPlazasRestantes(taller, inscripciones) > 0;
    return coincideCategoria && coincideNivel && tienePlazas;
  });
  // map prepara los datos que necesita la vista.
  resultado = resultado.map(prepararTaller);
  res.render("talleres", {
    talleres: resultado,
    filtros: { categoria, nivel, disponibles },
    mensaje: obtenerMensaje(req)
  });
});

// Ficha de un taller.
app.get("/talleres/:id", (req, res) => {
  const id = convertirId(req.params.id);
  const taller = id === null ? undefined : talleres.find((item) => item.id === id);
  if (!taller) return res.status(404).render("404", { url: req.originalUrl });
  res.render("detalle", { taller: prepararTaller(taller) });
});

// Formulario de inscripción.
app.get("/talleres/:id/inscripcion", (req, res) => {
  const id = convertirId(req.params.id);
  const taller = id === null ? undefined : talleres.find((item) => item.id === id);
  if (!taller) return res.status(404).render("404", { url: req.originalUrl });
  const datos = prepararTaller(taller);
  if (datos.plazasRestantes < 1) {
    return res.status(409).render("inscripcion", {
      taller: datos,
      valores: { nombre: "", email: "" },
      errores: { general: "Este taller está completo y no admite más inscripciones." }
    });
  }
  res.render("inscripcion", { taller: datos, valores: { nombre: "", email: "" }, errores: {} });
});

// Alta: valida de nuevo todos los datos en el servidor y aplica PRG si tiene éxito.
app.post("/talleres/:id/inscripcion", (req, res) => {
  const id = convertirId(req.params.id);
  const taller = id === null ? undefined : talleres.find((item) => item.id === id);
  if (!taller) return res.status(404).render("404", { url: req.originalUrl });

  const validacion = validarInscripcion(req.body);
  const errores = { ...validacion.errores };
  const plazasRestantes = obtenerPlazasRestantes(taller, inscripciones);

  if (plazasRestantes <= 0) errores.general = "No quedan plazas disponibles para este taller.";
  if (validacion.datos.email && estaInscrito(id, validacion.datos.email, inscripciones)) {
    errores.email = "Este correo ya está inscrito en el taller.";
  }

  if (Object.keys(errores).length > 0) {
    return res.status(plazasRestantes <= 0 ? 409 : 400).render("inscripcion", {
      taller: prepararTaller(taller),
      valores: { nombre: String(req.body?.nombre ?? "").slice(0, 80), email: String(req.body?.email ?? "").slice(0, 254) },
      errores
    });
  }

  const nuevaInscripcion = {
    id: inscripciones.length ? Math.max(...inscripciones.map((item) => item.id)) + 1 : 1,
    tallerId: id,
    nombre: validacion.datos.nombre,
    email: validacion.datos.email
  };
  inscripciones.push(nuevaInscripcion);
  return res.redirect(303, "/talleres?mensaje=ok");
});

// Addendum: cualquier ruta no definida termina aquí y devuelve una vista EJS con 404.
app.use((req, res) => {
  res.status(404).render("404", { url: req.originalUrl });
});

// Errores inesperados: respuesta genérica, sin filtrar detalles internos.
app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(500).render("error", { mensaje: "Ha ocurrido un error interno. Inténtalo de nuevo más tarde." });
});

export default app;
