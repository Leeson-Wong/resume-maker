import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createMcpServer } from '../src/create-mcp-server.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import resumeData from '../data/leeson-resume.json' assert { type: 'json' };
import type { ResumeData } from '../src/types.js';

const resume = resumeData as ResumeData;

// CORS headers for public access
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(204).end();
    return;
  }

  // Set CORS headers for all responses
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    res.setHeader(key, value);
  }

  // Health check
  if (req.method === 'GET' && (!req.url || req.url === '/')) {
    res.status(200).json({
      name: 'resume-mcp-server',
      version: '2.0.0',
      status: 'running',
      candidate: resume.personal?.name,
    });
    return;
  }

  // MCP endpoint - only accept POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST for MCP protocol.' });
    return;
  }

  try {
    const server = createMcpServer(resume);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on('close', () => {
      transport.close();
    });

    await server.connect(transport);

    // Convert VercelRequest to Node.js IncomingMessage-compatible object
    // and VercelResponse to Node.js ServerResponse-compatible object
    await transport.handleRequest(req as any, res as any);
  } catch (err) {
    console.error('MCP handler error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
