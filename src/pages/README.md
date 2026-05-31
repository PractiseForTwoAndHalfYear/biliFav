# 页面视图（Pages）

本目录映射 `bili-fav-fast.html` 中各页面级视图组件的位置。

| 视图 | 行号 | 功能 |
|------|------|------|
| `SetupView` | L471-498 | 首页：输入 B 站 UID，显示准备工作和错误提示 |
| `FolderPickerView` | L499-525 | 收藏夹选择器：展示公开收藏夹列表，支持多选/全选 |
| `LibraryView` | L526-587 | 全部视频库：统计卡片、搜索、筛选、排序、视频卡片列表 |
| `TodayView` | L588-628 | 每日清单：按时间目标自动打包未看视频 |
| `HighlightsView` | L629-644 | 精华回看：展示已加精视频列表 |
| `SettingsView` | L645-696 | 设置页：时间目标、UP 主白名单、数据管理、关于信息 |
| `RankView` | L698-779 | 拖拽评级：5 档位评级系统（夯→拉），拖拽交互 |

## 视图路由

在 `App` 组件（L781-949）中通过 `view` 状态变量切换视图：

```js
const [view, setView] = useState('library');
// ...
view === 'library' && React.createElement(LibraryView, ...)
view === 'today' && React.createElement(TodayView, ...)
// ...
```

## 全部视图列表

- [SetupView](bili-fav-fast.html#L471)
- [FolderPickerView](bili-fav-fast.html#L499)
- [LibraryView](bili-fav-fast.html#L526)
- [TodayView](bili-fav-fast.html#L588)
- [HighlightsView](bili-fav-fast.html#L629)
- [SettingsView](bili-fav-fast.html#L645)
- [RankView](bili-fav-fast.html#L698)
