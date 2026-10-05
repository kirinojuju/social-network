export function validateSignup({ firstName, lastName, email, password, confirmPassword }) {
  if (!firstName?.trim() || !lastName?.trim()) return 'Enter your first and last name.'
  if (`${firstName.trim()} ${lastName.trim()}`.length > 100) return 'Your full name must be 100 characters or fewer.'
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.'
  if (!password || password.length < 6) return 'Use a password with at least 6 characters.'
  if (password !== confirmPassword) return 'Passwords do not match.'
  return null
}

export function authError(error) {
  const messages = {
    'auth/not-configured': 'Firebase settings are missing. For local testing, run npm run dev:team.',
    'auth/invalid-api-key': 'Firebase settings are invalid. Check the web app configuration.',
    'auth/configuration-not-found': 'Firebase Authentication is not configured for this project.',
    'auth/operation-not-allowed': 'Email/password sign-in is disabled in Firebase Authentication.',
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/user-not-found': 'The email or password is incorrect.',
    'auth/wrong-password': 'The email or password is incorrect.',
    'auth/email-already-in-use': 'This email already has an account. Sign in or reset your password.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/weak-password': 'Choose a stronger password with at least 6 characters.',
    'auth/password-does-not-meet-requirements': 'This password does not meet the account requirements. Try a longer password with upper and lowercase letters, numbers, and symbols.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/network-request-failed': 'Unable to connect. Check your internet connection and try again.',
    'auth/unauthorized-domain': 'This local address is not authorized in Firebase Authentication settings.',
    'auth/user-disabled': 'This account is disabled. Contact the app administrator.',
  }
  return messages[error?.code] || 'Something went wrong. Please try again.'
}
