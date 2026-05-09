import React from 'react';
import AuthPage from './pages/AuthPage.jsx';
import { useAuth } from './contexts/AuthContext.jsx';

export default function App() {
  const { authLoading, user, logout } = useAuth();

  if (authLoading) {
    return <main className="checkpoint-screen"><section className="checkpoint-card">Loading...</section></main>;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <main className="checkpoint-screen">
      <section className="checkpoint-card">
        <h1>Welcome, {user.displayName || user.username}</h1>
        <p>You are signed in.</p>
        <button type="button" onClick={logout}>Log out</button>
      </section>
    </main>
  );
}
