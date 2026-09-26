import { getApps, initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword, getAuth, onAuthStateChanged,
  sendPasswordResetEmail, signInWithEmailAndPassword,
  signOut, updateProfile,
} from 'firebase/auth'
import { createAuthActions } from './actions'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export function getClientApp() {
  if (Object.values(config).some(value => !value?.trim())) {
    throw Object.assign(new Error('Missing Firebase web configuration'), { code: 'auth/not-configured' })
  }
  return getApps().find(app => app.name === 'social-network-web') || initializeApp(config, 'social-network-web')
}

export const getClientAuth = () => getAuth(getClientApp())

export const authActions = createAuthActions({
  create: async (email, password) => (await createUserWithEmailAndPassword(getClientAuth(), email, password)).user,
  updateName: (user, displayName) => updateProfile(user, { displayName }),
  resetPassword: email => sendPasswordResetEmail(getClientAuth(), email),
})

export const watchUser = (auth, callback) => onAuthStateChanged(auth, callback)
export const login = (email, password) => signInWithEmailAndPassword(getClientAuth(), email.trim(), password)
export const logout = () => signOut(getClientAuth())
