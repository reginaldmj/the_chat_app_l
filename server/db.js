// UUIDs make user ids unique without needing a database sequence.
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

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

const conversations = new Map();

function createConversation({ participants, name, isGroup }) {
  const id = uuidv4();
  const conv = {
    id,
    name: name || null,
    isGroup: !!isGroup,
    participants,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  conversations.set(id, conv);
  return conv;
}

function getConversation(id) {
  return conversations.get(id) || null;
}

function getConversationsForUser(userId) {
  return [...conversations.values()].filter((conversation) => conversation.participants.includes(userId));
}

function findDirectConversation(userA, userB) {
  // Direct conversations should be reused instead of duplicated.
  return [...conversations.values()].find(
    (conversation) => !conversation.isGroup
      && conversation.participants.includes(userA)
      && conversation.participants.includes(userB)
  ) || null;
}

function touchConversation(id) {
  const conversation = conversations.get(id);
  if (conversation) {
    conversation.updatedAt = new Date().toISOString();
    conversations.set(id, conversation);
  }
}



export {
  createUser,
  findUserByEmail,
  findUserById,
  getAllUsers,
  setUserOnline,
  safeUser,
  refreshTokens,
};

export default {
  createUser,
  findUserByEmail,
  findUserById,
  getAllUsers,
  setUserOnline,
  safeUser,
  refreshTokens,
  createConversation, 
  getConversation, 
  getConversationsForUser, 
  findDirectConversation, 
  touchConversation
};