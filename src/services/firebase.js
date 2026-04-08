import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const runtimeGlobals = typeof globalThis !== 'undefined' ? globalThis : {}

const runtimeConfig = runtimeGlobals.__firebase_config
  ? JSON.parse(runtimeGlobals.__firebase_config)
  : null

const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const firebaseConfig =
  runtimeConfig && Object.keys(runtimeConfig).length ? runtimeConfig : envConfig

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)

export const appId = runtimeGlobals.__app_id || import.meta.env.VITE_APP_ID || 'qna-app-default'
export const authToken =
  runtimeGlobals.__initial_auth_token || import.meta.env.VITE_FIREBASE_AUTH_TOKEN || null
