// Shared type definitions for resume data

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
  level?: 1 | 2 | 3 | 4 | 5; // 1=了解 2=熟悉 3=熟练 4=精通 5=权威
  yearsUsed?: number;
  aliases?: string[]; // ["React.js", "ReactJS"]
  related?: string[]; // ["TypeScript", "Next.js"]
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
  domains?: string[]; // ["大数据云服务", "跨端应用开发"]
  trajectory?: string[]; // Career path ["Qt桌面", "大数据平台", "独立产品"]
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

// RAG search result types

export interface SearchResult {
  content: string;
  source: string;
  relevance: number;
}

// Evaluate fit structured result
export interface FitResult {
  matched: string[];
  missing: string[];
  score: number;
  analysis: string;
}

// Career summary result
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

// Helper: normalize a Skill.items entry to a string name
export function getSkillName(item: string | SkillItem): string {
  return typeof item === 'string' ? item : item.name;
}

// Helper: check if a skill entry is a SkillItem (enriched)
export function isSkillItem(item: string | SkillItem): item is SkillItem {
  return typeof item === 'object' && item !== null && 'name' in item;
}
