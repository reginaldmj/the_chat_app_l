const express = require('express');
const bcrypt  = require('bcryptjs');
const db      = require('../db');
const { signAccess, signRefresh, verifyRefresh, requireAuth } = require('../auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, displayName, role } = req.body;

    // Validate the minimum fields before doing any storage work.
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await db.createUser({ username, email, password, displayName, role });
    const accessToken  = signAccess({ id: user.id, username: user.username });
    const refreshToken = signRefresh({ id: user.id });

    // The allowlist lets logout revoke refresh tokens in this in-memory demo.
    db.refreshTokens.add(refreshToken);
    res.status(201).json({ user, accessToken, refreshToken });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await db.findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    db.setUserOnline(user.id, true);
    const safe = db.safeUser(user);
    const accessToken  = signAccess({ id: safe.id, username: safe.username });
    const refreshToken = signRefresh({ id: safe.id });
    db.refreshTokens.add(refreshToken);
    res.json({ user: safe, accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken || !db.refreshTokens.has(refreshToken)) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  try {
    const payload = verifyRefresh(refreshToken);
    // Refresh tokens are not rotated; the allowlist only supports logout/expiry revocation in this demo.
    const accessToken = signAccess({ id: payload.id, username: payload.username });
    res.json({ accessToken });
  } catch {
    db.refreshTokens.delete(refreshToken);
    res.status(401).json({ error: 'Refresh token expired' });
  }
});

router.post('/logout', requireAuth, (req, res) => {
  // The client sends the refresh token so logout can revoke it.
  const { refreshToken } = req.body;
  db.refreshTokens.delete(refreshToken);
  db.setUserOnline(req.user.id, false);
  res.json({ message: 'Logged out' });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(db.safeUser(user));
});

module.exports = router;
