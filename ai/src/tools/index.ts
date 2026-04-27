import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import * as z from 'zod';
import type { ResumeData, Experience, Project } from '../types.js';
import { searchResume, evaluateFit } from '../rag/search.js';

export function registerTools(server: McpServer, resume: ResumeData): void {
  // 1. get_profile
  server.registerTool(
    'get_profile',
    {
      title: 'Get Candidate Profile',
      description:
        "Get the candidate's basic profile information including name, title, contact details, and professional summary.",
      inputSchema: z.object({}),
    },
    async (): Promise<CallToolResult> => {
      const p = resume.personal;
      const lines = [
        `**${p.name}**`,
        `Title: ${p.title}`,
        `Email: ${p.email}`,
      ];
      if (p.phone) lines.push(`Phone: ${p.phone}`);
      if (p.location) lines.push(`Location: ${p.location}`);
      if (p.github) lines.push(`GitHub: ${p.github}`);
      if (p.linkedin) lines.push(`LinkedIn: ${p.linkedin}`);
      if (p.website) lines.push(`Website: ${p.website}`);
      if (p.summary) lines.push(`\n${p.summary}`);

      return { content: [{ type: 'text', text: lines.join('\n') }] };
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
      }),
    },
    async ({ keyword }): Promise<CallToolResult> => {
      let experiences = resume.experience;

      if (keyword) {
        const kw = keyword.toLowerCase();
        experiences = experiences.filter((exp: Experience) => {
          const text = [
            exp.company,
            exp.position,
            exp.location,
            ...exp.highlights,
          ]
            .join(' ')
            .toLowerCase();
          return text.includes(kw);
        });
      }

      if (experiences.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: keyword
                ? `No experience entries matching "${keyword}".`
                : 'No work experience listed.',
            },
          ],
        };
      }

      const formatted = experiences
        .map((exp: Experience) => {
          const period = `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`;
          const highlights = exp.highlights.map((h) => `  - ${h}`).join('\n');
          let text = `**${exp.position}** @ ${exp.company}`;
          if (exp.location) text += ` (${exp.location})`;
          text += `\n${period}\n${highlights}`;
          return text;
        })
        .join('\n\n');

      return { content: [{ type: 'text', text: formatted }] };
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
      }),
    },
    async ({ keyword }): Promise<CallToolResult> => {
      let projects = resume.projects;

      if (keyword) {
        const kw = keyword.toLowerCase();
        projects = projects.filter((proj: Project) => {
          const text = [
            proj.name,
            proj.description,
            ...proj.technologies,
            ...(proj.highlights || []),
          ]
            .join(' ')
            .toLowerCase();
          return text.includes(kw);
        });
      }

      if (projects.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: keyword
                ? `No projects matching "${keyword}".`
                : 'No projects listed.',
            },
          ],
        };
      }

      const formatted = projects
        .map((proj: Project) => {
          const techs = proj.technologies.join(', ');
          const highlights = (proj.highlights || [])
            .map((h) => `  - ${h}`)
            .join('\n');
          let text = `**${proj.name}**\n${proj.description}`;
          if (proj.link) text += `\nLink: ${proj.link}`;
          text += `\nTechnologies: ${techs}`;
          if (highlights) text += `\n${highlights}`;
          return text;
        })
        .join('\n\n');

      return { content: [{ type: 'text', text: formatted }] };
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
      }),
    },
    async ({ category }): Promise<CallToolResult> => {
      let skills = resume.skills;

      if (category) {
        const cat = category.toLowerCase();
        skills = skills.filter((s) =>
          s.category.toLowerCase().includes(cat)
        );
      }

      if (skills.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: category
                ? `No skills found in category "${category}".`
                : 'No skills listed.',
            },
          ],
        };
      }

      const formatted = skills
        .map((s) => `**${s.category}**: ${s.items.join(', ')}`)
        .join('\n');

      return { content: [{ type: 'text', text: formatted }] };
    }
  );

  // 5. get_education
  server.registerTool(
    'get_education',
    {
      title: 'Get Education',
      description: "Get the candidate's educational background.",
      inputSchema: z.object({}),
    },
    async (): Promise<CallToolResult> => {
      if (resume.education.length === 0) {
        return {
          content: [{ type: 'text', text: 'No education listed.' }],
        };
      }

      const formatted = resume.education
        .map((edu) => {
          let text = `**${edu.school}** - ${edu.degree} in ${edu.field}`;
          text += `\nPeriod: ${edu.startDate} - ${edu.endDate}`;
          if (edu.gpa) text += `\nGPA: ${edu.gpa}`;
          if (edu.location) text += `\nLocation: ${edu.location}`;
          if (edu.honors && edu.honors.length > 0) {
            text += `\nHonors: ${edu.honors.join(', ')}`;
          }
          return text;
        })
        .join('\n\n');

      return { content: [{ type: 'text', text: formatted }] };
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
      }),
    },
    async ({ query }): Promise<CallToolResult> => {
      const results = searchResume(resume, query);

      if (results.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No results found for "${query}".`,
            },
          ],
        };
      }

      const formatted = results
        .map(
          (r, i) =>
            `### Result ${i + 1} [source: ${r.source}, relevance: ${r.relevance}]\n${r.content}`
        )
        .join('\n\n');

      return { content: [{ type: 'text', text: formatted }] };
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
      }),
    },
    async ({ job_description }): Promise<CallToolResult> => {
      const result = evaluateFit(resume, job_description);
      return { content: [{ type: 'text', text: result.analysis }] };
    }
  );
}
