import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Avatar from './Avatar.jsx';

export default function Sidebar({ user }) {
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
    </aside>
  );
}