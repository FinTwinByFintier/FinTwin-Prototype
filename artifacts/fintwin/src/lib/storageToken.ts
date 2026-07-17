/**
 * Storage auth helper — two-step session + token flow.
 *
 * Step 1: POST /api/auth/init-session  (with credentials)
 *   → server creates an HttpOnly, SameSite=Strict session cookie
 *
 * Step 2: GET /api/auth/storage-token  (with credentials)
 *   → server returns an HMAC token bound to the session ID
 *
 * The token is then sent as `Authorization: Bearer <token>` on upload
 * URL requests and object-serving requests.
 *
 * Tokens and session initialization are cached in sessionStorage so the
 * two-step round-trip only happens once per browser tab.
 */

const SESSION_INIT_KEY = 'ft_session_init';
const STORAGE_TOKEN_KEY = 'ft_storage_token';

let _tokenPromise: Promise<string> | null = null;

async function initSession(): Promise<void> {
  if (sessionStorage.getItem(SESSION_INIT_KEY)) return;

  const res = await fetch('/api/auth/init-session', {
    method: 'POST',
    credentials: 'include',           // send/receive HttpOnly session cookie
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to initialise session');
  sessionStorage.setItem(SESSION_INIT_KEY, '1');
}

async function fetchToken(): Promise<string> {
  await initSession();

  const res = await fetch('/api/auth/storage-token', {
    credentials: 'include',           // send session cookie
  });
  if (!res.ok) throw new Error('Failed to obtain storage token');

  const { token } = await res.json() as { token: string };
  sessionStorage.setItem(STORAGE_TOKEN_KEY, token);
  return token;
}

/**
 * Returns a valid storage token, fetching one if needed.
 * Concurrent callers share a single in-flight request.
 */
export async function getStorageToken(): Promise<string> {
  const cached = sessionStorage.getItem(STORAGE_TOKEN_KEY);
  if (cached) return cached;

  if (!_tokenPromise) {
    _tokenPromise = fetchToken().finally(() => { _tokenPromise = null; });
  }
  return _tokenPromise;
}

/** Returns Headers-compatible auth object for storage fetch calls. */
export async function storageAuthHeaders(): Promise<Record<string, string>> {
  const token = await getStorageToken();
  return { Authorization: `Bearer ${token}` };
}
