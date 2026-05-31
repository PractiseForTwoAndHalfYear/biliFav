# 工具函数（Utilities）

**文件位置：** `bili-fav-fast.html` L370-L455

## 函数列表

### `biliFetch(url)` (L370-400)

Bilibili API 请求函数。通过 CORS 代理链获取数据，支持自动 failover。

**流程：**
1. 遍历 `PROXIES` 列表
2. 对每个代理发起 `fetch` 请求
3. 解析响应 JSON（兼容 `d.contents` 包装）
4. 检查 `d.code !== 0` 错误
5. 所有代理失败则抛出错误

**错误提示：** `所有代理均失败（xxx）。请确认收藏夹已设公开，或稍后重试。`

### `fmtDur(seconds)` (L401-402)

格式化视频时长。例：`3720` → `"1:02:00"`，`125` → `"2:05"`

### `fmtDurChn(seconds)` (L403)

中文时长描述。例：`3720` → `"1小时2分"`，`125` → `"2分钟"`

### `fmtDate(timestamp)` (L404)

格式化收藏日期。例：`1700000000` → `"1/15"`

### `autoBucket(video, whitelistSet)` (L405-415)

自动分类视频为"听"（listen）或"看"（watch）。

**分类优先级：**
1. 如果 UP 主在白名单中 → `'listen'`
2. 标题/简介包含 `LISTEN_KW` 关键词 → `'listen'`
3. 分区名包含"演讲""访谈""播客""脱口秀" → `'listen'`
4. 否则 → `'watch'`

### `getBucket(video, overrides, whitelistSet)` (L416)

获取视频的最终分类：优先使用用户手动覆盖（overrides），否则使用 `autoBucket`。

### `buildDays(videos, overrides, whitelistSet, listenSec, watchSec)` (L417-455)

构建每日清单。将未看的视频按"听/看"分类，分别打包到最多 30 天。

**算法：**
1. 过滤出未看视频，按收藏时间倒序排列
2. 遍历视频，填充到每天的 listen 和 watch 队列
3. 每天不超过设定的时间目标（默认听 2h、看 1h）
4. 如果当天已有内容，允许超时 10 分钟（`+600`）
5. 返回 `[{ listen: [], watch: [], lSec: 0, wSec: 0 }, ...]`
