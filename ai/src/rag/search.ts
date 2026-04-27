import type { ResumeData, SearchResult, FitResult } from '../types.js';
import { getSkillName } from '../types.js';
import {
  normalizeSkillName,
  extractTechTermsFromResume,
} from './skills.js';
import { buildAliasMap } from './skill-aliases.js';

/**
 * Lightweight keyword search with TF-based relevance scoring.
 * Tokenizes query and resume fields, matches keywords, and ranks results.
 */

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    // Separate Chinese/Latin and Chinese/digit boundaries
    .replace(/([\u4e00-\u9fff])([a-z0-9])/g, '$1 $2')
    .replace(/([a-z0-9])([\u4e00-\u9fff])/g, '$1 $2')
    .replace(/[^\w\u4e00-\u9fff]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/** Check if a Chinese/English query term appears as a substring in the text */
function containsTerm(text: string, term: string): boolean {
  return text.toLowerCase().includes(term.toLowerCase());
}

/** Calculate relevance score based on how many query terms match the text */
function scoreText(text: string, queryTerms: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const term of queryTerms) {
    if (containsTerm(lower, term)) {
      let count = 0;
      let idx = 0;
      const termLower = term.toLowerCase();
      while ((idx = lower.indexOf(termLower, idx)) !== -1) {
        count++;
        idx += termLower.length;
      }
      score += count;
    }
  }
  return score;
}

export function searchResume(resume: ResumeData, query: string): SearchResult[] {
  const queryTerms = tokenize(query);
  if (queryTerms.length === 0) return [];

  const results: SearchResult[] = [];

  // Search personal info
  const personal = resume.personal;
  const personalText = [
    personal?.name,
    personal?.title,
    personal?.summary,
    personal?.location,
  ]
    .filter(Boolean)
    .join(' ');

  const personalScore = scoreText(personalText, queryTerms);
  if (personalScore > 0) {
    results.push({
      content: `**${personal?.name ?? ''}** | ${personal?.title ?? ''}\n${personal?.summary || ''}\n📍 ${personal?.location || ''}`,
      source: 'personal',
      relevance: personalScore,
    });
  }

  // Search experience
  for (const exp of resume?.experience ?? []) {
    const expText = [
      exp.company,
      exp.position,
      exp.location,
      ...(exp.highlights ?? []),
    ].join(' ');

    const expScore = scoreText(expText, queryTerms);
    if (expScore > 0) {
      const highlights = (exp.highlights ?? []).map((h) => `  - ${h}`).join('\n');
      results.push({
        content: `**${exp.position}** @ ${exp.company} (${exp.startDate} - ${exp.current ? '至今' : exp.endDate ?? ''})\n${highlights}`,
        source: 'experience',
        relevance: expScore,
      });
    }
  }

  // Search projects
  for (const proj of resume?.projects ?? []) {
    const projText = [
      proj.name,
      proj.description,
      ...(proj.technologies ?? []),
      ...(proj.highlights ?? []),
    ].join(' ');

    const projScore = scoreText(projText, queryTerms);
    if (projScore > 0) {
      const techs = (proj.technologies ?? []).join(', ');
      const highlights = (proj.highlights ?? []).map((h) => `  - ${h}`).join('\n');
      results.push({
        content: `**${proj.name}**\n${proj.description}\nTech: ${techs}\n${highlights}`,
        source: 'projects',
        relevance: projScore,
      });
    }
  }

  // Search skills
  for (const skillGroup of resume?.skills ?? []) {
    const itemNames = (skillGroup.items ?? []).map((item) =>
      typeof item === 'string' ? item : item.name
    );
    const skillText = [skillGroup.category, ...itemNames].join(' ');
    const skillScore = scoreText(skillText, queryTerms);
    if (skillScore > 0) {
      results.push({
        content: `**${skillGroup.category}**: ${itemNames.join(', ')}`,
        source: 'skills',
        relevance: skillScore,
      });
    }
  }

  // Search education
  for (const edu of resume?.education ?? []) {
    const eduText = [
      edu.school,
      edu.degree,
      edu.field,
      edu.gpa,
      ...(edu.honors ?? []),
    ].join(' ');

    const eduScore = scoreText(eduText, queryTerms);
    if (eduScore > 0) {
      const honors = edu.honors?.length ? `\n  Honors: ${edu.honors.join(', ')}` : '';
      results.push({
        content: `**${edu.school}** - ${edu.degree} in ${edu.field} (${edu.startDate} - ${edu.endDate ?? ''})${honors}\n  GPA: ${edu.gpa || 'N/A'}`,
        source: 'education',
        relevance: eduScore,
      });
    }
  }

  // Search certificates
  for (const cert of resume?.certificates ?? []) {
    const certText = [cert.name, cert.issuer].join(' ');
    const certScore = scoreText(certText, queryTerms);
    if (certScore > 0) {
      results.push({
        content: `**${cert.name}** - ${cert.issuer} (${cert.date})`,
        source: 'certificates',
        relevance: certScore,
      });
    }
  }

  // Search custom sections
  for (const section of resume?.customSections ?? []) {
    for (const entry of section.entries ?? []) {
      const entryText = [
        entry.title,
        entry.subtitle,
        entry.description,
        ...(entry.highlights ?? []),
      ].join(' ');
      const entryScore = scoreText(entryText, queryTerms);
      if (entryScore > 0) {
        results.push({
          content: `**${entry.title}**${entry.subtitle ? ` - ${entry.subtitle}` : ''}\n${entry.description || ''}`,
          source: `custom:${section.title}`,
          relevance: entryScore,
        });
      }
    }
  }

  // Sort by relevance descending
  results.sort((a, b) => b.relevance - a.relevance);

  return results;
}

/**
 * Analyze candidate fit against a job description.
 * Extracts keywords from the JD and matches against resume data.
 * Uses dynamic tech term extraction instead of hardcoded lists.
 */
export function evaluateFit(
  resume: ResumeData,
  jobDescription: string
): FitResult {
  const jd = jobDescription ?? '';

  // Extract skill-like keywords from the JD
  const jdTerms = tokenize(jd);
  const allSkillNames = (resume?.skills ?? []).flatMap((s) =>
    (s.items ?? []).map((item) => getSkillName(item))
  );
  const allTechs = (resume?.projects ?? []).flatMap((p) => p.technologies ?? []);

  // Build candidate terms from resume data + normalized forms
  const candidateTerms = new Set<string>();
  for (const t of [...allSkillNames, ...allTechs]) {
    const lower = t.toLowerCase();
    candidateTerms.add(lower);
    const canonical = normalizeSkillName(t).toLowerCase();
    candidateTerms.add(canonical);
    for (const part of lower.split(/[.\s/]+/)) {
      if (part.length >= 2) candidateTerms.add(part);
    }
  }

  // Also add all known aliases from resume tech terms
  const resumeTechTerms = extractTechTermsFromResume(resume);
  for (const term of resumeTechTerms) {
    candidateTerms.add(term.toLowerCase());
  }

  // Also extract from experience highlights for soft skills
  const expTexts = (resume?.experience ?? [])
    .flatMap((e) => e.highlights ?? [])
    .join(' ')
    .toLowerCase();

  const matched: string[] = [];
  const missing: string[] = [];

  for (const term of jdTerms) {
    if (term.length < 2) continue; // skip single chars

    const isMatch =
      candidateTerms.has(term) ||
      containsTerm(expTexts, term) ||
      containsTerm(resume?.personal?.summary?.toLowerCase() ?? '', term);

    if (isMatch) {
      if (!matched.includes(term)) {
        matched.push(term);
      }
    }
  }

  // For missing: check JD against ALL known tech terms (from global alias database)
  // This replaces the hardcoded commonTechTerms list
  const aliasMap = buildAliasMap();
  const checkedMissing = new Set<string>();

  for (const [aliasLower, canonical] of aliasMap) {
    if (containsTerm(jd.toLowerCase(), aliasLower)) {
      const hasSkill =
        candidateTerms.has(canonical.toLowerCase()) ||
        candidateTerms.has(aliasLower) ||
        containsTerm(expTexts, aliasLower) ||
        containsTerm(resume?.personal?.summary?.toLowerCase() ?? '', aliasLower);
      if (!hasSkill && !checkedMissing.has(canonical.toLowerCase())) {
        missing.push(canonical);
        checkedMissing.add(canonical.toLowerCase());
      }
    }
  }

  // Calculate match score (0-100)
  const totalRelevantTerms = matched.length + missing.length;
  const score =
    totalRelevantTerms > 0
      ? Math.round((matched.length / totalRelevantTerms) * 100)
      : 50;

  // Build analysis text
  const p = resume?.personal;
  let analysis = `## Candidate Fit Analysis\n\n`;
  analysis += `**Candidate**: ${p?.name ?? 'Unknown'} - ${p?.title ?? 'Unknown'}\n\n`;
  analysis += `### Matched Skills/Experience (${matched.length})\n`;
  if (matched.length > 0) {
    analysis += matched.map((m) => `- ✅ ${m}`).join('\n') + '\n';
  } else {
    analysis += '- No direct keyword matches found\n';
  }

  analysis += `\n### Potentially Missing Skills (${missing.length})\n`;
  if (missing.length > 0) {
    analysis += missing.map((m) => `- ❌ ${m}`).join('\n') + '\n';
  } else {
    analysis += '- No obvious skill gaps detected\n';
  }

  analysis += `\n### Overall Match Score: **${score}%**\n\n`;

  if (score >= 80) {
    analysis += `**Strong match!** The candidate's profile aligns well with the job requirements.`;
  } else if (score >= 60) {
    analysis += `**Good potential.** The candidate has relevant experience but may need development in some areas.`;
  } else if (score >= 40) {
    analysis += `**Partial match.** There are some overlaps but significant gaps exist.`;
  } else {
    analysis += `**Low match.** The candidate's profile doesn't closely align with this role's requirements.`;
  }

  return { matched, missing, score, analysis };
}
