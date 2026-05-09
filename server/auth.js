// JWTs keep API requests stateless after login.
const jwt = require('jsonwebtoken');

// Defaults keep local demos runnable; deployed environments must override them so tokens are not forgeable.
const ACCESS_SECRET  = process.env.ACCESS_SECRET  || 'chat_access_secret_changeme';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'chat_refresh_secret_changeme';

// Access tokens are short-lived because they are sent on every protected API call.
function signAccess(payload)  { return jwt.sign(payload, ACCESS_SECRET,  { expiresIn: '15m' }); }

// Refresh tokens last longer so the user can stay signed in across page refreshes.
function signRefresh(payload) { return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d'  }); }

function verifyAccess(token)  { return jwt.verify(token, ACCESS_SECRET);  }
function verifyRefresh(token) { return jwt.verify(token, REFRESH_SECRET); }

function requireAuth(req, res, next) {
  // The client sends access tokens as Authorization: Bearer <token>.
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' });
  }

  try {
    // Attach the verified payload so route handlers know the current user id.
    req.user = verifyAccess(header.slice(7));
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh, requireAuth };