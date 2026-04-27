# Resume Maker

> 一个简洁、现代的在线简历生成器，配备 AI MCP Server 让 AI Agent 也能查询你的简历。

[![GitHub](https://img.shields.io/badge/GitHub-Leeson--Wong%2Fresume--maker-blue?logo=github)](https://github.com/Leeson-Wong/resume-maker)
[![Live Demo](https://img.shields.io/badge/Live-Demo-green?logo=github-pages)](https://leeson-wong.github.io/resume-maker/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 简介

Resume Maker 包含两个核心产品：

1. **前端简历编辑器** — 基于 React 的开源简历生成工具，帮助你轻松创建专业的个人简历。无需注册登录，数据存储在本地浏览器中，保护你的隐私。

2. **AI MCP Server** — 基于 Model Context Protocol 的 AI 可查询简历服务。启动 MCP Server 后，任何兼容 MCP 的 AI Agent（如 Claude、Cursor）都可以通过标准协议查询简历数据，实现 AI 辅助求职匹配。

## 功能特性

### 前端编辑器

- **编辑/预览模式** — 实时切换编辑和预览视图
- **多种主题** — Classic（经典）、Modern（现代）、Minimal（极简）三种风格
- **本地存储** — 数据自动保存到浏览器，无需担心丢失
- **PDF 导出** — 一键打印或导出为 PDF 文件
- **JSON 导入/导出** — 备份和迁移简历数据
- **个人头像** — 支持上传可选的个人头像
- **拖拽排序** — 经历、项目等条目可拖拽调整顺序
- **模块开关** — 控制各部分（语言能力、技能等）是否显示
- **i18n 国际化** — 支持中英文切换
- **响应式设计** — 适配不同屏幕尺寸

### AI MCP Server

- **7 个查询工具** — 涵盖个人资料、工作经历、项目、技能、教育、全文搜索、岗位匹配分析
- **2 个资源端点** — `resume://full` 完整简历 JSON，`resume://summary` 一行摘要
- **全文搜索** — TF 评分的跨模块关键词搜索，支持中文
- **岗位匹配** — 自动分析候选人与 JD 的匹配度，给出分数和建议
- **标准 MCP 协议** — 兼容任何支持 MCP 的 AI 客户端
- **HTTP Streamable Transport** — 通过 POST `/mcp` 端点接入

## 技术栈

| 层级 | 前端 | AI MCP Server |
|------|------|---------------|
| 框架 | React 19 | Node.js |
| 语言 | TypeScript | TypeScript |
| 构建 | Vite 7 | tsc |
| 样式 | Tailwind CSS 4 | — |
| 协议 | — | MCP (Model Context Protocol) |
| 拖拽 | @dnd-kit | — |
| PDF | jsPDF + html2canvas | — |
| i18n | i18next | — |
| 校验 | — | Zod |
| 测试 | — | Vitest |

## 架构概览

```
┌──────────────────────────────────────────────┐
│                  用户浏览器                    │
│  ┌──────────┐    ┌──────────┐    ┌─────────┐ │
│  │ 编辑器    │◄──►│ React App│◄──►│ 主题引擎 │ │
│  │ ResumeEditor│   │ App.tsx  │    │ themes/ │ │
│  └──────────┘    └────┬─────┘    └─────────┘ │
│                       │ localStorage          │
└───────────────────────┼──────────────────────┘
                        │ JSON
┌───────────────────────┼──────────────────────┐
│                 AI MCP Server (ai/)           │
│  ┌────────────────────┴────────────────────┐  │
│  │         sample-resume.json              │  │
│  └────────────┬───────────────────────────┘  │
│               │                               │
│  ┌────────────▼────────────┐                  │
│  │     McpServer           │                  │
│  │  ┌──────────┐ ┌───────┐ │                  │
│  │  │ 7 Tools  │ │ 2 Res │ │  POST /mcp      │
│  │  └──────────┘ └───────┘ │◄──────── AI Agent│
│  │  ┌──────────────────┐   │                  │
│  │  │ RAG Search Engine│   │                  │
│  │  └──────────────────┘   │                  │
│  └─────────────────────────┘                  │
└──────────────────────────────────────────────┘
```

## 快速开始

### 前端

```bash
# 克隆仓库
git clone https://github.com/Leeson-Wong/resume-maker.git
cd resume-maker

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### AI MCP Server

```bash
cd ai

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 或构建后运行
npm run build
npm start
```

Server 启动后：
- 健康检查: `GET http://localhost:3001/`
- MCP 端点: `POST http://localhost:3001/mcp`

自定义简历数据：
```bash
RESUME_DATA_PATH=/path/to/your-resume.json npm start
```

### 运行测试

```bash
cd ai

# 运行所有测试
npm test

# 监听模式
npm run test:watch

# MCP 验证脚本（独立运行）
npx tsx scripts/validate-mcp.mts
```

## 项目结构

```
resume-maker/
├── src/                          # 前端源码
│   ├── components/
│   │   ├── Resume.tsx            # 简历渲染组件
│   │   ├── ResumeEditor.tsx      # 简历编辑器
│   │   └── Toolbar.tsx           # 顶部工具栏
│   ├── data/
│   │   └── resume.json           # 默认示例数据
│   ├── i18n/
│   │   ├── index.ts              # i18n 配置
│   │   └── locales/              # 语言文件
│   │       ├── en.json
│   │       └── zh.json
│   ├── themes/
│   │   └── index.ts              # 主题配置 (classic/modern/minimal)
│   ├── types/
│   │   └── resume.ts             # TypeScript 类型定义
│   ├── App.tsx                   # 主应用组件
│   ├── main.tsx                  # 入口文件
│   └── index.css                 # 全局样式
├── ai/                           # AI MCP Server
│   ├── src/
│   │   ├── server.ts             # HTTP 服务器入口
│   │   ├── resources.ts          # MCP 资源注册 (resume://full, resume://summary)
│   │   ├── types.ts              # 共享类型定义
│   │   ├── tools/
│   │   │   └── index.ts          # 7 个 MCP 工具注册
│   │   └── rag/
│   │       └── search.ts         # 搜索引擎 + 岗位匹配
│   ├── data/
│   │   └── sample-resume.json    # 示例简历数据
│   ├── scripts/
│   │   └── validate-mcp.mts      # 独立验证脚本
│   ├── tests/
│   │   ├── fixtures/
│   │   │   └── minimal-resume.json
│   │   ├── helpers/
│   │   │   ├── create-test-server.ts
│   │   │   └── load-resume.ts
│   │   ├── unit/
│   │   │   ├── rag/
│   │   │   │   └── search.test.ts
│   │   │   └── tools/
│   │   │       └── handlers.test.ts
│   │   └── integration/
│   │       ├── resources.test.ts
│   │       └── mcp-validation.test.ts
│   ├── vitest.config.ts
│   ├── tsconfig.json
│   └── package.json
├── public/                       # 静态资源
├── index.html                    # HTML 模板
├── LICENSE                       # MIT 许可证
└── README.md
```

## MCP 工具与资源

### 工具 (Tools)

| 工具名 | 描述 | 参数 |
|--------|------|------|
| `get_profile` | 获取候选人基本信息（姓名、职位、联系方式、简介） | 无 |
| `get_experience` | 获取工作经历，支持关键词过滤 | `keyword?` (string) |
| `get_projects` | 获取项目经历，支持技术/关键词过滤 | `keyword?` (string) |
| `get_skills` | 获取技能列表，支持分类过滤 | `category?` (string) |
| `get_education` | 获取教育背景 | 无 |
| `search_resume` | 全文搜索简历，返回匹配片段和相关性评分 | `query` (string) |
| `evaluate_fit` | 分析候选人与岗位描述的匹配度，给出分数和建议 | `job_description` (string) |

### 资源 (Resources)

| URI | 类型 | 描述 |
|-----|------|------|
| `resume://full` | `application/json` | 完整简历 JSON 数据 |
| `resume://summary` | `text/plain` | 一行摘要：姓名、职位、经验年限、核心技能 |

## 开发计划

### 功能增强

- [x] 导入/导出 JSON — 方便备份和迁移简历数据
- [x] 拖拽排序 — 经历、项目等条目可拖拽调整顺序
- [x] 模块开关 — 控制各部分（语言能力、技能等）是否显示
- [ ] 多简历管理 — 支持创建多份不同简历

### 用户体验

- [x] 实时预览 — 左右分栏，编辑时同步预览
- [ ] 撤销/重做 — 操作历史记录
- [ ] 表单验证 — 必填项空值提示
- [ ] 快捷键支持 — Ctrl+S 保存等

### 技术改进

- [ ] PWA 支持 — 可离线使用
- [x] i18n 国际化 — 支持中英文切换
- [x] 响应式优化 — 移动端更好体验
- [x] AI MCP Server — 让 AI Agent 可以查询简历数据

### 新增模块

- [x] 证书/荣誉 — 独立的证书展示区
- [x] 兴趣爱好 — 个人兴趣展示
- [ ] 自定义模块 — 用户可添加自定义 section

## 贡献指南

欢迎贡献代码、报告问题或提出新功能建议！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 作者

**王乐生 (Leeson-Wong)** — [GitHub](https://github.com/Leeson-Wong)

## 许可证

[MIT](LICENSE) © 2026 Resume Maker Contributors
