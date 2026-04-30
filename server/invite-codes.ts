import { randomBytes } from 'node:crypto';
import type { Storage } from './storage.js';
import type { ValidatedInviteCode, ValidatedAccessLogEntry } from './schema.js';

// Characters for code generation (excludes 0/O, 1/l/I to avoid confusion)
const CODE_CHARS = '23456789abcdefghjkmnpqrstuvwxyz';
const CODE_LENGTH = 6;

// ─── Code Generation ───────────────────────────────────────────────────

function generateCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  }
  return code;
}

// ─── Public API ────────────────────────────────────────────────────────

export interface InviteCodeManager {
  /** Generate a new invite code with a label */
  create(label: string): Promise<ValidatedInviteCode>;

  /** List all invite codes */
  list(): Promise<ValidatedInviteCode[]>;

  /** Revoke a code by its value */
  revoke(code: string): Promise<boolean>;

  /** Validate a code and return it if active */
  validate(code: string): Promise<ValidatedInviteCode | null>;

  /** Log an access event for a code */
  logAccess(code: string, tool: string): Promise<void>;
}

export function createInviteCodeManager(storage: Storage): InviteCodeManager {
  return {
    async create(label: string): Promise<ValidatedInviteCode> {
      const codes = await storage.readCodes();
      const entry: ValidatedInviteCode = {
        code: generateCode(),
        label,
        status: 'active',
        createdAt: new Date().toISOString(),
        revokedAt: null,
        accessLog: [],
      };
      codes.push(entry);
      await storage.writeCodes(codes);
      return entry;
    },

    async list(): Promise<ValidatedInviteCode[]> {
      return storage.readCodes();
    },

    async revoke(code: string): Promise<boolean> {
      const codes = await storage.readCodes();
      const entry = codes.find((c) => c.code === code);
      if (!entry || entry.status !== 'active') return false;

      entry.status = 'revoked';
      entry.revokedAt = new Date().toISOString();
      await storage.writeCodes(codes);
      return true;
    },

    async validate(code: string): Promise<ValidatedInviteCode | null> {
      return storage.validateCode(code);
    },

    async logAccess(code: string, tool: string): Promise<void> {
      await storage.logAccess(code, tool);
    },
  };
}
