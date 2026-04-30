import { z } from 'zod';

// ─── Core Resume Schemas ───────────────────────────────────────────────

export const PersonalInfoSchema = z.object({
  name: z.string(),
  title: z.string(),
  email: z.string().email().or(z.literal('')),
  phone: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  summary: z.string().optional(),
  avatar: z.string().optional(),
});

export const ExperienceSchema = z.object({
  company: z.string(),
  position: z.string(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  current: z.boolean().optional(),
  highlights: z.array(z.string()),
});

export const EducationSchema = z.object({
  school: z.string(),
  degree: z.string(),
  field: z.string(),
  location: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  gpa: z.string().optional(),
  honors: z.array(z.string()).optional(),
});

export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
  link: z.string().optional(),
  highlights: z.array(z.string()).optional(),
});

export const SkillItemSchema = z.object({
  name: z.string(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  yearsUsed: z.number().optional(),
  aliases: z.array(z.string()).optional(),
  related: z.array(z.string()).optional(),
});

export const SkillSchema = z.object({
  category: z.string(),
  items: z.array(z.union([z.string(), SkillItemSchema])),
});

export const LanguageSchema = z.object({
  name: z.string(),
  level: z.string(),
});

export const CertificateSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  date: z.string(),
  link: z.string().optional(),
});

export const InterestItemSchema = z.object({
  name: z.string(),
  items: z.array(z.string()).optional(),
});

export const CustomSectionEntrySchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  highlights: z.array(z.string()).optional(),
});

export const CustomSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  entries: z.array(CustomSectionEntrySchema),
});

export const CareerMetadataSchema = z.object({
  totalYears: z.number().optional(),
  seniority: z.enum(['junior', 'mid', 'senior', 'staff', 'principal']).optional(),
  domains: z.array(z.string()).optional(),
  trajectory: z.array(z.string()).optional(),
});

export const ResumeDataSchema = z.object({
  personal: PersonalInfoSchema,
  experience: z.array(ExperienceSchema),
  education: z.array(EducationSchema),
  projects: z.array(ProjectSchema),
  skills: z.array(SkillSchema),
  languages: z.array(LanguageSchema).optional(),
  certificates: z.array(CertificateSchema).optional(),
  interests: z.array(InterestItemSchema).optional(),
  customSections: z.array(CustomSectionSchema).optional(),
  sectionOrder: z.array(z.string()).optional(),
  sectionVisibility: z.record(z.boolean()).optional(),
  careerMeta: CareerMetadataSchema.optional(),
});

// ─── Invite Code Schema ────────────────────────────────────────────────

export const AccessLogEntrySchema = z.object({
  time: z.string(),
  tool: z.string(),
});

export const InviteCodeSchema = z.object({
  code: z.string(),
  label: z.string(),
  status: z.enum(['active', 'revoked']),
  createdAt: z.string(),
  revokedAt: z.string().nullable(),
  accessLog: z.array(AccessLogEntrySchema),
});

export const InviteCodesSchema = z.array(InviteCodeSchema);

// ─── Type re-exports from inferred schemas ──────────────────────────────

export type ValidatedResumeData = z.infer<typeof ResumeDataSchema>;
export type ValidatedInviteCode = z.infer<typeof InviteCodeSchema>;
export type ValidatedAccessLogEntry = z.infer<typeof AccessLogEntrySchema>;
