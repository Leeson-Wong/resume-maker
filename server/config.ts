import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

export interface AppConfig {
  /** Auth code for accessing the editor */
  authCode: string;
  /** Server port */
  port: number;
  /** Path to data directory (absolute or relative to cwd) */
  dataPath: string;
}

const DEFAULT_CONFIG: Partial<AppConfig> = {
  port: 965,
  dataPath: './data',
};

/**
 * Load configuration from config.json (or config.yaml in future).
 * Environment variables take precedence over config file values.
 */
export async function loadConfig(): Promise<AppConfig> {
  const configPath = join(process.cwd(), 'config.json');

  let fileConfig: Partial<AppConfig> = {};

  if (existsSync(configPath)) {
    try {
      const raw = await readFile(configPath, 'utf-8');
      fileConfig = JSON.parse(raw);
    } catch (err) {
      throw new Error(
        `Failed to parse config file: ${configPath} — ${err instanceof Error ? err.message : err}`
      );
    }
  }

  // Merge: defaults < file < env vars
  const config: AppConfig = {
    authCode:
      process.env.AUTH_CODE ??
      fileConfig.authCode ??
      DEFAULT_CONFIG.authCode ??
      '',
    port: parseInt(process.env.PORT ?? String(fileConfig.port ?? DEFAULT_CONFIG.port ?? 965), 10),
    dataPath: process.env.DATA_PATH ?? fileConfig.dataPath ?? DEFAULT_CONFIG.dataPath ?? './data',
  };

  // Validate required fields
  if (!config.authCode) {
    throw new Error(
      `Missing required config: "authCode". ` +
      `Set it in config.json or via AUTH_CODE environment variable.`
    );
  }

  return config;
}
