import type { Request, Response } from 'express';
import app from '../server.js';

/**
 * Vercel rewrites /api/<path> to this concrete function and supplies the
 * original path as __express_path. Restore the Express URL while retaining
 * the caller's query string so existing routes see their original request.
 */
export default function handler(req: Request, res: Response) {
  const incoming = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const expressPath = incoming.searchParams.get('__express_path');

  if (expressPath !== null) {
    incoming.searchParams.delete('__express_path');
    const routePath = expressPath.replace(/^\/+/, '');
    const query = incoming.searchParams.toString();
    req.url = `/api/${routePath}${query ? `?${query}` : ''}`;
  }

  return app(req, res);
}
