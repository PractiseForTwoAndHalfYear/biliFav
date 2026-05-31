# SVG 图标（Icons）

**文件位置：** `bili-fav-fast.html` L291-L340

## 实现方式

所有图标是手写的 Lucide 风格 SVG React 组件，使用 `React.createElement` 构建。

### 基础组件 (L291)

```js
const Ic = ({ s = 16, c = '', ch }) => React.createElement("svg", ...);
```

`Ic` 是底层 SVG 容器组件，其他图标通过它来构建。

### 图标列表

| 组件名 | 行号 | 用途 |
|--------|------|------|
| `Star` | L292 | 加精/星标 |
| `Trophy` | L293-299 | 评级页奖杯 |
| `Eye` | L300-302 | 观看/标记已看 |
| `RefreshCw` | L303-306 | 重新加载/刷新 |
| `Settings` | L307-309 | 设置页 |
| `Library` | L310-312 | 全部视频库 |
| `Calendar` | L313-317 | 每日清单 |
| `Sparkles` | L318 | 精华页面 |
| `Loader2` | L319 | 加载动画 |
| `ExternalLink` | L320-323 | 视频外链跳转 |
| `Search` | L324-326 | 搜索 |
| `Check` | L327 | 勾选/完成 |
| `AlertCircle` | L328-331 | 错误警告 |
| `ChevronRight` | L332 | 右箭头 |
| `Trash2` | L333-335 | 删除 |
| `FolderOpen` | L336 | 收藏夹选择器 |
| `Car` | L337-340 | "开车听"汽车图标 |

## 使用方式

```jsx
// 所有图标通过相同接口调用
React.createElement(Star, { size: 16, className: "..." })
// 或通过包装好的函数组件：
Star({ size: 16, className: "" })
```

如果将来迁移到 Vite 工程，可直接替换为 `lucide-react` 库。
