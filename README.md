# AI Nexus 汇智

> **Mac 本地优先的多 AI 协作操作工作台**

一次输入，同时调用多个 AI 模型，横向对比回答，收集素材，评审总结，本地 CLI 安全审批。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![Electron](https://img.shields.io/badge/Electron-42-47848F?logo=electron)

---

## 界面概览

- **品牌蓝紫渐变背景** — 基于品牌设计的 ethereal 风格
- **玻璃拟态面板** — 多层毛玻璃 + 品牌色渲染 (`backdrop-filter: blur(40px)`)
- **开屏动画** — 品牌图渐隐 → 主界面流畅过渡
- **80px 侧边 Rail** — 极简图标导航
- **药丸形输入栏** — 底部悬浮控制台，一键多 AI 广播
- **自适应网格** — 2~6 列响应式布局

## 核心功能

| 功能 | 说明 |
|------|------|
| **多 AI 并行查询** | 同时向 Kimi、Claude Code、Codex、DeepSeek、GPT-4o 发送问题 |
| **自动账号检测** | 启动时扫描本机已登录的 AI 账号（Claude/Codex/Kimi/DeepSeek/OpenAI） |
| **SSE 流式输出** | 实时逐字渲染 AI 回答 |
| **横向对比** | 多面板并排展示，便于对比不同 AI 的差异 |
| **素材库** | 选中文字 → 一键收藏，统一管理所有素材 |
| **评审总结** | 自动生成多个 AI 回答的对比评审报告 |
| **管理控制台** | 技能 / CLI / 模型 / MCP 服务器配置 |
| **历史任务** | 三栏式任务管理（任务列表 / 时间线 / 素材） |
| **本地 CLI 审批** | 敏感命令执行前弹窗确认，风险分级 |
| **SQLite 持久化** | 所有数据本地存储，隐私安全 |

## 技术栈

| 层 | 技术 |
|---|------|
| **前端** | React 19 + TypeScript + Vite 7 + Tailwind CSS 3 + shadcn/ui |
| **状态管理** | Zustand |
| **动画** | Framer Motion |
| **后端** | Node.js + Express + WebSocket (`ws`) |
| **数据库** | SQLite（sql.js，纯 JS 无原生依赖） |
| **AI SDK** | OpenAI SDK + Anthropic SDK |
| **检测引擎** | 7 个 Detector，覆盖 Claude/Codex/Kimi/DeepSeek/OpenAI/lark-cli/CLI 工具 |
| **桌面框架** | Electron 42 + electron-builder |
| **测试** | Vitest + Supertest |

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/liyb-coder/AI-Nexus.git
cd AI-Nexus

# 安装依赖
npm install
cd server && npm install && cd ..

# 一键启动（后端 + 前端）
./start.sh
# 浏览器打开 http://localhost:3000
```

## 运行方式

```bash
# 开发模式（前后端分离）
npm run dev:backend    # 后端 → http://127.0.0.1:5173
npm run dev            # 前端 → http://localhost:3000

# Electron 桌面模式
npm run dev:electron

# 打包 macOS 应用
npm run package:dmg    # 输出到 release/
```

## 项目结构

```
AI-Nexus/
├── src/                     # 前端 React 应用
│   ├── components/          # 核心组件
│   │   ├── AIStreamPanel.tsx    # AI 流式输出面板
│   │   ├── Console.tsx          # 底部输入栏
│   │   ├── ReviewPanel.tsx      # 素材库 + 评审
│   │   ├── Sidebar.tsx          # 左侧导航
│   │   ├── SplashScreen.tsx     # 开屏动画
│   │   ├── ApprovalModal.tsx    # CLI 审批弹窗
│   │   ├── ManagementPage.tsx   # 管理控制台
│   │   └── HistoryPage.tsx      # 历史任务
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useWebSocket.ts      # WebSocket 连接
│   │   └── useSimulateStream.ts # 模拟流式（demo）
│   ├── lib/api.ts           # 后端 API 客户端
│   ├── store/useAppStore.ts # Zustand 全局状态
│   └── types/index.ts       # TypeScript 类型
├── server/                  # 后端 Node.js 服务
│   ├── src/
│   │   ├── index.ts             # 入口（Express + WS）
│   │   ├── detectors/           # AI 账号检测器（7 个）
│   │   ├── db/database.ts       # SQLite 管理
│   │   ├── routes/              # REST API（8 组）
│   │   ├── services/            # AI 代理 / CLI 沙箱 / 流管理 / 评审
│   │   └── ws/handler.ts        # WebSocket 消息路由
│   └── __tests__/               # 28 个测试
├── electron/                # Electron 主进程
│   └── main.cjs
├── build/                   # 打包资源
│   ├── icon.icns            # macOS 应用图标
│   └── entitlements.mac.plist
├── public/                  # 静态资源
│   ├── logo.png             # 品牌 Logo
│   └── splash-bg.png        # 开屏图
├── electron-builder.yml     # Electron 打包配置
├── start.sh                 # 一键启动脚本
└── package.json
```

## Auth Detector — 自动账号检测

启动时自动扫描本机已登录的 AI 账号，覆盖以下来源：

| 检测目标 | 检测来源 |
|---------|---------|
| Claude Code | `~/.claude/` 凭据、`claude` CLI、`ANTHROPIC_API_KEY` |
| Codex | `~/.codex/auth.json`、Codex Desktop、CC Switch DB |
| Kimi | VS Code 扩展 `moonshot-ai.kimi-code`、`MOONSHOT_API_KEY` |
| DeepSeek | CC Switch DB、`DEEPSEEK_API_KEY` |
| OpenAI/GPT-4o | `OPENAI_API_KEY` 环境变量 |
| lark-cli | `~/.lark-cli/` 凭据、`lark-cli auth whoami` |
| CLI 工具 | Git / Node / npm / Python / Docker 版本检测 |

## License

MIT
