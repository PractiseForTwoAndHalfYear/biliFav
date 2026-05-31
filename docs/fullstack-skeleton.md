# B站收藏整理器 · 最小可跑骨架

## 🎯 这个骨架包含什么

- **后端**：Express + TypeScript + Prisma + PostgreSQL，跑 `/api/auth/register`、`/api/auth/login`、`/api/auth/me` 三个接口
- **前端**：React + Vite，一个登录/注册页 + 登录后的简单 Dashboard
- **数据库**：PostgreSQL，只有一张 User 表
- **Android 架构**：建议的目录结构 + 关键类示例

跑通这个骨架后，你就有了：账号系统 + 数据库连接 + JWT 鉴权 + 三端能交互。后续加 B站同步、视频管理只是往上叠功能。

## 🚀 启动方式（三条命令）

```bash
# 1. 把下面所有文件按目录建好，进入项目根目录
cd bili-fav

# 2. 拉起所有服务
docker compose up

# 3. 另开一个终端，初始化数据库表
docker compose exec backend npx prisma migrate dev --name init
```

打开 [http://localhost:5173](http://localhost:5173)，注册账号，登录，看到"🎉 登录成功"就 OK。

---

# 一、项目目录

```
bili-fav/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── env.ts
│       ├── db.ts
│       ├── app.ts
│       ├── index.ts
│       ├── lib/
│       │   ├── jwt.ts
│       │   └── password.ts
│       ├── middleware/
│       │   └── auth.ts
│       └── routes/
│           └── auth.ts
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── api.js
        └── App.jsx
```

---

# 二、后端文件

### `docker-compose.yml`（根目录）

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
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U bilifav']
      interval: 5s
      retries: 5

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://bilifav:dev_password@db:5432/bilifav
      JWT_SECRET: dev_secret_change_in_production
      PORT: '4000'
    ports: ['4000:4000']
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend/src:/app/src
      - ./backend/prisma:/app/prisma

  frontend:
    build: ./frontend
    environment:
      VITE_API_URL: http://localhost:4000
    ports: ['5173:5173']
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/index.html:/app/index.html

volumes:
  db_data:
```

### `backend/Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 4000
CMD ["npm", "run", "dev"]
```

### `backend/package.json`

```json
{
  "name": "bili-fav-backend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@prisma/client": "^5.20.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.14.0",
    "prisma": "^5.20.0",
    "tsx": "^4.19.0",
    "typescript": "^5.5.0"
  }
}
```

### `backend/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

### `backend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt 哈希后
  biliUid   String?
  createdAt DateTime @default(now())
}
```

### `backend/src/env.ts`

```typescript
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const env = {
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: required('JWT_SECRET'),
  databaseUrl: required('DATABASE_URL'),
};
```

### `backend/src/db.ts`

```typescript
import { PrismaClient } from '@prisma/client';
export const db = new PrismaClient();
```

### `backend/src/lib/password.ts`

```typescript
import bcrypt from 'bcryptjs';

export const hashPassword = (pwd: string) => bcrypt.hash(pwd, 10);
export const verifyPassword = (pwd: string, hash: string) => bcrypt.compare(pwd, hash);
```

### `backend/src/lib/jwt.ts`

```typescript
import jwt from 'jsonwebtoken';
import { env } from '../env.js';

export function signToken(userId: string): string {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: '30d' });
}

export function verifyToken(token: string): { userId: string } {
  return jwt.verify(token, env.jwtSecret) as { userId: string };
}
```

### `backend/src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'no_token' });
    return;
  }
  try {
    const { userId } = verifyToken(token);
    req.userId = userId;
    next();
  } catch {
    res.status(401).json({ error: 'invalid_token' });
  }
}
```

### `backend/src/routes/auth.ts`

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signToken } from '../lib/jwt.js';
import { authRequired } from '../middleware/auth.js';

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const { email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'email_taken' });
    return;
  }

  const user = await db.user.create({
    data: { email, password: await hashPassword(password) },
  });
  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, email: user.email } });
});

authRouter.post('/login', async (req, res) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.password))) {
    res.status(401).json({ error: 'invalid_credentials' });
    return;
  }

  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, email: user.email } });
});

authRouter.get('/me', authRequired, async (req, res) => {
  const user = await db.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, email: true, biliUid: true, createdAt: true },
  });
  res.json({ user });
});
```

### `backend/src/app.ts`

```typescript
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use('/api/auth', authRouter);

// 全局错误兜底
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'internal_error' });
});
```

### `backend/src/index.ts`

```typescript
import { app } from './app.js';
import { env } from './env.js';

app.listen(env.port, () => {
  console.log(`🚀 Backend running at http://localhost:${env.port}`);
});
```

---

# 三、前端文件

### `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### `frontend/package.json`

```json
{
  "name": "bili-fav-frontend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0"
  }
}
```

### `frontend/vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173 },
});
```

### `frontend/index.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>B站收藏整理器</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

### `frontend/src/main.jsx`

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
```

### `frontend/src/api.js`

```javascript
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const getToken = () => localStorage.getItem('token');

async function request(method, path, body) {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}

export const api = {
  health:   ()             => request('GET',  '/api/health'),
  register: (email, pwd)   => request('POST', '/api/auth/register', { email, password: pwd }),
  login:    (email, pwd)   => request('POST', '/api/auth/login',    { email, password: pwd }),
  me:       ()             => request('GET',  '/api/auth/me'),
};

export const setToken = (t) => localStorage.setItem('token', t);
export const clearToken = () => localStorage.removeItem('token');
```

### `frontend/src/App.jsx`

```jsx
import { useState, useEffect } from 'react';
import { api, setToken, clearToken } from './api.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      api.me()
        .then(d => setUser(d.user))
        .catch(() => clearToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) return <div style={S.center}>Loading...</div>;
  if (!user) return <AuthForm onAuth={u => setUser(u)} />;
  return <Dashboard user={user} onLogout={() => { clearToken(); setUser(null); }} />;
}

function AuthForm({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr(''); setBusy(true);
    try {
      const data = await (mode === 'login' ? api.login(email, pwd) : api.register(email, pwd));
      setToken(data.token);
      onAuth(data.user);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={S.center}>
      <div style={S.card}>
        <h1 style={{ marginTop: 0 }}>{mode === 'login' ? '登录' : '注册'}</h1>
        <input style={S.input} type="email" placeholder="邮箱"
          value={email} onChange={e => setEmail(e.target.value)} />
        <input style={S.input} type="password" placeholder="密码（≥6位）"
          value={pwd} onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()} />
        {err && <div style={S.error}>{err}</div>}
        <button style={S.btn} onClick={submit} disabled={busy}>
          {busy ? '...' : (mode === 'login' ? '登录' : '注册')}
        </button>
        <p style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>
          {mode === 'login' ? '还没账号？' : '已有账号？'}
          <a href="#" onClick={e => { e.preventDefault(); setMode(mode === 'login' ? 'register' : 'login'); setErr(''); }} style={{ marginLeft: 6 }}>
            {mode === 'login' ? '注册' : '登录'}
          </a>
        </p>
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  return (
    <div style={S.center}>
      <div style={S.card}>
        <h1>🎉 登录成功</h1>
        <p><b>邮箱：</b>{user.email}</p>
        <p><b>用户 ID：</b><code style={{ fontSize: 12 }}>{user.id}</code></p>
        <p style={{ color: '#666', fontSize: 14, marginTop: 20 }}>
          骨架跑通了！下一步把 B 站同步接口加到后端，再让前端调用。
        </p>
        <button style={S.btn} onClick={onLogout}>退出登录</button>
      </div>
    </div>
  );
}

const S = {
  center: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7', fontFamily: '-apple-system, system-ui, sans-serif' },
  card: { background: 'white', padding: 32, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.06)', width: 360 },
  input: { width: '100%', padding: 12, border: '1px solid #ddd', borderRadius: 8, marginBottom: 12, fontSize: 14, boxSizing: 'border-box' },
  btn: { width: '100%', padding: 12, background: '#5b6cff', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 12 },
  error: { color: '#d33', fontSize: 14, marginBottom: 12, padding: 8, background: '#fee', borderRadius: 6 },
};
```

---

# 四、验证跑通

```bash
# 1. 健康检查
curl http://localhost:4000/api/health
# 应该返回 {"ok":true,"time":"..."}

# 2. 注册
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# 3. 直接看数据库
docker compose exec db psql -U bilifav -d bilifav -c "SELECT id, email FROM \"User\";"
```

每一步都能跑通就说明：**前端 → 后端 → 数据库** 整条链路打通了。

---

# 五、Android 项目架构

你是 Android 开发者，下面只给你结构和关键文件示意，具体实现你自己来。

## 5.1 推荐技术栈

| 模块 | 选型 | 备注 |
|------|------|------|
| UI | Jetpack Compose | 类比 SwiftUI / React |
| DI | Hilt | 比 Dagger 易上手，注解驱动 |
| 网络 | Retrofit + OkHttp + Moshi | 业内标准，配 JWT 拦截器 |
| 本地存储 | DataStore | 存 token、用户偏好 |
| 异步 | Coroutines + Flow | StateFlow 给 UI 提供数据流 |
| 图片 | Coil | Compose 友好 |
| 导航 | Navigation Compose | 单 Activity 多 Screen |
| 架构 | MVVM + Repository | View → ViewModel → Repository → Api |

## 5.2 目录结构

```
app/
├── build.gradle.kts
└── src/main/
    ├── AndroidManifest.xml
    └── java/com/yourname/bilifav/
        ├── BiliFavApp.kt                    # @HiltAndroidApp
        ├── MainActivity.kt                  # 单 Activity，挂 Compose
        │
        ├── di/                              # 依赖注入
        │   ├── NetworkModule.kt             # 提供 Retrofit、OkHttp
        │   └── StorageModule.kt             # 提供 DataStore
        │
        ├── data/                            # 数据层
        │   ├── remote/
        │   │   ├── ApiService.kt            # Retrofit interface
        │   │   ├── AuthInterceptor.kt       # 自动加 Bearer token
        │   │   └── dto/
        │   │       ├── AuthDto.kt           # LoginRequest, AuthResponse
        │   │       └── VideoDto.kt
        │   ├── local/
        │   │   └── TokenStore.kt            # DataStore 包装
        │   └── repository/
        │       ├── AuthRepository.kt
        │       └── VideoRepository.kt
        │
        ├── domain/                          # 领域模型（可选，简单项目跳过）
        │   └── model/
        │       └── Video.kt
        │
        └── ui/                              # 表现层
            ├── theme/
            │   ├── Color.kt
            │   ├── Theme.kt
            │   └── Type.kt
            ├── navigation/
            │   └── NavGraph.kt              # 路由配置
            ├── auth/
            │   ├── LoginScreen.kt           # @Composable
            │   └── LoginViewModel.kt        # @HiltViewModel
            ├── library/
            │   ├── LibraryScreen.kt
            │   ├── LibraryViewModel.kt
            │   └── VideoCard.kt             # 复用组件
            ├── today/
            │   ├── TodayScreen.kt
            │   └── TodayViewModel.kt
            └── settings/
                ├── SettingsScreen.kt
                └── SettingsViewModel.kt
```

## 5.3 关键文件示意（不是完整代码，给你写法参考）

### `data/remote/ApiService.kt`

```kotlin
interface ApiService {
    @POST("api/auth/register")
    suspend fun register(@Body body: AuthRequest): AuthResponse

    @POST("api/auth/login")
    suspend fun login(@Body body: AuthRequest): AuthResponse

    @GET("api/auth/me")
    suspend fun me(): MeResponse

    @POST("api/sync")
    suspend fun sync(@Body body: SyncRequest): SyncResponse

    @GET("api/videos")
    suspend fun getVideos(): List<VideoDto>

    @PATCH("api/videos/{bvid}")
    suspend fun updateVideo(
        @Path("bvid") bvid: String,
        @Body patch: VideoPatchDto
    ): VideoDto
}
```

### `data/remote/AuthInterceptor.kt`

```kotlin
class AuthInterceptor @Inject constructor(
    private val tokenStore: TokenStore
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val token = runBlocking { tokenStore.token.first() }
        val req = chain.request().newBuilder().apply {
            if (!token.isNullOrEmpty()) {
                addHeader("Authorization", "Bearer $token")
            }
        }.build()
        return chain.proceed(req)
    }
}
```

### `di/NetworkModule.kt`

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    @Provides @Singleton
    fun okHttp(authInterceptor: AuthInterceptor): OkHttpClient =
        OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .build()

    @Provides @Singleton
    fun retrofit(okHttp: OkHttpClient): Retrofit =
        Retrofit.Builder()
            .baseUrl("https://your-api.com/")  // 你的后端地址
            .client(okHttp)
            .addConverterFactory(MoshiConverterFactory.create())
            .build()

    @Provides @Singleton
    fun apiService(retrofit: Retrofit): ApiService =
        retrofit.create(ApiService::class.java)
}
```

### `data/repository/AuthRepository.kt`

```kotlin
class AuthRepository @Inject constructor(
    private val api: ApiService,
    private val tokenStore: TokenStore
) {
    suspend fun login(email: String, pwd: String): Result<User> = runCatching {
        val res = api.login(AuthRequest(email, pwd))
        tokenStore.saveToken(res.token)
        res.user
    }

    suspend fun register(email: String, pwd: String): Result<User> = runCatching {
        val res = api.register(AuthRequest(email, pwd))
        tokenStore.saveToken(res.token)
        res.user
    }

    suspend fun logout() = tokenStore.clear()

    val isLoggedIn: Flow<Boolean> = tokenStore.token.map { !it.isNullOrEmpty() }
}
```

### `ui/auth/LoginViewModel.kt`

```kotlin
@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepo: AuthRepository
) : ViewModel() {

    private val _state = MutableStateFlow(LoginState())
    val state: StateFlow<LoginState> = _state.asStateFlow()

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            authRepo.login(email, password)
                .onSuccess { user -> _state.update { it.copy(loading = false, user = user) } }
                .onFailure { e -> _state.update { it.copy(loading = false, error = e.message) } }
        }
    }
}

data class LoginState(
    val loading: Boolean = false,
    val user: User? = null,
    val error: String? = null
)
```

### `ui/auth/LoginScreen.kt`

```kotlin
@Composable
fun LoginScreen(
    viewModel: LoginViewModel = hiltViewModel(),
    onLoggedIn: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    LaunchedEffect(state.user) {
        if (state.user != null) onLoggedIn()
    }

    Column(modifier = Modifier.fillMaxSize().padding(24.dp)) {
        OutlinedTextField(value = email, onValueChange = { email = it }, label = { Text("邮箱") })
        OutlinedTextField(
            value = password, onValueChange = { password = it }, label = { Text("密码") },
            visualTransformation = PasswordVisualTransformation()
        )
        Button(
            onClick = { viewModel.login(email, password) },
            enabled = !state.loading
        ) {
            Text(if (state.loading) "登录中..." else "登录")
        }
        state.error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
    }
}
```

## 5.4 数据流图

```
用户操作                                  网络/存储
    │                                          ▲
    ▼                                          │
[Screen] ─event─► [ViewModel] ─call─► [Repository] ─use─► [Api]
    ▲                  │                     │              │
    │                  ▼                     ▼              ▼
    └──[StateFlow]──[State]              [TokenStore]    后端 API
                                              │
                                              ▼
                                          DataStore
```

## 5.5 Android 端的特别考虑

1. **后端地址**：开发时如果用模拟器，`localhost` 是模拟器自己，得用 `10.0.2.2:4000` 访问宿主机后端。真机连同一 WiFi 时用电脑局域网 IP（如 `192.168.1.x:4000`）。

2. **HTTPS**：上线后端必须 HTTPS，否则 Android 9+ 默认拒绝明文流量（或在 `network_security_config.xml` 里加白名单）。

3. **Token 持久化**：用 DataStore，别用 SharedPreferences 存敏感数据；更安全的话用 EncryptedSharedPreferences 或 Android Keystore。

4. **B站 App 跳转**：你可以直接在 Android 里 startActivity 唤起 B站 App，比 web 端的 deep link 还方便：
   ```kotlin
   val intent = Intent(Intent.ACTION_VIEW, Uri.parse("bilibili://video/$bvid"))
   intent.setPackage("tv.danmaku.bili")
   startActivity(intent)
   ```

5. **同步进度**：B站收藏量大的时候，同步可能要十几秒，可以用 WorkManager 跑后台任务，或者后端实现 SSE/WebSocket 推送进度。

---

# 六、跑通之后的下一步

按这个顺序加功能，每一步都能独立验证：

1. ✅ **当前**：注册 + 登录 + 鉴权（现在）
2. ⏭️ **加 B站同步**：扩展 `prisma/schema.prisma` 加 `Video`、`UserVideo`、`UserSetting` 表，再加 `/api/bili/folders` 和 `/api/sync` 端点
3. ⏭️ **加视频 CRUD**：`/api/videos`、`PATCH /api/videos/:bvid`
4. ⏭️ **加用户设置**：`/api/settings`
5. ⏭️ **前端搬迁**：把之前 HTML 版的 LibraryView/TodayView/HighlightsView/SettingsView 搬到这个 React 项目，把 `LS.get/set` 换成 `api.xxx`
6. ⏭️ **Android 端**：照着上面的架构搭，先实现登录、再视频列表、最后每日清单
7. ⏭️ **部署**：买个 VPS（Hetzner 月费 ¥30 起），装 Docker，把 docker-compose 改成生产版（用真实 JWT_SECRET、加 Caddy 做 HTTPS 反代）

有任何一步卡住直接来问。
