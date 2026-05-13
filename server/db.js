// UUIDs make user ids unique without needing a database sequence.
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data.json');

const users = new Map();
const refreshTokens = new Set();
const conversations = new Map();
const messages = new Map();

function loadStore() {
  try {
    if (!fs.existsSync(DATA_FILE)) return;

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    (data.users || []).forEach((user) => {
      if (user?.id) users.set(user.id, user);
    });

    (data.refreshTokens || []).forEach((token) => {
      if (token) refreshTokens.add(token);
    });

    (data.conversations || []).forEach((conversation) => {
      if (conversation?.id) conversations.set(conversation.id, conversation);
    });

    (data.messages || []).forEach(([conversationId, conversationMessages]) => {
      if (conversationId && Array.isArray(conversationMessages)) {
        messages.set(conversationId, conversationMessages);
      }
    });
  } catch (error) {
    console.warn(`Unable to load local data store: ${error.message}`);
  }
}

function persistStore() {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify({
        users: [...users.values()],
        refreshTokens: [...refreshTokens],
        conversations: [...conversations.values()],
        messages: [...messages.entries()],
      }, null, 2),
    );
  } catch (error) {
    console.warn(`Unable to save local data store: ${error.message}`);
  }
}

loadStore();

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
  persistStore();
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
    persistStore();
  }
}
function safeUser(user) {
  // API responses must never include passwordHash.
  const { passwordHash, ...safe } = user;
  return safe;
}

function publicUser(user) {
  // Public profiles do not expose login details.
  const { passwordHash, email, ...profile } = user;
  return profile;
}

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
  persistStore();
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
    persistStore();
  }
}

function addMessage({ conversationId, senderId, text, attachment = null }) {
  if (!messages.has(conversationId)) messages.set(conversationId, []);

  const msg = {
    id: uuidv4(),
    conversationId,
    senderId,
    text,
    attachment,
    createdAt: new Date().toISOString(),
    read: false,
  };

  messages.get(conversationId).push(msg);
  touchConversation(conversationId);
  persistStore();
  return msg;
}

function getMessages(conversationId, limit = 50) {
  const all = messages.get(conversationId) || [];
  return all.slice(-limit);
}

function markRead(conversationId, userId) {
  const convoMessages = messages.get(conversationId) || [];
  convoMessages.forEach((message) => {
    if (message.senderId !== userId) message.read = true;
  });
  persistStore();
}

function unreadCount(conversationId, userId) {
  const convoMessages = messages.get(conversationId) || [];
  return convoMessages.filter((message) => message.senderId !== userId && !message.read).length;
}

function updateUser(id, updates = {}) {
  const user = users.get(id);
  if (!user) return null;

  if (updates.email && [...users.values()].some((entry) => entry.id !== id && entry.email === updates.email)) {
    throw new Error('Email already registered');
  }

  if (updates.username && [...users.values()].some((entry) => entry.id !== id && entry.username === updates.username)) {
    throw new Error('Username already taken');
  }

  const nextUser = {
    ...user,
    ...Object.fromEntries(
      // Empty strings mean "leave unchanged"; explicit clears would need a separate nullable path.
      Object.entries({
        username: updates.username,
        email: updates.email,
        displayName: updates.displayName,
        role: updates.role,
        avatarUrl: updates.avatarUrl,
      }).filter(([, value]) => typeof value === 'string' && value.trim())
    ),
  };

  users.set(id, nextUser);
  persistStore();
  return safeUser(nextUser);
}

function deleteUser(id) {
  const user = users.get(id);
  if (!user) return false;
  users.delete(id);
  persistStore();
  return true;
}

function addRefreshToken(token) {
  if (!token) return;
  refreshTokens.add(token);
  persistStore();
}

function deleteRefreshToken(token) {
  const deleted = refreshTokens.delete(token);
  if (deleted) persistStore();
  return deleted;
}

function hasRefreshToken(token) {
  return refreshTokens.has(token);
}


export {
  createUser,
  findUserByEmail,
  findUserById,
  getAllUsers,
  setUserOnline,
  safeUser,
  publicUser,
  refreshTokens,
  addMessage,
  getMessages,
  markRead,
  updateUser,
  deleteUser,
  addRefreshToken,
  deleteRefreshToken,
  hasRefreshToken,
};

export default {
  createUser,
  findUserByEmail,
  findUserById,
  getAllUsers,
  setUserOnline,
  safeUser,
  publicUser,
  refreshTokens,
  createConversation, 
  getConversation, 
  getConversationsForUser, 
  findDirectConversation, 
  touchConversation,
  addMessage,
  getMessages,
  markRead,
  updateUser,
  deleteUser,
  addRefreshToken,
  deleteRefreshToken,
  hasRefreshToken,
};
