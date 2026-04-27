import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const transport = new StreamableHTTPClientTransport(new URL('http://localhost:3001/mcp'));
const client = new Client({ name: 'test-client', version: '1.0.0' });

await client.connect(transport);
console.log('Connected to MCP server!\n');

// 1. List available tools
const { tools } = await client.listTools();
console.log('=== Available Tools ===');
for (const t of tools) {
  console.log(`  - ${t.name}: ${t.description}`);
}

// 2. List available resources
const { resources } = await client.listResources();
console.log('\n=== Available Resources ===');
for (const r of resources) {
  console.log(`  - ${r.uri}: ${r.name}`);
}

// 3. Call each tool
console.log('\n====================================');
console.log('=== get_profile ===');
console.log('====================================');
const profile = await client.callTool({ name: 'get_profile', arguments: {} });
console.log(profile.content[0].text);

console.log('\n====================================');
console.log('=== get_experience ===');
console.log('====================================');
const experience = await client.callTool({ name: 'get_experience', arguments: {} });
console.log(experience.content[0].text);

console.log('\n====================================');
console.log('=== get_projects ===');
console.log('====================================');
const projects = await client.callTool({ name: 'get_projects', arguments: {} });
console.log(projects.content[0].text);

console.log('\n====================================');
console.log('=== get_skills ===');
console.log('====================================');
const skills = await client.callTool({ name: 'get_skills', arguments: {} });
console.log(skills.content[0].text);

console.log('\n====================================');
console.log('=== get_education ===');
console.log('====================================');
const education = await client.callTool({ name: 'get_education', arguments: {} });
console.log(education.content[0].text);

// 4. Read resources
console.log('\n====================================');
console.log('=== Resource: resume://full ===');
console.log('====================================');
const full = await client.readResource({ uri: 'resume://full' });
console.log(full.contents[0].text);

console.log('\n====================================');
console.log('=== Resource: resume://summary ===');
console.log('====================================');
const summary = await client.readResource({ uri: 'resume://summary' });
console.log(summary.contents[0].text);

// 5. Test search
console.log('\n====================================');
console.log('=== search_resume("React") ===');
console.log('====================================');
const search = await client.callTool({ name: 'search_resume', arguments: { query: 'React' } });
console.log(search.content[0].text);

// 6. Test evaluate_fit
console.log('\n====================================');
console.log('=== evaluate_fit ===');
console.log('====================================');
const fit = await client.callTool({ name: 'evaluate_fit', arguments: {
  job_description: '招聘前端开发工程师，要求3年以上React经验，熟悉TypeScript和Node.js，有独立产品开发经验优先。'
}});
console.log(fit.content[0].text);

await client.close();
console.log('\nDone.');
