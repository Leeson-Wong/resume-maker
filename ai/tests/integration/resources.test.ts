import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../helpers/create-test-server.js';
import { loadSampleResume } from '../helpers/load-resume.js';
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { ResumeData } from '../../src/types.js';

describe('MCP Resources', () => {
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

  it('listResources should return 2 resources', async () => {
    const result = await client.listResources();
    expect(result.resources).toHaveLength(2);
  });

  it('should read resume://full as valid JSON', async () => {
    const result = await client.readResource({ uri: 'resume://full' });
    const text = result.contents[0];
    expect('text' in text).toBe(true);
    const parsed = JSON.parse((text as { text: string }).text);
    expect(parsed.personal.name).toBe(resume.personal.name);
    expect(parsed).toHaveProperty('experience');
    expect(parsed).toHaveProperty('skills');
  });

  it('should read resume://summary with name and experience info', async () => {
    const result = await client.readResource({ uri: 'resume://summary' });
    const text = result.contents[0];
    expect('text' in text).toBe(true);
    const summary = (text as { text: string }).text;
    expect(summary).toContain(resume.personal.name);
    expect(summary).toContain('years experience');
  });

  it('should have correct resource metadata', async () => {
    const result = await client.listResources();
    const uris = result.resources.map((r) => r.uri);
    expect(uris).toContain('resume://full');
    expect(uris).toContain('resume://summary');

    const fullResource = result.resources.find((r) => r.uri === 'resume://full');
    expect(fullResource?.mimeType).toBe('application/json');

    const summaryResource = result.resources.find(
      (r) => r.uri === 'resume://summary'
    );
    expect(summaryResource?.mimeType).toBe('text/plain');
  });
});
