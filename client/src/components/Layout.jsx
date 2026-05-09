import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Layout({ children, user, searchQuery, setSearchQuery, menuOpen, setMenuOpen }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = React.useCallback(async () => {
    await logout();
    navigate('/');
  }, [logout, navigate]);

  return (
    <div className="app">
      <Sidebar user={user} />
      <section className="workspace-shell">
        <TopBar
          user={user}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          onLogout={handleLogout}
        />
        <main className="workspace-page">
          {children}
        </main>
      </section>
    </div>
  );
}