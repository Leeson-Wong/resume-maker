import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

// ─── Session Store ─────────────────────────────────────────────────────

interface Session {
  token: string;
  createdAt: number;
}

const sessions = new Map<string, Session>();

// Session TTL: 7 days
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Clean expired sessions every hour
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(token);
    }
  }
}, 60 * 60 * 1000);

// ─── Cookie Helpers ────────────────────────────────────────────────────

function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie ?? '';
  const cookies: Record<string, string> = {};
  for (const part of header.split(';')) {
    const [key, ...rest] = part.split('=');
    if (key) {
      cookies[key.trim()] = decodeURIComponent(rest.join('=').trim());
    }
  }
  return cookies;
}

// ─── Public API ────────────────────────────────────────────────────────

/**
 * Validate auth code and create a session.
 * Returns session token on success, null on failure.
 */
export function authenticate(authCode: string, expectedCode: string): string | null {
  if (authCode !== expectedCode) return null;
  const token = randomUUID();
  sessions.set(token, { token, createdAt: Date.now() });
  return token;
}

/**
 * Set session cookie on response.
 */
export function setSessionCookie(res: ServerResponse, token: string): void {
  res.setHeader('Set-Cookie', `session=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`);
}

/**
 * Clear session cookie on response.
 */
export function clearSessionCookie(res: ServerResponse): void {
  res.setHeader('Set-Cookie', 'session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0');
}

/**
 * Check if request has a valid session.
 * Returns true if authenticated.
 */
export function isAuthenticated(req: IncomingMessage): boolean {
  const cookies = parseCookies(req);
  const token = cookies['session'];
  if (!token) return false;

  const session = sessions.get(token);
  if (!session) return false;

  // Check expiry
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(token);
    return false;
  }

  return true;
}

/**
 * Middleware: require auth for a route handler.
 * Returns 401 JSON if not authenticated.
 */
export function requireAuth(
  req: IncomingMessage,
  res: ServerResponse
): boolean {
  if (isAuthenticated(req)) return true;

  res.writeHead(401, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Authentication required' }));
  return false;
}
