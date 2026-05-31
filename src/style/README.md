# 样式（Styles）

本目录映射 `bili-fav-fast.html` 中内联 CSS 样式的位置。

## CSS 内联样式块

- **文件位置：** `bili-fav-fast.html` L9-L288
- **整体风格：** 手写 Tailwind 风格工具类（约 280 个类）
- **移动端适配：** L260-L288，`@media (max-width:639px)` 响应式工具类
- **CSS 变量：** 使用 `--tw-gradient-from`、`--tw-gradient-stops`、`--tw-gradient-to` 实现渐变色
- **动画：** `@keyframes spin`（L22）

## 样式分类

| 类别 | 行号 | 说明 |
|------|------|------|
| 全局重置 | L10-21 | box-sizing、body 字体、边距、a/img/button/input 默认样式 |
| 布局 | L61-65, L86-87, L108-110, L129 | flex、grid、对齐 |
| 间距 | L79-85, L122-127, L131-139, L146-173 | gap、margin、padding |
| 颜色/背景 | L27-50 | 背景色、文字色 |
| 边框/圆角 | L49-56, L176-181 | border、rounded |
| 动效 | L59, L95-105, L225-228 | transition、hover |
| 文字 | L72-75, L197-223 | font-size、font-weight、color |
| 定位 | L23, L107, L174, L192, L223-224 | absolute、sticky、z-index |
| 媒体查询 | L129 | 响应式（>=768px） |
| 动态渐变色 | L242-258 | 运行时动态注入的 StatCard/Rank 渐变色阶 |

## 样式规则

- 所有类名遵循 Tailwind CSS 命名约定
- 使用 `@media(min-width:768px)` 实现响应式（当前仅 `.md:grid-cols-5`）
- 不支持 IE，仅兼容现代浏览器（Chrome、Firefox、Safari、Edge）
