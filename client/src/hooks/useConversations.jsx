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

export default function useConversations(user, navigate) {
  const [conversations, setConversations] = React.useState([]);
  const [conversationsLoading, setConversationsLoading] = React.useState(false);
  const [activeConvId, setActiveConvId] = React.useState(null);
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

  React.useEffect(() => {
    if (!user) {
      setConversations([]);
      setActiveConvId(null);
      return;
    }
    loadConversations();
  }, [loadConversations, user]);

  const selectConversation = React.useCallback((conversationId) => {
    if (!conversationId) return;
    setActiveConvId(conversationId);
    navigate('/messages');
  }, [navigate]);

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
    return created;
  }, [loadConversations, navigate]);

  return {
    conversations,
    conversationsLoading,
    activeConvId,
    modalUsers,
    modalLoading,
    loadConversations,
    selectConversation,
    openConversationModal,
    createConversation,
  };
}