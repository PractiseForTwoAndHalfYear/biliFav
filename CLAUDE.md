# biliFav — B站收藏整理器

## 项目简介

输入 B 站 UID，拉取公开收藏夹视频，支持分类（听/看、标题主题、时长区间）、标记已看、加精、拖拽评级、每日清单计划。所有数据保存在浏览器 localStorage 中。

## 技术栈

- **框架：** React 18（CDN，`React.createElement` API，无 JSX/无构建步骤）
- **样式：** 手写 Tailwind 风格工具类（内联 `<style>`，约 250 个类）
- **图标：** 自定义 SVG React 组件（Lucide 风格，内联实现）
- **存储：** 浏览器 `localStorage`（3 个键：`biliFav:config`、`biliFav:videos`、`biliFav:overrides`）
- **API：** Bilibili 公开 API，通过 CORS 代理链访问
- **构建：** 无构建步骤，双击 `bili-fav-fast.html` 即可运行

## 目录结构

```
biliFav-main/
├── bili-fav-fast.html          # 唯一可运行的产品文件，双击即开（React 18 + 内联 CSS/JS）
├── AGENTS.md                   # AI 助手项目级工作规则
├── CLAUDE.md                   # 本文件——项目规范与代码映射
├── README.md                   # 项目简介
├── classifiers/                # 分类算法规则管理（页面内嵌同等逻辑以保持单文件可运行）
│   ├── README.md               # 分类规则说明
│   └── classification-rules.js # 听/看、标题主题、时长分类规则
│
├── src/                        # 逻辑地图——标注 bili-fav-fast.html 中的行号位置
│   ├── pages/
│   │   └── README.md           # 各视图的行号映射（L528-L847）
│   ├── style/
│   │   └── README.md           # 内联 CSS 的行号映射（L9-L288）
│   ├── javascript/
│   │   ├── README.md           # JS 代码总览（L294-L1016）
│   │   ├── lib.md              # L294-L337: 存储适配器、常量、代理、分类规则
│   │   ├── icons.md            # L338-L388: SVG 图标组件
│   │   ├── utils.md            # L390-L480: 工具函数（biliFetch、autoBucket、classifyTopic、buildDays 等）
│   │   ├── components.md       # L482-L526: 共享 UI 组件（TabBtn、StatCard、VideoCard 等）
│   │   └── views.md            # L528-L847: 各视图组件说明
│   └── docs/
│       └── README.md           # 文档索引快捷链接
│
├── docs/                       # 架构文档
│   ├── 00-index.md             # 文档索引
│   ├── vite-migration.md       # React + Vite + Tailwind 迁移指南
│   ├── fullstack-skeleton.md   # 最小全栈骨架文档
│   └── fullstack-architecture.md # 完整全栈架构设计
│
└── archive/                    # 归档旧原型
    └── bili-fav-html.html      # 早期 React 原型（JSX + Babel + Tailwind CDN）
```

## 数据模型

### `biliFav:config`
```json
{
  "mid": "12345678",
  "folders": [{ "id": 123, "title": "默认收藏夹", "count": 50 }],
  "whitelist": ["12345"],
  "listenTarget": 7200,
  "watchTarget": 3600
}
```

### `biliFav:videos`
```json
[{
  "bvid": "BV1xx411c7mD",
  "title": "视频标题",
  "intro": "视频简介",
  "cover": "https://i0.hdslb.com/bfs/archive/...",
  "duration": 3720,
  "up_name": "UP主名",
  "up_mid": 12345,
  "fav_time": 1700000000,
  "tname": "科技",
  "folder_id": 123,
  "folder_title": "默认收藏夹"
}]
```

### `biliFav:overrides`
```json
{
  "BV1xx411c7mD": {
    "watched": true,
    "starred": true,
    "bucket": "listen",
    "rating": "hong"
  }
}
```

## API 依赖

| 接口 | 用途 | 参数 |
|------|------|------|
| `api.bilibili.com/x/v3/fav/folder/created/list-all` | 列出用户公开收藏夹 | `up_mid`、`web_location` |
| `api.bilibili.com/x/v3/fav/resource/list` | 列出收藏夹视频 | `media_id`、`pn`、`ps`、`keyword`、`order` |

当前通过 4 个 CORS 代理链访问（corsproxy.io → allorigins.win → codetabs.com → corsproxy.org），自动 failover。

## 视图与组件

### 页面视图（7 个）
| 视图 | 行号 | 功能 |
|------|------|------|
| SetupView | L528 | UID 输入首页 |
| FolderPickerView | L556 | 收藏夹选择器 |
| LibraryView | L583 | 全部视频库（搜索/听看筛选/主题筛选/时长筛选/排序） |
| TodayView | L656 | 每日清单（自动打包） |
| HighlightsView | L697 | 精华回看 |
| SettingsView | L713 | 设置与数据管理 |
| RankView | L781 | 拖拽评级（5 档位） |

### 共享 UI 组件（4 个）
| 组件 | 行号 | 用途 |
|------|------|------|
| TabBtn | L482 | 导航标签 |
| StatCard | L487 | 统计卡片 |
| ChipBtn | L494 | 筛选标签 |
| VideoCard | L497 | 视频卡片（核心组件，显示主题/时长标签） |

### 工具函数（7 个）
| 函数 | 行号 | 用途 |
|------|------|------|
| biliFetch | L390 | B 站 API 请求（代理 failover） |
| fmtDur | L421 | 秒→mm:ss / h:mm:ss |
| fmtDurChn | L423 | 秒→中文描述 |
| fmtDate | L424 | 时间戳→月/日 |
| autoBucket | L428 | 自动分类听/看 |
| classifyTopic | L439 | 按标题/简介/分区识别内容主题 |
| classifyDuration | L440 | 按视频时长识别短/中/长/超长 |
| getBucket | L441 | 获取最终分类（用户覆盖优先） |
| buildDays | L442 | 构建每日清单 |

## 常用命令

```bash
# 预览（直接双击 bili-fav-fast.html，或启动本地服务）
python -m http.server 8000

# 搜索代码
rg "localStorage|biliFetch|buildDays|RankView" .

# 查看目录结构
Get-ChildItem -Recurse -Name

# 读取中文文件
Get-Content -Raw -Encoding UTF8 CLAUDE.md
```

## 修改规则

1. **保持单文件可运行：** `bili-fav-fast.html` 是唯一产品文件，修改后确保双击仍可打开
2. **不引入构建工具：** 不添加 Vite/Webpack/Tailwind/TypeScript，除非用户明确要求
3. **不清空 localStorage：** 涉及 `biliFav:config`、`biliFav:videos`、`biliFav:overrides` 时需谨慎
4. **更新映射：** 修改 `bili-fav-fast.html` 时同步更新 `src/` 下的行号映射文件
5. **命名规范：** 变量/函数以业务含义命名（`buildDays`、`autoBucket`、`toggleWatched`）
6. **通信语言：** 日常使用中文，技术术语保留英文
7. **提交格式：** `类型: 简短说明`（feat/fix/style/docs/refactor）
