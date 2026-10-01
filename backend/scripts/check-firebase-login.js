const path = require('node:path');
const fs = require('node:fs');
const { randomBytes, randomUUID } = require('node:crypto');
const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env'), quiet: true });

async function main() {
  const webConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '../../frontend/.env')));
  if (!webConfig.VITE_FIREBASE_API_KEY ||
      webConfig.VITE_FIREBASE_PROJECT_ID !== process.env.FIREBASE_PROJECT_ID ||
      !process.env.MIGRATION_DATABASE_URL ||
      !['localhost', '127.0.0.1'].includes(new URL(process.env.MIGRATION_DATABASE_URL).hostname)) {
    throw new Error('Matching local Firebase and database configuration required');
  }
  const suffix = randomUUID().replace(/-/g, '');
  const email = `codex-check-${suffix}@example.invalid`;
  const password = `${randomBytes(24).toString('base64url')}Aa1!`;
  const endpoint = method => `https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${webConfig.VITE_FIREBASE_API_KEY}`;
  async function authRequest(method, body) {
    const response = await fetch(endpoint(method), { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(`Firebase ${method} failed: ${data.error?.message || response.status}`);
    return data;
  }
  let account;
  let token;
  try {
    account = await authRequest('signUp', { email, password, returnSecureToken: true });
    token = account.idToken;
    const login = await authRequest('signInWithPassword', { email, password, returnSecureToken: true });
    token = login.idToken;
    if (login.localId !== account.localId) throw new Error('Login returned a different UID');
    const response = await fetch('http://127.0.0.1:3000/api/users/ensure', {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (!response.ok) throw new Error(`Backend rejected Firebase sign-in: HTTP ${response.status}`);
    const { user } = await response.json();
    if (user.firebase_uid !== account.localId || user.email !== email) {
      throw new Error('Backend profile did not match Firebase identity');
    }
    console.log('Live Firebase signup, login, and backend profile verification passed.');
  } finally {
    if (account) {
      const owner = new Client({ connectionString: process.env.MIGRATION_DATABASE_URL });
      try {
        await owner.connect();
        await owner.query('DELETE FROM public.users WHERE firebase_uid = $1', [account.localId]);
      } finally {
        await owner.end().catch(() => {});
        await authRequest('delete', { idToken: token });
        console.log('Firebase and PostgreSQL test account cleanup complete.');
      }
    }
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
