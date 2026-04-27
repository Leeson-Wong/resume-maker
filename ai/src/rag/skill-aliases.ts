/**
 * Shared skill alias data.
 * Used by both skills.ts (normalization) and search.ts (JD matching).
 */

// Canonical skill name → known aliases
export const SKILL_ALIASES: Record<string, string[]> = {
  React: ['react', 'react.js', 'reactjs', 'react js'],
  Vue: ['vue', 'vue.js', 'vuejs', 'vue js'],
  Angular: ['angular', 'angular.js', 'angularjs', 'angular js'],
  TypeScript: ['typescript', 'ts'],
  JavaScript: ['javascript', 'js', 'ecmascript'],
  Node: ['node', 'node.js', 'nodejs', 'node js'],
  'Next.js': ['next.js', 'nextjs', 'next js', 'next'],
  Nuxt: ['nuxt', 'nuxt.js', 'nuxtjs'],
  Python: ['python', 'python3', 'py'],
  Java: ['java', 'jdk'],
  Go: ['go', 'golang'],
  Rust: ['rust', 'rustlang'],
  'C++': ['c++', 'cpp', 'cplusplus'],
  'C#': ['c#', 'csharp', 'c sharp'],
  Swift: ['swift', 'swiftlang'],
  Kotlin: ['kotlin', 'kotlinlang'],
  Docker: ['docker', 'docker.io'],
  Kubernetes: ['kubernetes', 'k8s'],
  PostgreSQL: ['postgresql', 'postgres', 'psql'],
  MongoDB: ['mongodb', 'mongo'],
  MySQL: ['mysql', 'my sql'],
  Redis: ['redis', 'redisdb'],
  GraphQL: ['graphql', 'gql'],
  'Tailwind CSS': ['tailwind css', 'tailwindcss', 'tailwind'],
  Webpack: ['webpack', 'webpack.js'],
  Vite: ['vite', 'vitejs'],
  Express: ['express', 'express.js', 'expressjs'],
  NestJS: ['nestjs', 'nest.js', 'nest'],
  Django: ['django'],
  Flask: ['flask'],
  Spring: ['spring', 'spring boot', 'springboot'],
  Kafka: ['kafka', 'apache kafka'],
  RabbitMQ: ['rabbitmq', 'rabbit mq'],
  Elasticsearch: ['elasticsearch', 'elastic', 'es'],
  Jenkins: ['jenkins'],
  Git: ['git', 'git scm'],
  Linux: ['linux', 'gnu/linux'],
  Nginx: ['nginx', 'engine-x'],
  Terraform: ['terraform', 'tf'],
  Ansible: ['ansible'],
  Flutter: ['flutter', 'flutter sdk'],
  'React Native': ['react native', 'reactnative', 'react-native'],
  HarmonyOS: ['harmonyos', '鸿蒙', 'harmony', '鸿蒙 (harmonyos)'],
  Qt: ['qt', 'qt framework', 'qt5', 'qt6'],
  'Cocos Creator': ['cocos creator', 'cocos', 'cocoscreator'],
  MCP: ['mcp', 'mcp protocol', 'model context protocol', 'mcp (model context protocol)'],
  'WeChat Mini Program': ['wechat mini program', '微信小程序', '小程序', 'miniprogram'],
  'CI/CD': ['ci/cd', 'continuous integration', 'continuous delivery', 'ci cd'],
  REST: ['rest', 'rest api', 'restful'],
  Microservices: ['microservice', 'microservices', '微服务'],
  Agile: ['agile', 'scrum', '敏捷'],
  DevOps: ['devops', '运维'],
  SQL: ['sql', 'structured query language'],
  AWS: ['aws', 'amazon web services'],
  GCP: ['gcp', 'google cloud', 'google cloud platform'],
  Azure: ['azure', 'microsoft azure'],
  'Big Data': ['big data', '大数据'],
  'Cloud Services': ['cloud services', '云服务', '云服务架构', 'cloud architecture'],
};

// Chinese → English tech term mappings
export const CN_TO_EN: Record<string, string> = {
  大数据: 'Big Data',
  云服务: 'Cloud Services',
  云服务架构: 'Cloud Architecture',
  微服务: 'Microservices',
  前端开发: 'Frontend Development',
  后端开发: 'Backend Development',
  全栈开发: 'Full-stack Development',
  小程序: 'WeChat Mini Program',
  微信小程序: 'WeChat Mini Program',
  桌面应用: 'Desktop Application',
  跨端: 'Cross-platform',
  跨平台: 'Cross-platform',
  人工智能: 'AI',
  机器学习: 'Machine Learning',
  深度学习: 'Deep Learning',
  数据库: 'Database',
  运维: 'DevOps',
  持续集成: 'CI/CD',
  自动化测试: 'Automated Testing',
  敏捷开发: 'Agile',
};

/**
 * Build reverse lookup map: alias (lowercase) → canonical name.
 * Used by both skills.ts and search.ts.
 */
export function buildAliasMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const [canonical, aliases] of Object.entries(SKILL_ALIASES)) {
    map.set(canonical.toLowerCase(), canonical);
    for (const alias of aliases) {
      map.set(alias.toLowerCase(), canonical);
    }
  }
  return map;
}
