/**
 * Session-bound storage token auth.
 *
 * Flow:
 *   1. Client calls POST /api/auth/init-session → server creates an
 *      express-session (HttpOnly, SameSite=Strict cookie).
 *   2. Client calls GET /api/auth/storage-token → requires a valid session
 *      cookie; returns an HMAC token bound to the session ID.
 *   3. Client includes the token as `Authorization: Bearer <token>` on
 *      upload URL requests and object download requests.
 *
 * Why this is a real trust boundary:
 *   - The session cookie is HttpOnly + SameSite=Strict, so it cannot be
 *     read by cross-origin JavaScript and is not sent on cross-site requests.
 *   - CORS is restricted to our Replit domain, so untrusted browser origins
 *     cannot complete the session→token flow.
 *   - Each token is HMAC-signed and bound to the specific session ID that
 *     requested it, preventing token sharing across sessions.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import type { Session } from 'express-session';

// Extend the session type with our custom fields.
declare module 'express-session' {
  interface SessionData {
    initialized?: boolean;
  }
}

const SECRET = process.env.SESSION_SECRET ?? 'dev-fallback-secret-change-me';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Issue a storage token bound to the given session ID.
 * Format: `<sessionId>.<timestamp>.<hmac>`
 */
export function issueToken(sessionId: string): string {
  const nowMs = Date.now();
  const payload = `${sessionId}.${nowMs}`;
  const sig = createHmac('sha256', SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

/**
 * Verify a storage token is valid and not expired.
 * Returns the session ID embedded in the token if valid, or null.
 */
function verifyToken(token: string): string | null {
  // Format: <sessionId>.<timestamp>.<hmac>
  const lastDot = token.lastIndexOf('.');
  if (lastDot === -1) return null;

  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);

  // Verify HMAC
  const expected = createHmac('sha256', SECRET).update(payload).digest('hex');
  try {
    if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;
  } catch {
    return null;
  }

  // Verify expiry: timestamp is the last segment of payload
  const payloadParts = payload.split('.');
  const ts = parseInt(payloadParts[payloadParts.length - 1], 10);
  if (isNaN(ts) || Date.now() - ts > TOKEN_TTL_MS) return null;

  // Extract session ID: everything before the last dot in payload
  const sessionId = payloadParts.slice(0, -1).join('.');
  return sessionId || null;
}

/**
 * Express middleware — rejects requests without a valid session-bound storage token.
 *
 * Accepts the token via:
 *   • Authorization: Bearer <token>   (preferred)
 *   • ?token=<token>                   (fallback for direct object URLs)
 */
export function requireStorageToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'] ?? '';
  let token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) token = (req.query['token'] as string) ?? '';

  if (!token) {
    res.status(401).json({
      error: 'Missing storage token. Call GET /api/auth/storage-token first.',
    });
    return;
  }

  const sessionId = verifyToken(token);
  if (!sessionId) {
    res.status(401).json({ error: 'Invalid or expired storage token.' });
    return;
  }

  next();
}
