# SVG 图标（Icons）

**文件位置：** `bili-fav-fast.html` L338-L388

## 实现方式

所有图标是手写的 Lucide 风格 SVG React 组件，使用 `React.createElement` 构建。

### 基础组件 (L338)

```js
const Ic = ({ s = 16, c = '', ch }) => React.createElement("svg", ...);
```

`Ic` 是底层 SVG 容器组件，其他图标通过它来构建。

### 图标列表

| 组件名 | 行号 | 用途 |
|--------|------|------|
| `Star` | L339 | 加精/星标 |
| `Trophy` | L340-L346 | 评级页奖杯 |
| `Eye` | L347-L349 | 观看/标记已看 |
| `RefreshCw` | L350-L353 | 重新加载/刷新 |
| `Settings` | L354-L356 | 设置页 |
| `Library` | L357-L359 | 全部视频库 |
| `Calendar` | L360-L364 | 每日清单 |
| `Sparkles` | L365 | 精华页面 |
| `Loader2` | L366 | 加载动画 |
| `ExternalLink` | L367-L370 | 视频外链跳转 |
| `Search` | L371-L373 | 搜索 |
| `Check` | L374 | 勾选/完成 |
| `AlertCircle` | L375-L378 | 错误警告 |
| `ChevronRight` | L379 | 右箭头 |
| `Trash2` | L380-L382 | 删除 |
| `FolderOpen` | L383 | 收藏夹选择器 |
| `Car` | L384-L388 | "开车听"汽车图标 |

## 使用方式

```jsx
// 所有图标通过相同接口调用
React.createElement(Star, { size: 16, className: "..." })
// 或通过包装好的函数组件：
Star({ size: 16, className: "" })
```

如果将来迁移到 Vite 工程，可直接替换为 `lucide-react` 库。
