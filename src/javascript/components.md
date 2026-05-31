# 共享 UI 组件（Components）

**文件位置：** `bili-fav-fast.html` L456-L499

## 组件列表

### `TabBtn` (L457-461)

导航标签按钮。

**Props:** `{ active: bool, onClick: fn, icon: Component, children }`

- `active` 时：白色背景 + 阴影 + 紫色文字
- 非 `active` 时：灰色文字，hover 变深

### `StatCard` (L462-468)

统计卡片，用于 LibraryView 顶部的数据概览。

**Props:** `{ label: string, value: number, color: string, emoji: string }`

- 使用渐变背景（`bg-gradient-to-br ${color}`）
- 白色文字 + 阴影

**颜色映射：**
- 总收藏：`from-purple-400 to-pink-400` 📚
- 开车听：`from-amber-400 to-orange-400` 🚗
- 专注看：`from-indigo-400 to-blue-400` 👀
- 已看：`from-gray-400 to-gray-500` ✅
- 精华：`from-yellow-400 to-amber-400` ⭐

### `ChipBtn` (L469-471)

小型筛选标签按钮。

**Props:** `{ active: bool, onClick: fn, children }`

- 样式与 `TabBtn` 类似，但尺寸更小（`px-3 py-1.5`）

### `VideoCard` (L472-499)

视频卡片组件，是应用中最核心的 UI 组件。

**Props:** `{ v: video, ov: overrides, wl: whitelistSet, toggleStar, toggleWatched, setBucket, showSwitch? }`

**卡片结构：**
1. 左侧：封面图 + 时长角标 + hover 外链图标
2. 右侧：标题（可点击跳转 B 站）、UP 主名、分区 tag、收藏日期、收藏夹名
3. 底部操作栏：
   - 🚗 听 / 👀 看 切换按钮（`showSwitch=true` 时显示）
   - ⭐ 加精按钮
   - ✅ 标记已看按钮

**已看视频样式：** `opacity-60` + 标题添加删除线
