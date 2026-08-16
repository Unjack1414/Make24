# 凑24 / Make24

一个手机优先的 24 点 PWA 游戏。玩家使用四张数字卡各一次，通过加、减、乘、除和括号构造结果为 24 的算式。

项目完全运行在浏览器中，不需要后端、数据库、账号或第三方 API。首次成功加载后可以离线使用，答题统计保存在当前浏览器的 `localStorage` 中。

## 当前功能

- 从 1～13 中生成四个数字，允许重复，并保证每题至少有一种解法
- 点击数字、运算符和括号构造表达式
- 精确处理分数、括号优先级和除零，不使用 `eval`
- 支持提交、撤销、清空、提示和下一题
- 本地记录答题数、正确数、正确率、平均用时和最佳用时
- 支持 iPhone Safari、Android 和桌面现代浏览器
- 支持添加到主屏幕、离线缓存和非阻塞版本更新提示

第一阶段不包含后端、登录、云同步、排行榜、每日挑战、难度分级或错题收藏。

## 技术栈

- React 19
- TypeScript 5（strict 模式）
- Vite 7
- Vitest、Testing Library、jsdom
- `vite-plugin-pwa` / Workbox

架构和重要设计理由见 [docs/architecture.md](docs/architecture.md) 与 [docs/decisions.md](docs/decisions.md)。Agent 或新开发者还应阅读 [AGENTS.md](AGENTS.md)。

## 环境要求

- 推荐：Node.js 22 LTS
- 最低：Node.js 20.19.0
- npm 10 或更高版本

项目以 npm 和 `package-lock.json` 为唯一依赖基线，不要提交其他包管理器的锁文件。

检查环境：

```bash
node --version
npm --version
```

## 安装与启动

在 Windows PowerShell、Windows Terminal、Linux 或 macOS 终端中执行相同命令：

```bash
npm ci
npm run dev
```

Vite 会输出本地访问地址，通常为 `http://localhost:5173`。

日常依赖变更使用 `npm install <package>`，并同时提交 `package.json` 和 `package-lock.json`。普通拉取或 CI 环境应使用 `npm ci`。

## 配置

第一阶段没有必需的环境变量。`.env.example` 仅作为未来配置的安全模板。

如果以后增加会进入浏览器的 Vite 配置：

- 变量名必须以 `VITE_` 开头
- 不得把密钥、Token 或密码放入客户端环境变量
- 本地值写入不提交的 `.env.local`
- 新增变量时同步更新 `.env.example` 和本节

## 测试与验证

```bash
# 单元与组件测试
npm test

# TypeScript 类型检查
npm run typecheck

# 检查静态题库是否与生成算法一致
npm run check:puzzles

# 类型、测试、题库和生产构建的统一验证入口
npm run check
```

开发时持续运行测试：

```bash
npm run test:watch
```

只有修改题目范围或求解规则时才应重新生成静态题库：

```bash
npm run generate:puzzles
npm run check
```

当前题库包含 1362 个有解的四数组合。修改生成逻辑后必须审查 `src/game/puzzle-bank.json` 的变化。

## 构建与部署

生成生产文件：

```bash
npm run build
```

构建结果位于 `dist/`，可部署到任何支持 HTTPS 的静态托管平台。PWA 的 Service Worker 在 HTTPS 或 localhost 环境下工作。

本地预览生产构建：

```bash
npm run preview
```

根域名部署使用默认构建即可。部署到子路径（例如 `https://example.com/make24/`）时指定 Vite base：

```bash
npm run build -- --base=/make24/
```

部署平台应把未知前端路径回退到 `index.html`。当前应用只有一个页面，不需要服务器 API。

### iPhone 添加到主屏幕

1. 使用 Safari 打开已经部署的 HTTPS 地址。
2. 点击“分享”。
3. 选择“添加到主屏幕”。
4. 从主屏幕启动并完成一次断网测试。

## 常见问题

### `npm ci` 提示 Node 版本不兼容

升级到 Node 22 LTS，删除旧的 `node_modules` 后重新运行 `npm ci`。不要通过忽略 engines 警告维持旧版本。

### 修改代码后页面仍显示旧版本

PWA 可能仍在使用旧缓存。先完成当前题并点击页面中的更新提示；开发阶段也可在浏览器开发者工具中注销 Service Worker 后刷新。

### 本地成绩消失

成绩仅保存在当前站点、当前浏览器的 `localStorage` 中。清除站点数据、无痕模式结束、域名或部署路径变化都可能导致无法读取旧成绩。

### 题库检查失败

如果有意修改了求解规则，运行 `npm run generate:puzzles` 并审查题库变化；否则恢复意外修改的题库文件。

### 安装后无法离线启动

确认使用 HTTPS 部署，并至少在线成功打开一次生产版本。开发服务器的离线行为不能替代部署后的真机验收。

## 项目结构

```text
src/
├── components/   展示组件、抽屉和 PWA 更新提示
├── expression/   精确分数、表达式解析和判定
├── game/         静态题库与随机出题
├── solver/       递归 24 点求解器
├── storage/      版本化本地统计
├── styles/       全局响应式样式
├── test/         测试环境初始化
├── App.tsx       游戏流程与页面状态
└── types.ts      共享领域类型
```

## 数据与隐私

应用不发送答题数据，不包含分析 SDK，也不连接外部服务。所有统计只存放在本机浏览器中。
