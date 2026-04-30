# Phase 1: 项目结构合并

> 目标：将前端（src/）和 AI 后端（ai/）合并为一个统一项目，建立新的目录结构和构建流程。

## 任务清单

### 1.1 统一 package.json

- [x] 将 `ai/package.json` 的依赖合并到根 `package.json`
- [x] 统一 TypeScript 配置（新增 `tsconfig.server.json`，区分 server 和 client）
- [x] 统一构建脚本：`dev`（前后端同时启动）、`build`（前后端分别构建）

### 1.2 重构目录结构

- [x] 创建 `server/` 目录，将 `ai/src/` 下的服务端代码迁移到 `server/`
- [x] 创建 `mcp/` 目录，将 MCP 核心逻辑（tools、rag、resources）分离
- [x] `src/` 保留为前端源码不变
- [x] 删除 `ai/` 目录
- [x] 更新所有 import 路径

### 1.3 统一类型定义

- [x] 将 `ai/src/types.ts` 和 `src/types/resume.ts` 合并到 `src/types/resume.ts`
- [x] 前端和后端共用同一套 ResumeData 类型定义
- [x] MCP 端新增类型（SkillItem、CareerMetadata、SearchResult 等）合并入统一类型文件
- [ ] 添加 Zod schema 用于数据验证（移至 Phase 2）

### 1.4 构建系统

- [x] 前端继续用 Vite 构建
- [x] 后端用 `tsc -p tsconfig.server.json` 编译，输出到 `dist/server/`
- [x] 开发模式：`tsx watch server/index.ts` 运行 server，Vite proxy 转发 `/mcp` 和 `/api`
- [x] 生产模式：`npm run build` 一键构建前后端，`npm start` 启动服务

## 验收标准

- [x] `npm run dev` 同时启动前端和后端（dev:client + dev:server）
- [x] `npm run build` 一键构建前后端
- [x] 前后端共享同一套类型定义（`src/types/resume.ts`）
- [x] 不存在 `ai/` 目录（已清空）
- [x] TypeScript 编译无错误

## 最终项目结构

```
resume-maker/
├── server/index.ts              # 后端服务入口
├── mcp/                         # MCP 核心逻辑
│   ├── create-server.ts         # MCP Server 工厂
│   ├── resources.ts             # Resource 定义
│   ├── tools/index.ts           # Tool 定义
│   └── rag/                     # 搜索和匹配
├── src/                         # 前端源码（React）
│   ├── types/resume.ts          # 统一类型定义
│   ├── components/
│   ├── i18n/
│   └── themes/
├── data/                        # 运行时数据（git ignore）
│   └── resume.json
├── docs/                        # 项目文档
├── tsconfig.server.json         # 后端 TypeScript 配置
├── tsconfig.app.json            # 前端 TypeScript 配置
├── vite.config.ts               # Vite 配置（含开发代理）
└── package.json                 # 统一依赖
```
