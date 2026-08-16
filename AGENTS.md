# AGENTS.md

本文件面向 Codex、Qoder、其他代码 Agent 和新加入的开发者。目标是让任何接手者不依赖历史聊天即可安全继续开发。

## 项目目标与边界

凑24 / Make24 是无后端、手机优先的 24 点 PWA。四个 1～13 的数字允许重复，但必须各使用一次；每道发布题目必须至少有一种通过 `+ - × ÷` 和括号得到 24 的解。

第一阶段不包含账号、后端、数据库、云同步、排行榜、每日挑战、难度、错题收藏或第三方分析服务。不要在未明确提出产品扩展时引入这些能力。

## 开始修改前的阅读顺序

1. `README.md`
2. `AGENTS.md`
3. `docs/architecture.md`
4. `docs/decisions.md`
5. `package.json`
6. `src/types.ts`
7. 与任务直接相关的实现及其测试

算法或游戏规则变更还必须阅读：

1. `src/expression/fraction.ts`
2. `src/expression/parser.ts`
3. `src/solver/solver.ts`
4. `src/game/puzzles.ts`
5. `scripts/generate-puzzle-bank.mjs`

## 核心模块

- `src/App.tsx`：数字→运算符→数字输入状态机、逐步合并、题目导航快照、计时、结算和页面编排
- `src/expression/`：精确分数、token 语法、表达式求值和答案验证
- `src/solver/`：递归求解任意四数是否可得 24
- `src/game/`：已验证静态题库、随机抽题、卡片实例创建和两卡逐步合并
- `src/storage/`：`StatsV1` 的读取、容错、累计和持久化
- `src/components/`：统计、帮助、抽屉和 PWA 更新提示
- `vite.config.ts`：React、测试环境、Manifest 和 Service Worker 配置

## 必须复用的已有能力

- 使用 `Fraction` 整数分数做精确运算；不得改用浮点误差阈值作为核心判定。
- 使用 `ExpressionToken` 和现有解析器验证表达式；不得使用 `eval`、`Function` 或解析任意用户字符串。
- 每张当前运算卡必须保留其来源 token；数字→运算符→数字自动合并时为左右表达式补括号，最终仍通过现有解析器验证四张原始卡各使用一次。
- 合并结果必须保留在第二操作数的布局位置并自动选中；不得恢复为“两张数字选完后再点运算符”的旧交互。
- 上一题只使用内存快照恢复当前会话状态；已结算题不得重复累计统计。
- 使用卡片唯一 ID 区分重复数字；不得只按数字值判断是否已使用。
- 题目从已提交的静态有解题库抽取；不得在应用启动时重新枚举全部组合。
- 统计继续使用版本化的 `make24:stats` localStorage 数据；改变结构必须提供兼容策略并记录决策。
- PWA 更新不得在进行中的题目里强制刷新。

## 谨慎修改的区域

- `src/expression/`、`src/solver/` 和题库生成器共同定义游戏正确性，修改必须补充算法测试。
- `src/game/puzzle-bank.json` 是生成产物但需要提交；只通过生成脚本更新，不手工编辑。
- `StatsV1` 和 `STATS_KEY` 影响已有用户本地数据，不要随意重命名。
- `vite.config.ts`、图标文件和 `index.html` 共同决定安装及离线能力，修改后必须运行生产构建。
- 当前 `App.tsx` 规模仍可维护，不要仅为了“分层”进行无行为收益的大重构。

## 依赖与配置规则

- npm 是唯一包管理器，使用 `package-lock.json`；不要添加其他锁文件。
- 新环境使用 `npm ci`，依赖变更使用 npm 并提交两个 package 文件。
- 当前无必需环境变量。不得提交 `.env`、真实 Token、密码、用户路径、固定 IP 或浏览器状态。
- 浏览器可见的 `VITE_` 变量不能承载秘密。
- 不为简单任务引入新的框架、全局状态库或大型 UI 组件库。

## 自测要求

任何代码修改完成后运行：

```bash
npm run check
```

按改动范围追加验证：

- 算法或题目规则：运行 `npm run generate:puzzles`，审查题库变化，再运行完整检查。
- PWA、图标或缓存：检查 `dist/manifest.webmanifest`、`dist/sw.js`，并在 HTTPS 或 localhost 验证。
- 移动端 UI：至少检查约 390×844 视口、触控目标和安全区域。
- localStorage：验证旧数据、损坏数据和重置流程。

不得以“构建成功”替代测试，也不得提交 `node_modules`、`dist`、`dev-dist` 或本地缓存。

## 文档同步规则

- 命令、依赖、Node 要求、安装或部署变化：更新 `README.md`。
- 模块职责或数据流变化：更新 `docs/architecture.md`。
- 关键技术选择、兼容性或数据格式变化：更新 `docs/decisions.md`。
- Agent 工作约束或必读文件变化：更新 `AGENTS.md`。
- 环境变量变化：更新 `.env.example` 和 README 配置章节。
