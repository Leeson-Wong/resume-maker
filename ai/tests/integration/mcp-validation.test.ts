import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../helpers/create-test-server.js';
import { loadSampleResume } from '../helpers/load-resume.js';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { ResumeData } from '../../src/types.js';

/**
 * Comprehensive MCP protocol validation test.
 * Verifies all 7 tools + 2 resources are properly registered and functional.
 */
describe('MCP Protocol Validation', () => {
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

  describe('Tool Registration', () => {
    it('should list all 7 registered tools', async () => {
      const result = await client.listTools();
      const toolNames = result.tools.map((t) => t.name);
      expect(toolNames).toContain('get_profile');
      expect(toolNames).toContain('get_experience');
      expect(toolNames).toContain('get_projects');
      expect(toolNames).toContain('get_skills');
      expect(toolNames).toContain('get_education');
      expect(toolNames).toContain('search_resume');
      expect(toolNames).toContain('evaluate_fit');
      expect(result.tools).toHaveLength(7);
    });

    it('each tool should have a description', async () => {
      const result = await client.listTools();
      for (const tool of result.tools) {
        expect(tool.description).toBeTruthy();
        expect(typeof tool.description).toBe('string');
      }
    });

    it('each tool should have an inputSchema', async () => {
      const result = await client.listTools();
      for (const tool of result.tools) {
        expect(tool.inputSchema).toBeTruthy();
        expect(tool.inputSchema.type).toBe('object');
      }
    });
  });

  describe('Tool Execution', () => {
    it('get_profile returns valid content', async () => {
      const result = await client.callTool({ name: 'get_profile', arguments: {} });
      expect(result.content).toHaveLength(1);
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text.length).toBeGreaterThan(0);
    });

    it('get_experience returns valid content', async () => {
      const result = await client.callTool({ name: 'get_experience', arguments: {} });
      expect(result.content).toHaveLength(1);
    });

    it('get_projects returns valid content', async () => {
      const result = await client.callTool({ name: 'get_projects', arguments: {} });
      expect(result.content).toHaveLength(1);
    });

    it('get_skills returns valid content', async () => {
      const result = await client.callTool({ name: 'get_skills', arguments: {} });
      expect(result.content).toHaveLength(1);
    });

    it('get_education returns valid content', async () => {
      const result = await client.callTool({ name: 'get_education', arguments: {} });
      expect(result.content).toHaveLength(1);
    });

    it('search_resume returns valid content', async () => {
      const result = await client.callTool({
        name: 'search_resume',
        arguments: { query: 'React' },
      });
      expect(result.content).toHaveLength(1);
    });

    it('evaluate_fit returns valid content', async () => {
      const result = await client.callTool({
        name: 'evaluate_fit',
        arguments: { job_description: 'React developer' },
      });
      expect(result.content).toHaveLength(1);
    });
  });

  describe('Resource Registration', () => {
    it('should list 2 resources', async () => {
      const result = await client.listResources();
      expect(result.resources).toHaveLength(2);
    });

    it('resume://full should be readable', async () => {
      const result = await client.readResource({ uri: 'resume://full' });
      expect(result.contents).toHaveLength(1);
      const text = result.contents[0] as { text: string };
      const parsed = JSON.parse(text.text);
      expect(parsed.personal).toBeTruthy();
    });

    it('resume://summary should be readable', async () => {
      const result = await client.readResource({ uri: 'resume://summary' });
      expect(result.contents).toHaveLength(1);
    });
  });
});
