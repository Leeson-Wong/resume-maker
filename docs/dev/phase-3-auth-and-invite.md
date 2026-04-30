# Phase 3: 认证与邀请码系统

> 目标：实现编辑器认证和 MCP 邀请码两套认证体系。

## 任务清单

### 3.1 编辑器认证（Auth Code）

- [x] 实现 `server/auth.ts`：内存 session store，UUID token
- [x] 认证成功后设置 httpOnly session cookie（7天有效期）
- [x] `requireAuth()` 中间件：未认证返回 401 JSON
- [x] `/api/auth` 登录、`/api/auth/logout` 登出、`/api/auth/check` 状态检查
- [x] 自动清理过期 session（每小时）

### 3.2 邀请码管理模块

- [x] 实现 `server/invite-codes.ts`
- [x] 数据结构：code、label、status、createdAt、revokedAt、accessLog
- [x] 生成邀请码：6位随机字符串，排除易混淆字符（0/O, 1/l/I）
- [x] 查询、吊销、访问记录接口
- [x] 所有操作通过 Storage 模块原子写入

### 3.3 MCP 邀请码认证

- [x] `/mcp` 路由从 `Authorization: Bearer <code>` 提取邀请码
- [x] 无邀请码返回 401
- [x] 无效/已吊销邀请码返回 401
- [x] 每次有效请求异步记录到 accessLog

### 3.4 邀请码管理 UI

- [x] `src/components/InviteCodeManager.tsx` 组件
- [x] 生成新邀请码（输入 label + Enter 或点击按钮）
- [x] 查看 active/revoked 分组列表
- [x] 吊销操作
- [x] 展开查看访问日志
- [x] 集成到 Toolbar 的编辑模式下（Codes 按钮）

### 3.5 集成路由

- [x] 轻量路由匹配器（支持 :param 参数）
- [x] `/health` — 公开健康检查
- [x] `/api/auth` — 认证登录
- [x] `/api/auth/logout` — 登出
- [x] `/api/auth/check` — 认证状态
- [x] `/api/resume` GET — 读取简历（需认证）
- [x] `/api/resume` PUT — 保存简历（需认证 + Zod 验证）
- [x] `/api/invite-codes` POST — 生成邀请码（需认证）
- [x] `/api/invite-codes` GET — 列出邀请码（需认证）
- [x] `/api/invite-codes/:code` DELETE — 吊销邀请码（需认证）
- [x] `/api/invite-codes/:code/logs` GET — 查看日志（需认证）
- [x] `/mcp` POST — MCP endpoint（需邀请码）

## 新增文件

- `server/auth.ts` — Session 认证（内存 store + cookie）
- `server/invite-codes.ts` — 邀请码管理（create/list/revoke/validate/logAccess）
- `src/components/InviteCodeManager.tsx` — 邀请码管理 UI 组件

## 验收标准

- [x] 无认证码无法访问 /api/* 路由
- [x] 无邀请码无法调用 MCP，返回 401
- [x] 可生成、查看、吊销邀请码
- [x] 已吊销的邀请码立即失效
- [x] MCP 每次调用都有访问记录
- [x] 邀请码管理 UI 集成到编辑器 Toolbar
- [x] TypeScript 编译无错误
