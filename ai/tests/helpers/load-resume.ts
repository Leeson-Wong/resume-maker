import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ResumeData } from '../../src/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadSampleResume(): Promise<ResumeData> {
  const path = join(__dirname, '..', '..', 'data', 'sample-resume.json');
  const raw = await readFile(path, 'utf-8');
  return JSON.parse(raw) as ResumeData;
}

export async function loadMinimalResume(): Promise<ResumeData> {
  const path = join(__dirname, '..', 'fixtures', 'minimal-resume.json');
  const raw = await readFile(path, 'utf-8');
  return JSON.parse(raw) as ResumeData;
}
