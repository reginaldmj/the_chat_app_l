// Load .env values before any code reads process.env.
import dotenv from 'dotenv';
dotenv.config();

// Express handles HTTP routes; CORS allows the Vite dev server to call the API.
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import convRoutes from './routes/convRoutes.js';


const app = express();
const PORT = process.env.PORT || 3001;

// Allow local frontend origins plus optional extra origins from env.
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  ...(process.env.CORS_ORIGIN || '').split(',').map((origin) => origin.trim()).filter(Boolean),
].map((origin) => origin.replace(/\/$/, ''));

function isSameHostOrigin(origin, host) {
  if (!origin || !host) return false;

  try {
    return new URL(origin).host === String(host).trim();
  } catch {
    return false;
  }
}

function getForwardedHosts(req) {
  return [
    req.headers.host,
    req.headers['x-forwarded-host'],
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim())
    .filter(Boolean);
}

app.use((req, res, next) => {
  cors({
    origin(origin, callback) {
      // Browserless tools like curl send no origin, so allow them for local testing.
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin = origin.replace(/\/$/, '');
      const isSameOriginRequest = getForwardedHosts(req)
        .some((host) => isSameHostOrigin(normalizedOrigin, host));

      if (allowedOrigins.includes(normalizedOrigin) || isSameOriginRequest) {
        callback(null, true);
        return;
      }

      const error = new Error('Not allowed by CORS');
      error.status = 403;
      callback(error);
    },
    credentials: true,
  })(req, res, next);
});

// Parse JSON request bodies for every route that follows.
// Image attachments are sent as data URLs in this demo, so allow larger JSON bodies.
app.use(express.json({ limit: '10mb' }));

// Auth routes must mount before the 404 handler.
app.use('/api/auth', authRoutes);

// Protected user lookup powers the Members page and new chat modal.
app.use('/api/users', userRoutes);

// Conversations power the sidebar and messages page.
app.use('/api/conversations', convRoutes);

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
  const status = err.status || err.statusCode || 500;
  const message = status === 403
    ? 'Origin not allowed'
    : status >= 500
      ? 'Internal server error'
      : err.message || 'Request failed';

  if (status >= 500) console.error(err);
  res.status(status).json({ error: message });
});

// Start the local API when this file is run directly.
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`chat server running on http://localhost:${PORT}`);
  });
}

export default app;
