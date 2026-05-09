import React from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AuthPage() {
  const {
    authMode,
    switchAuthMode,
    authSubmitting,
    authError,
    authForm,
    setAuthForm,
    submitAuth,
  } = useAuth();

  const isRegister = authMode === 'register';

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submitAuth();
  };

  return (
    <div className="auth-shell">
      <section className="auth-panel">
        <div className="auth-brand">
          <div className="auth-logo-icon">C</div>
          <span>chat</span>
        </div>

        <div className="auth-copy">
          <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
          <p>{isRegister ? 'Join your workspace.' : 'Sign in to continue.'}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister ? (
            <>
              <div className="field-group">
                <label htmlFor="auth-username">Username</label>
                <input id="auth-username" required value={authForm.username} onChange={(event) => setAuthForm((current) => ({ ...current, username: event.target.value }))} />
              </div>

              <div className="field-row">
                <div className="field-group">
                  <label htmlFor="auth-display-name">Display Name</label>
                  <input id="auth-display-name" value={authForm.displayName} onChange={(event) => setAuthForm((current) => ({ ...current, displayName: event.target.value }))} />
                </div>
                <div className="field-group">
                  <label htmlFor="auth-role">Role</label>
                  <input id="auth-role" value={authForm.role} onChange={(event) => setAuthForm((current) => ({ ...current, role: event.target.value }))} />
                </div>
              </div>
            </>
          ) : null}

          <div className="field-group">
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" type="email" required value={authForm.email} onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))} />
          </div>

          <div className="field-group">
            <label htmlFor="auth-password">Password</label>
            <input id="auth-password" type="password" required value={authForm.password} onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))} />
            {isRegister ? <span className="field-hint">Minimum 6 characters</span> : null}
          </div>

          {authError ? <div className="auth-error">{authError}</div> : null}

          <button className="auth-submit" type="submit" disabled={authSubmitting}>
            {authSubmitting ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <div className="auth-switch">
          {isRegister ? 'Already have an account? ' : "Don't have an account? "}
          <button type="button" onClick={() => switchAuthMode(isRegister ? 'login' : 'register')}>
            {isRegister ? 'Sign in' : 'Register'}
          </button>
        </div>
      </section>
    </div>
  );
}