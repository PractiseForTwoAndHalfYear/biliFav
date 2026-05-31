# 核心库（Lib）

**文件位置：** `bili-fav-fast.html` L261-L289

## 内容

```js
const { useState, useEffect, useMemo, useRef } = React;
```

### localStorage 适配器 (L263-279)

```js
const LS = {
    get(k) { ... },   // 读取，返回 { value } 或 null
    set(k, v) { ... }, // 写入
    del(k) { ... },    // 删除
};
```

### 存储键名常量 (L280)

```js
const STORE = {
    config: 'biliFav:config',     // 用户配置
    videos: 'biliFav:videos',     // 视频数据
    overrides: 'biliFav:overrides', // 用户操作记录
};
```

### 默认配置 (L281)

```js
const DEFAULT_CONFIG = { mid: '', folders: [], whitelist: [], listenTarget: 7200, watchTarget: 3600 };
```

### 自动分类关键词 (L282)

`LISTEN_KW` — 用于 `autoBucket()` 判断视频是否为"听"类的关键词列表（访谈、播客、演讲等）。

### CORS 代理列表 (L283-288)

```js
const PROXIES = [
    u => `https://corsproxy.io/?url=${...}`,
    u => `https://api.allorigins.win/raw?url=${...}`,
    u => `https://api.codetabs.com/v1/proxy?quest=${...}`,
    u => `https://corsproxy.org/?${...}`,
];
```

遇到失败时自动按序切换（failover）。

### 工具 (L289)

```js
const sleep = ms => new Promise(r => setTimeout(r, ms));
```

用于 B 站 API 分页请求之间的延迟。
