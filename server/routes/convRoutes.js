import express from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db.js";
import { requireAuth } from "../auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", (req, res) => {
  const convs = db.getConversationsForUser(req.user.id);

  const result = convs
    .map((conv) => {
      const members = conv.participants
        .map((uid) => {
          const user = db.findUserById(uid);
          return user ? db.safeUser(user) : null;
        })
        .filter(Boolean);

      let name = conv.name;
      let color = "#185FA5";
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
    })
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  res.json(result);
});

router.post("/", (req, res) => {
  const { participantIds, name, isGroup } = req.body;
  if (!participantIds || !Array.isArray(participantIds)) {
    return res.status(400).json({ error: "participantIds array required" });
  }

  if (!isGroup && participantIds.length === 1) {
    const existing = db.findDirectConversation(req.user.id, participantIds[0]);
    if (existing) return res.json(existing);
  }

  const all = [...new Set([req.user.id, ...participantIds])];
  const conv = db.createConversation({
    participants: all,
    name,
    isGroup: !!isGroup,
  });
  res.status(201).json(conv);
});

router.get("/:id/messages", (req, res) => {
  const conv = db.getConversation(req.params.id);
  if (!conv) return res.status(404).json({ error: "Not found" });
  if (!conv.participants.includes(req.user.id))
    return res.status(403).json({ error: "Forbidden" });

  // Opening a thread is the read-receipt boundary; clients refresh the list afterward to clear badges.
  db.markRead(req.params.id, req.user.id);

  const msgs = db.getMessages(req.params.id, 50).map((message) => {
    const sender = db.findUserById(message.senderId);
    return {
      id: message.id,
      text: message.text,
      attachment: message.attachment || null,
      senderId: message.senderId,
      senderName: sender ? sender.displayName : "Unknown",
      senderColor: sender ? sender.color : "#888",
      senderAvatarUrl: sender ? sender.avatarUrl || null : null,
      createdAt: message.createdAt,
      time: formatTime(message.createdAt),
      mine: message.senderId === req.user.id,
    };
  });

  res.json(msgs);
});

router.post("/:id/messages", (req, res) => {
  const conv = db.getConversation(req.params.id);
  if (!conv) return res.status(404).json({ error: "Not found" });
  if (!conv.participants.includes(req.user.id))
    return res.status(403).json({ error: "Forbidden" });

  const { text, attachment } = req.body;
  const trimmedText = typeof text === "string" ? text.trim() : "";

  // Inline attachments keep the demo self-contained; production should validate size/type and store bytes externally.
  const normalizedAttachment =
    attachment && typeof attachment === "object"
      ? {
          name: attachment.name || "Attachment",
          type: attachment.type || "application/octet-stream",
          size: Number(attachment.size) || 0,
          dataUrl: attachment.dataUrl || "",
        }
      : null;

  if (!trimmedText && !normalizedAttachment) {
    return res.status(400).json({ error: "text or attachment is required" });
  }

  const msg = db.addMessage({
    conversationId: conv.id,
    senderId: req.user.id,
    text: trimmedText,
    attachment: normalizedAttachment,
  });
  const sender = db.findUserById(msg.senderId);

  res.status(201).json({
    id: msg.id,
    text: msg.text,
    attachment: msg.attachment || null,
    senderId: msg.senderId,
    senderName: sender ? sender.displayName : "Unknown",
    senderColor: sender ? sender.color : "#888",
    senderAvatarUrl: sender ? sender.avatarUrl || null : null,
    createdAt: msg.createdAt,
    time: formatTime(msg.createdAt),
    mine: true,
  });
});

function formatTime(iso) {
  const date = new Date(iso);
  const now = new Date();
  const day = 86400000;
  if (now - date < day && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  if (now - date < 2 * day) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export default router;
