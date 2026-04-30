import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { existsSync } from 'node:fs';
import { Readable } from 'node:stream';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { ResumeData } from '../src/types/resume.js';
import { createMcpServer } from '../mcp/create-server.js';
import { loadConfig } from './config.js';
import { Storage } from './storage.js';
import { authenticate, setSessionCookie, clearSessionCookie, isAuthenticated, requireAuth } from './auth.js';
import { createInviteCodeManager } from './invite-codes.js';
import { PublicPageServer } from './public-page.js';

// ─── CORS Headers ──────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS_HEADERS });
  res.end(JSON.stringify(data));
}

function setCorsHeaders(res: ServerResponse): void {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value);
  }
}

// ─── Request Body Parser ───────────────────────────────────────────────

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

// ─── Default Resume Template ───────────────────────────────────────────

const DEFAULT_RESUME: ResumeData = {
  personal: { name: '', title: '', email: '', summary: '' },
  experience: [],
  education: [],
  projects: [],
  skills: [],
};

// ─── SPA Static File Server ────────────────────────────────────────────

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

/**
 * Serve the Vite-built SPA for /edit and /edit/* routes.
 * Also serves assets from dist/ (the Vite output directory).
 */
async function serveSpa(req: IncomingMessage, res: ServerResponse, distDir: string): Promise<boolean> {
  const url = (req.url ?? '/').split('?')[0];
  const filePath = join(distDir, url === '/edit' ? 'index.html' : url);

  // If requesting a file that exists in dist/, serve it
  if (url !== '/edit' && existsSync(filePath)) {
    const ext = extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext];
    if (mime) {
      const data = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': mime });
      res.end(data);
      return true;
    }
  }

  // For /edit or any /edit/* sub-path, serve index.html (SPA client routing)
  const indexHtml = join(distDir, 'index.html');
  if (existsSync(indexHtml)) {
    const html = await readFile(indexHtml, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return true;
  }

  return false;
}

// ─── Route Matchers ────────────────────────────────────────────────────

type RouteHandler = (req: IncomingMessage, res: ServerResponse, params: Record<string, string>) => Promise<void>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

function route(method: string, path: string, handler: RouteHandler): Route {
  const paramNames: string[] = [];
  const patternStr = path.replace(/:([^/]+)/g, (_match, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  return { method, pattern: new RegExp(`^${patternStr}$`), paramNames, handler };
}

function matchRoute(routes: Route[], req: IncomingMessage): { handler: RouteHandler; params: Record<string, string> } | null {
  const url = (req.url ?? '/').split('?')[0];
  for (const r of routes) {
    if (req.method !== r.method) continue;
    const match = url.match(r.pattern);
    if (match) {
      const params: Record<string, string> = {};
      r.paramNames.forEach((name, i) => { params[name] = match[i + 1]; });
      return { handler: r.handler, params };
    }
  }
  return null;
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  // 1. Load config
  const config = await loadConfig();
  console.log(`Config loaded (port: ${config.port}, dataPath: ${config.dataPath})`);

  // 2. Initialize storage
  const storage = new Storage(config);
  await storage.init(DEFAULT_RESUME);

  // 3. Load resume data
  const getResume = () => storage.readValidatedResume();
  const resume = await getResume();
  if (!resume) throw new Error('Resume data not found after initialization.');
  console.log(`Loaded resume for: ${resume.personal?.name || '(empty)'}`);

  // 4. Initialize invite code manager
  const inviteCodes = createInviteCodeManager(storage);

  // 5. Initialize public page server
  const publicPage = new PublicPageServer(config.dataPath, config.port);

  // 6. Define routes
  const routes: Route[] = [

    // ─── Health ───────────────────────────────────────────────────
    route('GET', '/health', async (_req, res) => {
      const currentResume = await getResume();
      sendJson(res, 200, {
        name: 'resume-maker',
        version: '2.0.0',
        status: 'running',
        candidate: currentResume?.personal?.name ?? null,
      });
    }),

    // ─── Well-Known MCP Discovery ────────────────────────────────
    route('GET', '/.well-known/mcp', async (req, res) => {
      const host = req.headers.host ?? `localhost:${config.port}`;
      publicPage.serveWellKnown(res, host);
    }),

    // ─── LLMs.txt Discovery ──────────────────────────────────────
    route('GET', '/llms.txt', async (req, res) => {
      const host = req.headers.host ?? `localhost:${config.port}`;
      const currentResume = await getResume();
      if (!currentResume) {
        sendJson(res, 503, { error: 'Resume data unavailable.' });
        return;
      }
      publicPage.serveLlmsTxt(res, host, currentResume as ResumeData);
    }),

    // ─── Auth ─────────────────────────────────────────────────────
    route('POST', '/api/auth', async (req, res) => {
      const body = JSON.parse(await readBody(req));
      const token = authenticate(body.authCode ?? '', config.authCode);
      if (!token) {
        sendJson(res, 401, { error: 'Invalid auth code' });
        return;
      }
      setSessionCookie(res, token);
      sendJson(res, 200, { ok: true });
    }),

    route('POST', '/api/auth/logout', async (_req, res) => {
      clearSessionCookie(res);
      sendJson(res, 200, { ok: true });
    }),

    route('GET', '/api/auth/check', async (req, res) => {
      sendJson(res, 200, { authenticated: isAuthenticated(req) });
    }),

    // ─── Resume CRUD ──────────────────────────────────────────────
    route('GET', '/api/resume', async (req, res) => {
      if (!requireAuth(req, res)) return;
      const data = await getResume();
      sendJson(res, 200, data);
    }),

    route('PUT', '/api/resume', async (req, res) => {
      if (!requireAuth(req, res)) return;
      try {
        const body = JSON.parse(await readBody(req));
        await storage.writeResume(body);
        sendJson(res, 200, { ok: true });
      } catch (err) {
        sendJson(res, 400, { error: err instanceof Error ? err.message : 'Validation failed' });
      }
    }),

    // ─── Invite Codes ─────────────────────────────────────────────
    route('POST', '/api/invite-codes', async (req, res) => {
      if (!requireAuth(req, res)) return;
      const body = JSON.parse(await readBody(req));
      const code = await inviteCodes.create(body.label ?? 'Unlabeled');
      sendJson(res, 201, code);
    }),

    route('GET', '/api/invite-codes', async (req, res) => {
      if (!requireAuth(req, res)) return;
      const codes = await inviteCodes.list();
      sendJson(res, 200, codes);
    }),

    route('DELETE', '/api/invite-codes/:code', async (req, res, params) => {
      if (!requireAuth(req, res)) return;
      const ok = await inviteCodes.revoke(params.code);
      sendJson(res, ok ? 200 : 404, ok ? { ok: true } : { error: 'Code not found or already revoked' });
    }),

    route('GET', '/api/invite-codes/:code/logs', async (req, res, params) => {
      if (!requireAuth(req, res)) return;
      const codes = await inviteCodes.list();
      const found = codes.find((c) => c.code === params.code);
      sendJson(res, found ? 200 : 404, found ? found.accessLog : { error: 'Code not found' });
    }),
  ];

  // 6. Create HTTP server
  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
      setCorsHeaders(res);
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      const url = (req.url ?? '/').split('?')[0];

      // Try route matching
      const matched = matchRoute(routes, req);
      if (matched) {
        setCorsHeaders(res);
        await matched.handler(req, res, matched.params);
        return;
      }

      // MCP endpoint
      if (req.url === '/mcp' && req.method === 'POST') {
        // Validate invite code from Authorization header
        const authHeader = req.headers['authorization'] ?? '';
        const inviteCode = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

        if (!inviteCode) {
          sendJson(res, 401, { error: 'Missing invite code. Use Authorization: Bearer <code>' });
          return;
        }

        const codeEntry = await inviteCodes.validate(inviteCode);
        if (!codeEntry) {
          sendJson(res, 401, { error: 'Invalid or revoked invite code' });
          return;
        }

        // Reload resume data for each MCP request (real-time)
        const currentResume = await getResume();
        if (!currentResume) {
          sendJson(res, 503, { error: 'Resume data unavailable.' });
          return;
        }

        // Create fresh MCP server with latest data
        const liveMcpServer = createMcpServer(currentResume as ResumeData);
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        });

        res.on('close', () => {
          transport.close();
        });

        await liveMcpServer.connect(transport);

        // Read body to extract tool name, then re-inject for transport
        const rawBody = await readBody(req);
        let toolName = 'mcp_request';
        try {
          const parsed = JSON.parse(rawBody);
          if (parsed.method === 'tools/call' && parsed.params?.name) {
            toolName = parsed.params.name;
          }
        } catch {}

        const bodyStream = Readable.from(Buffer.from(rawBody));
        Object.assign(req, bodyStream);

        await transport.handleRequest(req, res);

        // Log access asynchronously with the actual tool name
        inviteCodes.logAccess(inviteCode, toolName).catch(() => {});
        return;
      }

      // SPA editor: /edit and /edit/*
      if (url === '/edit' || url.startsWith('/edit/') || url.startsWith('/assets/')) {
        const distDir = join(process.cwd(), 'dist');
        if (await serveSpa(req, res, distDir)) return;
      }

      // Public page: serve `/` as the public resume page
      if (url === '/' && req.method === 'GET') {
        const currentResume = await getResume();
        if (currentResume) {
          await publicPage.servePage(res, currentResume as ResumeData);
          return;
        }
        sendJson(res, 503, { error: 'Resume data unavailable.' });
        return;
      }

      // Static files from data/public/
      if (await publicPage.serveStatic(req, res)) {
        return;
      }

      // 404
      sendJson(res, 404, { error: 'Not found' });
    } catch (err) {
      console.error('Request handler error:', err);
      if (!res.headersSent) {
        sendJson(res, 500, { error: 'Internal server error' });
      }
    }
  });

  // 7. Graceful shutdown
  let shuttingDown = false;
  function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    httpServer.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 5000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // 8. Start listening
  httpServer.listen(config.port, () => {
    console.log(`\nResume Maker running at http://localhost:${config.port}`);
    console.log(`  Health:     http://localhost:${config.port}/health`);
    console.log(`  MCP:        http://localhost:${config.port}/mcp`);
    console.log(`  Auth check: http://localhost:${config.port}/api/auth/check`);
    console.log(`\nWaiting for connections...`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err.message ?? err);
  process.exit(1);
});
