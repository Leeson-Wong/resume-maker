import { describe, it, expect } from 'vitest';
import { searchResume, evaluateFit } from '../../../src/rag/search.js';
import type { ResumeData } from '../../../src/types.js';

const sampleResume: ResumeData = {
  personal: {
    name: '张三',
    title: '全栈开发工程师',
    email: 'zhangsan@example.com',
    summary: '5年全栈开发经验，专注于React生态和Node.js后端开发。',
  },
  experience: [
    {
      company: '某科技有限公司',
      position: '高级全栈工程师',
      startDate: '2021-03',
      current: true,
      highlights: [
        '主导开发公司核心SaaS产品',
        '设计并实现微服务架构',
        '搭建CI/CD流水线',
      ],
    },
    {
      company: '某互联网公司',
      position: '前端开发工程师',
      startDate: '2019-07',
      endDate: '2021-02',
      highlights: [
        '负责电商平台前端开发，使用React+TypeScript技术栈',
        '优化首屏加载速度',
      ],
    },
  ],
  education: [
    {
      school: '北京理工大学',
      degree: '本科',
      field: '计算机科学与技术',
      startDate: '2015-09',
      endDate: '2019-06',
      gpa: '3.8/4.0',
      honors: ['校级优秀毕业生', '国家奖学金'],
    },
  ],
  projects: [
    {
      name: '开源简历生成器',
      description: '基于React的简历生成工具',
      technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Vite'],
      highlights: ['支持JSON配置', '3种精美主题'],
    },
    {
      name: '实时协作白板',
      description: '支持多人实时协作的在线白板应用',
      technologies: ['React', 'Socket.io', 'Node.js', 'Canvas API'],
      highlights: ['实时同步，延迟低于100ms'],
    },
  ],
  skills: [
    {
      category: '前端技术',
      items: ['React', 'Vue', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    },
    {
      category: '后端技术',
      items: ['Node.js', 'Express', 'NestJS', 'PostgreSQL', 'MongoDB'],
    },
  ],
  certificates: [
    {
      name: 'AWS 认证解决方案架构师',
      issuer: 'Amazon Web Services',
      date: '2023-06',
    },
  ],
  customSections: [
    {
      id: 'volunteer',
      title: '志愿者经历',
      entries: [
        {
          title: '开源社区维护者',
          description: '维护多个开源项目，贡献代码',
          highlights: ['GitHub Stars 1000+'],
        },
      ],
    },
  ],
};

describe('searchResume', () => {
  it('should match keyword in experience', () => {
    const results = searchResume(sampleResume, 'SaaS');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.source === 'experience')).toBe(true);
  });

  it('should support Chinese search', () => {
    const results = searchResume(sampleResume, '全栈');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.source === 'personal')).toBe(true);
  });

  it('should handle multi-word queries', () => {
    const results = searchResume(sampleResume, 'React TypeScript');
    expect(results.length).toBeGreaterThan(0);
  });

  it('should return empty array for empty query', () => {
    const results = searchResume(sampleResume, '');
    expect(results).toEqual([]);
  });

  it('should return empty array for whitespace-only query', () => {
    const results = searchResume(sampleResume, '   ');
    expect(results).toEqual([]);
  });

  it('should return empty results for non-matching query', () => {
    const results = searchResume(sampleResume, '量子计算_xyz_不存在');
    expect(results).toEqual([]);
  });

  it('should search across multiple modules', () => {
    const results = searchResume(sampleResume, 'React');
    const sources = new Set(results.map((r) => r.source));
    // React appears in experience, projects, skills
    expect(sources.size).toBeGreaterThanOrEqual(2);
  });

  it('should sort results by TF relevance score (descending)', () => {
    const results = searchResume(sampleResume, 'React');
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].relevance).toBeGreaterThanOrEqual(
        results[i].relevance
      );
    }
  });

  it('should search custom sections', () => {
    const results = searchResume(sampleResume, '开源社区');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.source.startsWith('custom:'))).toBe(true);
  });

  it('should search certificates', () => {
    const results = searchResume(sampleResume, 'AWS');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.source === 'certificates')).toBe(true);
  });

  it('should search education', () => {
    const results = searchResume(sampleResume, '北京理工大学');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.source === 'education')).toBe(true);
  });

  it('should search skills', () => {
    const results = searchResume(sampleResume, 'Tailwind');
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.source === 'skills')).toBe(true);
  });

  it('should return SearchResult objects with correct shape', () => {
    const results = searchResume(sampleResume, 'React');
    for (const r of results) {
      expect(r).toHaveProperty('content');
      expect(r).toHaveProperty('source');
      expect(r).toHaveProperty('relevance');
      expect(typeof r.content).toBe('string');
      expect(typeof r.source).toBe('string');
      expect(typeof r.relevance).toBe('number');
    }
  });
});

describe('evaluateFit', () => {
  it('should return high match for well-aligned JD', () => {
    const jd = 'Looking for a React TypeScript developer with Node.js backend experience. Must know Docker and CI/CD.';
    const result = evaluateFit(sampleResume, jd);
    expect(result.matched.length).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThanOrEqual(60);
  });

  it('should return low match for unrelated JD', () => {
    const jd = 'Looking for a Rust embedded systems engineer with experience in FPGA and Verilog.';
    const result = evaluateFit(sampleResume, jd);
    expect(result.score).toBeLessThan(50);
  });

  it('should handle partial match', () => {
    const jd = 'React developer needed, but also requires Swift and Kubernetes experience.';
    const result = evaluateFit(sampleResume, jd);
    expect(result.matched.length).toBeGreaterThan(0);
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it('should handle empty JD', () => {
    const result = evaluateFit(sampleResume, '');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('matched');
    expect(result).toHaveProperty('missing');
    expect(result).toHaveProperty('analysis');
    // No terms to match => score defaults to 50
    expect(result.score).toBe(50);
  });

  it('should calculate accurate match score', () => {
    const jd = 'React developer needed. Also requires Kubernetes and Terraform.';
    const result = evaluateFit(sampleResume, jd);
    const totalRelevant = result.matched.length + result.missing.length;
    if (totalRelevant > 0) {
      const expectedScore = Math.round(
        (result.matched.length / totalRelevant) * 100
      );
      expect(result.score).toBe(expectedScore);
    }
  });

  it('should produce analysis text with proper formatting', () => {
    const jd = 'React developer with Docker experience';
    const result = evaluateFit(sampleResume, jd);
    expect(result.analysis).toContain('Candidate Fit Analysis');
    expect(result.analysis).toContain('Matched Skills');
    expect(result.analysis).toContain('Missing Skills');
    expect(result.analysis).toContain('Overall Match Score');
  });

  it('should include score level messages', () => {
    // Test high score message
    const jd1 = 'React TypeScript Node.js Express MongoDB Docker CI/CD Git Linux Nginx AWS';
    const result1 = evaluateFit(sampleResume, jd1);
    const hasLevelMsg =
      result1.analysis.includes('Strong match') ||
      result1.analysis.includes('Good potential') ||
      result1.analysis.includes('Partial match') ||
      result1.analysis.includes('Low match');
    expect(hasLevelMsg).toBe(true);
  });

  it('should identify missing skills from JD', () => {
    const jd = 'Looking for React and Kubernetes and Terraform experts.';
    const result = evaluateFit(sampleResume, jd);
    // The resume doesn't have Kubernetes or Terraform
    expect(result.missing).toContain('Kubernetes');
    expect(result.missing).toContain('Terraform');
  });
});
