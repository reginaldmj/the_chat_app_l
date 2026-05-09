import React from 'react';
import ReactDOM from 'react-dom/client';

// Global CSS is imported once at the app entry point.
import './styles/globals.css';

import App from './App.jsx';

// Import AuthProvider
import { AuthProvider } from './contexts/AuthContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 
      Wrap App with AuthProvider
      so useAuth() works everywhere inside App.
    */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);