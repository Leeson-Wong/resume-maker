/**
 * Build script: generates profile.html from leeson-resume.json.
 * Run with: npx tsx scripts/build-profile.mts
 *
 * This eliminates manual sync between resume data and the profile page.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Vercel production URL (update after first deployment)
const MCP_URL = process.env.MCP_URL || 'https://resume-mcp-server.vercel.app/api/mcp';
const PROFILE_URL = process.env.PROFILE_URL || 'https://leeson-wong.github.io/resume-maker/profile.html';

interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone?: string;
  location?: string;
  github?: string;
  summary?: string;
}

interface SkillItem {
  name: string;
  level?: number;
  yearsUsed?: number;
  aliases?: string[];
}

interface Skill {
  category: string;
  items: (string | SkillItem)[];
}

interface ResumeData {
  personal: PersonalInfo;
  skills: Skill[];
  experience: Array<{ company: string; position: string; startDate: string; current?: boolean }>;
  languages?: Array<{ name: string; level: string }>;
}

function getSkillName(item: string | SkillItem): string {
  return typeof item === 'string' ? item : item.name;
}

async function main() {
  const dataPath = join(__dirname, '..', 'data', 'leeson-resume.json');
  const raw = await readFile(dataPath, 'utf-8');
  const resume = JSON.parse(raw) as ResumeData;

  const p = resume.personal;

  // Calculate years of experience
  const startDates = resume.experience.map((e) => new Date(e.startDate));
  const earliest = startDates.length > 0 ? startDates.reduce((a, b) => (a < b ? a : b)) : new Date();
  const yearsExp = new Date().getFullYear() - earliest.getFullYear();

  // Core skills as tags (first 10)
  const allSkills = resume.skills.flatMap((s) => s.items.map(getSkillName));
  const tagSkills = allSkills.slice(0, 12);
  const tags = tagSkills.map((s) => `    <span class="tag">${escapeHtml(s)}</span>`).join('\n');

  // Skills with levels for JSON-LD
  const skillNames = allSkills.map(escapeHtml);

  // Languages
  const langs = (resume.languages ?? []).map((l) => `${l.name} (${l.level})`).join(', ');

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(p.name)} - Leeson Wong</title>

  <!-- AI Agent Discovery: MCP Server Configuration -->
  <!-- Any MCP-compatible AI Agent can connect via the configuration below to query structured resume data -->
  <meta name="mcp-server" content="${MCP_URL}" />
  <meta name="mcp-transport" content="streamable-http" />
  <meta name="candidate-name" content="${escapeHtml(p.name)}" />

  <!-- JSON-LD: Structured data for AI agents and search engines -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "${escapeHtml(p.name)}",
    "jobTitle": "${escapeHtml(p.title)}",
    "email": "${escapeHtml(p.email)}",
    ${p.location ? `"address": "${escapeHtml(p.location)}",` : ''}
    ${p.github ? `"url": "https://${escapeHtml(p.github)}",` : ''}
    "knowsAbout": ${JSON.stringify(skillNames)}
  }
  </script>

  <!-- MCP Endpoint Configuration: Machine-readable MCP connection info -->
  <script type="application/mcp+json">
  {
    "version": "2.0.0",
    "transport": "streamable-http",
    "endpoint": "${MCP_URL}",
    "tools": [
      "get_profile",
      "get_experience",
      "get_projects",
      "get_skills",
      "get_education",
      "search_resume",
      "evaluate_fit",
      "get_career_summary"
    ],
    "resources": [
      "resume://full",
      "resume://summary"
    ]
  }
  </script>

  <!--
    MCP Server Configuration (JSON)
    Copy the following JSON to your AI client's MCP configuration to connect:

    {
      "mcpServers": {
        "resume-leeson": {
          "url": "${MCP_URL}"
        }
      }
    }

    Available Tools (8):
    - get_profile        : Get candidate basic info (name, title, contact, summary)
    - get_experience     : Get work experience, optional keyword filter (keyword?)
    - get_projects       : Get project experience, optional tech/keyword filter (keyword?)
    - get_skills         : Get skill list, optional category filter (category?)
    - get_education      : Get educational background
    - search_resume      : Full-text search with relevance scoring (query)
    - evaluate_fit       : Analyze job description fit (job_description)
    - get_career_summary : Comprehensive career analysis

    Available Resources (2):
    - resume://full      : Complete resume JSON data
    - resume://summary   : Candidate summary (name, title, experience, core skills)

    Health check: GET ${MCP_URL.replace('/mcp', '')}
    MCP endpoint: POST ${MCP_URL}
    Profile page: ${PROFILE_URL}
  -->

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      max-width: 520px;
      width: 90%;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 40px;
    }
    h1 { font-size: 28px; font-weight: 700; color: #f8fafc; }
    .title { color: #38bdf8; font-size: 16px; margin-top: 4px; }
    .summary { color: #94a3b8; font-size: 14px; line-height: 1.7; margin-top: 16px; }
    .meta { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 20px; font-size: 13px; color: #64748b; }
    .meta span { display: flex; align-items: center; gap: 4px; }
    .tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
    .tag {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 12px;
      color: #38bdf8;
    }
    .mcp-box {
      margin-top: 28px;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 16px;
    }
    .mcp-box h2 { font-size: 14px; color: #38bdf8; margin-bottom: 8px; }
    .mcp-box code {
      display: block;
      background: #1e293b;
      border-radius: 6px;
      padding: 12px;
      font-size: 12px;
      line-height: 1.6;
      color: #a5f3fc;
      overflow-x: auto;
      white-space: pre;
    }
    .mcp-box p { font-size: 12px; color: #64748b; margin-top: 8px; }
    .footer { margin-top: 16px; font-size: 11px; color: #475569; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(p.name)}</h1>
    <div class="title">Leeson Wong · ${escapeHtml(p.title)}</div>

    <p class="summary">
      ${escapeHtml(p.summary ?? `${yearsExp} years of software development experience.`)}
    </p>

    <div class="meta">
      <span>📍 ${escapeHtml(p.location ?? '')}</span>
      <span>📧 ${escapeHtml(p.email)}</span>
      ${p.github ? `<span>🔗 ${escapeHtml(p.github)}</span>` : ''}
    </div>

    <div class="tags">
${tags}
    </div>

    <!-- AI Agent Connection Configuration -->
    <div class="mcp-box">
      <h2>AI Agent Connection</h2>
      <code>{
  "mcpServers": {
    "resume-leeson": {
      "url": "${MCP_URL}"
    }
  }
}</code>
      <p>Connect via MCP protocol to query: profile, experience, projects, skills, education, full-text search, job fit analysis, career summary.</p>
    </div>

    <div class="footer">
      MCP Server v2.0.0 · ${langs || 'Languages available'} · ${yearsExp}+ years experience
    </div>
  </div>
</body>
</html>`;

  const outPath = join(__dirname, '..', 'profile.html');
  await writeFile(outPath, html, 'utf-8');
  console.log(`Generated profile.html → ${outPath}`);
  console.log(`  MCP URL: ${MCP_URL}`);
  console.log(`  Skills: ${tagSkills.join(', ')}`);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
