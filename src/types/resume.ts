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

export interface Skill {
  category: string;
  items: string[];
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
}

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
