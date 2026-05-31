# B站收藏整理器 · 全栈架构指南

## 一、整体架构

```
┌─────────────┐     HTTP/JSON     ┌──────────────┐    SQL    ┌─────────────┐
│   前端 SPA   │  ◄─────────────►  │   后端 API    │  ◄─────► │  PostgreSQL │
│  React+Vite │                    │ Express+TS   │           │   数据库     │
└─────────────┘                    └──────┬───────┘           └─────────────┘
       ▲                                  │ HTTPS (服务端调用，无 CORS)
       │ 用户访问                          ▼
   用户浏览器                         ┌──────────────┐
   (PC / 手机)                       │  B站官方 API  │
                                     └──────────────┘
```

**架构对比之前的纯前端版**：

| 问题 | 纯前端方案 | 全栈方案 |
|------|----------|---------|
| CORS | 依赖第三方代理 | 后端直接请求，0 CORS 问题 |
| 数据存储 | localStorage（单设备） | PostgreSQL（多设备同步） |
| 多用户 | 每人各自部署 | 一个网站多人共用，登录区分 |
| 鉴权 | 无 | JWT token |
| 扩展性 | 受限 | 可加定时任务、缓存、统计 |

---

## 二、技术栈（对应 App 开发者熟悉的概念）

| 层 | 选型 | 类比 |
|----|------|------|
| 语言 | TypeScript | Swift / Kotlin 的类型系统 |
| 框架 | Express.js | iOS 的 URLSession 路由 / Android 的 OkHttp 服务端版 |
| ORM | Prisma | Core Data / Room（自动生成模型代码） |
| 数据库 | PostgreSQL | 持久化层，比 SQLite 更强 |
| 鉴权 | JWT | App 里的 access token |
| 容器化 | Docker Compose | 一键拉起全套环境 |
| 部署 | 任意 VPS / Railway / Fly.io | TestFlight 之于 App |

---

## 三、项目目录

```
bili-fav/
├── README.md
├── docker-compose.yml           # 一键拉起 Postgres + 后端 + 前端
├── .env.example                 # 环境变量模板
├── .gitignore
│
├── backend/                     # ─── 后端 ─────────────────────────
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma        # 数据模型定义（核心！）
│   │   └── migrations/          # 自动生成的 SQL 迁移
│   └── src/
│       ├── index.ts             # 入口
│       ├── app.ts               # Express 应用配置
│       ├── env.ts               # 环境变量解析
│       ├── db.ts                # Prisma 客户端单例
│       ├── middleware/
│       │   ├── auth.ts          # JWT 鉴权中间件
│       │   └── error.ts         # 全局错误处理
│       ├── routes/
│       │   ├── auth.ts          # POST /api/auth/register, /login
│       │   ├── sync.ts          # POST /api/sync 触发 B站同步
│       │   ├── videos.ts        # GET /api/videos
│       │   ├── overrides.ts     # PATCH /api/videos/:bvid
│       │   └── settings.ts      # GET/PUT /api/settings
│       ├── services/
│       │   ├── bili.ts          # B站 API 封装
│       │   └── sync.ts          # 同步逻辑
│       └── lib/
│           └── jwt.ts           # JWT 签发/验证
│
└── frontend/                    # ─── 前端 ─────────────────────────
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    ├── Dockerfile
    └── src/
        ├── main.jsx
        ├── App.jsx              # 主组件（之前的逻辑搬过来）
        ├── index.css
        ├── api/
        │   └── client.js        # axios 封装，自动带 token
        ├── auth/
        │   ├── AuthContext.jsx  # 全局登录态
        │   └── LoginPage.jsx
        └── components/
            └── ...（VideoCard、TodayView 等）
```

---

## 四、核心文件内容

### 4.1 `docker-compose.yml`（一键启动）

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: bilifav
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: bilifav
    ports: ['5432:5432']
    volumes: ['db_data:/var/lib/postgresql/data']

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://bilifav:dev_password@db:5432/bilifav
      JWT_SECRET: change_this_in_production_to_random_string
      PORT: 4000
    ports: ['4000:4000']
    depends_on: [db]
    volumes: ['./backend/src:/app/src']  # 热重载

  frontend:
    build: ./frontend
    environment:
      VITE_API_URL: http://localhost:4000
    ports: ['5173:5173']
    volumes: ['./frontend/src:/app/src']

volumes:
  db_data:
```

跑起来只要一行：`docker compose up`。前端访问 `http://localhost:5173`，API 在 `http://localhost:4000`。

### 4.2 `backend/prisma/schema.prisma`（数据模型 · 最重要）

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  password    String   // bcrypt 加密后的
  biliUid     String?  // 用户的 B站 UID
  createdAt   DateTime @default(now())
  userVideos  UserVideo[]
  setting     UserSetting?
}

model Video {
  // B站视频元数据，多用户共享，避免重复存储
  bvid        String   @id
  title       String
  cover       String
  duration    Int
  upName      String
  upMid       BigInt
  tname       String?
  intro       String?
  fetchedAt   DateTime @default(now())
  userVideos  UserVideo[]
}

model UserVideo {
  // 用户和视频的多对多关联，包含每个用户对该视频的状态
  userId      String
  bvid        String
  folderId    BigInt
  folderTitle String
  favTime     Int      // B站收藏时间戳
  starred     Boolean  @default(false)
  watched     Boolean  @default(false)
  bucket      String?  // 'listen' | 'watch' | null（null 走自动判断）
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  video       Video    @relation(fields: [bvid], references: [bvid], onDelete: Cascade)
  
  @@id([userId, bvid])
  @@index([userId, watched, bucket])
}

model UserSetting {
  userId        String   @id
  listenTarget  Int      @default(7200)   // 秒
  watchTarget   Int      @default(3600)
  whitelistUps  BigInt[] @default([])     // UP 主 mid 数组
  
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

写完跑 `npx prisma migrate dev`，自动生成 SQL 表 + TypeScript 类型。这就是 ORM 的爽点。

### 4.3 `backend/src/services/bili.ts`（B站 API 封装）

```typescript
// 关键：后端直接请求 B站，没有 CORS 问题
const BILI_BASE = 'https://api.bilibili.com';

export async function fetchFolders(uid: string) {
  const r = await fetch(`${BILI_BASE}/x/v3/fav/folder/created/list-all?up_mid=${uid}`);
  const data = await r.json();
  if (data.code !== 0) throw new Error(data.message);
  return (data.data?.list || []).map((f: any) => ({
    id: f.id, title: f.title, count: f.media_count
  }));
}

export async function fetchFolderVideos(folderId: number) {
  const all: any[] = [];
  let pn = 1, hasMore = true;
  while (hasMore) {
    const r = await fetch(
      `${BILI_BASE}/x/v3/fav/resource/list?media_id=${folderId}&pn=${pn}&ps=20`
    );
    const data = await r.json();
    if (data.code !== 0) throw new Error(data.message);
    for (const m of (data.data?.medias || [])) {
      if (m.type === 2) all.push(m);
    }
    hasMore = data.data?.has_more;
    pn++;
    await new Promise(r => setTimeout(r, 200));  // 礼貌限速
  }
  return all;
}
```

### 4.4 `backend/src/middleware/auth.ts`（JWT 鉴权）

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request { userId?: string }
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'no_token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'invalid_token' });
  }
}
```

### 4.5 `backend/src/routes/sync.ts`（核心业务：同步 B站收藏）

```typescript
import { Router } from 'express';
import { db } from '../db';
import { fetchFolders, fetchFolderVideos } from '../services/bili';
import { authRequired } from '../middleware/auth';

export const syncRouter = Router();

syncRouter.post('/', authRequired, async (req, res) => {
  const { biliUid, folderIds } = req.body;
  const userId = req.userId!;
  
  // 1. 拉取选中的收藏夹
  const allFolders = await fetchFolders(biliUid);
  const folders = allFolders.filter(f => folderIds.includes(f.id));
  
  let total = 0;
  for (const folder of folders) {
    const medias = await fetchFolderVideos(folder.id);
    
    for (const m of medias) {
      const bvid = m.bv_id || m.bvid;
      
      // 2. upsert 视频元数据（多用户共享）
      await db.video.upsert({
        where: { bvid },
        create: {
          bvid, title: m.title, cover: m.cover, duration: m.duration,
          upName: m.upper?.name || '未知', upMid: BigInt(m.upper?.mid || 0),
          tname: m.tname, intro: m.intro,
        },
        update: { title: m.title, cover: m.cover },  // 元数据可能变
      });
      
      // 3. 关联到当前用户（保留已有的 starred/watched/bucket）
      await db.userVideo.upsert({
        where: { userId_bvid: { userId, bvid } },
        create: {
          userId, bvid, folderId: BigInt(folder.id),
          folderTitle: folder.title, favTime: m.fav_time,
        },
        update: { folderTitle: folder.title },
      });
      
      total++;
    }
  }
  
  // 4. 记录 UID
  await db.user.update({ where: { id: userId }, data: { biliUid } });
  
  res.json({ synced: total });
});
```

### 4.6 `frontend/src/api/client.js`（前端 API 调用）

```javascript
const API = import.meta.env.VITE_API_URL;

function getToken() { return localStorage.getItem('token'); }

async function req(method, path, body) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() && { Authorization: `Bearer ${getToken()}` })
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401) { localStorage.removeItem('token'); location.reload(); }
  if (!r.ok) throw new Error((await r.json()).error || 'request_failed');
  return r.json();
}

export const api = {
  login: (email, pwd) => req('POST', '/api/auth/login', { email, password: pwd }),
  register: (email, pwd) => req('POST', '/api/auth/register', { email, password: pwd }),
  listFolders: (uid) => req('GET', `/api/bili/folders?uid=${uid}`),
  sync: (biliUid, folderIds) => req('POST', '/api/sync', { biliUid, folderIds }),
  getVideos: () => req('GET', '/api/videos'),
  updateVideo: (bvid, patch) => req('PATCH', `/api/videos/${bvid}`, patch),
  getSettings: () => req('GET', '/api/settings'),
  updateSettings: (s) => req('PUT', '/api/settings', s),
};
```

---

## 五、API 设计速览

| 方法 | 路径 | 作用 | 鉴权 |
|------|------|------|------|
| POST | `/api/auth/register` | 注册 | ✗ |
| POST | `/api/auth/login` | 登录，返回 JWT | ✗ |
| GET | `/api/bili/folders?uid=` | 列出 B站收藏夹（代理 B站 API）| ✓ |
| POST | `/api/sync` | 同步选中的收藏夹到数据库 | ✓ |
| GET | `/api/videos` | 取该用户全部视频 | ✓ |
| PATCH | `/api/videos/:bvid` | 改 starred / watched / bucket | ✓ |
| GET | `/api/settings` | 取用户设置 | ✓ |
| PUT | `/api/settings` | 改用户设置（白名单、目标时长）| ✓ |

---

## 六、快速启动

```bash
# 1. 克隆/创建项目结构后
cp .env.example .env

# 2. 拉起所有服务
docker compose up

# 3. 首次需要建表（在另一个终端）
docker compose exec backend npx prisma migrate dev --name init

# 4. 浏览器打开 http://localhost:5173
```

---

## 七、给你的学习路径建议

按这个顺序循序渐进，每一步都能跑通：

1. **先把数据库跑起来** — 单独 `docker run` 一个 postgres，用 TablePlus / DBeaver 客户端连，手动建一张表，跑几条 SQL。建立对"持久化"的直觉。

2. **写最小的 Express + Prisma** — `GET /hello`，再加 `POST /users` 写入数据库。不加鉴权、不加 B站、就这一个端点。

3. **加 JWT 鉴权** — 注册/登录两个端点，理解 token 的签发和验证流程。

4. **加 B站代理** — 服务端调 B站 API，把数据返回前端。体会"服务端无 CORS"。

5. **把同步逻辑串起来** — POST /sync 拉数据存库，GET /videos 取出来。

6. **改前端** — 把之前的 `LS.get/set` 换成 `api.xxx` 调用。

7. **进阶**：
   - 加 Redis 缓存 B站响应
   - 加定时任务（node-cron）每天自动同步
   - 加日志（pino）和监控
   - 加 HTTPS 和域名（Caddy 反代）
   - 部署到 VPS（Hetzner/腾讯云轻量都行，月费几十块）

---

## 八、推荐资源

- **Prisma 入门**：[prisma.io/docs/getting-started](https://www.prisma.io/docs/getting-started) — 跟着 quickstart 走 30 分钟
- **Express 官方教程**：[expressjs.com/en/starter](https://expressjs.com/en/starter/installing.html)
- **JWT 原理**：[jwt.io](https://jwt.io) 的 Debugger，玩一下就懂
- **HTTP 基础**：MDN 的 HTTP 章节
- **REST API 设计**：[restfulapi.net](https://restfulapi.net)

---

需要我把哪一步的代码写得更完整？比如先把 `backend/package.json` + `index.ts` + `auth.ts` 这套最小可跑的骨架先给你？这样你能先把"服务器跑起来 + 注册登录通了"这个里程碑达成，再往后加 B站逻辑。
