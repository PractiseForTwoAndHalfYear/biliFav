# 核心库（Lib）

**文件位置：** `bili-fav-fast.html` L294-L336

## 内容

```js
const { useState, useEffect, useMemo, useRef } = React;
```

### localStorage 适配器 (L295-311)

```js
const LS = {
    get(k) { ... },   // 读取，返回 { value } 或 null
    set(k, v) { ... }, // 写入
    del(k) { ... },    // 删除
};
```

### 存储键名常量 (L313)

```js
const STORE = {
    config: 'biliFav:config',     // 用户配置
    videos: 'biliFav:videos',     // 视频数据
    overrides: 'biliFav:overrides', // 用户操作记录
};
```

### 默认配置 (L314)

```js
const DEFAULT_CONFIG = { mid: '', folders: [], whitelist: [], listenTarget: 7200, watchTarget: 3600 };
```

### 自动分类规则 (L315-L330)

`LISTEN_KEYWORDS`、`LISTEN_TNAME_KEYWORDS`、`TOPIC_RULES`、`DURATION_BUCKETS` — 用于 `autoBucket()`、`classifyTopic()`、`classifyDuration()` 的分类规则。规则维护源文件位于 `classifiers/classification-rules.js`，页面内嵌一份同等逻辑以保持 HTML 可直接打开。

### CORS 代理列表 (L332-L336)

```js
const PROXIES = [
    u => `https://corsproxy.io/?url=${...}`,
    u => `https://api.allorigins.win/raw?url=${...}`,
    u => `https://api.codetabs.com/v1/proxy?quest=${...}`,
    u => `https://corsproxy.org/?${...}`,
];
```

遇到失败时自动按序切换（failover）。

### 工具 (L337)

```js
const sleep = ms => new Promise(r => setTimeout(r, ms));
```

用于 B 站 API 分页请求之间的延迟。
