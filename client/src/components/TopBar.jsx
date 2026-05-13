import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Avatar from './Avatar.jsx';

function getSearchPlaceholder(pathname) {
  if (pathname.startsWith('/profile')) return 'Search profile settings';
  if (pathname === '/members') return 'Search members';
  if (pathname === '/messages') return 'Search messages';
  return 'Search status updates';
}

export default function TopBar({ user, searchQuery, setSearchQuery, menuOpen, setMenuOpen, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = React.useRef(null);
  const displayName = user.displayName || user.username || 'Profile';

  React.useEffect(() => {
    function handlePointerDown(event) {
      if (!menuOpen) return;
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [menuOpen, setMenuOpen]);

  return (
    <header className="app-topbar">
      <label className="app-search">
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={getSearchPlaceholder(location.pathname)}
        />
      </label>

      <div className="app-user-menu" ref={menuRef}>
        <button className="app-user-chip" type="button" onClick={() => setMenuOpen((current) => !current)}>
          <span>{displayName}</span>
          <span className="app-user-avatar" style={{ background: user.color || '#444' }}>
            <Avatar avatarUrl={user.avatarUrl} name={displayName} className="avatar-image" />
          </span>
        </button>

        {menuOpen ? (
          <div className="app-dropdown">
            <button type="button" onClick={() => { setMenuOpen(false); navigate('/profile'); }}>Edit Profile</button>
            <button type="button" onClick={() => { setMenuOpen(false); onLogout(); }}>Log Out</button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
