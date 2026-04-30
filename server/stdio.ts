import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { ResumeData } from '../src/types/resume.js';
import { createMcpServer } from '../mcp/create-server.js';
import { loadConfig } from './config.js';
import { Storage } from './storage.js';

const DEFAULT_RESUME: ResumeData = {
  personal: { name: '', title: '', email: '', summary: '' },
  experience: [],
  education: [],
  projects: [],
  skills: [],
};

async function main() {
  const config = await loadConfig();
  const storage = new Storage(config);
  await storage.init(DEFAULT_RESUME);

  const resume = await storage.readValidatedResume();
  if (!resume) throw new Error('Resume data not found.');

  const server = createMcpServer(resume as ResumeData);
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error(`Resume MCP Server (stdio) — Candidate: ${resume.personal?.name ?? 'Unknown'}`);
}

main().catch((err) => {
  console.error('Failed to start stdio server:', err.message ?? err);
  process.exit(1);
});
