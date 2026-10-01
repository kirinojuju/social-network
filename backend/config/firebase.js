const { applicationDefault, getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Lazy initialization keeps health checks and unit tests independent of credentials.
async function verifyFirebaseToken(token) {
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error('Auth emulator is not supported by this server');
  }
  const name = 'social-network';
  const app = getApps().find(item => item.name === name) || initializeApp({
    credential: applicationDefault(),
    ...(process.env.FIREBASE_PROJECT_ID ? { projectId: process.env.FIREBASE_PROJECT_ID } : {}),
  }, name);
  // Signature, issuer, audience and expiry are verified without an Admin API call.
  // Revocation checks require Admin credentials and can be enabled explicitly.
  return getAuth(app).verifyIdToken(token, process.env.FIREBASE_CHECK_REVOKED === 'true');
}

module.exports = { verifyFirebaseToken };
