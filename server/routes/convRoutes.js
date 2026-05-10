import express from 'express';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', (req, res) => {
  const convs = db.getConversationsForUser(req.user.id);

  const result = convs.map((conv) => {
    const members = conv.participants
      .map((uid) => {
        const user = db.findUserById(uid);
        return user ? db.safeUser(user) : null;
      })
      .filter(Boolean);

    let name = conv.name;
    let color = '#185FA5';
    let online = false;
    let avatarUrl = null;

    if (!conv.isGroup) {
      const other = members.find((member) => member.id !== req.user.id);
      if (other) {
        name = other.displayName;
        color = other.color;
        online = other.online;
        avatarUrl = other.avatarUrl || null;
      }
    }

    return {
      id: conv.id,
      name,
      isGroup: conv.isGroup,
      color,
      avatarUrl,
      online,
      unread: 0,
      members,
      lastMessage: null,
      updatedAt: conv.updatedAt,
    };
  }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  res.json(result);
});

router.post('/', (req, res) => {
  const { participantIds, name, isGroup } = req.body;
  if (!participantIds || !Array.isArray(participantIds)) {
    return res.status(400).json({ error: 'participantIds array required' });
  }

  if (!isGroup && participantIds.length === 1) {
    const existing = db.findDirectConversation(req.user.id, participantIds[0]);
    if (existing) return res.json(existing);
  }

  const all = [...new Set([req.user.id, ...participantIds])];
  const conv = db.createConversation({ participants: all, name, isGroup: !!isGroup });
  res.status(201).json(conv);
});

export default router;