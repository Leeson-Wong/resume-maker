# Phase 4: MCP 服务实时化与隐私控制

> 目标：MCP 查询实时读取最新数据；隐私字段分级控制；公开页 MCP 发现机制；stdio transport。

## 任务清单

### 4.1 MCP 数据实时化

- [x] 每次 MCP 请求重新读取 resume.json（Phase 3 已实现）
- [x] 文件读取错误时返回 503
- [x] 读到的数据经过 Zod schema 验证

### 4.2 隐私字段控制

- [x] `get_profile` 不返回 email、phone、location
- [x] 只返回 name、title、summary、github、linkedin、website
- [x] 其他 MCP tools（experience、projects、skills、education）不含联系方式

### 4.3 公开页 MCP 发现机制

- [x] `<link rel="mcp" href="/mcp">` 自动注入
- [x] JSON-LD 结构化数据（Person schema + knowsAbout）
- [x] `/.well-known/mcp` 端点返回 MCP 元信息 JSON
- [x] 注入逻辑在 `server/public-page.ts` 中实现

### 4.4 stdio transport 支持

- [x] `server/stdio.ts` stdio 模式入口
- [x] `npm run start:stdio` 脚本
- [x] 不需要邀请码认证（本地使用）

## 验收标准

- [x] 编辑简历后 MCP 立即能查到新数据
- [x] MCP 不返回邮箱、手机号等隐私字段
- [x] 公开页 HTML 中包含 MCP 发现信息
- [x] stdio 模式正常工作
- [x] 数据文件损坏时 MCP 返回明确错误
