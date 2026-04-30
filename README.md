# Resume Maker

> 一个面向开发者的个人简历服务器。编辑简历、生成公开页、通过 MCP 协议让 AI Agent 深度查询你的简历数据。

## 这是什么

Resume Maker 是一个自部署的开源工具，服务于一个核心理念：

**投递简历时给出「页面链接 + 邀请码」→ 只有 AI 素养足够的人才能通过 Agent 查询你的深度信息。**

### 三个入口，一个服务

```
/            → 公开页（任何人可见，包含 MCP 发现元信息）
/mcp         → MCP endpoint（需要邀请码认证，给 AI Agent 用）
/edit        → 简历编辑器（需要认证码，给自己用）
```

## 快速开始

### 本地开发

```bash
git clone https://github.com/Leeson-Wong/resume-maker.git
cd resume-maker
npm install

# 创建配置文件
cp config.example.json config.json
# 编辑 config.json，设置 authCode

# 启动前后端
npm run dev
```

访问 `http://localhost:1053` 进行开发（Vite 代理 API 到后端）。

### Docker 部署

```bash
# 创建配置和数据目录
cp config.example.json config.json
mkdir -p data

# 一键启动
docker compose up -d
```

访问 `http://localhost:965`。

### 手动部署

```bash
# 构建
npm run build

# 配置
cp config.example.json config.json
# 编辑 config.json

# 启动
npm start
```

## 配置

创建 `config.json`（已在 .gitignore 中）：

```json
{
  "authCode": "your-secret-auth-code",
  "port": 965,
  "dataPath": "./data"
}
```

| 字段 | 说明 | 环境变量 |
|------|------|----------|
| `authCode` | 编辑器认证码（必填） | `AUTH_CODE` |
| `port` | 服务端口，默认 965 | `PORT` |
| `dataPath` | 数据目录，默认 `./data` | `DATA_PATH` |

## 数据文件

```
data/
├── resume.json      # 简历数据
├── codes.json       # 邀请码列表（自动生成）
└── public/          # 自定义公开页（可选）
    └── index.html   # 放入自己的 HTML 即可替换默认页面
```

首次启动时，如果 `resume.json` 不存在，会自动创建空模板。

## 公开页

`/` 路由服务公开页面。默认渲染一份简洁的简历 HTML。你可以自定义：

1. 在 `data/public/` 目录放入 `index.html` 即可替换
2. 页面会自动注入 MCP 发现元信息（`<link rel="mcp">` + JSON-LD）
3. 通过 `data/public/` 目录放入 CSS/JS/图片等静态资源，访问路径 `/public/filename`

## 邀请码系统

编辑器内点击 **Codes** 按钮管理邀请码：

- **生成** — 输入标注（如"字节跳动-HR张三"），生成 6 位安全码
- **吊销** — 随时吊销某个邀请码，立即失效
- **追踪** — 查看每个邀请码的访问日志

分享给招聘方：

```
简历链接：https://your-domain.com
MCP 配置（给 AI Agent 用）：
{
  "mcpServers": {
    "candidate-resume": {
      "url": "https://your-domain.com/mcp",
      "headers": {
        "Authorization": "Bearer <邀请码>"
      }
    }
  }
}
```

## MCP 工具列表

| 工具 | 说明 |
|------|------|
| `get_profile` | 公开信息（姓名、title、简介，不含邮箱手机） |
| `get_experience` | 工作经历，支持关键词过滤 |
| `get_projects` | 项目经历，支持技术栈过滤 |
| `get_skills` | 技能列表，支持分类过滤 |
| `get_education` | 教育背景 |
| `search_resume` | 全文搜索 |
| `evaluate_fit` | 职位匹配分析（给出匹配分数和建议） |
| `get_career_summary` | 职业概览 |

## stdio 模式（本地开发）

```bash
npm run start:stdio
```

在 Claude Desktop 的 `claude_desktop_config.json` 中配置：

```json
{
  "mcpServers": {
    "resume": {
      "command": "npx",
      "args": ["tsx", "server/stdio.ts"],
      "cwd": "/path/to/resume-maker"
    }
  }
}
```

## 技术栈

- **后端**: Node.js, TypeScript, MCP SDK, Zod
- **前端**: React 19, Vite 7, Tailwind CSS 4
- **部署**: Docker, docker-compose

## 项目结构

```
resume-maker/
├── server/               # 后端服务
│   ├── index.ts          # HTTP 服务入口
│   ├── stdio.ts          # stdio 模式入口
│   ├── config.ts         # 配置加载
│   ├── auth.ts           # Session 认证
│   ├── storage.ts        # 原子文件存储
│   ├── schema.ts         # Zod 验证
│   ├── invite-codes.ts   # 邀请码管理
│   └── public-page.ts    # 公开页服务 + MCP 发现注入
├── mcp/                  # MCP 核心逻辑
│   ├── create-server.ts  # MCP Server 工厂
│   ├── tools/index.ts    # 8 个 Tool
│   ├── resources.ts      # 2 个 Resource
│   └── rag/              # 搜索和匹配引擎
├── src/                  # 前端（React）
│   ├── components/       # 编辑器、认证页、邀请码管理
│   ├── types/resume.ts   # 统一类型定义
│   ├── i18n/             # 中英双语
│   └── themes/           # 3 套简历主题
├── data/                 # 运行时数据（git ignore）
├── docs/                 # 产品文档 + 开发任务
├── Dockerfile
├── docker-compose.yml
└── config.example.json
```

## 许可证

[MIT](LICENSE)
