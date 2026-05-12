// Vercel imports the Express app instead of running server/index.js directly.
import app from '../server/index.js';

export default (req, res) => {
  const originalUrl = req.url || '';
  const pathname = originalUrl.split('?')[0];

  if (pathname === '/api' && originalUrl.includes('path=')) {
    // Vercel may invoke this as /api?path=...; normalize it so Express sees local-dev routes.
    const url = new URL(originalUrl, `http://${req.headers.host || 'localhost'}`);
    const path = url.searchParams.getAll('path').join('/');

    if (path) {
      url.searchParams.delete('path');
      const query = url.searchParams.toString();
      req.url = `/api/${path.replace(/^\/+/, '')}${query ? `?${query}` : ''}`;
    }
  }

  return app(req, res);
};