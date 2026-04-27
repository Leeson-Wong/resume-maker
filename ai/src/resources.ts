import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ResumeData, SkillItem } from './types.js';
import { getSkillName, isSkillItem } from './types.js';

export function registerResources(server: McpServer, resume: ResumeData): void {
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

  // resume://summary — enriched candidate summary
  server.registerResource(
    'resume-summary',
    'resume://summary',
    {
      title: 'Resume Summary',
      description: 'Candidate summary: name, title, experience, seniority, core skills, domains',
      mimeType: 'text/plain',
    },
    async (uri) => {
      // Calculate years of experience
      const startDates = (resume.experience ?? []).map((e) => new Date(e.startDate));
      const earliest = startDates.length > 0
        ? startDates.reduce((a, b) => (a < b ? a : b))
        : new Date();
      const yearsExp = new Date().getFullYear() - earliest.getFullYear();

      // Extract core skills with levels
      const allItems: (string | SkillItem)[] = (resume.skills ?? [])
        .flatMap((s) => [...(s.items ?? [])]);
      const coreSkills = allItems
        .slice(0, 8)
        .map((item) => {
          const name = getSkillName(item);
          if (isSkillItem(item) && item.level) {
            const labels: Record<number, string> = { 1: '了解', 2: '熟悉', 3: '熟练', 4: '精通', 5: '权威' };
            return `${name}(${labels[item.level] ?? ''})`;
          }
          return name;
        })
        .join(', ');

      // Career metadata
      const meta = resume.careerMeta;
      const seniority = meta?.seniority ?? (yearsExp >= 6 ? 'senior' : yearsExp >= 3 ? 'mid' : 'junior');
      const domains = meta?.domains?.join(', ') ?? '软件开发';

      const summary = [
        `${p?.name ?? 'Unknown'} | ${p?.title ?? 'Unknown'}`,
        `${yearsExp}+ years experience | Seniority: ${seniority}`,
        `Domains: ${domains}`,
        `Core skills: ${coreSkills}`,
      ].join('\n');

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
