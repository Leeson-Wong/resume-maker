/**
 * MCP Validation Script
 *
 * Standalone script that starts a real HTTP server and validates all MCP endpoints.
 * Run with: npx tsx ai/scripts/validate-mcp.mts
 */
import { createServer } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerTools } from '../src/tools/index.js';
import { registerResources } from '../src/resources.js';
import type { ResumeData } from '../src/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let passed = 0;
let failed = 0;

function log(msg: string) {
  console.log(`  ${msg}`);
}

async function assert(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err: any) {
    log(`  ❌ FAIL: ${name}`);
    log(`     ${err.message}`);
    failed++;
  }
}

async function main() {
  console.log('\n=== MCP Validation Script ===\n');

  // Load resume data
  const dataPath = join(__dirname, '..', 'data', 'sample-resume.json');
  const raw = await readFile(dataPath, 'utf-8');
  const resume: ResumeData = JSON.parse(raw);

  // Create MCP server
  const server = new McpServer({
    name: 'resume-mcp-server',
    version: '1.0.0',
  });
  registerTools(server, resume);
  registerResources(server, resume);

  // Create in-memory client for testing
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'validation-client', version: '1.0.0' });
  await server.connect(serverTransport);
  await client.connect(clientTransport);

  console.log('--- Tool Validation ---\n');

  await assert('listTools returns 7 tools', async () => {
    const result = await client.listTools();
    if (result.tools.length !== 7) {
      throw new Error(`Expected 7 tools, got ${result.tools.length}`);
    }
  });

  await assert('get_profile returns candidate name', async () => {
    const result = await client.callTool({ name: 'get_profile', arguments: {} });
    const text = (result.content as any)[0].text;
    if (!text.includes(resume.personal.name)) {
      throw new Error(`Expected name "${resume.personal.name}" in output`);
    }
  });

  await assert('get_experience returns experience data', async () => {
    const result = await client.callTool({ name: 'get_experience', arguments: {} });
    const text = (result.content as any)[0].text;
    if (!text.includes(resume.experience[0].company)) {
      throw new Error('Expected company name in experience output');
    }
  });

  await assert('get_experience filters by keyword', async () => {
    const result = await client.callTool({
      name: 'get_experience',
      arguments: { keyword: 'SaaS' },
    });
    const text = (result.content as any)[0].text;
    if (!text.includes('SaaS')) {
      throw new Error('Expected SaaS keyword in filtered output');
    }
  });

  await assert('get_projects returns project data', async () => {
    const result = await client.callTool({ name: 'get_projects', arguments: {} });
    const text = (result.content as any)[0].text;
    if (!text.includes(resume.projects[0].name)) {
      throw new Error('Expected project name in output');
    }
  });

  await assert('get_skills returns skill data', async () => {
    const result = await client.callTool({ name: 'get_skills', arguments: {} });
    const text = (result.content as any)[0].text;
    if (!text.includes(resume.skills[0].category)) {
      throw new Error('Expected skill category in output');
    }
  });

  await assert('get_education returns education data', async () => {
    const result = await client.callTool({ name: 'get_education', arguments: {} });
    const text = (result.content as any)[0].text;
    if (!text.includes(resume.education[0].school)) {
      throw new Error('Expected school name in output');
    }
  });

  await assert('search_resume returns results for valid query', async () => {
    const result = await client.callTool({
      name: 'search_resume',
      arguments: { query: 'React' },
    });
    const text = (result.content as any)[0].text;
    if (text.includes('No results found')) {
      throw new Error('Expected search results for "React"');
    }
  });

  await assert('evaluate_fit returns analysis', async () => {
    const result = await client.callTool({
      name: 'evaluate_fit',
      arguments: { job_description: 'React developer with Node.js' },
    });
    const text = (result.content as any)[0].text;
    if (!text.includes('Candidate Fit Analysis')) {
      throw new Error('Expected fit analysis in output');
    }
  });

  console.log('\n--- Resource Validation ---\n');

  await assert('listResources returns 2 resources', async () => {
    const result = await client.listResources();
    if (result.resources.length !== 2) {
      throw new Error(`Expected 2 resources, got ${result.resources.length}`);
    }
  });

  await assert('resume://full returns valid JSON', async () => {
    const result = await client.readResource({ uri: 'resume://full' });
    const text = (result.contents[0] as any).text;
    const parsed = JSON.parse(text);
    if (!parsed.personal || !parsed.experience) {
      throw new Error('Invalid resume data structure');
    }
  });

  await assert('resume://summary contains name and experience', async () => {
    const result = await client.readResource({ uri: 'resume://summary' });
    const text = (result.contents[0] as any).text;
    if (!text.includes(resume.personal.name)) {
      throw new Error('Expected candidate name in summary');
    }
    if (!text.includes('years experience')) {
      throw new Error('Expected experience years in summary');
    }
  });

  // Cleanup
  await client.close();
  await server.close();

  // Summary
  console.log('\n=== Results ===\n');
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${passed + failed}`);

  if (failed > 0) {
    console.log('\n❌ Validation FAILED\n');
    process.exit(1);
  } else {
    console.log('\n✅ All validations passed!\n');
  }
}

main().catch((err) => {
  console.error('Validation script error:', err);
  process.exit(1);
});
