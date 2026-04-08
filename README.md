# Q&A Live para Eventos (React + Firebase + Vercel)

Plataforma de preguntas y respuestas en tiempo real con 4 vistas:

1. Home: creacion de sesion del moderador e ingreso del participante.
2. Moderador: aprobacion, rechazo, edicion, fijado, ocultado, proyeccion y acciones en lote.
3. Presentacion: vista para proyector con QR permanente y top 10 aprobadas.
4. Participante: interfaz movil para preguntar, reaccionar y responder en hilos.

## Stack

- Frontend: React + Vite.
- Backend: Firebase Firestore + Firebase Auth.
- Deploy: Vercel (frontend estatico).

## Variables de entorno

Crea tu archivo `.env.local`:

```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_APP_ID=q-a-live
# Opcional: token custom para autenticacion en vez de anonima
VITE_FIREBASE_AUTH_TOKEN=
```

## Reglas tecnicas implementadas

- Rutas de documentos con segmentos pares.
- Autenticacion previa obligatoria para lectura y escritura.
- Consultas simples sin filtros complejos (se lee la coleccion completa y se procesa en cliente).

### Estructura de datos Firestore

- Documento de sesion activa:
	- `artifacts/{appId}/public/data/session_meta/active`
- Documento de sesion:
	- `artifacts/{appId}/public/data/sessions/{sessionId}`
- Coleccion de preguntas:
	- `artifacts/{appId}/public/data/sessions/{sessionId}/questions/{questionId}`

Cada pregunta guarda:

- `status`: `pending | approved | rejected`
- `voteCount` y `votesByUid`
- `replies[]` con `authorName`, `authorUid`, `isModerator`, `status`, `createdAt`

## Desarrollo local

```bash
npm install
npm run dev
```

## Build de produccion

```bash
npm run build
npm run preview
```

## Deploy en Vercel

1. Importa el repositorio en Vercel.
2. Framework preset: Vite.
3. Agrega las mismas variables `VITE_*` en Project Settings > Environment Variables.
4. Deploy.

## Seguridad recomendada en Firebase

Activa Firebase Authentication (Anonymous o Custom Token) y configura reglas de Firestore para exigir usuario autenticado en lectura/escritura.

Ejemplo base (ajusta a tu politica):

```txt
rules_version = '2';
service cloud.firestore {
	match /databases/{database}/documents {
		match /artifacts/{appId}/public/data/{document=**} {
			allow read, write: if request.auth != null;
		}
	}
}
```
