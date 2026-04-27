import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../../helpers/create-test-server.js';
import { loadSampleResume } from '../../helpers/load-resume.js';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { ResumeData } from '../../../src/types.js';

describe('MCP Tool Handlers', () => {
  let client: Client;
  let cleanup: () => Promise<void>;
  let resume: ResumeData;

  beforeAll(async () => {
    resume = await loadSampleResume();
    const result = await createTestServer(resume);
    client = result.client;
    cleanup = result.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  // 1. get_profile
  describe('get_profile', () => {
    it('should return candidate profile info', async () => {
      const result = await client.callTool({ name: 'get_profile', arguments: {} });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain(resume.personal.name);
      expect(text).toContain(resume.personal.title);
      expect(text).toContain(resume.personal.email);
    });

    it('should include optional fields when present', async () => {
      const result = await client.callTool({ name: 'get_profile', arguments: {} });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      if (resume.personal.github) {
        expect(text).toContain(resume.personal.github);
      }
      if (resume.personal.summary) {
        expect(text).toContain(resume.personal.summary);
      }
    });
  });

  // 2. get_experience
  describe('get_experience', () => {
    it('should return all experience entries without filter', async () => {
      const result = await client.callTool({ name: 'get_experience', arguments: {} });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain(resume.experience[0].company);
      expect(text).toContain(resume.experience[0].position);
    });

    it('should filter experience by keyword', async () => {
      const result = await client.callTool({
        name: 'get_experience',
        arguments: { keyword: 'SaaS' },
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('SaaS');
    });

    it('should return no-match message for non-existing keyword', async () => {
      const result = await client.callTool({
        name: 'get_experience',
        arguments: { keyword: '量子计算不存在' },
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('No experience entries matching');
    });
  });

  // 3. get_projects
  describe('get_projects', () => {
    it('should return all projects without filter', async () => {
      const result = await client.callTool({ name: 'get_projects', arguments: {} });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain(resume.projects[0].name);
    });

    it('should filter projects by keyword', async () => {
      const result = await client.callTool({
        name: 'get_projects',
        arguments: { keyword: 'React' },
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('React');
    });

    it('should return no-match message for non-existing keyword', async () => {
      const result = await client.callTool({
        name: 'get_projects',
        arguments: { keyword: '完全不存在的项目名' },
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('No projects matching');
    });
  });

  // 4. get_skills
  describe('get_skills', () => {
    it('should return all skills without filter', async () => {
      const result = await client.callTool({ name: 'get_skills', arguments: {} });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain(resume.skills[0].category);
    });

    it('should filter skills by category', async () => {
      const result = await client.callTool({
        name: 'get_skills',
        arguments: { category: '前端' },
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('React');
    });

    it('should return no-match message for non-existing category', async () => {
      const result = await client.callTool({
        name: 'get_skills',
        arguments: { category: '量子计算' },
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('No skills found in category');
    });
  });

  // 5. get_education
  describe('get_education', () => {
    it('should return education entries', async () => {
      const result = await client.callTool({ name: 'get_education', arguments: {} });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain(resume.education[0].school);
      expect(text).toContain(resume.education[0].degree);
      expect(text).toContain(resume.education[0].field);
    });
  });

  // 6. search_resume
  describe('search_resume', () => {
    it('should return search results for valid query', async () => {
      const result = await client.callTool({
        name: 'search_resume',
        arguments: { query: 'React' },
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('Result');
      expect(text).toContain('relevance');
    });

    it('should return no-results message for non-matching query', async () => {
      const result = await client.callTool({
        name: 'search_resume',
        arguments: { query: '量子计算不存在' },
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('No results found');
    });
  });

  // 7. evaluate_fit
  describe('evaluate_fit', () => {
    it('should return fit analysis with score', async () => {
      const jd = 'Looking for a React developer with Node.js experience';
      const result = await client.callTool({
        name: 'evaluate_fit',
        arguments: { job_description: jd },
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('Candidate Fit Analysis');
      expect(text).toContain('Overall Match Score');
    });
  });

  // Edge case: minimal resume (empty arrays)
  describe('with minimal resume', () => {
    let minClient: Client;
    let minCleanup: () => Promise<void>;

    beforeAll(async () => {
      const minimalResume: ResumeData = {
        personal: { name: '空用户', title: '无', email: 'empty@test.com' },
        experience: [],
        education: [],
        projects: [],
        skills: [],
      };
      const result = await createTestServer(minimalResume);
      minClient = result.client;
      minCleanup = result.cleanup;
    });

    afterAll(async () => {
      await minCleanup();
    });

    it('should handle empty experience gracefully', async () => {
      const result = await minClient.callTool({
        name: 'get_experience',
        arguments: {},
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('No work experience listed');
    });

    it('should handle empty projects gracefully', async () => {
      const result = await minClient.callTool({
        name: 'get_projects',
        arguments: {},
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('No projects listed');
    });

    it('should handle empty education gracefully', async () => {
      const result = await minClient.callTool({
        name: 'get_education',
        arguments: {},
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('No education listed');
    });

    it('should handle empty skills gracefully', async () => {
      const result = await minClient.callTool({
        name: 'get_skills',
        arguments: {},
      });
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain('No skills listed');
    });
  });
});
