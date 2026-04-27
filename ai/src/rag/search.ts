import type { ResumeData, SearchResult } from '../types.js';

/**
 * Lightweight keyword search with TF-based relevance scoring.
 * Tokenizes query and resume fields, matches keywords, and ranks results.
 */

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
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
      // Count occurrences for TF scoring
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
    personal.name,
    personal.title,
    personal.summary,
    personal.location,
  ]
    .filter(Boolean)
    .join(' ');

  const personalScore = scoreText(personalText, queryTerms);
  if (personalScore > 0) {
    results.push({
      content: `**${personal.name}** | ${personal.title}\n${personal.summary || ''}\n📍 ${personal.location || ''}`,
      source: 'personal',
      relevance: personalScore,
    });
  }

  // Search experience
  for (const exp of resume.experience) {
    const expText = [
      exp.company,
      exp.position,
      exp.location,
      ...exp.highlights,
    ].join(' ');

    const expScore = scoreText(expText, queryTerms);
    if (expScore > 0) {
      const highlights = exp.highlights.map((h) => `  - ${h}`).join('\n');
      results.push({
        content: `**${exp.position}** @ ${exp.company} (${exp.startDate} - ${exp.current ? '至今' : exp.endDate})\n${highlights}`,
        source: 'experience',
        relevance: expScore,
      });
    }
  }

  // Search projects
  for (const proj of resume.projects) {
    const projText = [
      proj.name,
      proj.description,
      ...proj.technologies,
      ...(proj.highlights || []),
    ].join(' ');

    const projScore = scoreText(projText, queryTerms);
    if (projScore > 0) {
      const techs = proj.technologies.join(', ');
      const highlights = (proj.highlights || []).map((h) => `  - ${h}`).join('\n');
      results.push({
        content: `**${proj.name}**\n${proj.description}\nTech: ${techs}\n${highlights}`,
        source: 'projects',
        relevance: projScore,
      });
    }
  }

  // Search skills
  for (const skillGroup of resume.skills) {
    const skillText = [skillGroup.category, ...skillGroup.items].join(' ');
    const skillScore = scoreText(skillText, queryTerms);
    if (skillScore > 0) {
      results.push({
        content: `**${skillGroup.category}**: ${skillGroup.items.join(', ')}`,
        source: 'skills',
        relevance: skillScore,
      });
    }
  }

  // Search education
  for (const edu of resume.education) {
    const eduText = [
      edu.school,
      edu.degree,
      edu.field,
      edu.gpa,
      ...(edu.honors || []),
    ].join(' ');

    const eduScore = scoreText(eduText, queryTerms);
    if (eduScore > 0) {
      const honors = edu.honors ? `\n  Honors: ${edu.honors.join(', ')}` : '';
      results.push({
        content: `**${edu.school}** - ${edu.degree} in ${edu.field} (${edu.startDate} - ${edu.endDate})${honors}\n  GPA: ${edu.gpa || 'N/A'}`,
        source: 'education',
        relevance: eduScore,
      });
    }
  }

  // Search certificates
  if (resume.certificates) {
    for (const cert of resume.certificates) {
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
  }

  // Search custom sections
  if (resume.customSections) {
    for (const section of resume.customSections) {
      for (const entry of section.entries) {
        const entryText = [
          entry.title,
          entry.subtitle,
          entry.description,
          ...(entry.highlights || []),
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
  }

  // Sort by relevance descending
  results.sort((a, b) => b.relevance - a.relevance);

  return results;
}

/**
 * Analyze candidate fit against a job description.
 * Extracts keywords from the JD and matches against resume data.
 */
export function evaluateFit(
  resume: ResumeData,
  jobDescription: string
): {
  matched: string[];
  missing: string[];
  score: number;
  analysis: string;
} {
  // Extract skill-like keywords from the JD
  const jdTerms = tokenize(jobDescription);
  const allSkills = resume.skills.flatMap((s) => s.items);
  const allTechs = resume.projects.flatMap((p) => p.technologies);

  // Known common tech terms for matching
  const candidateTerms = new Set(
    [...allSkills, ...allTechs].map((t) => t.toLowerCase())
  );

  // Also extract from experience highlights for soft skills
  const expTexts = resume.experience
    .flatMap((e) => e.highlights)
    .join(' ')
    .toLowerCase();

  const matched: string[] = [];
  const missing: string[] = [];

  for (const term of jdTerms) {
    if (term.length < 2) continue; // skip single chars

    const isMatch =
      candidateTerms.has(term) ||
      containsTerm(expTexts, term) ||
      containsTerm(resume.personal.summary?.toLowerCase() || '', term);

    if (isMatch) {
      if (!matched.includes(term)) {
        matched.push(term);
      }
    }
  }

  // For missing, check if JD terms that look like skills/technologies are absent
  const commonTechTerms = [
    'react',
    'vue',
    'angular',
    'typescript',
    'javascript',
    'python',
    'java',
    'go',
    'rust',
    'node',
    'node.js',
    'docker',
    'kubernetes',
    'k8s',
    'aws',
    'gcp',
    'azure',
    'sql',
    'mongodb',
    'redis',
    'graphql',
    'rest',
    'microservice',
    'ci/cd',
    'devops',
    'agile',
    'next.js',
    'tailwind',
    'webpack',
    'vite',
    'express',
    'nestjs',
    'django',
    'flask',
    'spring',
    'kafka',
    'rabbitmq',
    'elasticsearch',
    'jenkins',
    'git',
    'linux',
    'nginx',
    'postgres',
    'mysql',
    'swift',
    'kotlin',
    'flutter',
    'react native',
    'terraform',
    'ansible',
  ];

  for (const tech of commonTechTerms) {
    if (containsTerm(jobDescription.toLowerCase(), tech)) {
      const hasSkill =
        candidateTerms.has(tech) ||
        containsTerm(expTexts, tech) ||
        containsTerm(resume.personal.summary?.toLowerCase() || '', tech);
      if (!hasSkill && !missing.includes(tech)) {
        missing.push(tech);
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
  const p = resume.personal;
  let analysis = `## Candidate Fit Analysis\n\n`;
  analysis += `**Candidate**: ${p.name} - ${p.title}\n\n`;
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
