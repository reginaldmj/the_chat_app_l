import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import './styles/auth.css';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
