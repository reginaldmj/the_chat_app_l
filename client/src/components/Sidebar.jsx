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
  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Members', path: '/members' },
    { label: 'Statuses', path: '/statuses' },
    { label: 'Messages', path: '/messages' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-hero-avatar" style={{ background: user.color || '#444' }}>
          <Avatar avatarUrl={user.avatarUrl} name={displayName} className="avatar-image" />
        </div>
        <strong>@{user.username || 'member'}</strong>
        <p>{user.role || 'Member'}</p>
      </div>

      <nav className="sidebar-primary-nav">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`sidebar-nav-item${location.pathname === item.path ? ' active' : ''}`}
            type="button"
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-conversations">
        <div className="sidebar-title-row">
          <h2>Messages</h2>
          <button className="new-chat-btn" type="button" onClick={onOpenModal}>+</button>
        </div>

        {conversationsLoading ? <div><span className="mini-spinner"></span></div> : null}

        {!conversationsLoading && conversations.length === 0 ? (
          <div className="sidebar-empty">No conversations yet.</div>
        ) : null}

        {!conversationsLoading ? conversations.map((conversation) => (
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
    </aside>
  );
}