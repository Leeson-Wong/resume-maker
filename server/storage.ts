import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import type { AppConfig } from './config.js';
import { ResumeDataSchema, InviteCodesSchema, type ValidatedInviteCode } from './schema.js';

// ─── Write Queue (concurrency safety) ──────────────────────────────────

class WriteQueue {
  private queue: Promise<void> = Promise.resolve();

  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const result = new Promise<T>((resolve, reject) => {
      this.queue = this.queue.then(async () => {
        try {
          resolve(await fn());
        } catch (err) {
          reject(err);
        }
      });
    });
    return result;
  }
}

// ─── Atomic JSON File Operations ───────────────────────────────────────

/**
 * Read and parse a JSON file. Returns null if file doesn't exist.
 */
async function readJsonFile<T>(filePath: string): Promise<T | null> {
  if (!existsSync(filePath)) return null;
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

/**
 * Write JSON to file atomically: write to temp file, then rename.
 * Rename is atomic on most filesystems.
 */
async function writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
  const dir = join(filePath, '..');
  const tmpPath = join(dir, `.tmp-${randomUUID()}.json`);

  await mkdir(dir, { recursive: true });
  await writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  await rename(tmpPath, filePath);
}

// ─── Storage Class ─────────────────────────────────────────────────────

export class Storage {
  private readonly resumePath: string;
  private readonly codesPath: string;
  private readonly writeQueue = new WriteQueue();

  constructor(config: AppConfig) {
    this.resumePath = join(config.dataPath, 'resume.json');
    this.codesPath = join(config.dataPath, 'codes.json');
  }

  // ─── Resume ────────────────────────────────────────────────────────

  /**
   * Read resume data. Returns null if file doesn't exist or is invalid.
   */
  async readResume(): Promise<unknown | null> {
    const data = await readJsonFile<unknown>(this.resumePath);
    return data;
  }

  /**
   * Read and validate resume data. Throws on validation failure.
   */
  async readValidatedResume() {
    const data = await this.readResume();
    if (data === null) return null;
    return ResumeDataSchema.parse(data);
  }

  /**
   * Validate and save resume data atomically.
   * Throws on validation failure — existing file is not modified.
   */
  async writeResume(data: unknown): Promise<void> {
    // Validate BEFORE writing
    const validated = ResumeDataSchema.parse(data);
    await this.writeQueue.enqueue(() => writeJsonAtomic(this.resumePath, validated));
  }

  /**
   * Check if resume data file exists.
   */
  hasResume(): boolean {
    return existsSync(this.resumePath);
  }

  // ─── Invite Codes ──────────────────────────────────────────────────

  /**
   * Read all invite codes.
   */
  async readCodes(): Promise<ValidatedInviteCode[]> {
    const data = await readJsonFile<unknown>(this.codesPath);
    if (data === null) return [];
    return InviteCodesSchema.parse(data);
  }

  /**
   * Save invite codes atomically.
   */
  async writeCodes(codes: ValidatedInviteCode[]): Promise<void> {
    const validated = InviteCodesSchema.parse(codes);
    await this.writeQueue.enqueue(() => writeJsonAtomic(this.codesPath, validated));
  }

  /**
   * Check if an invite code exists and is active.
   */
  async validateCode(code: string): Promise<ValidatedInviteCode | null> {
    const codes = await this.readCodes();
    const found = codes.find((c) => c.code === code);
    if (!found || found.status !== 'active') return null;
    return found;
  }

  /**
   * Append an access log entry to a specific invite code.
   */
  async logAccess(code: string, tool: string): Promise<void> {
    await this.writeQueue.enqueue(async () => {
      const codes = await this.readCodes();
      const entry = codes.find((c) => c.code === code);
      if (entry) {
        entry.accessLog.push({ time: new Date().toISOString(), tool });
        await writeJsonAtomic(this.codesPath, codes);
      }
    });
  }

  // ─── Initialization ────────────────────────────────────────────────

  /**
   * Initialize data files if they don't exist.
   */
  async init(defaultResume: unknown): Promise<void> {
    // Ensure data directory exists
    const dir = join(this.resumePath, '..');
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Create default resume if not exists
    if (!existsSync(this.resumePath)) {
      const validated = ResumeDataSchema.parse(defaultResume);
      await writeJsonAtomic(this.resumePath, validated);
      console.log(`Created default resume data: ${this.resumePath}`);
    }

    // Create empty codes file if not exists
    if (!existsSync(this.codesPath)) {
      await writeJsonAtomic(this.codesPath, []);
      console.log(`Created empty invite codes file: ${this.codesPath}`);
    }
  }
}
