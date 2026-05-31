# SVG 图标（Icons）

**文件位置：** `bili-fav-fast.html` L320-L369

## 实现方式

所有图标是手写的 Lucide 风格 SVG React 组件，使用 `React.createElement` 构建。

### 基础组件 (L320)

```js
const Ic = ({ s = 16, c = '', ch }) => React.createElement("svg", ...);
```

`Ic` 是底层 SVG 容器组件，其他图标通过它来构建。

### 图标列表

| 组件名 | 行号 | 用途 |
|--------|------|------|
| `Star` | L321 | 加精/星标 |
| `Trophy` | L322-328 | 评级页奖杯 |
| `Eye` | L329-331 | 观看/标记已看 |
| `RefreshCw` | L332-335 | 重新加载/刷新 |
| `Settings` | L336-338 | 设置页 |
| `Library` | L339-341 | 全部视频库 |
| `Calendar` | L342-346 | 每日清单 |
| `Sparkles` | L347 | 精华页面 |
| `Loader2` | L348 | 加载动画 |
| `ExternalLink` | L349-352 | 视频外链跳转 |
| `Search` | L353-355 | 搜索 |
| `Check` | L356 | 勾选/完成 |
| `AlertCircle` | L357-360 | 错误警告 |
| `ChevronRight` | L361 | 右箭头 |
| `Trash2` | L362-364 | 删除 |
| `FolderOpen` | L365 | 收藏夹选择器 |
| `Car` | L366-369 | "开车听"汽车图标 |

## 使用方式

```jsx
// 所有图标通过相同接口调用
React.createElement(Star, { size: 16, className: "..." })
// 或通过包装好的函数组件：
Star({ size: 16, className: "" })
```

如果将来迁移到 Vite 工程，可直接替换为 `lucide-react` 库。
