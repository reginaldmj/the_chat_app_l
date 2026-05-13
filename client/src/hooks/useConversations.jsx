import React from "react";
import { convApi, userApi } from "../utils/api";
import { resizeImageFile } from "../utils/images";

export function getConversationName(conversation, user) {
  if (!conversation) return "Unknown conversation";
  if (conversation.name) return conversation.name;
  if (!conversation.isGroup) {
    const otherMember = conversation.members?.find(
      (member) => member.id !== user?.id,
    );
    return (
      otherMember?.displayName ||
      otherMember?.username ||
      "Unknown conversation"
    );
  }
  return "Unnamed group";
}

export function getFilteredMessages(messages, query) {
  const value = query.trim().toLowerCase();
  if (!value) return messages;
  return messages.filter((message) =>
    (message.text || "").toLowerCase().includes(value) ||
      (message.attachment?.name || "").toLowerCase().includes(value),
  );
}

export function groupMessages(messages) {
  return messages.reduce((groups, message) => {
    const previousGroup = groups[groups.length - 1];
    const previousMessage =
      previousGroup?.messages?.[previousGroup.messages.length - 1];

    // The five-minute window is a presentation choice; messages stay ordered by server time.
    const sameRun =
      previousMessage &&
      previousMessage.senderId === message.senderId &&
      new Date(message.createdAt) - new Date(previousMessage.createdAt) <
        5 * 60 * 1000;

    if (sameRun) {
      previousGroup.messages.push(message);
      return groups;
    }

    groups.push({
      senderId: message.senderId,
      senderName: message.senderName,
      senderColor: message.senderColor,
      senderAvatarUrl: message.senderAvatarUrl,
      mine: message.mine,
      messages: [message],
    });
    return groups;
  }, []);
}

function uniqueUsers(users, currentUserId) {
  const seen = new Set();

  return (Array.isArray(users) ? users : []).filter((user) => {
    if (!user?.id || user.id === currentUserId || seen.has(user.id)) {
      return false;
    }

    seen.add(user.id);
    return true;
  });
}

export default function useConversations(user, navigate) {
  const [conversations, setConversations] = React.useState([]);
  const [conversationsLoading, setConversationsLoading] = React.useState(false);
  const [activeConvId, setActiveConvId] = React.useState(null);
  const [messagesByConversation, setMessagesByConversation] = React.useState(
    {},
  );
  const [messagesLoading, setMessagesLoading] = React.useState(false);
  const [sendingMessage, setSendingMessage] = React.useState(false);
  const [modalUsers, setModalUsers] = React.useState([]);
  const [modalLoading, setModalLoading] = React.useState(false);
  const [modalError, setModalError] = React.useState("");

  const loadConversations = React.useCallback(
    async ({ silent = false } = {}) => {
      if (!user) return;
      if (!silent) setConversationsLoading(true);
      try {
        const next = await convApi.list();
        setConversations(next);
        setActiveConvId((current) =>
          next.some((conversation) => conversation.id === current)
            ? current
            : next[0]?.id || null,
        );
      } catch {
        setConversations([]);
      } finally {
        if (!silent) setConversationsLoading(false);
      }
    },
    [user],
  );

  const loadMessages = React.useCallback(async (conversationId) => {
    if (!conversationId) return;
    setMessagesLoading(true);
    try {
      const messages = await convApi.messages(conversationId);
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: messages,
      }));
    } catch {
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: [],
      }));
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!user) {
      setConversations([]);
      setActiveConvId(null);
      setMessagesByConversation({});
      return;
    }
    loadConversations();
  }, [loadConversations, user]);

  const selectConversation = React.useCallback(
    async (conversationId) => {
      if (!conversationId) return;
      setActiveConvId(conversationId);
      navigate("/messages");
      await loadMessages(conversationId);
      // Loading messages marks them read on the server, so refresh the list to update unread badges.
      await loadConversations({ silent: true });
    },
    [loadConversations, loadMessages, navigate],
  );

  const openConversationModal = React.useCallback(async (usersFallback = []) => {
    const fallbackUsers = uniqueUsers(usersFallback, user?.id);

    setModalError("");
    setModalUsers(fallbackUsers);
    setModalLoading(true);
    try {
      const registeredUsers = uniqueUsers(await userApi.list(), user?.id);
      setModalUsers(uniqueUsers([...fallbackUsers, ...registeredUsers], user?.id));
    } catch (error) {
      setModalError(error.message || "Unable to load registered users.");
      if (fallbackUsers.length === 0) setModalUsers([]);
    } finally {
      setModalLoading(false);
    }
  }, [user?.id]);

  const createConversation = React.useCallback(
    async ({ participantIds, name, isGroup }) => {
      const created = await convApi.create({ participantIds, name, isGroup });
      await loadConversations({ silent: true });
      setActiveConvId(created.id);
      navigate("/messages");
      await loadMessages(created.id);
      return created;
    },
    [loadConversations, loadMessages, navigate],
  );

  const sendMessage = React.useCallback(
    async (conversationId, text, attachment = null) => {
      const trimmedText = text.trim();
      if (!conversationId || (!trimmedText && !attachment) || sendingMessage)
        return false;
      setSendingMessage(true);
      try {
        const message = await convApi.sendMessage(conversationId, {
          text: trimmedText,
          attachment,
        });
        setMessagesByConversation((current) => ({
          ...current,
          [conversationId]: [...(current[conversationId] || []), message],
        }));
        await loadConversations({ silent: true });
        return true;
      } finally {
        setSendingMessage(false);
      }
    },
    [loadConversations, sendingMessage],
  );

  const unreadTotal = React.useMemo(
    () =>
      conversations.reduce(
        (sum, conversation) => sum + (conversation.unread || 0),
        0,
      ),
    [conversations],
  );

  const prepareAttachment = React.useCallback(async (file) => {
    if (!file) return null;
    if (!file.type?.startsWith("image/")) return null;
    const resized = await resizeImageFile(file);
    return {
      name: file.name,
      type: resized.type,
      size: resized.size,
      dataUrl: resized.dataUrl,
    };
  }, []);

  return {
    conversations,
    conversationsLoading,
    activeConvId,
    messagesByConversation,
    messagesLoading,
    sendingMessage,
    modalUsers,
    modalLoading,
    modalError,
    unreadTotal,
    loadConversations,
    loadMessages,
    selectConversation,
    openConversationModal,
    createConversation,
    sendMessage,
    prepareAttachment,
  };
}
