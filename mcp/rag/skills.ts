/**
 * Skill normalization and analysis module.
 * Provides alias resolution, level inference, and canonical skill mapping.
 */

import type { ResumeData, SkillItem } from '../../src/types/resume.js';
import { getSkillName, isSkillItem } from '../../src/types/resume.js';
import { SKILL_ALIASES, CN_TO_EN, buildAliasMap } from './skill-aliases.js';

// Build reverse lookup once
const ALIAS_TO_CANONICAL = buildAliasMap();

// ─── Public API ────────────────────────────────────────────────────────

/**
 * Normalize a skill name to its canonical form.
 * "react.js" → "React", "k8s" → "Kubernetes", "vuejs" → "Vue"
 */
export function normalizeSkillName(input: string): string {
  const lower = input.trim().toLowerCase();

  // Check alias map first
  const canonical = ALIAS_TO_CANONICAL.get(lower);
  if (canonical) return canonical;

  // Check Chinese mapping
  const en = CN_TO_EN[input.trim()];
  if (en) return en;

  // Fallback: capitalize first letter of each word
  return input
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get the proficiency level of a specific skill from the resume.
 * Returns the SkillItem level if available, or infers from experience/projects.
 */
export function getSkillLevel(
  resume: ResumeData,
  skillName: string
): number | undefined {
  const canonical = normalizeSkillName(skillName);

  // Check enriched SkillItem data
  for (const group of resume.skills ?? []) {
    for (const item of group.items ?? []) {
      if (isSkillItem(item)) {
        const match =
          normalizeSkillName(item.name) === canonical ||
          (item.aliases ?? []).some((a) => normalizeSkillName(a) === canonical);
        if (match) return item.level;
      }
    }
  }

  // Infer from plain string skills — if present, give baseline 3
  for (const group of resume.skills ?? []) {
    for (const item of group.items ?? []) {
      const name = getSkillName(item);
      if (normalizeSkillName(name) === canonical) return 3;
    }
  }

  return undefined;
}

/**
 * Get all skills in normalized canonical form with metadata.
 * Returns a Map: canonicalName → { level?, yearsUsed?, aliases?, related? }
 */
export function getAllSkillsCanonical(
  resume: ResumeData
): Map<
  string,
  { level?: number; yearsUsed?: number; aliases?: string[]; related?: string[] }
> {
  const result = new Map<
    string,
    {
      level?: number;
      yearsUsed?: number;
      aliases?: string[];
      related?: string[];
    }
  >();

  for (const group of resume.skills ?? []) {
    for (const item of group.items ?? []) {
      if (isSkillItem(item)) {
        const canonical = normalizeSkillName(item.name);
        if (!result.has(canonical)) {
          result.set(canonical, {
            level: item.level,
            yearsUsed: item.yearsUsed,
            aliases: item.aliases,
            related: item.related,
          });
        }
      } else {
        const canonical = normalizeSkillName(item as string);
        if (!result.has(canonical)) {
          result.set(canonical, {});
        }
      }
    }
  }

  return result;
}

/**
 * Extract all known tech terms from the resume dynamically.
 * Replaces the hardcoded commonTechTerms list.
 */
export function extractTechTermsFromResume(resume: ResumeData): Set<string> {
  const terms = new Set<string>();

  // From skills
  for (const group of resume.skills ?? []) {
    for (const item of group.items ?? []) {
      const name = getSkillName(item);
      const canonical = normalizeSkillName(name);
      terms.add(canonical.toLowerCase());

      // Add aliases from SkillItem
      if (isSkillItem(item)) {
        for (const alias of item.aliases ?? []) {
          terms.add(alias.toLowerCase());
        }
      }
    }
  }

  // From projects.technologies
  for (const proj of resume.projects ?? []) {
    for (const tech of proj.technologies ?? []) {
      terms.add(normalizeSkillName(tech).toLowerCase());
    }
  }

  // From experience highlights (extract skill-like terms)
  for (const exp of resume.experience ?? []) {
    for (const h of exp.highlights ?? []) {
      // Extract terms that match known aliases
      for (const [alias] of ALIAS_TO_CANONICAL) {
        if (h.toLowerCase().includes(alias)) {
          terms.add(alias);
        }
      }
    }
  }

  // From personal summary
  const summary = resume.personal?.summary?.toLowerCase() ?? '';
  for (const [alias] of ALIAS_TO_CANONICAL) {
    if (summary.includes(alias)) {
      terms.add(alias);
    }
  }

  return terms;
}

/**
 * Get the Chinese-to-English tech term mapping for use in search.
 */
export function getChineseTechMappings(): Record<string, string> {
  return { ...CN_TO_EN };
}
