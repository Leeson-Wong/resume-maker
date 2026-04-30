import { readFile, readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { existsSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ResumeData } from '../src/types/resume.js';
import { getSkillName } from '../src/types/resume.js';

// ─── MIME Types ────────────────────────────────────────────────────────

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// ─── MCP Discovery Injection ───────────────────────────────────────────

function buildMcpDiscoveryHtml(port: number): string {
  const parts: string[] = [];
  // <link> tags for AI discovery
  parts.push(`<link rel="mcp" href="/mcp">`);
  parts.push(`<link rel="llms-txt" href="/llms.txt">`);
  return parts.join('\n');
}

function buildJsonLd(resume: ResumeData): string {
  const p = resume.personal;
  const skills = (resume.skills ?? []).flatMap((s) =>
    (s.items ?? []).map((item) => getSkillName(item))
  ).slice(0, 10);

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: p?.name ?? '',
    jobTitle: p?.title ?? '',
    knowsAbout: skills,
    description: p?.summary ?? '',
  };

  return `<script type="application/ld+json">\n${JSON.stringify(ld, null, 2)}\n</script>`;
}

function injectDiscovery(html: string, resume: ResumeData, port: number): string {
  const discovery = buildMcpDiscoveryHtml(port);
  const jsonLd = buildJsonLd(resume);

  // Inject before </head> if exists, otherwise prepend
  if (html.includes('</head>')) {
    return html.replace('</head>', `${discovery}\n${jsonLd}\n</head>`);
  }
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>\n${discovery}\n${jsonLd}`);
  }
  // No head tag, prepend
  return `${discovery}\n${jsonLd}\n${html}`;
}

// ─── Default Resume Page ───────────────────────────────────────────────

function buildDefaultPage(resume: ResumeData): string {
  const p = resume.personal;
  const skills = (resume.skills ?? []).flatMap((s) =>
    (s.items ?? []).map((item) => getSkillName(item))
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${p?.name ?? 'Resume'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 680px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a; line-height: 1.6; }
    h1 { font-size: 2rem; margin-bottom: 4px; }
    .title { font-size: 1.1rem; color: #666; margin-bottom: 16px; }
    .summary { margin-bottom: 24px; color: #444; }
    h2 { font-size: 1.2rem; margin: 24px 0 12px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    .skills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .skill { background: #f0f0f0; padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; }
    .job { margin-bottom: 16px; }
    .job-header { display: flex; justify-content: space-between; align-items: baseline; }
    .job-title { font-weight: 600; }
    .job-company { color: #555; }
    .job-period { font-size: 0.85rem; color: #888; }
    .highlights { margin-top: 6px; padding-left: 18px; font-size: 0.9rem; color: #444; }
    .highlights li { margin-bottom: 2px; }
    .links { margin-top: 24px; display: flex; gap: 12px; }
    .links a { color: #2563eb; text-decoration: none; font-size: 0.9rem; }
    .links a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${p?.name ?? ''}</h1>
  <div class="title">${p?.title ?? ''}</div>
  ${p?.summary ? `<p class="summary">${p.summary}</p>` : ''}
  ${p?.github || p?.linkedin || p?.website ? `<div class="links">${
    p?.github ? `<a href="${p.github}" target="_blank">GitHub</a>` : ''
  }${
    p?.linkedin ? `<a href="${p.linkedin}" target="_blank">LinkedIn</a>` : ''
  }${
    p?.website ? `<a href="${p.website}" target="_blank">Website</a>` : ''
  }</div>` : ''}
  ${skills.length > 0 ? `<h2>Skills</h2><div class="skills">${skills.map((s: string) => `<span class="skill">${s}</span>`).join('')}</div>` : ''}
  ${(resume.experience ?? []).length > 0 ? `<h2>Experience</h2>${resume.experience.map((exp) => `<div class="job"><div class="job-header"><div><span class="job-title">${exp.position}</span> <span class="job-company">@ ${exp.company}</span></div><span class="job-period">${exp.startDate} - ${exp.current ? 'Present' : exp.endDate ?? ''}</span></div>${exp.highlights?.length ? `<ul class="highlights">${exp.highlights.map((h: string) => `<li>${h}</li>`).join('')}</ul>` : ''}</div>`).join('')}` : ''}
</body>
</html>`;
}

// ─── Public Page Server ────────────────────────────────────────────────

export class PublicPageServer {
  private readonly publicDir: string;
  private readonly port: number;

  constructor(dataPath: string, port: number) {
    this.publicDir = join(dataPath, 'public');
    this.port = port;
  }

  /**
   * Serve the public page for `/` requests.
   */
  async servePage(res: ServerResponse, resume: ResumeData): Promise<void> {
    const customIndex = join(this.publicDir, 'index.html');

    let html: string;
    if (existsSync(customIndex)) {
      html = await readFile(customIndex, 'utf-8');
    } else {
      html = buildDefaultPage(resume);
    }

    // Inject MCP discovery meta
    html = injectDiscovery(html, resume, this.port);

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Link': '</.well-known/mcp>; rel="mcp"; type="application/json", </llms.txt>; rel="llms-txt"; type="text/markdown"',
    });
    res.end(html);
  }

  /**
   * Serve static files from data/public/ directory.
   * Returns true if file was found and served.
   */
  async serveStatic(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const url = (req.url ?? '/').split('?')[0];

    // Only serve from /public/ prefix or well-known
    if (!url.startsWith('/public/')) return false;

    const filePath = join(this.publicDir, url.replace('/public/', ''));
    if (!existsSync(filePath)) return false;

    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return false;

    const ext = extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] ?? 'application/octet-stream';

    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
    return true;
  }

  /**
   * Serve /.well-known/mcp endpoint with MCP server metadata.
   */
  serveWellKnown(res: ServerResponse, host: string): void {
    const baseUrl = `http://${host}`;
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Link': '</.well-known/mcp>; rel="mcp"; type="application/json", </llms.txt>; rel="llms-txt"; type="text/markdown"',
    });
    res.end(JSON.stringify({
      mcp: {
        endpoint: `${baseUrl}/mcp`,
        transport: 'http',
        auth: {
          type: 'bearer',
          description: 'Invite code required. Use Authorization: Bearer <code>',
          docs: `${baseUrl}/llms.txt`,
        },
        tools: [
          { name: 'get_profile', description: "Get the candidate's public profile: name, title, summary, and social links." },
          { name: 'get_experience', description: "Get the candidate's work experience. Optionally filter by keyword." },
          { name: 'get_projects', description: "Get the candidate's project experience. Optionally filter by technology or keyword." },
          { name: 'get_skills', description: "Get the candidate's skill list. Optionally filter by category." },
          { name: 'get_education', description: "Get the candidate's educational background." },
          { name: 'search_resume', description: 'Full-text search across the entire resume. Returns matching snippets with relevance ranking.' },
          { name: 'evaluate_fit', description: 'Analyze how well the candidate fits a given job description. Returns matched/missing skills and score.' },
          { name: 'get_career_summary', description: 'Get a comprehensive career analysis including seniority, domain expertise, and core strengths.' },
        ],
        resources: ['resume://full', 'resume://summary'],
        discovery: `${baseUrl}/llms.txt`,
      },
    }, null, 2));
  }

  /**
   * Serve /llms.txt endpoint with Markdown-formatted service description.
   */
  serveLlmsTxt(res: ServerResponse, host: string, resume: ResumeData): void {
    const baseUrl = `http://${host}`;
    const p = resume.personal;
    const name = p?.name ?? 'Resume';
    const title = p?.title ?? '';
    const summary = p?.summary ?? '';

    const tools = [
      { name: 'get_profile', desc: "Get the candidate's public profile: name, title, summary, and social links." },
      { name: 'get_experience', desc: "Get the candidate's work experience. Optionally filter by keyword." },
      { name: 'get_projects', desc: "Get the candidate's project experience. Optionally filter by technology or keyword." },
      { name: 'get_skills', desc: "Get the candidate's skill list. Optionally filter by category." },
      { name: 'get_education', desc: "Get the candidate's educational background." },
      { name: 'search_resume', desc: 'Full-text search across the entire resume with relevance ranking.' },
      { name: 'evaluate_fit', desc: 'Analyze candidate-job fit: matched/missing skills, overall score, and recommendations.' },
      { name: 'get_career_summary', desc: 'Comprehensive career analysis: seniority, domain expertise, career trajectory, core strengths.' },
    ];

    const toolLines = tools.map(t => `- **${t.name}**: ${t.desc}`).join('\n');

    const content = `# ${name}

> ${title}${summary ? ` — ${summary}` : ''}

This site exposes resume data via the Model Context Protocol (MCP).

## MCP Endpoint

- **URL**: \`${baseUrl}/mcp\`
- **Transport**: HTTP (Streamable HTTP)
- **Auth**: Bearer token (invite code). Pass via \`Authorization: Bearer <invite-code>\` header.

## Tools

${toolLines}

## Resources

- \`resume://full\` — Complete resume data in JSON format
- \`resume://summary\` — Candidate summary: name, title, experience, seniority, core skills

## Discovery

- **Well-known**: \`${baseUrl}/.well-known/mcp\` — Machine-readable MCP metadata (JSON)
- **This file**: \`${baseUrl}/llms.txt\` — Human/AI-readable service description (Markdown)
`;

    res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' });
    res.end(content);
  }
}
