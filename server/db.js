// UUIDs make user ids unique without needing a database sequence.
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Demo storage is process-local; data and token revocation do not survive restarts or scale across instances.
const users = new Map();
const refreshTokens = new Set();

async function createUser({ username, email, password, displayName, role, color }) {
  // Uniqueness checks live beside storage so every auth route gets the same rule.
  if ([...users.values()].find((user) => user.email === email)) {
    throw new Error('Email already registered');
  }
  if ([...users.values()].find((user) => user.username === username)) {
    throw new Error('Username already taken');
  }

  // Store only a password hash, never the raw password.
  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();
  const colors = ['#1a9e75', '#534AB7', '#185FA5', '#D85A30', '#993556', '#BA7517'];

  const user = {
    id,
    username,
    email,
    passwordHash: hash,
    displayName: displayName || username,
    role: role || 'Member',
    color: color || colors[Math.floor(Math.random() * colors.length)],
    avatarUrl: null,
    online: false,
    createdAt: new Date().toISOString(),
  };

  users.set(id, user);
  return safeUser(user);
}

async function findUserByEmail(email) {
  return [...users.values()].find((user) => user.email === email) || null;
}

function findUserById(id) {
  return users.get(id) || null;
}

function getAllUsers() {
  return [...users.values()].map(safeUser);
}

function setUserOnline(id, online) {
  const user = users.get(id);
  if (user) {
    user.online = online;
    users.set(id, user);
  }
}

function safeUser(user) {
  // API responses must never include passwordHash.
  const { passwordHash, ...safe } = user;
  return safe;
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  getAllUsers,
  setUserOnline,
  safeUser,
  refreshTokens,
};