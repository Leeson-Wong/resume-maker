import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { ResumeData } from '../../src/types.js';
import { registerTools } from '../../src/tools/index.js';
import { registerResources } from '../../src/resources.js';

export async function createTestServer(resume: ResumeData) {
  const server = new McpServer({
    name: 'test-resume-mcp-server',
    version: '1.0.0',
  });

  registerTools(server, resume);
  registerResources(server, resume);

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  const client = new Client({
    name: 'test-client',
    version: '1.0.0',
  });

  await server.connect(serverTransport);
  await client.connect(clientTransport);

  const cleanup = async () => {
    await client.close();
    await server.close();
  };

  return { server, client, cleanup };
}
