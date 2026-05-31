# 视图组件（Views）

**文件位置：** `bili-fav-fast.html` L528-L847

## SetupView (L528-L555)

首页展示组件。

- 显示品牌标题和 B 站 UID 输入框
- 列出准备工作说明（登录→找 UID→设收藏夹为公开）
- 支持 Enter 键提交
- 底部显示错误提示（如果有）

## FolderPickerView (L556-L581)

收藏夹选择器。

- 展示 UID 关联的公开收藏夹列表
- 支持全选/全不选
- 显示"开始加载 N 个视频"按钮
- 支持取消返回

## LibraryView (L583-L654)

全部视频库——主浏览页面。

**功能：**
- 顶部 5 个 `StatCard` 统计（总收藏/开车听/专注看/已看/精华）
- 筛选栏：全部/听/看 切换
- 搜索框（标题、简介、UP 主、分区、主题、时长标签搜索）
- UP 主下拉筛选（按视频数量排序）
- 主题下拉筛选（标题内容主题标签）
- 时长下拉筛选（短视频/中等/长视频/超长）
- 排序下拉（收藏时间、时长、标题）
- "隐藏已看"开关
- 视频卡片列表（使用 `VideoCard` 组件）

## TodayView (L656-L696)

每日清单页面。

- 调用 `buildDays()` 构建最多 30 天的观看计划
- 第一天标记为"🌟 今天"
- 每天分"开车听"和"专注看"两个区域
- 显示每天的时长和视频数量

## HighlightsView (L697-L712)

精华回看页面。

- 展示所有已加精视频，按收藏时间倒序
- 没有精华时显示空状态提示

## SettingsView (L713-L764)

设置页面。

**设置项：**
1. 每日目标时长（听/看，0.5-8 小时）
2. UP 主白名单（"总是当听"的 UP 主列表）
3. 数据管理按钮：
   - 重新选择/加载收藏夹
   - 清空"已看"标记
   - 从列表移除已看视频
   - 完全重置（清空所有数据）
4. 关于信息（当前 UID、收藏夹数、视频总数）

## RankView (L781-L847)

拖拽评级页面。

**评级档位（5 级）：**

| 档位 | 键名 | 标签 | 说明 | 渐变色 |
|------|------|------|------|--------|
| 夯 | hong | 封神 | 顶级 | rose → red |
| 顶级 | ding | 天花板 | 优秀 | amber → orange |
| 人上人 | rsr | 高人一等 | 不错 | yellow → amber |
| NPC | npc | 路人甲 | 一般 | sky → blue |
| 拉完了 | la | 拉垮 | 不好 | gray → gray |

**交互：**
- 已看视频出现在"待评级"池
- 通过 `pointerDown/move/up` 实现拖拽
- 拖拽时显示悬浮视频卡片
- 拖入对应档位区域设置评级
- 拖回"待评级"池取消评级
- 评级自动保存到 `localStorage`

## 组件清单

- [SetupView](bili-fav-fast.html#L528)
- [FolderPickerView](bili-fav-fast.html#L556)
- [LibraryView](bili-fav-fast.html#L583)
- [TodayView](bili-fav-fast.html#L656)
- [HighlightsView](bili-fav-fast.html#L697)
- [SettingsView](bili-fav-fast.html#L713)
- [RankView](bili-fav-fast.html#L781)
