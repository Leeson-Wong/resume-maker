# Resume Maker - 产品设计文档

## 定位

面向开发者的个人简历服务器。单用户部署，通过 MCP 协议让 AI Agent 深度查询简历数据。

**不是一个 SaaS 平台，而是一个开源的个人工具。**

## 核心理念

投递简历时给出「页面链接 + 邀请码」。HR 需要 AI Agent 介入才能查询到深度信息，自然筛选掉 AI 普及率低的公司。

## 三个入口

```
/            → 公开页（完全自由，用户想放什么放什么）
/mcp         → MCP endpoint（需要邀请码认证）
/edit        → 简历编辑器（需要认证码认证）
```

## 认证体系

两种凭证，服务于不同场景：

### 认证码（Auth Code）

- 配置文件中定义，用于保护编辑器入口
- 只有部署者自己知道
- 输入后获得编辑会话

### 邀请码（Invite Code）

- 动态生成，用于控制 MCP 访问
- 投递简历时将「链接 + 邀请码」一起发送
- 支持多邀请码，每个可标注分配对象
- 支持吊销（revoke）
- 可追踪访问记录
- AI 客户端通过 HTTP Header `Authorization: Bearer <code>` 传递

## 数据流

```
部署者：/edit → 认证码验证 → 编辑简历 → 保存到 resume.json（原子写）
AI Agent：公开页 → 发现 MCP 元信息 → /mcp + 邀请码 → 查询简历数据
```

数据只有一份 `resume.json`，编辑器和 MCP 共享同一数据源。

## 公开页设计原则

- 内容完全自由：简历、个人主页、作品集、博客，不限制
- 必须包含机器可读的 MCP 发现信息（不在页面上可见）
  - `<link rel="mcp" href="/mcp">`
  - JSON-LD 结构化数据（姓名、title、领域摘要）
- 公开页的角色：**名片 + MCP 发现入口**

## MCP 发现机制

AI Agent 的发现链路：

```
AI Agent 访问公开页
  → 解析 HTML 中的 <link rel="mcp"> 或 /.well-known/mcp
  → 获取 MCP endpoint 地址
  → 使用邀请码通过 Authorization header 连接
  → 调用 get_skills、evaluate_fit 等工具查询
```

## MCP Tools 列表

| Tool | 说明 |
|------|------|
| get_profile | 基本信息（隐私字段需控制） |
| get_experience | 工作经历，支持关键词过滤 |
| get_projects | 项目经历，支持技术栈过滤 |
| get_skills | 技能列表，支持分类过滤 |
| get_education | 教育背景 |
| search_resume | 全文搜索 |
| evaluate_fit | 职位匹配分析 |
| get_career_summary | 职业概览 |

## 隐私分级

MCP 返回的个人信息需要分级：

- **公开级**：姓名、title、技能、工作经历、项目、教育
- **隐私级**：手机号、邮箱、住址 — 不通过 MCP 暴露，或需要额外授权

## 部署模型

- 部署在公网，使用者自行解决基础设施
- 提供 Dockerfile + docker-compose.yml
- 配置文件：`config.yaml`（认证码、端口、数据路径等）
- 数据文件：`resume.json`（简历）、`codes.json`（邀请码）
- Docker 部署通过 volume mount 持久化数据文件

## 配置文件示例

```yaml
# config.yaml
authCode: "your-secret-auth-code"
port: 3000
dataPath: "./data"
```

## 技术栈

- 后端：Node.js + TypeScript
- 前端：React + TypeScript + Vite + Tailwind CSS
- MCP：@modelcontextprotocol/sdk
- 验证：Zod
- 部署：Docker
- 传输：HTTP Streamable Transport（远程）+ stdio（本地开发）

## 文件结构规划

```
resume-maker/
├── server/                  # 后端服务
│   ├── index.ts             # 启动入口
│   ├── config.ts            # 配置加载
│   ├── auth.ts              # 认证中间件
│   ├── storage.ts           # 文件存储（原子读写）
│   ├── routes/
│   │   ├── page.ts          # / 公开页
│   │   ├── edit.ts          # /edit 编辑器
│   │   ├── mcp.ts           # /mcp endpoint
│   │   └── api.ts           # /api/* 数据接口
│   └── invite-codes.ts      # 邀请码管理
├── mcp/                     # MCP 核心逻辑
│   ├── create-server.ts     # MCP Server 工厂
│   ├── tools/               # Tool 实现
│   ├── rag/                 # 搜索和匹配
│   └── resources.ts         # Resource 实现
├── src/                     # 前端源码
│   ├── components/          # 编辑器组件
│   └── ...
├── public/                  # 公开页模板/静态资源
├── data/                    # 运行时数据（git ignore）
│   ├── resume.json
│   └── codes.json
├── config.yaml              # 部署配置
├── Dockerfile
├── docker-compose.yml
└── package.json
```
