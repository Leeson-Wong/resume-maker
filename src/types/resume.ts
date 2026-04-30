// Shared type definitions for resume data
// Used by both frontend (React app) and backend (MCP server)

export interface PersonalInfo {
  name: string;
  title: string;
  email: string;
  phone?: string;
  location?: string;
  website?: string;
  github?: string;
  linkedin?: string;
  summary?: string;
  avatar?: string;
}

export interface Experience {
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  highlights: string[];
}

export interface Education {
  school: string;
  degree: string;
  field: string;
  location?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  honors?: string[];
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  link?: string;
  highlights?: string[];
}

/** Enriched skill item with proficiency metadata */
export interface SkillItem {
  name: string;
  level?: 1 | 2 | 3 | 4 | 5;
  yearsUsed?: number;
  aliases?: string[];
  related?: string[];
}

export interface Skill {
  category: string;
  items: string[] | SkillItem[]; // Backward compatible: string[] or SkillItem[]
}

export interface Language {
  name: string;
  level: string;
}

export interface Certificate {
  name: string;
  issuer: string;
  date: string;
  link?: string;
}

export interface InterestItem {
  name: string;
  items?: string[];
}

export interface CustomSectionEntry {
  title: string;
  subtitle?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  highlights?: string[];
}

export interface CustomSection {
  id: string;
  title: string;
  entries: CustomSectionEntry[];
}

/** Career-level metadata for quick assessment */
export interface CareerMetadata {
  totalYears?: number;
  seniority?: 'junior' | 'mid' | 'senior' | 'staff' | 'principal';
  domains?: string[];
  trajectory?: string[];
}

export interface ResumeData {
  personal: PersonalInfo;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  skills: Skill[];
  languages?: Language[];
  certificates?: Certificate[];
  interests?: InterestItem[];
  customSections?: CustomSection[];
  sectionOrder?: string[];
  sectionVisibility?: Record<string, boolean>;
  careerMeta?: CareerMetadata;
}

// ─── MCP-only types ───────────────────────────────────────────────────

export interface SearchResult {
  content: string;
  source: string;
  relevance: number;
}

export interface FitResult {
  matched: string[];
  missing: string[];
  score: number;
  analysis: string;
}

export interface CareerSummary {
  name: string;
  title: string;
  seniority: string;
  totalYears: number;
  domains: string[];
  trajectory: string[];
  coreStrengths: string[];
  topSkills: Array<{ name: string; level?: number; yearsUsed?: number }>;
  workStyle: string;
}

// ─── Helper functions ──────────────────────────────────────────────────

/** Normalize a Skill.items entry to a string name */
export function getSkillName(item: string | SkillItem): string {
  return typeof item === 'string' ? item : item.name;
}

/** Check if a skill entry is a SkillItem (enriched) */
export function isSkillItem(item: string | SkillItem): item is SkillItem {
  return typeof item === 'object' && item !== null && 'name' in item;
}

// ─── Frontend-only types ───────────────────────────────────────────────

export type ThemeType = 'classic' | 'modern' | 'minimal';

export const DEFAULT_SECTION_ORDER = [
  'personal',
  'experience',
  'projects',
  'education',
  'skills',
  'languages',
  'certificates',
  'interests',
];

export const DEFAULT_SECTION_VISIBILITY: Record<string, boolean> = {
  personal: true,
  experience: true,
  projects: true,
  education: true,
  skills: true,
  languages: true,
  certificates: true,
  interests: true,
};
