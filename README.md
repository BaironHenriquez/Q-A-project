# Q&A Live para Eventos (React + Firebase + Vercel)

Aplicación web de preguntas y respuestas en tiempo real con cuatro vistas principales: inicio, moderación, presentación y participación.

## Estado actual del flujo

1. Inicio (/):
	- Login de moderador.
	- Ingreso de participante con ID de sesión.
	- Creación de sesión activa.
	- Entrada a sesión activa.
	- Borrado de sesión activa con confirmación en pantalla.

2. Moderador (/moderador):
	- Pausar y reanudar recepción de preguntas.
	- Abrir presentación en pestaña nueva.
	- Aprobar o rechazar preguntas pendientes.
	- Acciones avanzadas por pregunta: editar, fijar/desfijar, ocultar/mostrar.
	- Aprobar o rechazar respuestas pendientes.
	- Responder como moderador en preguntas aprobadas.

3. Presentación (/presentacion):
	- QR y URL para ingreso de participantes.
	- Top 10 de preguntas aprobadas ordenadas por: fijadas, votos, recencia.
	- Visualización de respuestas aprobadas.
	- Aviso visible cuando la sesión está pausada.

4. Participante (/participante):
	- Acceso por QR o ID de sesión activa.
	- Registro de nombre para participar.
	- Envío de preguntas (si la sesión está abierta).
	- Voto +1 con comportamiento toggle.
	- Respuestas por pregunta y votos de correcto/no correcto en respuestas aprobadas.

## Stack

- Frontend: React + Vite.
- Backend: Firebase Firestore + Firebase Auth.
- Estilos: Tailwind CSS + CSS global.
- Deploy: Vercel.

## Estructura actual del proyecto

```txt
src/
├─ App.jsx
├─ main.jsx
├─ index.css
├─ assets/
│  ├─ hero.png
│  ├─ react.svg
│  └─ vite.svg
├─ pages/
│  ├─ Home.jsx
│  ├─ Moderator.jsx
│  ├─ Presentation.jsx
│  └─ Participant.jsx
├─ hooks/
│  ├─ useAuth.js
│  ├─ useModeratorAuth.js
│  ├─ useSession.js
│  └─ useQuestions.js
└─ services/
	└─ firebase.js
```

## Rutas

- /: Inicio.
- /moderador: Panel de moderación.
- /presentacion: Vista de proyección.
- /participante: Vista de usuarios participantes.

## Lógica de datos implementada

### Sesión activa

- Documento: artifacts/{appId}/public/data/session_meta/active.
- La creación de sesión se realiza con transacción para evitar dobles creaciones concurrentes.
- El borrado de sesión elimina primero la data histórica de preguntas de la sesión y luego borra el puntero activo.

### Preguntas y respuestas

- Colección: artifacts/{appId}/public/data/sessions/{sessionId}/questions/{questionId}.
- La creación de pregunta valida de forma transaccional:
  - que exista sesión activa,
  - que coincida con sessionId actual,
  - que la sesión esté aceptando preguntas.
- Votos de preguntas y votos de respuestas usan transacciones para consistencia.
- Moderación de respuestas se actualiza con transacción para no perder votos concurrentes.

### Estructura de una pregunta

- author
- userId
- content
- status: pending | approved | rejected
- upvotes
- upvotedBy[]
- isPinned
- isHidden
- createdAt
- answers[]

### Estructura de una respuesta

- id
- author
- userId
- content
- status: pending | approved | rejected
- createdAt
- isCorrectVotes
- isIncorrectVotes
- isCorrectVotedBy[]
- isIncorrectVotedBy[]

## Variables de entorno

Crear .env.local:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_APP_ID=q-a-live
VITE_FIREBASE_AUTH_TOKEN=
```

## Desarrollo local

```bash
npm install
npm run dev
```

## Verificación

```bash
npm run lint
npm run build
```

## Producción en Vercel

1. Repositorio conectado a Vercel.
2. Branch main configurada para producción.
3. Cada push a main dispara un deploy de producción.

## Nota de seguridad

La autenticación de moderador actual es de tipo cliente (credenciales locales). Para uso en producción real, mover la validación a backend y reforzar reglas de Firestore por rol.
