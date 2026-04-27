import { describe, it, expect } from 'vitest';
import {
  normalizeSkillName,
  getSkillLevel,
  getAllSkillsCanonical,
  extractTechTermsFromResume,
} from '../../../src/rag/skills.js';
import type { ResumeData } from '../../../src/types.js';

const enrichedResume: ResumeData = {
  personal: {
    name: 'Test User',
    title: 'Full-stack Developer',
    email: 'test@example.com',
    summary: 'Experienced React and Node.js developer',
  },
  experience: [],
  education: [],
  projects: [
    {
      name: 'Test Project',
      description: 'A test project',
      technologies: ['React', 'TypeScript'],
    },
  ],
  skills: [
    {
      category: 'Frontend',
      items: [
        { name: 'React', level: 4, yearsUsed: 5, aliases: ['ReactJS', 'React.js'], related: ['Next.js'] },
        { name: 'TypeScript', level: 4, yearsUsed: 5, aliases: ['TS'] },
        { name: 'Vue', level: 3, yearsUsed: 2 },
      ],
    },
    {
      category: 'Backend',
      items: ['Node.js', 'Python'],
    },
  ],
};

describe('normalizeSkillName', () => {
  it('should normalize React aliases', () => {
    expect(normalizeSkillName('react')).toBe('React');
    expect(normalizeSkillName('React.js')).toBe('React');
    expect(normalizeSkillName('reactjs')).toBe('React');
    expect(normalizeSkillName('React')).toBe('React');
  });

  it('should normalize Vue aliases', () => {
    expect(normalizeSkillName('vue')).toBe('Vue');
    expect(normalizeSkillName('Vue.js')).toBe('Vue');
    expect(normalizeSkillName('vuejs')).toBe('Vue');
  });

  it('should normalize Kubernetes aliases', () => {
    expect(normalizeSkillName('k8s')).toBe('Kubernetes');
    expect(normalizeSkillName('kubernetes')).toBe('Kubernetes');
  });

  it('should normalize Node.js aliases', () => {
    expect(normalizeSkillName('node')).toBe('Node');
    expect(normalizeSkillName('node.js')).toBe('Node');
    expect(normalizeSkillName('nodejs')).toBe('Node');
  });

  it('should normalize Chinese tech terms', () => {
    expect(normalizeSkillName('大数据')).toBe('Big Data');
    expect(normalizeSkillName('云服务')).toBe('Cloud Services');
  });

  it('should capitalize unknown skills as fallback', () => {
    expect(normalizeSkillName('solidity')).toBe('Solidity');
    expect(normalizeSkillName('web3.js')).toBe('Web3.js');
  });

  it('should handle empty and whitespace input', () => {
    expect(normalizeSkillName('  react  ')).toBe('React');
  });
});

describe('getSkillLevel', () => {
  it('should return level from SkillItem', () => {
    expect(getSkillLevel(enrichedResume, 'React')).toBe(4);
    expect(getSkillLevel(enrichedResume, 'TypeScript')).toBe(4);
    expect(getSkillLevel(enrichedResume, 'Vue')).toBe(3);
  });

  it('should resolve aliases to find level', () => {
    expect(getSkillLevel(enrichedResume, 'React.js')).toBe(4);
    expect(getSkillLevel(enrichedResume, 'reactjs')).toBe(4);
    expect(getSkillLevel(enrichedResume, 'TS')).toBe(4);
  });

  it('should return 3 for plain string skills', () => {
    expect(getSkillLevel(enrichedResume, 'Node.js')).toBe(3);
    expect(getSkillLevel(enrichedResume, 'Python')).toBe(3);
  });

  it('should return undefined for unknown skills', () => {
    expect(getSkillLevel(enrichedResume, 'Rust')).toBeUndefined();
  });

  it('should handle empty resume', () => {
    const empty: ResumeData = {
      personal: { name: '', title: '', email: '' },
      experience: [],
      education: [],
      projects: [],
      skills: [],
    };
    expect(getSkillLevel(empty, 'React')).toBeUndefined();
  });
});

describe('getAllSkillsCanonical', () => {
  it('should return canonical map with metadata', () => {
    const map = getAllSkillsCanonical(enrichedResume);
    expect(map.has('React')).toBe(true);
    expect(map.has('TypeScript')).toBe(true);
    expect(map.has('Vue')).toBe(true);
    expect(map.has('Node')).toBe(true);
  });

  it('should include level and yearsUsed for SkillItems', () => {
    const map = getAllSkillsCanonical(enrichedResume);
    expect(map.get('React')?.level).toBe(4);
    expect(map.get('React')?.yearsUsed).toBe(5);
    expect(map.get('React')?.aliases).toEqual(['ReactJS', 'React.js']);
  });

  it('should have empty metadata for plain string skills', () => {
    const map = getAllSkillsCanonical(enrichedResume);
    expect(map.get('Node')?.level).toBeUndefined();
  });
});

describe('extractTechTermsFromResume', () => {
  it('should extract terms from skills and projects', () => {
    const terms = extractTechTermsFromResume(enrichedResume);
    expect(terms.has('react')).toBe(true);
    expect(terms.has('typescript')).toBe(true);
    expect(terms.has('node')).toBe(true);
    expect(terms.has('python')).toBe(true);
  });

  it('should include SkillItem aliases', () => {
    const terms = extractTechTermsFromResume(enrichedResume);
    expect(terms.has('reactjs')).toBe(true);
    expect(terms.has('ts')).toBe(true);
  });

  it('should extract from personal summary', () => {
    const terms = extractTechTermsFromResume(enrichedResume);
    expect(terms.has('react')).toBe(true);
    expect(terms.has('node')).toBe(true);
  });
});
