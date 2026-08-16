# 架构说明

## 系统概览

Make24 是纯前端单页面 PWA，没有服务器 API、数据库、登录或第三方运行时服务。

```text
静态题库 → 随机出题 → App 游戏状态 → 用户点击 token
                                  ↓
                           表达式解析与分数求值
                                  ↓
                      结果反馈 → localStorage 统计

Vite 构建 → Manifest + Service Worker → 安装与离线运行
```

## 核心数据流

1. `createPuzzle` 从 `puzzle-bank.json` 随机选择一个与上一题不同的组合，打乱顺序并为四张卡生成唯一 ID。
2. `App` 将每次点击保存为 `ExpressionToken`。数字 token 引用卡片 ID，因此重复值仍是不同卡片。
3. `allowedNext` 根据 token 上下文控制可用按钮；`isExpressionComplete` 决定能否提交。
4. `validateExpression` 先检查四个卡片 ID 是否各出现一次，再将中缀 token 转为后缀表达式。
5. `fraction.ts` 使用约分后的整数分子、分母执行四则运算，最终精确判断是否为 24。
6. 完成、提示或跳题后，`storage/stats.ts` 更新版本化统计并写入 `localStorage`。
7. PWA 插件在生产构建中生成 Manifest 和 Service Worker，缓存应用壳、题库和图标。

## 模块职责

| 模块 | 职责 |
|---|---|
| `src/App.tsx` | 当前题、token、计时、提示、结算、抽屉和组件编排 |
| `src/types.ts` | 卡片、token、分数、题目、验证结果、阶段和统计类型 |
| `src/expression/fraction.ts` | 最大公约数、约分和精确四则运算 |
| `src/expression/parser.ts` | 输入约束、中缀转后缀、求值和答案验证 |
| `src/solver/solver.ts` | 递归合并两个数，搜索至少一种 24 点解法 |
| `src/game/puzzles.ts` | 读取静态题库、随机抽题、洗牌和卡片实例化 |
| `scripts/generate-puzzle-bank.mjs` | 枚举 1～13 的四数组合并生成或检查静态题库 |
| `src/storage/stats.ts` | `StatsV1` 默认值、容错加载、持久化和结算累计 |
| `src/components/` | 无业务算法的展示与辅助交互 |
| `vite.config.ts` | React、Vitest、Manifest、缓存和更新策略 |

## 关键接口

- `ExpressionToken`：数字卡 token、四则运算符或左右括号。
- `Fraction`：整数 `numerator` 与非零正整数 `denominator`。
- `Puzzle`：稳定组合 ID、四个卡片实例和一种提示解法。
- `ValidationResult`：成功值或明确的语法、数字使用、除零、非 24 原因。
- `StatsV1`：版本 1 的累计答题、正确、总用时和最佳用时。

这些接口均为前端内部接口，不是网络 API。

## 外部依赖

运行时只依赖现代浏览器提供的 DOM、`localStorage`、Web App Manifest 和 Service Worker。构建与测试依赖 Node.js/npm 及 `package.json` 中声明的包。

应用不访问外部 API，不上传答题数据，也不需要密钥。

## 已知限制

- 统计仅保存在当前 origin 的浏览器中，清除站点数据或改变域名/路径可能失去访问。
- 进行中的题目不会在刷新后恢复。
- 题库生成脚本和运行时求解器目前各自实现求解逻辑；规则变化时必须同步并由测试与题库检查约束。
- 第一阶段只支持页面按钮输入，不解析键盘自由文本。
- iPhone 安装和离线能力最终需要 HTTPS 部署后的真机验证。
