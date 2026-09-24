import { getApps, initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword, getAuth, onAuthStateChanged, reload,
  sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword,
  signOut, updateProfile,
} from 'firebase/auth'
import { createAuthActions } from './actions'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export function getClientAuth() {
  if (Object.values(config).some(value => !value?.trim())) {
    throw Object.assign(new Error('Missing Firebase web configuration'), { code: 'auth/not-configured' })
  }
  const app = getApps().find(app => app.name === 'social-network-web') || initializeApp(config, 'social-network-web')
  return getAuth(app)
}

export const authActions = createAuthActions({
  create: async (email, password) => (await createUserWithEmailAndPassword(getClientAuth(), email, password)).user,
  updateName: (user, displayName) => updateProfile(user, { displayName }),
  sendVerification: sendEmailVerification,
  resetPassword: email => sendPasswordResetEmail(getClientAuth(), email),
})

export const watchUser = (auth, callback) => onAuthStateChanged(auth, callback)
export const login = (email, password) => signInWithEmailAndPassword(getClientAuth(), email.trim(), password)
export const logout = () => signOut(getClientAuth())
export const resendVerification = () => sendEmailVerification(getClientAuth().currentUser)
export async function refreshUser() {
  const user = getClientAuth().currentUser
  await reload(user)
  await user.getIdToken(true)
  return user
}
