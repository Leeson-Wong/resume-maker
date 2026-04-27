import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { ResumeData } from './types.js';
import { registerTools } from './tools/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3001', 10);

async function loadResumeData(): Promise<ResumeData> {
  // Try loading from env-specified path first, then fall back to sample data
  const dataPath = process.env.RESUME_DATA_PATH ||
    join(__dirname, '..', 'data', 'sample-resume.json');
  const raw = await readFile(dataPath, 'utf-8');
  return JSON.parse(raw) as ResumeData;
}

function registerResources(server: McpServer, resume: ResumeData): void {
  const p = resume.personal;

  // resume://full — complete resume JSON
  server.registerResource(
    'resume-full',
    'resume://full',
    {
      title: 'Full Resume',
      description: 'Complete resume data in JSON format',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(resume, null, 2),
        },
      ],
    })
  );

  // resume://summary — one-line summary
  server.registerResource(
    'resume-summary',
    'resume://summary',
    {
      title: 'Resume Summary',
      description: 'One-line candidate summary: name, title, experience years, core skills',
      mimeType: 'text/plain',
    },
    async (uri) => {
      // Calculate years of experience from earliest start date
      const startDates = resume.experience.map((e) => new Date(e.startDate));
      const earliest = startDates.length > 0
        ? startDates.reduce((a, b) => (a < b ? a : b))
        : new Date();
      const yearsExp = new Date().getFullYear() - earliest.getFullYear();

      const coreSkills = resume.skills
        .flatMap((s) => s.items)
        .slice(0, 6)
        .join(', ');

      const summary = `${p.name} | ${p.title} | ${yearsExp}+ years experience | Core skills: ${coreSkills}`;

      return {
        contents: [
          {
            uri: uri.href,
            text: summary,
          },
        ],
      };
    }
  );
}

async function main() {
  console.log('Loading resume data...');
  const resume = await loadResumeData();
  console.log(`Loaded resume for: ${resume.personal.name}`);

  const server = new McpServer({
    name: 'resume-mcp-server',
    version: '1.0.0',
  });

  // Register tools and resources
  registerTools(server, resume);
  registerResources(server, resume);

  // Create HTTP server
  const httpServer = createServer(async (req, res) => {
    // Health check endpoint
    if (req.url === '/' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          name: 'resume-mcp-server',
          version: '1.0.0',
          status: 'running',
          candidate: resume.personal.name,
          endpoints: {
            mcp: `http://localhost:${PORT}/mcp`,
          },
        })
      );
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
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found. POST to /mcp for MCP protocol.' }));
  });

  httpServer.listen(PORT, () => {
    console.log(`\nResume MCP Server running at http://localhost:${PORT}`);
    console.log(`  MCP endpoint: http://localhost:${PORT}/mcp`);
    console.log(`  Health check: http://localhost:${PORT}/`);
    console.log(`\nCandidate: ${resume.personal.name} - ${resume.personal.title}`);
    console.log(`\nAvailable tools: get_profile, get_experience, get_projects, get_skills, get_education, search_resume, evaluate_fit`);
    console.log(`Available resources: resume://full, resume://summary`);
    console.log('\nWaiting for MCP client connections...');
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
