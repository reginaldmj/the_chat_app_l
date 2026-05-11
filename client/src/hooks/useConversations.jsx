import React from 'react';
import { convApi, userApi } from '../utils/api';

export function getConversationName(conversation, user) {
  if (!conversation) return 'Unknown conversation';
  if (conversation.name) return conversation.name;
  if (!conversation.isGroup) {
    const otherMember = conversation.members?.find((member) => member.id !== user?.id);
    return otherMember?.displayName || otherMember?.username || 'Unknown conversation';
  }
  return 'Unnamed group';
}

export function getFilteredMessages(messages, query) {
  const value = query.trim().toLowerCase();
  if (!value) return messages;
  return messages.filter((message) => (message.text || '').toLowerCase().includes(value));
}

export function groupMessages(messages) {
  return messages.reduce((groups, message) => {
    const previousGroup = groups[groups.length - 1];
    const previousMessage = previousGroup?.messages?.[previousGroup.messages.length - 1];

    // The five-minute window is a presentation choice; messages stay ordered by server time.
    const sameRun = previousMessage
      && previousMessage.senderId === message.senderId
      && new Date(message.createdAt) - new Date(previousMessage.createdAt) < 5 * 60 * 1000;

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

export default function useConversations(user, navigate) {
  const [conversations, setConversations] = React.useState([]);
  const [conversationsLoading, setConversationsLoading] = React.useState(false);
  const [activeConvId, setActiveConvId] = React.useState(null);
  const [messagesByConversation, setMessagesByConversation] = React.useState({});
  const [messagesLoading, setMessagesLoading] = React.useState(false);
  const [sendingMessage, setSendingMessage] = React.useState(false);
  const [modalUsers, setModalUsers] = React.useState([]);
  const [modalLoading, setModalLoading] = React.useState(false);

  const loadConversations = React.useCallback(async ({ silent = false } = {}) => {
    if (!user) return;
    if (!silent) setConversationsLoading(true);
    try {
      const next = await convApi.list();
      setConversations(next);
      setActiveConvId((current) => (next.some((conversation) => conversation.id === current) ? current : (next[0]?.id || null)));
    } catch {
      setConversations([]);
    } finally {
      if (!silent) setConversationsLoading(false);
    }
  }, [user]);

  const loadMessages = React.useCallback(async (conversationId) => {
    if (!conversationId) return;
    setMessagesLoading(true);
    try {
      const messages = await convApi.messages(conversationId);
      setMessagesByConversation((current) => ({ ...current, [conversationId]: messages }));
    } catch {
      setMessagesByConversation((current) => ({ ...current, [conversationId]: [] }));
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

  const selectConversation = React.useCallback(async (conversationId) => {
    if (!conversationId) return;
    setActiveConvId(conversationId);
    navigate('/messages');
    await loadMessages(conversationId);
    // Loading messages marks them read on the server, so refresh the list to update unread badges.
    await loadConversations({ silent: true });
  }, [loadConversations, loadMessages, navigate]);

  const openConversationModal = React.useCallback(async () => {
    setModalLoading(true);
    try {
      setModalUsers(await userApi.list());
    } catch {
      setModalUsers([]);
    } finally {
      setModalLoading(false);
    }
  }, []);

  const createConversation = React.useCallback(async ({ participantIds, name, isGroup }) => {
    const created = await convApi.create({ participantIds, name, isGroup });
    await loadConversations({ silent: true });
    setActiveConvId(created.id);
    navigate('/messages');
    await loadMessages(created.id);
    return created;
  }, [loadConversations, loadMessages, navigate]);

  const sendMessage = React.useCallback(async (conversationId, text) => {
    const trimmedText = text.trim();
    if (!conversationId || !trimmedText || sendingMessage) return false;
    setSendingMessage(true);
    try {
      const message = await convApi.sendMessage(conversationId, { text: trimmedText });
      setMessagesByConversation((current) => ({
        ...current,
        [conversationId]: [...(current[conversationId] || []), message],
      }));
      await loadConversations({ silent: true });
      return true;
    } finally {
      setSendingMessage(false);
    }
  }, [loadConversations, sendingMessage]);

  const unreadTotal = React.useMemo(
    () => conversations.reduce((sum, conversation) => sum + (conversation.unread || 0), 0),
    [conversations],
  );

  return {
    conversations,
    conversationsLoading,
    activeConvId,
    messagesByConversation,
    messagesLoading,
    sendingMessage,
    modalUsers,
    modalLoading,
    unreadTotal,
    loadConversations,
    loadMessages,
    selectConversation,
    openConversationModal,
    createConversation,
    sendMessage,
  };
}