# Sistema de inscripción a talleres y actividades

Práctica de recuperación de Desarrollo Web en Entorno Servidor (DWES), UD1. Aplicación desarrollada con Node.js, Express y EJS, con dos colecciones en memoria.

## 1. Requisitos

- Node.js 20 o superior.
- npm.
- Conexión a Internet durante la primera instalación para descargar Express y EJS.

## 2. Instalación y ejecución

Abre una terminal en la carpeta que contiene este README y ejecuta:

```bash
npm install
npm start
```

Abre <http://localhost:3000>. Para detener el servidor, pulsa `Ctrl + C` en la terminal.

En desarrollo también puedes utilizar `npm run dev` para reiniciar el servidor al guardar cambios.

## 3. Datos iniciales

Al arrancar se crean tres talleres y tres inscripciones en `src/datos.js`:

| ID | Taller | Categoría | Nivel | Plazas | Inscritos iniciales | Restantes |
|---:|---|---|---|---:|---:|---:|
| 1 | Introducción a Docker | sistemas | inicial | 20 | 1 | 19 |
| 2 | Desarrollo web con Express | web | avanzado | 2 | 1 | 1 |
| 3 | Diseño de interfaces con Figma | diseno | inicial | 1 | 1 | 0 |

Los datos viven en memoria: se reinician al detener y volver a arrancar el servidor. No se utiliza base de datos porque la práctica no la exige.

## 4. Funcionalidades y rutas

### Catálogo y filtros

`GET /talleres` muestra todos los talleres. Se pueden combinar los filtros `categoria`, `nivel` y `disponibles=true`.

Ejemplos reproducibles:

```bash
curl -i http://localhost:3000/talleres
curl -i 'http://localhost:3000/talleres?categoria=web'
curl -i 'http://localhost:3000/talleres?nivel=avanzado'
curl -i 'http://localhost:3000/talleres?disponibles=true'
curl -i 'http://localhost:3000/talleres?categoria=web&disponibles=true'
curl -i 'http://localhost:3000/talleres?categoria=web&nivel=avanzado&disponibles=true'
```

Equivalente HTML: formulario de filtros de la página `/talleres`, que envía una petición GET.

### Ficha de taller

`GET /talleres/:id` muestra los datos del taller, plazas totales, plazas restantes y su estado. La vista distingue entre `Completo`, `Última plaza disponible` y el número de plazas restantes.

```bash
curl -i http://localhost:3000/talleres/1
curl -i http://localhost:3000/talleres/2
curl -i http://localhost:3000/talleres/3
```

Equivalente HTML: enlace **Ver taller** en cada tarjeta del catálogo.

### Formulario de inscripción

`GET /talleres/:id/inscripcion` presenta el formulario del taller si quedan plazas. Si está completo, informa al usuario y no permite enviar una inscripción.

```bash
curl -i http://localhost:3000/talleres/2/inscripcion
```

Equivalente HTML: botón **Inscribirme** de la ficha del taller.

### Alta de inscripción

`POST /talleres/:id/inscripcion` recibe `nombre` y `email` mediante `application/x-www-form-urlencoded`. El servidor valida el taller, el nombre, el correo, las plazas y que el correo no esté ya inscrito en ese taller. Si hay errores, responde con 400 (datos no válidos) o 409 (sin plazas), vuelve a mostrar el formulario y conserva los campos introducidos. Si todo es correcto, guarda la inscripción y responde con una redirección 303 (PRG).

```bash
curl -i -X POST http://localhost:3000/talleres/2/inscripcion \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'nombre=María López' \
  --data-urlencode 'email=maria@example.com'
```

Para probar duplicados, repite el POST anterior con el mismo correo y el mismo ID de taller: debe responder 400 y mostrar el error de correo duplicado. Para probar el taller completo, envía un POST a `/talleres/3/inscripcion`: debe responder 409.

Equivalente HTML: formulario de inscripción servido por `GET /talleres/2/inscripcion`, con método POST y campos `nombre` y `email`.

### Rutas inexistentes (addendum)

Cualquier ruta no definida llega al middleware 404, que responde con estado HTTP 404 y renderiza `views/404.ejs`, integrada con la cabecera, el pie y los estilos de la aplicación.

```bash
curl -i http://localhost:3000/ruta-inexistente
```

Resultado esperado en las cabeceras:

```text
HTTP/1.1 404 Not Found
```

La vista muestra el recurso solicitado y un enlace para volver al catálogo.

## 5. Middleware de registro (addendum)

El middleware propio está declarado al principio de la cadena, antes de los archivos estáticos, el parseo del formulario y las rutas. Así registra todas las peticiones recibidas, incluidas las de recursos estáticos, e imprime fecha/hora, método HTTP y URL original. Ejemplo:

```text
[10/11/2026, 08:45:12] GET /talleres
[10/11/2026, 08:45:18] GET /talleres/2
[10/11/2026, 08:45:25] POST /talleres/2/inscripcion
```


## 6. Organización del proyecto

```text
recuperacion-ud1/
├── public/
│   └── estilos.css
├── src/
│   ├── app.js
│   ├── datos.js
│   ├── funciones.js
│   └── server.js
├── views/
│   ├── partials/
│   │   ├── header.ejs
│   │   └── footer.ejs
│   ├── 404.ejs
│   ├── detalle.ejs
│   ├── error.ejs
│   ├── inscripcion.ejs
│   └── talleres.ejs
├── .gitignore
├── package.json
└── README.md
```

- `datos.js`: colecciones iniciales en memoria.
- `funciones.js`: lógica independiente de Express: `obtenerPlazasRestantes`, `estaInscrito`, `validarInscripcion` y conversión segura de ID.
- `app.js`: configuración de Express, middleware y rutas.
- `server.js`: arranque del servidor, separado de la aplicación.
- `views/`: presentación EJS; `partials/` contiene dos parciales reutilizables.

## 7. Métodos JavaScript solicitados

- `filter()`: filtra talleres por categoría, nivel y disponibilidad; también cuenta las inscripciones de un taller.
- `find()`: localiza el taller por su identificador.
- `map()`: prepara los datos de presentación del catálogo y calcula el siguiente ID de inscripción.
- `some()`: comprueba si un correo ya está inscrito en un taller.

Las funciones obligatorias no reciben `req` ni `res` y están en `src/funciones.js`.

## 8. Validaciones y seguridad básica

Los valores recibidos del navegador se consideran no fiables. El ID se convierte y valida antes de buscar el taller; nombre y email se normalizan y validan en el servidor; el correo se compara sin distinguir mayúsculas; se comprueban las plazas y los duplicados también en el POST. Las vistas utilizan `<%=` para escapar los datos dinámicos. El formulario utiliza `express.urlencoded({ extended: false })` para procesar el body.

El alta se realiza de forma síncrona en memoria, sin operaciones asíncronas entre la comprobación de plazas y el `push`, evitando que dos manejadores se intercalen en ese tramo dentro de este proceso Node. Al reiniciar el servidor, las inscripciones se pierden, tal como corresponde al almacenamiento en memoria de esta práctica.

## 9. Uso de IA

Enlace al chat de ia 

https://chatgpt.com/share/6af9d89b-d220-83ed-8269-3429ea63018a


