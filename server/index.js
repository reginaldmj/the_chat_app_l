// Load .env values before any code reads process.env.
require('dotenv').config();

// Express handles HTTP routes; CORS allows the Vite dev server to call the API.
const express = require('express');
const cors = require('cors');

// Create one app instance for the local API server.
const app = express();
const PORT = process.env.PORT || 3001;

// Allow local frontend origins plus optional extra origins from env.
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  ...(process.env.CORS_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean),
];

app.use(cors({
  origin(origin, callback) {
    // Browserless tools like curl send no origin, so allow them for local testing.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Parse JSON request bodies for every route that follows.
app.use(express.json());

// Auth routes must mount before the 404 handler.
app.use('/api/auth', require('./routes/authRoutes'));


// A tiny route gives us a quick backend smoke test.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Unknown API paths should return JSON instead of an HTML error page.
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Keep unexpected errors from leaking stack traces to the browser.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the local API when this file is run directly.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`chat server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
