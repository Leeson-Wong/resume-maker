# Resume Maker

> 一个简洁、现代的在线简历生成器，支持多种主题风格和 PDF 导出。

## 简介

Resume Maker 是一个基于 React 的开源简历生成工具，帮助你轻松创建专业的个人简历。无需注册登录，数据存储在本地浏览器中，保护你的隐私。

## 功能特性

- **编辑/预览模式** - 实时切换编辑和预览视图
- **多种主题** - 经典、现代、极简三种风格可选
- **本地存储** - 数据自动保存到浏览器，无需担心丢失
- **PDF 导出** - 一键打印或导出为 PDF 文件
- **JSON 导入/导出** - 备份和迁移简历数据
- **个人头像** - 支持上传可选的个人头像
- **响应式设计** - 适配不同屏幕尺寸

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 pnpm

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-username/resume-maker.git

# 进入目录
cd resume-maker

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 项目结构

```
resume-maker/
├── src/
│   ├── components/       # React 组件
│   │   ├── Resume.tsx        # 简历渲染组件
│   │   ├── ResumeEditor.tsx  # 简历编辑器
│   │   └── Toolbar.tsx       # 顶部工具栏
│   ├── data/             # 示例数据
│   ├── themes/           # 主题配置
│   ├── types/            # TypeScript 类型定义
│   ├── App.tsx           # 主应用组件
│   └── main.tsx          # 入口文件
├── public/               # 静态资源
└── index.html            # HTML 模板
```

## 技术栈

- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS 4** - 样式框架

## 贡献指南

欢迎贡献代码、报告问题或提出新功能建议！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 开发计划

### 功能增强

- [x] 导入/导出 JSON - 方便备份和迁移简历数据
- [x] 拖拽排序 - 经历、项目等条目可拖拽调整顺序
- [x] 模块开关 - 控制各部分（语言能力、技能等）是否显示
- [ ] 多简历管理 - 支持创建多份不同简历

### 用户体验

- [x] 实时预览 - 左右分栏，编辑时同步预览
- [ ] 撤销/重做 - 操作历史记录
- [ ] 表单验证 - 必填项空值提示
- [ ] 快捷键支持 - Ctrl+S 保存等

### 技术改进

- [ ] PWA 支持 - 可离线使用
- [x] i18n 国际化 - 支持中英文切换
- [x] 响应式优化 - 移动端更好体验

### 新增模块

- [x] 证书/荣誉 - 独立的证书展示区
- [x] 兴趣爱好 - 个人兴趣展示
- [ ] 自定义模块 - 用户可添加自定义 section

## 许可证

[MIT](LICENSE) © 2026

## 致谢

感谢所有贡献者的付出！
