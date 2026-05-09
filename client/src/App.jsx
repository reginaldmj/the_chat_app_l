import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import ActivityPage from './pages/ActivityPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import MembersPage from './pages/MembersPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import StatusesPage from './pages/StatusesPage.jsx';

export default function App() {
  const { authLoading, user } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setMenuOpen(false);
    setSearchQuery('');
  }, [location.pathname]);

  if (authLoading) return <main className="checkpoint-screen"><section className="checkpoint-card">Loading...</section></main>;
  if (!user) return <AuthPage />;

  const sharedProps = { user, searchQuery, setSearchQuery, menuOpen, setMenuOpen };

  return (
    <Layout {...sharedProps}>
      <Routes>
        <Route path="/" element={<ActivityPage {...sharedProps} />} />
        <Route path="/members" element={<MembersPage {...sharedProps} />} />
        <Route path="/statuses" element={<StatusesPage {...sharedProps} />} />
        <Route path="/messages" element={<MessagesPage {...sharedProps} />} />
        <Route path="/profile" element={<ProfilePage {...sharedProps} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}