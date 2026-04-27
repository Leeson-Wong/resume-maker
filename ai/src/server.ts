import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { ResumeData } from './types.js';
import { createMcpServer } from './create-mcp-server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3001', 10);

// ─── CORS Headers ──────────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function setCorsHeaders(res: ServerResponse): void {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value);
  }
}

function sendJson(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS_HEADERS });
  res.end(JSON.stringify(data));
}

// ─── Data Loading ──────────────────────────────────────────────────────

async function loadResumeData(): Promise<ResumeData> {
  const dataPath = process.env.RESUME_DATA_PATH ||
    join(__dirname, '..', 'data', 'sample-resume.json');

  if (!existsSync(dataPath)) {
    throw new Error(`Resume data file not found: ${dataPath}`);
  }

  let raw: string;
  try {
    raw = await readFile(dataPath, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read resume data file: ${dataPath} — ${err instanceof Error ? err.message : err}`);
  }

  try {
    return JSON.parse(raw) as ResumeData;
  } catch (err) {
    throw new Error(`Invalid JSON in resume data file: ${dataPath} — ${err instanceof Error ? err.message : err}`);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log('Loading resume data...');
  const resume = await loadResumeData();
  console.log(`Loaded resume for: ${resume.personal?.name ?? 'Unknown'}`);

  const server = createMcpServer(resume);

  // Create HTTP server
  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      setCorsHeaders(res);
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      // Health check endpoint
      if (req.url === '/' && req.method === 'GET') {
        sendJson(res, 200, {
          name: 'resume-mcp-server',
          version: '2.0.0',
          status: 'running',
          candidate: resume.personal?.name,
          endpoints: {
            mcp: `http://localhost:${PORT}/mcp`,
          },
        });
        return;
      }

      // MCP endpoint
      if (req.url === '/mcp' && req.method === 'POST') {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        });

        // Clean up when connection closes
        res.on('close', () => {
          transport.close();
        });

        await server.connect(transport);
        await transport.handleRequest(req, res);
        return;
      }

      // 404 for everything else
      sendJson(res, 404, { error: 'Not found. POST to /mcp for MCP protocol.' });
    } catch (err) {
      console.error('Request handler error:', err);
      if (!res.headersSent) {
        sendJson(res, 500, { error: 'Internal server error' });
      }
    }
  });

  // Graceful shutdown
  let shuttingDown = false;
  function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    httpServer.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
    // Force exit after 5s if connections hang
    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 5000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  httpServer.listen(PORT, () => {
    console.log(`\nResume MCP Server running at http://localhost:${PORT}`);
    console.log(`  MCP endpoint: http://localhost:${PORT}/mcp`);
    console.log(`  Health check: http://localhost:${PORT}/`);
    console.log(`\nCandidate: ${resume.personal?.name ?? 'Unknown'} - ${resume.personal?.title ?? ''}`);
    console.log(`\nAvailable tools: get_profile, get_experience, get_projects, get_skills, get_education, search_resume, evaluate_fit, get_career_summary`);
    console.log(`Available resources: resume://full, resume://summary`);
    console.log('\nWaiting for MCP client connections...');
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err.message ?? err);
  process.exit(1);
});
