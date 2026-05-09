// ReactDOM connects React components to the real DOM element in index.html.
import React from 'react';
import ReactDOM from 'react-dom/client';

// Global CSS is imported once at the app entry point.
import './styles/globals.css';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
