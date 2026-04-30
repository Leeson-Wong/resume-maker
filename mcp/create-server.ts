import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ResumeData } from '../src/types/resume.js';
import { registerTools } from './tools/index.js';
import { registerResources } from './resources.js';

/**
 * Shared factory function for creating an MCP server instance.
 * Used by both local Node.js server (server/index.ts) and Vercel Serverless Function.
 */
export function createMcpServer(resume: ResumeData): McpServer {
  const server = new McpServer({
    name: 'resume-mcp-server',
    version: '2.0.0',
  });

  registerTools(server, resume);
  registerResources(server, resume);

  return server;
}
