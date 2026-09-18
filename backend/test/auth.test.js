const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createAuthMiddleware } = require('../middleware/auth');

function response() {
  return { headers: {}, set(key, value) { this.headers[key] = value; return this; },
    status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

test('rejects missing and malformed authorization without invoking verifier', async () => {
  for (const header of [undefined, '', 'Basic secret', 'Bearer', 'Bearer ', 'Bearer a b', 'Bearer a,Bearer b']) {
    const req = { get: () => header };
    const res = response();
    await createAuthMiddleware(() => assert.fail('verifier must not run'))(req, res, () => assert.fail('next must not run'));
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { error: 'Unauthorized' });
    assert.equal(res.headers['WWW-Authenticate'], 'Bearer');
  }
});

test('exposes verified claims and UID only after successful verification', async () => {
  const claims = { uid: 'firebase-uid', email: 'person@example.com', email_verified: true };
  const req = { get: () => 'bearer token-value' };
  let called = 0;
  await createAuthMiddleware(async token => {
    assert.equal(token, 'token-value'); return claims;
  })(req, response(), () => called++);
  assert.equal(called, 1);
  assert.equal(req.auth, claims);
});

test('invalid, expired, revoked, disabled and failed verification return generic 401', async () => {
  for (const code of ['auth/argument-error', 'auth/id-token-expired', 'auth/id-token-revoked', 'auth/user-disabled', 'internal']) {
    const res = response();
    const req = { get: () => 'Bearer token-value' };
    await createAuthMiddleware(async () => { throw Object.assign(new Error('SECRET credentials'), { code }); })(
      req, res, () => assert.fail('next must not run'));
    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { error: 'Unauthorized' });
    assert.equal(req.auth, undefined);
  }
});

test('rejects verifier results without a valid UID', async () => {
  for (const claims of [null, {}, { uid: '' }, { uid: 3 }, { uid: 'x'.repeat(129) }]) {
    const res = response();
    await createAuthMiddleware(async () => claims)({ get: () => 'Bearer value' }, res, () => assert.fail());
    assert.equal(res.statusCode, 401);
  }
});
