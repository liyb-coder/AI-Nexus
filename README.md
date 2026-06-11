# 汇智台 (Hui Zhi Tai)

> **Mac 本地优先的多 AI 协作操作工作台**

同时向多个 AI 模型发送问题、横向对比回答、收集素材、评审总结、本地 CLI 运行时审批 —— 一站式 AI 生产力工作台。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38B2AC?logo=tailwindcss)

---

## 界面概览

- **Luminal Glass 玻璃拟态设计** — 动态风景底图 + 多层毛玻璃面板 (`backdrop-filter: blur(40px)`)
- **80px 侧边 Rail** — Mac 风格图标导航，极简通透
- **药丸形输入栏** — 底部悬浮控制台，@提及选择模型
- **自适应网格** — 2~6 列响应式布局，随模型数量自动调整
- **AI 主题色** — 每个模型独立配色，从底图智能提取

## 核心功能

| 功能 | 说明 |
|------|------|
| **多 AI 并行查询** | 同时向 Kimi、Claude、Codex、DeepSeek、OpenAI 等模型发送同一问题 |
| **SSE 流式输出** | 实时逐字渲染 AI 回答，模拟真实流式体验 |
| **横向对比** | 多面板并排展示，便于对比不同模型的回答差异 |
| **文字选中收藏** | 选中任意文字 → 悬浮「加入素材库」按钮，一键收藏 |
| **素材库管理** | 右侧面板统一管理所有收藏素材，支持上传附件和粘贴文本 |
| **评审总结** | 手动触发评审模型对全部素材进行智能总结 |
| **输出文档** | 将评审结果导出为结构化文档 |
| **管理控制台** | 技能配置 / CLI 运行时 / 模型参数 / MCP 服务器管理 |
| **历史任务** | 三栏式任务管理（任务列表 / 时间线 / 资产） |
| **本地 CLI 审批** | 敏感操作弹窗确认，保障本地安全 |

## 技术栈

- **前端**: React 19 + TypeScript + Vite 7 + Tailwind CSS 3 + shadcn/ui
- **状态管理**: Zustand
- **动画**: Framer Motion
- **图标**: Lucide React
- **桌面框架**: Tauri v2 (Rust 后端，未来迁移)

## 快速开始

```bash
# 克隆仓库
git clone <your-repo-url>
cd huizhitai

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
src/
  components/          # 核心组件
    AIStreamPanel.tsx      # AI 输出面板（流式渲染 + 文字选中悬浮按钮）
    Console.tsx            # 底部药丸形输入栏
    ReviewPanel.tsx        # 右侧素材库 + 评审 + 输出文档
    Sidebar.tsx            # 80px 玻璃 Rail 导航
    FullscreenModal.tsx    # 全屏查看面板
    ApprovalModal.tsx      # CLI 操作审批弹窗
    SettingsPanel.tsx      # 设置面板
    ManagementPage.tsx     # 管理控制台框架
    HistoryPage.tsx        # 历史任务页面
    SkillsTab.tsx          # 技能配置管理
    CLITab.tsx             # CLI 运行时配置
    ModelsTab.tsx          # 模型参数配置
    MCPTab.tsx             # MCP 服务器管理
    MentionDropdown.tsx    # @提及下拉组件
  store/
    useAppStore.ts         # Zustand 全局状态
  types/                 # TypeScript 类型定义
  hooks/                 # 自定义 Hooks
  App.tsx                # 根组件
  index.css              # 全局样式 + Glass 主题
```

## 设计系统

### 玻璃拟态 (Glassmorphism)

```css
/* 基础玻璃面板 */
.glass-panel {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

/* 强化玻璃（悬浮按钮等） */
.glass-panel-strong {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.8);
}
```

### 自适应网格

| 模型数 | 列数 | 断点 |
|--------|------|------|
| 1 | 1 | - |
| 2 | 2 | - |
| 3 | 3 | - |
| 4 | 2×2 | default |
| 5-6 | 3×2 | `xl:` |
| 7-8 | 4×2 | `2xl:` |

## 未来规划

- [ ] **Tauri v2 桌面化** — 将前端封装为 Mac 原生应用
- [ ] **真实 SSE 连接** — 替换模拟流式为真实 AI API 调用
- [ ] **本地数据持久化** — SQLite / 文件系统存储
- [ ] **MCP 协议支持** — Model Context Protocol 完整实现
- [ ] **插件系统** — 第三方技能扩展

## License

MIT
