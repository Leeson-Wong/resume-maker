import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../../helpers/create-test-server.js';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { ResumeData } from '../../../src/types.js';

describe('Error Handling', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const resume: ResumeData = {
      personal: { name: 'Error Test', title: 'Tester', email: 'err@test.com' },
      experience: [],
      education: [],
      projects: [],
      skills: [],
    };
    const result = await createTestServer(resume);
    client = result.client;
    cleanup = result.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('search_resume validation', () => {
    it('should return error for empty query', async () => {
      const result = await client.callTool({
        name: 'search_resume',
        arguments: { query: '' },
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('Error');
      expect(result.isError).toBe(true);
    });

    it('should return error for whitespace-only query', async () => {
      const result = await client.callTool({
        name: 'search_resume',
        arguments: { query: '   ' },
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('Error');
      expect(result.isError).toBe(true);
    });
  });

  describe('evaluate_fit validation', () => {
    it('should return error for empty job description', async () => {
      const result = await client.callTool({
        name: 'evaluate_fit',
        arguments: { job_description: '' },
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('Error');
      expect(result.isError).toBe(true);
    });

    it('should return error for whitespace-only JD', async () => {
      const result = await client.callTool({
        name: 'evaluate_fit',
        arguments: { job_description: '   ' },
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('Error');
      expect(result.isError).toBe(true);
    });
  });

  describe('tools handle missing optional data', () => {
    it('get_profile works with minimal personal info', async () => {
      const result = await client.callTool({
        name: 'get_profile',
        arguments: {},
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('Error Test');
    });

    it('get_experience returns empty message', async () => {
      const result = await client.callTool({
        name: 'get_experience',
        arguments: {},
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('No work experience listed');
    });

    it('get_education returns empty message', async () => {
      const result = await client.callTool({
        name: 'get_education',
        arguments: {},
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('No education listed');
    });
  });
});

describe('JSON Output Format', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const resume: ResumeData = {
      personal: { name: 'JSON Test', title: 'Developer', email: 'json@test.com', github: 'github.com/test' },
      experience: [
        {
          company: 'TestCo',
          position: 'Engineer',
          startDate: '2020-01',
          current: true,
          highlights: ['Built things'],
        },
      ],
      education: [],
      projects: [],
      skills: [
        { category: 'Frontend', items: ['React', 'TypeScript'] },
      ],
    };
    const result = await createTestServer(resume);
    client = result.client;
    cleanup = result.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  it('get_profile returns valid JSON when format=json', async () => {
    const result = await client.callTool({
      name: 'get_profile',
      arguments: { format: 'json' },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.name).toBe('JSON Test');
    expect(parsed.email).toBe('json@test.com');
  });

  it('get_experience returns valid JSON when format=json', async () => {
    const result = await client.callTool({
      name: 'get_experience',
      arguments: { format: 'json' },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].company).toBe('TestCo');
  });

  it('get_skills returns valid JSON when format=json', async () => {
    const result = await client.callTool({
      name: 'get_skills',
      arguments: { format: 'json' },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].category).toBe('Frontend');
  });

  it('evaluate_fit returns valid JSON when format=json', async () => {
    const result = await client.callTool({
      name: 'evaluate_fit',
      arguments: { job_description: 'React developer', format: 'json' },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed).toHaveProperty('score');
    expect(parsed).toHaveProperty('matched');
    expect(parsed).toHaveProperty('missing');
    expect(parsed).toHaveProperty('recommendation');
  });

  it('text format returns markdown (not JSON)', async () => {
    const result = await client.callTool({
      name: 'get_profile',
      arguments: { format: 'text' },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    // Markdown format has bold markers
    expect(text).toContain('**');
    // Should not be parseable as JSON
    expect(() => JSON.parse(text)).toThrow();
  });
});

describe('get_career_summary', () => {
  let client: Client;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const resume: ResumeData = {
      personal: {
        name: 'Career Test',
        title: 'Senior Developer',
        email: 'career@test.com',
        summary: '8年全栈开发经验，专注于React和大数据平台开发。',
      },
      experience: [
        {
          company: 'Big Data Corp',
          position: 'Senior Engineer',
          startDate: '2018-01',
          current: true,
          highlights: ['Built big data platform'],
        },
      ],
      education: [],
      projects: [],
      skills: [
        {
          category: 'Frontend',
          items: [
            { name: 'React', level: 4, yearsUsed: 6 },
            { name: 'TypeScript', level: 4, yearsUsed: 5 },
          ],
        },
        {
          category: 'Backend',
          items: ['Node.js', 'Python'],
        },
      ],
      careerMeta: {
        totalYears: 8,
        seniority: 'senior',
        domains: ['大数据平台', '全栈开发'],
        trajectory: ['后端开发', '全栈架构'],
      },
    };
    const result = await createTestServer(resume);
    client = result.client;
    cleanup = result.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  it('should return career summary in text format', async () => {
    const result = await client.callTool({
      name: 'get_career_summary',
      arguments: {},
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain('Career Summary');
    expect(text).toContain('Career Test');
    expect(text).toContain('senior');
    expect(text).toContain('Domain Expertise');
  });

  it('should return career summary in JSON format', async () => {
    const result = await client.callTool({
      name: 'get_career_summary',
      arguments: { format: 'json' },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    expect(parsed.name).toBe('Career Test');
    expect(parsed.seniority).toBe('senior');
    expect(parsed.totalYears).toBe(8);
    expect(parsed.domains).toContain('大数据平台');
    expect(parsed.trajectory).toBeDefined();
    expect(parsed.coreStrengths).toBeDefined();
    expect(parsed.topSkills).toBeDefined();
    expect(parsed.workStyle).toBeDefined();
  });

  it('should include top skills with levels', async () => {
    const result = await client.callTool({
      name: 'get_career_summary',
      arguments: { format: 'json' },
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    const parsed = JSON.parse(text);
    const react = parsed.topSkills.find((s: { name: string }) => s.name === 'React');
    expect(react).toBeDefined();
    expect(react.level).toBe(4);
    expect(react.yearsUsed).toBe(6);
  });
});
