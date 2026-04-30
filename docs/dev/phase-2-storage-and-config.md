# Phase 2: 配置加载与文件存储

> 目标：建立配置体系和服务端文件存储能力，为认证、邀请码、数据持久化打基础。

## 任务清单

### 2.1 配置系统

- [x] 定义 `config.json` 结构：authCode、port、dataPath
- [x] 实现 `server/config.ts`：读取和解析配置文件
- [x] 支持环境变量覆盖（PORT、AUTH_CODE、DATA_PATH）
- [x] 配置文件缺失时给出明确错误提示

### 2.2 文件存储模块

- [x] 实现 `server/storage.ts`：JSON 文件的原子读写
  - 写操作：写临时文件 → rename 覆盖（原子性）
  - 读操作：直接读取
  - 并发安全：WriteQueue 写锁队列
- [x] `resume.json` 的读写接口（含 Zod 验证）
- [x] `codes.json` 的读写接口（含 Zod 验证）
- [x] 初始数据：首次启动时若数据文件不存在，使用默认模板创建

### 2.3 数据验证

- [x] 定义 ResumeData 的 Zod schema（`server/schema.ts`）
- [x] 加载 resume.json 时执行 schema 验证
- [x] 保存 resume.json 前执行 schema 验证
- [x] 验证失败时返回明确的错误信息，不覆盖已有数据
- [x] InviteCode 的 Zod schema 也已定义

## 配置文件结构

```json
{
  "authCode": "your-secret-auth-code",
  "port": 3000,
  "dataPath": "./data"
}
```

- `config.json` — 实际配置（git ignore，不进版本控制）
- `config.example.json` — 示例配置（进版本控制）

## 数据文件结构

```
data/
├── resume.json      # 简历数据（ResumeData）
├── codes.json       # 邀请码列表
└── .gitkeep         # 保证目录存在
```

## 新增文件

- `server/config.ts` — 配置加载（config.json + 环境变量覆盖）
- `server/storage.ts` — 原子读写存储（WriteQueue + tmpfile+rename）
- `server/schema.ts` — Zod 验证 schema（ResumeData + InviteCode）
- `config.example.json` — 示例配置

## 验收标准

- [x] `config.json` 缺失时启动报错并退出
- [x] 数据文件不存在时自动创建默认文件
- [x] 写入过程中断电不会损坏已有数据（tmp+rename 原子操作）
- [x] 无效 JSON 无法写入（Zod schema 验证拦截）
- [x] 配置和环境变量都能正常工作
- [x] TypeScript 编译无错误
