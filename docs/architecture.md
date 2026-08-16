# 架构说明

## 系统概览

Make24 是纯前端单页面 PWA，没有服务器 API、数据库、登录或第三方运行时服务。

```text
静态题库 → 随机出题 → 当前运算卡 → 选择第一张卡
                                      ↓
                              选择运算符与第二张卡
                                      ↓
                         自动合并并选中新结果卡
                                      ↓
                    只剩一张卡 → 自动验证 → localStorage 统计

当前题快照 ↔ 上一题/下一题会话内导航

GitHub push/PR → Linux CI → npm run check
main 检查通过 → /Make24/ 子路径构建 → Pages artifact → GitHub Pages
Vite 构建 → Manifest + Service Worker → 安装与离线运行
```

## 核心数据流

1. `createPuzzle` 从 `puzzle-bank.json` 随机选择一个与上一题不同的组合，打乱顺序并为四张卡生成唯一 ID。
2. `App` 把四张原始卡转换为当前运算卡。每张运算卡保存精确 `Fraction` 和引用原始卡 ID 的 `ExpressionToken[]`，界面根据分数值生成显示文本。
3. 玩家先选择第一张当前运算卡，再选择运算符，最后点击第二张卡。第二张卡点击后立即计算；点击顺序决定非交换运算的左、右操作数。
4. 合并时 `fraction.ts` 执行精确运算；第一张卡被移除，第二张卡的位置替换为结果卡。结果 token 是带括号的左右子表达式，结果卡自动选中以支持链式运算。步骤快照用于撤销，清空恢复初始四张卡。
5. 只剩一张运算卡时自动调用 `validateExpression`，检查四个原始卡片 ID 各出现一次，再将内部中缀 token 转为后缀表达式并精确判断是否为 24；正确时自动结算。
6. 完成、提示或跳题后，`storage/stats.ts` 更新版本化统计并写入 `localStorage`。
7. `App` 在内存中保存题目快照栈，上一题恢复离开时的运算、提示、计时和结算状态；刷新后不恢复，已结算快照只读且不重复统计。
8. PWA 插件在生产构建中生成 Manifest 和 Service Worker，缓存应用壳、题库和图标。

## 模块职责

| 模块 | 职责 |
|---|---|
| `src/App.tsx` | 当前题、输入状态机、运算卡、步骤与题目快照、计时、提示、结算、抽屉和组件编排 |
| `src/types.ts` | 卡片、token、分数、题目、验证结果、阶段和统计类型 |
| `src/expression/fraction.ts` | 最大公约数、约分和精确四则运算 |
| `src/expression/parser.ts` | 输入约束、中缀转后缀、求值和答案验证 |
| `src/solver/solver.ts` | 递归合并两个数，搜索至少一种 24 点解法 |
| `src/game/puzzles.ts` | 读取静态题库、随机抽题、洗牌和卡片实例化 |
| `src/game/operations.ts` | 创建当前运算卡，并按选择顺序精确合并两张卡 |
| `scripts/generate-puzzle-bank.mjs` | 枚举 1～13 的四数组合并生成或检查静态题库 |
| `src/storage/stats.ts` | `StatsV1` 默认值、容错加载、持久化和结算累计 |
| `src/components/` | 无业务算法的展示与辅助交互 |
| `vite.config.ts` | React、Vitest、Manifest、缓存和更新策略 |
| `.github/workflows/ci-pages.yml` | PR/主分支质量检查及 GitHub Pages 自动部署 |

## 关键接口

- `ExpressionToken`：内部表达式中的数字卡 token、四则运算符或左右括号；玩家不直接编辑完整 token 序列。
- `Fraction`：整数 `numerator` 与非零正整数 `denominator`。
- `WorkingCard`：当前可选运算卡，保存精确值、内部 token 和稳定 ID；每次合并消耗两张并生成一张。
- `Puzzle`：稳定组合 ID、四个卡片实例和一种提示解法。
- `ValidationResult`：成功值或明确的语法、数字使用、除零、非 24 原因。
- `StatsV1`：版本 1 的累计答题、正确、总用时和最佳用时。

这些接口均为前端内部接口，不是网络 API。

## 外部依赖

运行时只依赖现代浏览器提供的 DOM、`localStorage`、Web App Manifest 和 Service Worker。构建与测试依赖 Node.js/npm 及 `package.json` 中声明的包。

应用运行时不访问外部 API，不上传答题数据，也不需要密钥。构建和部署使用 GitHub Actions 提供的短期 `GITHUB_TOKEN` 与 OIDC 权限，不在仓库中保存部署密钥。

## 已知限制

- 统计仅保存在当前 origin 的浏览器中，清除站点数据或改变域名/路径可能失去访问。
- 进行中的题目不会在刷新后恢复。
- 题库生成脚本和运行时求解器目前各自实现求解逻辑；规则变化时必须同步并由测试与题库检查约束。
- 第一阶段只支持页面按钮输入；玩家通过“数字 → 运算符 → 数字”逐步合并，不解析键盘或自由文本公式。
- 上一题和前进状态只保存在当前页面会话内，刷新后不会恢复。
- iPhone 安装和离线能力最终需要 HTTPS 部署后的真机验证。
