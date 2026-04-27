import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ResumeData } from './types.js';

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
