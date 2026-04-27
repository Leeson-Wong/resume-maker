import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import * as z from 'zod';
import type { ResumeData, Experience, Project, CareerSummary } from '../types.js';
import { getSkillName, isSkillItem } from '../types.js';
import { searchResume, evaluateFit } from '../rag/search.js';
import { normalizeSkillName, getAllSkillsCanonical, getChineseTechMappings } from '../rag/skills.js';

// ─── Helpers ───────────────────────────────────────────────────────────

type OutputFormat = 'text' | 'json';

function resolveFormat(format: unknown): OutputFormat {
  return format === 'json' ? 'json' : 'text';
}

function formatOutput(
  format: OutputFormat,
  markdownText: string,
  jsonData: unknown
): string {
  if (format === 'json') {
    return JSON.stringify(jsonData, null, 2);
  }
  return markdownText;
}

function errorResult(message: string): CallToolResult {
  return {
    content: [{ type: 'text', text: `Error: ${message}` }],
    isError: true,
  };
}

// ─── Tool Registration ─────────────────────────────────────────────────

export function registerTools(server: McpServer, resume: ResumeData): void {
  // 1. get_profile
  server.registerTool(
    'get_profile',
    {
      title: 'Get Candidate Profile',
      description:
        "Get the candidate's basic profile information including name, title, contact details, and professional summary.",
      inputSchema: z.object({
        format: z.enum(['text', 'json']).optional().describe('Output format: text (markdown) or json (structured)'),
      }),
    },
    async ({ format }): Promise<CallToolResult> => {
      try {
        const fmt = resolveFormat(format);
        const p = resume.personal;
        const data: Record<string, string | undefined> = {
          name: p?.name,
          title: p?.title,
          email: p?.email,
          phone: p?.phone,
          location: p?.location,
          github: p?.github,
          linkedin: p?.linkedin,
          website: p?.website,
          summary: p?.summary,
        };

        const lines: string[] = [
          `**${p?.name ?? ''}**`,
          `Title: ${p?.title ?? ''}`,
          `Email: ${p?.email ?? ''}`,
        ];
        if (p?.phone) lines.push(`Phone: ${p.phone}`);
        if (p?.location) lines.push(`Location: ${p.location}`);
        if (p?.github) lines.push(`GitHub: ${p.github}`);
        if (p?.linkedin) lines.push(`LinkedIn: ${p.linkedin}`);
        if (p?.website) lines.push(`Website: ${p.website}`);
        if (p?.summary) lines.push(`\n${p.summary}`);

        return {
          content: [{ type: 'text', text: formatOutput(fmt, lines.join('\n'), data) }],
        };
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 2. get_experience
  server.registerTool(
    'get_experience',
    {
      title: 'Get Work Experience',
      description:
        "Get the candidate's work experience. Optionally filter by keyword (e.g. 'React', 'management', 'microservices').",
      inputSchema: z.object({
        keyword: z
          .string()
          .optional()
          .describe('Optional keyword to filter experience entries'),
        format: z.enum(['text', 'json']).optional().describe('Output format'),
      }),
    },
    async ({ keyword, format }): Promise<CallToolResult> => {
      try {
        const fmt = resolveFormat(format);
        let experiences = resume?.experience ?? [];

        if (keyword) {
          const kw = keyword.toLowerCase();
          experiences = experiences.filter((exp: Experience) => {
            const text = [
              exp.company,
              exp.position,
              exp.location,
              ...(exp.highlights ?? []),
            ]
              .join(' ')
              .toLowerCase();
            return text.includes(kw);
          });
        }

        if (experiences.length === 0) {
          const msg = keyword
            ? `No experience entries matching "${keyword}".`
            : 'No work experience listed.';
          return { content: [{ type: 'text', text: formatOutput(fmt, msg, []) }] };
        }

        const formatted = experiences
          .map((exp: Experience) => {
            const period = `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate ?? ''}`;
            const highlights = (exp.highlights ?? []).map((h) => `  - ${h}`).join('\n');
            let text = `**${exp.position}** @ ${exp.company}`;
            if (exp.location) text += ` (${exp.location})`;
            text += `\n${period}\n${highlights}`;
            return text;
          })
          .join('\n\n');

        const jsonData = experiences.map((exp: Experience) => ({
          company: exp.company,
          position: exp.position,
          location: exp.location,
          startDate: exp.startDate,
          endDate: exp.current ? 'Present' : (exp.endDate ?? ''),
          highlights: exp.highlights,
        }));

        return {
          content: [{ type: 'text', text: formatOutput(fmt, formatted, jsonData) }],
        };
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 3. get_projects
  server.registerTool(
    'get_projects',
    {
      title: 'Get Projects',
      description:
        "Get the candidate's project experience. Optionally filter by technology or keyword.",
      inputSchema: z.object({
        keyword: z
          .string()
          .optional()
          .describe(
            'Optional keyword to filter projects (technology, domain, etc.)'
          ),
        format: z.enum(['text', 'json']).optional().describe('Output format'),
      }),
    },
    async ({ keyword, format }): Promise<CallToolResult> => {
      try {
        const fmt = resolveFormat(format);
        let projects = resume?.projects ?? [];

        if (keyword) {
          const kw = keyword.toLowerCase();
          projects = projects.filter((proj: Project) => {
            const text = [
              proj.name,
              proj.description,
              ...(proj.technologies ?? []),
              ...(proj.highlights ?? []),
            ]
              .join(' ')
              .toLowerCase();
            return text.includes(kw);
          });
        }

        if (projects.length === 0) {
          const msg = keyword
            ? `No projects matching "${keyword}".`
            : 'No projects listed.';
          return { content: [{ type: 'text', text: formatOutput(fmt, msg, []) }] };
        }

        const formatted = projects
          .map((proj: Project) => {
            const techs = (proj.technologies ?? []).join(', ');
            const highlights = (proj.highlights ?? [])
              .map((h) => `  - ${h}`)
              .join('\n');
            let text = `**${proj.name}**\n${proj.description}`;
            if (proj.link) text += `\nLink: ${proj.link}`;
            text += `\nTechnologies: ${techs}`;
            if (highlights) text += `\n${highlights}`;
            return text;
          })
          .join('\n\n');

        const jsonData = projects.map((proj: Project) => ({
          name: proj.name,
          description: proj.description,
          technologies: proj.technologies,
          link: proj.link,
          highlights: proj.highlights,
        }));

        return {
          content: [{ type: 'text', text: formatOutput(fmt, formatted, jsonData) }],
        };
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 4. get_skills
  server.registerTool(
    'get_skills',
    {
      title: 'Get Skills',
      description:
        "Get the candidate's skill list. Optionally filter by category.",
      inputSchema: z.object({
        category: z
          .string()
          .optional()
          .describe(
            'Optional category filter (e.g. "frontend", "backend", "tools")'
          ),
        format: z.enum(['text', 'json']).optional().describe('Output format'),
      }),
    },
    async ({ category, format }): Promise<CallToolResult> => {
      try {
        const fmt = resolveFormat(format);
        let skills = resume?.skills ?? [];

        if (category) {
          const cat = category.toLowerCase();
          skills = skills.filter((s) =>
            s.category.toLowerCase().includes(cat)
          );
        }

        if (skills.length === 0) {
          const msg = category
            ? `No skills found in category "${category}".`
            : 'No skills listed.';
          return { content: [{ type: 'text', text: formatOutput(fmt, msg, []) }] };
        }

        const formatted = skills
          .map((s) => {
            const names = (s.items ?? []).map((item) => {
              if (isSkillItem(item)) {
                const levelStr = item.level ? ` (${levelLabel(item.level)})` : '';
                const yearsStr = item.yearsUsed ? ` ${item.yearsUsed}y` : '';
                return `${item.name}${levelStr}${yearsStr}`;
              }
              return item as string;
            });
            return `**${s.category}**: ${names.join(', ')}`;
          })
          .join('\n');

        const jsonData = skills.map((s) => ({
          category: s.category,
          items: (s.items ?? []).map((item) => {
            if (isSkillItem(item)) {
              return {
                name: item.name,
                level: item.level,
                levelLabel: item.level ? levelLabel(item.level) : undefined,
                yearsUsed: item.yearsUsed,
                aliases: item.aliases,
                related: item.related,
              };
            }
            return { name: item };
          }),
        }));

        return {
          content: [{ type: 'text', text: formatOutput(fmt, formatted, jsonData) }],
        };
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 5. get_education
  server.registerTool(
    'get_education',
    {
      title: 'Get Education',
      description: "Get the candidate's educational background.",
      inputSchema: z.object({
        format: z.enum(['text', 'json']).optional().describe('Output format'),
      }),
    },
    async ({ format }): Promise<CallToolResult> => {
      try {
        const fmt = resolveFormat(format);
        const education = resume?.education ?? [];

        if (education.length === 0) {
          return {
            content: [{ type: 'text', text: formatOutput(fmt, 'No education listed.', []) }],
          };
        }

        const formatted = education
          .map((edu) => {
            let text = `**${edu.school}** - ${edu.degree} in ${edu.field}`;
            text += `\nPeriod: ${edu.startDate} - ${edu.endDate ?? ''}`;
            if (edu.gpa) text += `\nGPA: ${edu.gpa}`;
            if (edu.location) text += `\nLocation: ${edu.location}`;
            if (edu.honors && edu.honors.length > 0) {
              text += `\nHonors: ${edu.honors.join(', ')}`;
            }
            return text;
          })
          .join('\n\n');

        const jsonData = education.map((edu) => ({
          school: edu.school,
          degree: edu.degree,
          field: edu.field,
          startDate: edu.startDate,
          endDate: edu.endDate,
          gpa: edu.gpa,
          location: edu.location,
          honors: edu.honors,
        }));

        return {
          content: [{ type: 'text', text: formatOutput(fmt, formatted, jsonData) }],
        };
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 6. search_resume
  server.registerTool(
    'search_resume',
    {
      title: 'Search Resume',
      description:
        'Full-text search across the entire resume. Returns matching snippets with source modules and relevance ranking.',
      inputSchema: z.object({
        query: z.string().describe('Search query (keywords or phrases)'),
        format: z.enum(['text', 'json']).optional().describe('Output format'),
      }),
    },
    async ({ query, format }): Promise<CallToolResult> => {
      try {
        if (!query || !query.trim()) {
          return errorResult('Query parameter is required and cannot be empty.');
        }

        const fmt = resolveFormat(format);
        const results = searchResume(resume, query);

        if (results.length === 0) {
          const msg = `No results found for "${query}".`;
          return { content: [{ type: 'text', text: formatOutput(fmt, msg, { query, results: [] }) }] };
        }

        const formatted = results
          .map(
            (r, i) =>
              `### Result ${i + 1} [source: ${r.source}, relevance: ${r.relevance}]\n${r.content}`
          )
          .join('\n\n');

        const jsonData = {
          query,
          totalResults: results.length,
          results: results.map((r, i) => ({
            index: i + 1,
            source: r.source,
            relevance: r.relevance,
            content: r.content,
          })),
        };

        return {
          content: [{ type: 'text', text: formatOutput(fmt, formatted, jsonData) }],
        };
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 7. evaluate_fit (highlight tool)
  server.registerTool(
    'evaluate_fit',
    {
      title: 'Evaluate Job Fit',
      description:
        'Analyze how well the candidate fits a given job description. Returns matched skills, missing skills, overall score, and recommendations.',
      inputSchema: z.object({
        job_description: z
          .string()
          .describe('Full job description text to evaluate against'),
        format: z.enum(['text', 'json']).optional().describe('Output format'),
      }),
    },
    async ({ job_description, format }): Promise<CallToolResult> => {
      try {
        if (!job_description || !job_description.trim()) {
          return errorResult('job_description parameter is required and cannot be empty.');
        }

        const fmt = resolveFormat(format);
        const result = evaluateFit(resume, job_description);

        const jsonData = {
          score: result.score,
          matched: result.matched,
          missing: result.missing,
          recommendation: getScoreRecommendation(result.score),
        };

        return {
          content: [{ type: 'text', text: formatOutput(fmt, result.analysis, jsonData) }],
        };
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    }
  );

  // 8. get_career_summary
  server.registerTool(
    'get_career_summary',
    {
      title: 'Get Career Summary',
      description:
        'Get a comprehensive career analysis including seniority level, domain expertise, career trajectory, core strengths, and work style. Provides a holistic view of the candidate.',
      inputSchema: z.object({
        format: z.enum(['text', 'json']).optional().describe('Output format'),
      }),
    },
    async ({ format }): Promise<CallToolResult> => {
      try {
        const fmt = resolveFormat(format);
        const summary = buildCareerSummary(resume);

        const formatted = [
          `## Career Summary: ${summary.name}`,
          ``,
          `**Title**: ${summary.title}`,
          `**Seniority**: ${summary.seniority}`,
          `**Experience**: ${summary.totalYears} years`,
          ``,
          `### Domain Expertise`,
          summary.domains.map((d) => `- ${d}`).join('\n'),
          ``,
          `### Career Trajectory`,
          summary.trajectory.map((t) => `- ${t}`).join('\n'),
          ``,
          `### Core Strengths`,
          summary.coreStrengths.map((s) => `- ${s}`).join('\n'),
          ``,
          `### Top Skills`,
          summary.topSkills.map((s) => {
            const level = s.level ? ` (${levelLabel(s.level)})` : '';
            const years = s.yearsUsed ? ` — ${s.yearsUsed} years` : '';
            return `- ${s.name}${level}${years}`;
          }).join('\n'),
          ``,
          `### Work Style`,
          summary.workStyle,
        ].join('\n');

        return {
          content: [{ type: 'text', text: formatOutput(fmt, formatted, summary) }],
        };
      } catch (err) {
        return errorResult(err instanceof Error ? err.message : String(err));
      }
    }
  );
}

// ─── Career Summary Builder ────────────────────────────────────────────

function buildCareerSummary(resume: ResumeData): CareerSummary {
  const p = resume?.personal;
  const meta = resume?.careerMeta;

  // Calculate total years from experience
  let totalYears = meta?.totalYears ?? 0;
  if (!totalYears && resume?.experience?.length) {
    const startDates = resume.experience.map((e) => new Date(e.startDate));
    const earliest = startDates.reduce((a, b) => (a < b ? a : b));
    totalYears = new Date().getFullYear() - earliest.getFullYear();
  }

  // Determine seniority
  const seniority = meta?.seniority ?? inferSeniority(totalYears);

  // Domains from metadata or inferred from experience
  const domains = meta?.domains?.length
    ? meta.domains
    : inferDomains(resume);

  // Trajectory from metadata or inferred
  const trajectory = meta?.trajectory?.length
    ? meta.trajectory
    : inferTrajectory(resume);

  // Core strengths from skills + summary
  const coreStrengths = inferCoreStrengths(resume);

  // Top skills with levels
  const skillsMap = getAllSkillsCanonical(resume);
  const topSkills = Array.from(skillsMap.entries())
    .slice(0, 10)
    .map(([name, data]) => ({
      name,
      level: data.level,
      yearsUsed: data.yearsUsed,
    }));

  // Work style from summary
  const workStyle = inferWorkStyle(resume);

  return {
    name: p?.name ?? 'Unknown',
    title: p?.title ?? 'Unknown',
    seniority,
    totalYears,
    domains,
    trajectory,
    coreStrengths,
    topSkills,
    workStyle,
  };
}

function inferSeniority(years: number): string {
  if (years >= 10) return 'staff';
  if (years >= 6) return 'senior';
  if (years >= 3) return 'mid';
  return 'junior';
}

function inferDomains(resume: ResumeData): string[] {
  const domains = new Set<string>();
  const summary = resume?.personal?.summary?.toLowerCase() ?? '';

  if (summary.includes('大数据') || summary.includes('big data')) domains.add('大数据云服务');
  if (summary.includes('全栈') || summary.includes('full-stack') || summary.includes('fullstack')) domains.add('全栈应用开发');
  if (summary.includes('前端') || summary.includes('frontend')) domains.add('前端开发');
  if (summary.includes('后端') || summary.includes('backend')) domains.add('后端开发');
  if (summary.includes('游戏') || summary.includes('game')) domains.add('游戏开发');
  if (summary.includes('小程序') || summary.includes('mini program')) domains.add('跨端应用开发');

  for (const exp of resume?.experience ?? []) {
    const highlights = (exp.highlights ?? []).join(' ').toLowerCase();
    if (highlights.includes('云平台') || highlights.includes('cloud')) domains.add('云服务');
    if (highlights.includes('大数据') || highlights.includes('big data')) domains.add('大数据平台');
    if (highlights.includes('小程序') || highlights.includes('小游戏')) domains.add('跨端应用');
    if (highlights.includes('独立') || highlights.includes('产品')) domains.add('独立产品开发');
  }

  if (domains.size === 0) domains.add('软件开发');
  return Array.from(domains);
}

function inferTrajectory(resume: ResumeData): string[] {
  const trajectory: string[] = [];
  const experiences = resume?.experience ?? [];

  if (experiences.length === 0) return ['软件开发'];

  for (const exp of experiences) {
    const highlights = (exp.highlights ?? []).join(' ');
    const label = exp.position || exp.company;
    trajectory.push(label);
  }

  return trajectory;
}

function inferCoreStrengths(resume: ResumeData): string[] {
  const strengths = new Set<string>();
  const summary = resume?.personal?.summary?.toLowerCase() ?? '';

  // From summary keywords
  if (summary.includes('跨') || summary.includes('multi')) strengths.add('多技术栈适应能力');
  if (summary.includes('独立') || summary.includes('0 到 1')) strengths.add('独立产品交付');
  if (summary.includes('架构') || summary.includes('architecture')) strengths.add('架构设计');
  if (summary.includes('ai') || summary.includes('人工智能')) strengths.add('AI 协议设计');
  if (summary.includes('开源') || summary.includes('open source')) strengths.add('开源贡献');

  // From skill breadth
  const skillCategories = (resume?.skills ?? []).map((s) => s.category);
  if (skillCategories.length >= 3) strengths.add('技术广度');

  // From project diversity
  const projCount = resume?.projects?.length ?? 0;
  if (projCount >= 3) strengths.add('多项目并行管理');

  if (strengths.size === 0) strengths.add('软件开发');
  return Array.from(strengths);
}

function inferWorkStyle(resume: ResumeData): string {
  const summary = resume?.personal?.summary ?? '';
  const styles: string[] = [];

  if (summary.includes('独立') || summary.includes('0 到 1')) {
    styles.push('独立完成从 0 到 1 的产品交付');
  }
  if (summary.includes('简洁') || summary.includes('简洁的技术方案')) {
    styles.push('追求用最简洁的技术方案解决真实问题');
  }
  if (summary.includes('多技术栈') || summary.includes('跨')) {
    styles.push('快速学习并适应新技术栈');
  }

  if (styles.length === 0) {
    styles.push('注重工程质量与产品交付');
  }

  return styles.join('；');
}

function levelLabel(level: number): string {
  const labels: Record<number, string> = {
    1: '了解',
    2: '熟悉',
    3: '熟练',
    4: '精通',
    5: '权威',
  };
  return labels[level] ?? String(level);
}

function getScoreRecommendation(score: number): string {
  if (score >= 80) return 'Strong match! The candidate\'s profile aligns well with the job requirements.';
  if (score >= 60) return 'Good potential. The candidate has relevant experience but may need development in some areas.';
  if (score >= 40) return 'Partial match. There are some overlaps but significant gaps exist.';
  return 'Low match. The candidate\'s profile doesn\'t closely align with this role\'s requirements.';
}
