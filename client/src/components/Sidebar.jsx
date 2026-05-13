import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import { getConversationName } from '../hooks/useConversations.jsx';

export default function Sidebar({
  user,
  conversations,
  conversationsLoading,
  activeConvId,
  onSelectConversation,
  onOpenModal,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const displayName = user.displayName || user.username || 'Member';
  const [conversationSearch, setConversationSearch] = React.useState('');
  const navItems = [
    { label: 'Home', path: '/', icon: 'H' },
    { label: 'Members', path: '/members', icon: 'M' },
    { label: 'Statuses', path: '/statuses', icon: 'S' },
    { label: 'Messages', path: '/messages', icon: 'C' },
  ];
  const filteredConversations = React.useMemo(() => {
    const query = conversationSearch.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) => (
      getConversationName(conversation, user).toLowerCase().includes(query)
    ));
  }, [conversationSearch, conversations, user]);

  return (
    <aside className="sidebar">
      <div className="sidebar-rail" aria-hidden="true">
        <span className="sidebar-rail-avatar" style={{ background: user.color || '#444' }}>
          <Avatar avatarUrl={user.avatarUrl} name={displayName} className="avatar-image" />
        </span>
        <span className="sidebar-rail-exit"></span>
      </div>

      <div className="sidebar-panel">
        <div className="sidebar-header">
          <div className="sidebar-hero-avatar" style={{ background: user.color || '#444' }}>
            <Avatar avatarUrl={user.avatarUrl} name={displayName} className="avatar-image" />
          </div>
          <div className="sidebar-profile-copy">
            <strong>@{user.username || 'member'}</strong>
            <span className="sidebar-status">active right now</span>
            <p>{user.role || 'Member'}</p>
          </div>
        </div>

        <nav className="sidebar-primary-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`sidebar-nav-item${location.pathname === item.path ? ' active' : ''}`}
              type="button"
              onClick={() => navigate(item.path)}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-conversations">
          <span className="sidebar-section-kicker">Chat</span>
          <div className="sidebar-title-row">
            <h2>Messages</h2>
            <button className="new-chat-btn" type="button" onClick={onOpenModal}>+</button>
          </div>

          <label className="sidebar-chat-search">
            <input
              value={conversationSearch}
              onChange={(event) => setConversationSearch(event.target.value)}
              placeholder="Search chats"
            />
          </label>

          {conversationsLoading ? <div><span className="mini-spinner"></span></div> : null}

          {!conversationsLoading && filteredConversations.length === 0 ? (
            <div className="sidebar-empty">{conversationSearch.trim() ? 'No chats match.' : 'No conversations yet.'}</div>
          ) : null}

          {!conversationsLoading ? filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              className={`convo-item${activeConvId === conversation.id ? ' active' : ''}`}
              type="button"
              onClick={() => onSelectConversation(conversation.id)}
            >
              <span>{conversation.isGroup ? '#' : getConversationName(conversation, user)}</span>
            </button>
          )) : null}
        </div>
      </div>
    </aside>
  );
}
