# 工具函数（Utilities）

**文件位置：** `bili-fav-fast.html` L390-L480

## 函数列表

### `biliFetch(url)` (L390-L420)

Bilibili API 请求函数。通过 CORS 代理链获取数据，支持自动 failover。

**流程：**
1. 遍历 `PROXIES` 列表
2. 对每个代理发起 `fetch` 请求
3. 解析响应 JSON（兼容 `d.contents` 包装）
4. 检查 `d.code !== 0` 错误
5. 所有代理失败则抛出错误

**错误提示：** `所有代理均失败（xxx）。请确认收藏夹已设公开，或稍后重试。`

### `fmtDur(seconds)` (L421-L422)

格式化视频时长。例：`3720` → `"1:02:00"`，`125` → `"2:05"`

### `fmtDurChn(seconds)` (L423)

中文时长描述。例：`3720` → `"1小时2分"`，`125` → `"2分钟"`

### `fmtDate(timestamp)` (L424)

格式化收藏日期。例：`1700000000` → `"1/15"`

### `normalizeText()` / `getSearchText()` / `hasKeyword()` (L425-L427)

分类算法的文本归一化和关键词匹配工具。

### `autoBucket(video, whitelistSet)` (L428-L438)

自动分类视频为"听"（listen）或"看"（watch）。

**分类优先级：**
1. 如果 UP 主在白名单中 → `'listen'`
2. 标题/简介/分区/UP 主名包含 `LISTEN_KEYWORDS` 关键词 → `'listen'`
3. 分区名包含 `LISTEN_TNAME_KEYWORDS` → `'listen'`
4. 否则 → `'watch'`

### `classifyTopic(video)` (L439)

按照标题、简介、分区、UP 主名中的关键词识别内容主题，返回 `{ key, label }`。当前规则包含编程开发、AI/科技、游戏、学习教程、职场商业、生活经验、影视音乐和其他主题。

### `classifyDuration(video)` (L440)

按照视频时长分类，返回短视频、中等、长视频、超长。

### `getBucket(video, overrides, whitelistSet)` (L441)

获取视频的最终分类：优先使用用户手动覆盖（overrides），否则使用 `autoBucket`。

### `buildDays(videos, overrides, whitelistSet, listenSec, watchSec)` (L442-L480)

构建每日清单。将未看的视频按"听/看"分类，分别打包到最多 30 天。

**算法：**
1. 过滤出未看视频，按收藏时间倒序排列
2. 遍历视频，填充到每天的 listen 和 watch 队列
3. 每天不超过设定的时间目标（默认听 2h、看 1h）
4. 如果当天已有内容，允许超时 10 分钟（`+600`）
5. 返回 `[{ listen: [], watch: [], lSec: 0, wSec: 0 }, ...]`

## 分类规则维护

分类规则集中维护在 `classifiers/classification-rules.js`。由于当前产品文件仍是可双击打开的单文件 HTML，修改规则后需要同步更新 `bili-fav-fast.html` 中的内嵌常量和函数。
