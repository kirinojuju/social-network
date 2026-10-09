function createAuthMiddleware(verifyToken) {
  return async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    const header = req.get('Authorization');
    const match = typeof header === 'string' && /^Bearer ([^\s,]+)$/i.exec(header);
    const unauthorized = () => res.set('WWW-Authenticate', 'Bearer')
      .status(401).json({ error: 'Unauthorized' });
    if (!match) return unauthorized();
    try {
      const claims = await verifyToken(match[1]);
      if (!claims || typeof claims.uid !== 'string' || !claims.uid || claims.uid.length > 128) {
        return unauthorized();
      }
      req.auth = claims;
    } catch {
      return unauthorized();
    }
    return next();
  };
}

module.exports = { createAuthMiddleware };
