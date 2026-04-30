# Phase 6: 部署与发布

> 目标：提供开箱即用的部署方案。

## 任务清单

### 6.1 Docker 部署

- [x] Dockerfile（多阶段构建：node:22-alpine）
- [x] docker-compose.yml（一键启动）
- [x] 数据目录 volume 挂载
- [x] 配置文件 volume 挂载

### 6.2 配置与文档

- [x] `config.example.json` 示例配置
- [x] README 完整重写：项目介绍、部署指南、配置说明
- [x] 邀请码使用说明（如何配置到 Claude Desktop）
- [x] stdio 模式说明

### 6.3 安全

- [x] config.json 在 .gitignore 中
- [x] data/ 在 .gitignore 中
- [x] MCP 需要邀请码认证
- [x] 编辑器需要认证码
- [x] MCP 不暴露邮箱、手机号

## 新增文件

- `Dockerfile`
- `docker-compose.yml`
- `README.md`（重写）

## 验收标准

- [x] `docker compose up` 一键启动
- [x] README 包含完整的部署步骤
- [x] 配置文件示例齐全
- [x] 敏感文件不会被 git 追踪
