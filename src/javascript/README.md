# JavaScript 代码映射

本目录映射 `bili-fav-fast.html` 中 JavaScript 代码的分区位置。

## 总览

`bili-fav-fast.html` 的 JS 代码（L260-L949）按文件内顺序分为以下逻辑区块：

| 区块 | 文件 | 行号 | 内容 |
|------|------|------|------|
| 核心库 | [lib.md](lib.md) | L261-289 | React hooks、localStorage 适配器、常量、代理列表 |
| 图标 | [icons.md](icons.md) | L291-340 | 11 个 SVG React 图标组件 |
| 工具函数 | [utils.md](utils.md) | L341-426 | API 请求、格式化、自动分类、每日清单构建 |
| 组件 | [components.md](components.md) | L427-470 | 共享 UI 组件（TabBtn, StatCard, VideoCard 等） |
| 视图 | [views.md](views.md) | L471-779 | 7 个页面级视图组件 |
| 应用入口 | — | L781-949 | App 组件、状态管理、事件处理、ReactDOM 入口 |

## 构建说明

当前无构建步骤。所有代码通过 React CDN 在浏览器中直接运行。

如需将来迁移到 Vite 工程，参考 [docs/vite-migration.md](../../docs/vite-migration.md)。

## 技术约束

- 使用 `React.createElement()` API（无 JSX），保持无构建依赖
- 所有组件写作纯函数形式，使用 `useState`、`useEffect`、`useMemo`、`useRef`
- 命名以业务含义为导向（`buildDays`、`autoBucket`、`toggleWatched`、`setRating`）
