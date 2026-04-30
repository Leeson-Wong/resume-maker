# Phase 5: 公开页与编辑器集成

> 目标：将公开页和编辑器统一到同一个服务中，前后端完整贯通。

## 任务清单

### 5.1 公开页服务

- [x] `/` 路由：服务公开简历页
- [x] 默认渲染简洁的简历 HTML（从 resume.json 数据生成）
- [x] 用户可自定义：`data/public/index.html` 替换默认页面
- [x] 自动注入 MCP 发现元信息（link 标签 + JSON-LD）
- [x] 静态资源通过 `/public/*` 路径服务

### 5.2 编辑器 API 路由

- [x] `GET /api/resume` — 获取简历数据（需认证）
- [x] `PUT /api/resume` — 保存简历数据（需认证 + Zod 验证）
- [x] `POST /api/invite-codes` — 生成邀请码（需认证）
- [x] `GET /api/invite-codes` — 列出邀请码（需认证）
- [x] `DELETE /api/invite-codes/:code` — 吊销邀请码（需认证）
- [x] `GET /api/invite-codes/:code/logs` — 查看日志（需认证）

### 5.3 编辑器前端改造

- [x] 移除 localStorage 存储逻辑
- [x] 添加认证页面 `AuthPage.tsx`：输入认证码 → 获取 session
- [x] 数据从 `/api/resume` 加载
- [x] 编辑时通过 `PUT /api/resume` 保存到服务端
- [x] 添加 Save 按钮（绿色，显示 saving 状态）
- [x] 保留 JSON 导入导出功能
- [x] 保留 PDF 导出功能

### 5.4 路由守卫

- [x] `/` → 公开，无需认证
- [x] `/mcp` → 需要邀请码
- [x] `/api/*` → 需要认证码（session cookie）
- [x] `/health` → 公开
- [x] `/.well-known/mcp` → 公开

## 新增文件

- `src/components/AuthPage.tsx` — 认证页面
- `server/public-page.ts` — 公开页服务 + MCP 发现注入

## 验收标准

- [x] 编辑器保存后公开页和 MCP 都能立即反映变化
- [x] 未认证无法进入编辑器
- [x] 公开页包含 MCP 发现信息
- [x] 前端不再依赖 localStorage 存储简历数据
