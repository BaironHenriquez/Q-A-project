# Q&A Live

Aplicacion web de preguntas y respuestas en tiempo real para eventos, clases o sesiones internas.

Incluye 4 vistas conectadas entre si:
- Inicio (`/`)
- Moderador (`/moderador`)
- Presentacion (`/presentacion`)
- Participante (`/participante`)

## Tabla de Contenidos

- [Resumen](#resumen)
- [Caracteristicas](#caracteristicas)
- [Stack Tecnologico](#stack-tecnologico)
- [Arquitectura](#arquitectura)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Primeros Pasos](#primeros-pasos)
- [Variables de Entorno](#variables-de-entorno)
- [Scripts Disponibles](#scripts-disponibles)
- [Flujo de Uso](#flujo-de-uso)
- [Calidad y Consistencia de Datos](#calidad-y-consistencia-de-datos)
- [Despliegue](#despliegue)
- [Troubleshooting](#troubleshooting)
- [Seguridad](#seguridad)
- [Contribucion](#contribucion)
- [Licencia](#licencia)

## Resumen

Q&A Live permite que una audiencia envie preguntas en tiempo real mientras un moderador controla la visibilidad del contenido y una vista de presentacion muestra las preguntas destacadas.

Objetivo principal:
- mantener un flujo rapido y ordenado de preguntas/respuestas,
- evitar ruido en pantalla,
- y conservar consistencia de datos aun con usuarios concurrentes.

## Caracteristicas

### Moderador

- Crear y borrar sesion activa (con confirmacion).
- Pausar y reanudar recepcion de preguntas.
- Abrir presentacion en nueva pestana.
- Aprobar/rechazar preguntas pendientes.
- Editar, fijar/desfijar y ocultar/mostrar preguntas.
- Aprobar/rechazar respuestas pendientes.
- Responder como moderador en preguntas aprobadas.

### Participante

- Entrar por QR o ID de sesion.
- Definir nombre de participacion.
- Enviar preguntas (si la sesion esta abierta).
- Votar preguntas con `+1` (toggle).
- Responder preguntas.
- Votar respuestas como correctas/no correctas.

### Presentacion

- Muestra titulo de la sesion activa.
- QR + URL para acceso rapido de la audiencia.
- Preguntas destacadas ordenadas por prioridad:
	1. fijadas,
	2. votos,
	3. recencia.
- Muestra respuestas aprobadas.
- Aviso visible cuando la sesion esta pausada.

## Stack Tecnologico

- Frontend: React 19 + Vite 8
- Routing: React Router 7
- Backend: Firebase Firestore + Firebase Auth
- UI: Tailwind CSS + CSS global
- Iconos: lucide-react
- QR: qrcode.react
- Telemetria web: @vercel/speed-insights
- Deploy: Vercel

## Arquitectura

La app se apoya en una arquitectura por hooks de dominio:

- `useAuth`: estado de autenticacion base con Firebase.
- `useModeratorAuth`: sesion local de moderador (cliente).
- `useSession`: ciclo de vida de la sesion activa.
- `useQuestions`: preguntas, respuestas, votaciones y moderacion.

### Modelo de datos

Documento de sesion activa:

`artifacts/{appId}/public/data/session_meta/active`

Coleccion de preguntas por sesion:

`artifacts/{appId}/public/data/sessions/{sessionId}/questions/{questionId}`

Registro de actividad por participante:

`artifacts/{appId}/public/data/sessions/{sessionId}/participants/{userId}`

#### Pregunta

- `author`
- `userId`
- `content`
- `status`: `pending | approved | rejected`
- `upvotes`
- `upvotedBy[]`
- `isPinned`
- `isHidden`
- `createdAt`
- `answers[]`

#### Respuesta

- `id`
- `author`
- `userId`
- `content`
- `status`: `pending | approved | rejected`
- `createdAt`
- `isCorrectVotes`
- `isIncorrectVotes`
- `isCorrectVotedBy[]`
- `isIncorrectVotedBy[]`

#### Participante (actividad)

Documento base en `participants/{userId}`:

- `userId`
- `lastDisplayName`
- `lastActivityAt`
- `updatedAt`

Subcoleccion `participants/{userId}/questions/{questionId}`:

- `questionId`
- `author`
- `content`
- `status`
- `createdAt`

Subcoleccion `participants/{userId}/answers/{answerId}`:

- `answerId`
- `questionId`
- `author`
- `content`
- `status`
- `createdAt`

Subcoleccion `participants/{userId}/question_votes/{questionId}`:

- `questionId`
- `votedAt`

## Estructura del Proyecto

```txt
src/
	App.jsx
	main.jsx
	index.css
	assets/
	hooks/
		useAuth.js
		useModeratorAuth.js
		useQuestions.js
		useSession.js
	pages/
		Home.jsx
		Moderator.jsx
		Participant.jsx
		Presentation.jsx
	services/
		firebase.js
```

## Primeros Pasos

### Prerrequisitos

- Node.js 20+
- npm 10+
- Proyecto Firebase con Firestore y Auth habilitados

### Instalacion

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

La app de desarrollo abre normalmente en `http://localhost:5173`.

## Variables de Entorno

Crea un archivo `.env.local` en la raiz del proyecto:

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

### Referencia rapida

| Variable | Requerida | Uso |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Si | Config Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Si | Auth |
| `VITE_FIREBASE_PROJECT_ID` | Si | Firestore/Auth |
| `VITE_FIREBASE_STORAGE_BUCKET` | Si | Storage (si aplica) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Si | Firebase app config |
| `VITE_FIREBASE_APP_ID` | Si | Firebase app config |
| `VITE_APP_ID` | Recomendado | Namespace de datos bajo `artifacts/{appId}` |
| `VITE_FIREBASE_AUTH_TOKEN` | Opcional | Token inicial en entornos integrados |

Nota: el proyecto tambien soporta configuracion runtime via globals (`__firebase_config`, `__app_id`, `__initial_auth_token`) cuando estan disponibles en el host.

## Scripts Disponibles

| Script | Descripcion |
|---|---|
| `npm run dev` | Levanta servidor de desarrollo |
| `npm run lint` | Ejecuta ESLint |
| `npm run build` | Genera build de produccion |
| `npm run preview` | Sirve build local para validacion |

## Flujo de Uso

1. Ir a `/` e iniciar sesion como moderador.
2. Crear sesion activa.
3. Abrir `/moderador` para moderar preguntas/respuestas.
4. Compartir QR/URL de `/presentacion` con la audiencia.
5. Participantes ingresan por `/participante?sid={sessionId}`.

## Calidad y Consistencia de Datos

El proyecto incluye salvaguardas para concurrencia:

- Creacion de sesion con transaccion para evitar dobles sesiones activas.
- Creacion de pregunta validada por transaccion (sesion activa y estado abierto).
- Votos de preguntas y votos de respuestas con transacciones.
- Moderacion de respuestas con transaccion para evitar perdida de votos concurrentes.
- Borrado de sesion con limpieza de preguntas historicas antes de remover el puntero activo.
- Registro por usuario para preguntas, respuestas y "me sumo" dentro de `participants/{userId}`.

## Despliegue

Configuracion prevista:

1. Conectar repositorio a Vercel.
2. Configurar `main` como rama de produccion.
3. Definir variables de entorno en Vercel.
4. Cada push a `main` genera deploy automatico.

## Troubleshooting

- Si falla Firebase al iniciar:
	- verifica variables `VITE_FIREBASE_*`.
	- valida que `VITE_APP_ID` sea consistente entre entornos.
- Si no ves sesion activa:
	- confirma documento `session_meta/active` en Firestore.
- Si lint falla:
	- ejecuta `npm run lint` y corrige warnings/errors antes de build.

## Seguridad

La autenticacion de moderador actual es cliente/local.

Para un entorno de produccion robusto:
- mover la validacion de rol a backend,
- endurecer reglas de Firestore por rol y recurso,
- y auditar limites de escritura/lectura por usuario.

## Contribucion

1. Crea una rama desde `main`.
2. Realiza cambios pequenos y enfocados.
3. Ejecuta `npm run lint` y `npm run build`.
4. Abre un Pull Request con contexto funcional y tecnico.

## Licencia

No hay licencia declarada en este repositorio por ahora.
