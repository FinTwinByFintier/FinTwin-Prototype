import { Router, type IRouter, type Request, type Response } from 'express';
import { issueToken } from '../lib/sessionAuth';

const router: IRouter = Router();

/**
 * POST /auth/init-session
 *
 * Establishes an authenticated session. The session ID is stored in an
 * HttpOnly, SameSite=Strict cookie — it cannot be read by cross-origin
 * JavaScript and won't be sent on cross-site requests.
 *
 * This is the first step in the storage auth flow. Call this before
 * requesting a storage token.
 */
router.post('/auth/init-session', (req: Request, res: Response) => {
  if (req.session.initialized) {
    // Session already active — return OK without creating a new one
    res.json({ ok: true, resumed: true });
    return;
  }

  req.session.initialized = true;
  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to create session' });
      return;
    }
    res.json({ ok: true, resumed: false });
  });
});

/**
 * GET /auth/storage-token
 *
 * Issues a 24-hour HMAC token bound to the caller's session ID.
 * Requires a valid session cookie (obtained via POST /auth/init-session).
 *
 * Only clients that went through init-session can obtain upload/download
 * tokens, and each token is cryptographically tied to the issuing session.
 */
router.get('/auth/storage-token', (req: Request, res: Response) => {
  if (!req.session?.initialized || !req.session.id) {
    res.status(401).json({
      error: 'No active session. Call POST /api/auth/init-session first.',
    });
    return;
  }

  const token = issueToken(req.session.id);
  res.json({ token });
});

export default router;
