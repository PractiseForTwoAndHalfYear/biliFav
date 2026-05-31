# B站收藏整理器 · 部署指南

## 第一步：搭项目

```bash
npm create vite@latest bili-fav -- --template react
cd bili-fav
npm install
npm install lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## 第二步：替换 / 新建以下文件

### `tailwind.config.js`（替换）
```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

### `src/index.css`（替换）
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
```

### `src/main.jsx`（替换）
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
```

### `src/App.jsx`（替换，完整代码）
```jsx
import { useState, useEffect, useMemo } from 'react';
import {
  Star, Eye, RefreshCw, Settings, BookOpen as Library,
  Calendar, Sparkles, Loader2, ExternalLink, Search,
  Check, AlertCircle, ChevronRight, Trash2, FolderOpen, Car
} from 'lucide-react';

const LS = {
  get(k) { try { const v = localStorage.getItem(k); return v ? { value: v } : null; } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

const STORE = { config: 'biliFav:config', videos: 'biliFav:videos', overrides: 'biliFav:overrides' };
const DEFAULT_CONFIG = { mid: '', folders: [], whitelist: [], listenTarget: 7200, watchTarget: 3600 };
const LISTEN_KW = ['访谈','对话','专访','杂谈','闲聊','聊聊','唠嗑','漫谈','播客','电台','podcast','演讲','圆桌','谈话','分享会','对谈','聊天','闲谈','畅聊'];
const PROXIES = [
  u => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
  u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
  u => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  u => `https://corsproxy.org/?${encodeURIComponent(u)}`,
];
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function biliFetch(url) {
  let err;
  for (const p of PROXIES) {
    try {
      const r = await fetch(p(url));
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const text = await r.text();
      let d;
      try { d = JSON.parse(text); } catch { throw new Error('响应不是 JSON'); }
      if (d.contents) { try { d = JSON.parse(d.contents); } catch {} }
      if (d.code !== 0) throw new Error(d.message || ('code=' + d.code));
      return d.data;
    } catch (e) { err = e; }
  }
  throw new Error(`所有代理均失败（${err?.message}）。请确认收藏夹已设公开，或稍后重试。`);
}

const fmtDur = s => { if (!s) return '0:00'; const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sc = s%60; return h ? `${h}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}` : `${m}:${String(sc).padStart(2,'0')}`; };
const fmtDurChn = s => { const h = Math.floor(s/3600), m = Math.round((s%3600)/60); return h&&m ? `${h}小时${m}分` : h ? `${h}小时` : `${m}分钟`; };
const fmtDate = ts => { const d = new Date(ts*1000); return `${d.getMonth()+1}/${d.getDate()}`; };

function autoBucket(v, wl) {
  if (wl.has(v.up_mid)) return 'listen';
  const t = (v.title + ' ' + (v.intro || '')).toLowerCase();
  if (LISTEN_KW.some(k => t.includes(k.toLowerCase()))) return 'listen';
  const tn = (v.tname || '').toLowerCase();
  if (tn.includes('演讲') || tn.includes('访谈') || tn.includes('播客') || tn.includes('脱口秀')) return 'listen';
  return 'watch';
}
const getBucket = (v, ov, wl) => ov[v.bvid]?.bucket || autoBucket(v, wl);

function buildDays(videos, ov, wl, lSec, wSec) {
  const lp = [], wp = [];
  for (const v of videos) {
    if (ov[v.bvid]?.watched) continue;
    if (getBucket(v, ov, wl) === 'listen') lp.push(v); else wp.push(v);
  }
  lp.sort((a,b) => b.fav_time - a.fav_time);
  wp.sort((a,b) => b.fav_time - a.fav_time);
  const days = []; let li = 0, wi = 0;
  while ((li < lp.length || wi < wp.length) && days.length < 30) {
    const day = { listen: [], watch: [], lSec: 0, wSec: 0 };
    while (li < lp.length && day.lSec < lSec) { const v = lp[li]; if (day.lSec+v.duration > lSec+600 && day.listen.length) break; day.listen.push(v); day.lSec += v.duration; li++; }
    while (wi < wp.length && day.wSec < wSec) { const v = wp[wi]; if (day.wSec+v.duration > wSec+600 && day.watch.length) break; day.watch.push(v); day.wSec += v.duration; wi++; }
    if (!day.listen.length && !day.watch.length) break;
    days.push(day);
  }
  return days;
}

function TabBtn({ active, onClick, icon: Icon, children }) {
  return <button onClick={onClick} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${active ? 'bg-white shadow text-purple-600' : 'text-gray-600 hover:text-gray-800'}`}><Icon size={16} />{children}</button>;
}
function StatCard({ label, value, color, emoji }) {
  return <div className={`bg-gradient-to-br ${color} rounded-2xl p-3 text-white shadow`}><div className="flex items-center justify-between"><span className="text-xs font-bold opacity-90">{label}</span><span className="text-lg">{emoji}</span></div><div className="text-2xl font-black">{value}</div></div>;
}
function ChipBtn({ active, onClick, children }) {
  return <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${active ? 'bg-white shadow text-purple-600' : 'text-gray-600 hover:text-gray-800'}`}>{children}</button>;
}

function VideoCard({ v, ov, wl, toggleStar, toggleWatched, setBucket, showSwitch }) {
  const o = ov[v.bvid] || {}, bucket = getBucket(v, ov, wl);
  return (
    <div className={`bg-white rounded-2xl shadow hover:shadow-lg transition-all p-3 flex gap-3 ${o.watched ? 'opacity-60' : ''}`}>
      <a href={`https://www.bilibili.com/video/${v.bvid}`} target="_blank" rel="noreferrer" className="flex-shrink-0 relative group">
        <img src={v.cover} alt="" referrerPolicy="no-referrer" className="w-32 h-20 object-cover rounded-xl bg-gray-100" loading="lazy" onError={e => { e.target.style.opacity = '0.15'; }} />
        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-mono">{fmtDur(v.duration)}</div>
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center"><ExternalLink className="text-white" size={20} /></div>
      </a>
      <div className="flex-1 min-w-0">
        <a href={`https://www.bilibili.com/video/${v.bvid}`} target="_blank" rel="noreferrer" className={`block font-bold text-gray-800 hover:text-purple-600 line-clamp-2 leading-snug ${o.watched ? 'line-through' : ''}`}>{v.title}</a>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
          <span className="font-medium text-gray-600">{v.up_name}</span>
          {v.tname && <span className="px-1.5 py-0.5 bg-gray-100 rounded">{v.tname}</span>}
          <span>收藏于 {fmtDate(v.fav_time)}</span>
          <span className="text-gray-400">{v.folder_title}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {showSwitch ? (
            <div className="flex gap-1 bg-gray-100 rounded-full p-0.5">
              <button onClick={() => setBucket(v.bvid, 'listen')} className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${bucket === 'listen' ? 'bg-amber-400 text-white' : 'text-gray-500'}`}>🚗 听</button>
              <button onClick={() => setBucket(v.bvid, 'watch')} className={`px-2.5 py-1 rounded-full text-xs font-bold transition ${bucket === 'watch' ? 'bg-indigo-500 text-white' : 'text-gray-500'}`}>👀 看</button>
            </div>
          ) : (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${bucket === 'listen' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>{bucket === 'listen' ? '🚗 听' : '👀 看'}</span>
          )}
          <button onClick={() => toggleStar(v.bvid)} className={`px-2.5 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 ${o.starred ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-500 hover:bg-yellow-100'}`}>
            <Star size={12} className={o.starred ? 'fill-current' : ''} />{o.starred ? '已加精' : '加精'}
          </button>
          <button onClick={() => toggleWatched(v.bvid)} className={`px-2.5 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 ${o.watched ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-green-100'}`}>
            <Check size={12} />{o.watched ? '已看' : '标记已看'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SetupView({ midInput, setMidInput, onSubmit, error }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-amber-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">📺✨</div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-pink-500 via-purple-500 to-amber-500 bg-clip-text text-transparent mb-2">B站收藏整理器</h1>
          <p className="text-gray-600">把你的收藏自动分类，每天给你排好</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 text-sm">
          <p className="font-bold text-amber-900 mb-2">📝 准备工作</p>
          <ol className="space-y-1.5 text-amber-800 list-decimal list-inside">
            <li>登录 B 站 → 点头像进入个人空间</li>
            <li>地址栏 <code className="bg-amber-200 px-1 rounded">space.bilibili.com/<b>数字</b></code>，那串数字是你的 UID</li>
            <li>把要分类的收藏夹设为"公开"（管理 → 编辑 → 隐私设置）</li>
          </ol>
        </div>
        <label className="block text-sm font-bold text-gray-700 mb-2">你的 B 站 UID</label>
        <div className="flex gap-2">
          <input type="text" inputMode="numeric" value={midInput} onChange={e => setMidInput(e.target.value.trim())} placeholder="例如：12345678"
            onKeyDown={e => e.key === 'Enter' && midInput && onSubmit(midInput)}
            className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-purple-400 focus:outline-none text-lg font-mono" />
          <button onClick={() => midInput && onSubmit(midInput)} disabled={!midInput} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold disabled:opacity-40 hover:scale-105 transition-transform">
            下一步 <ChevronRight className="inline" size={18} />
          </button>
        </div>
        {error && <div className="mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2"><AlertCircle size={18} className="flex-shrink-0 mt-0.5" /><span>{error}</span></div>}
      </div>
    </div>
  );
}

function FolderPickerView({ picker, setPicker, onConfirm, onCancel }) {
  const allIds = picker.folders.map(f => f.id);
  const toggle = id => { const s = new Set(picker.selected); s.has(id) ? s.delete(id) : s.add(id); setPicker({ ...picker, selected: s }); };
  const sel = picker.folders.filter(f => picker.selected.has(f.id));
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-amber-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-lg w-full">
        <h2 className="text-2xl font-black text-gray-800 mb-2 flex items-center gap-2"><FolderOpen className="text-purple-500" size={24} /> 选择要分析的收藏夹</h2>
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600 text-sm">只显示公开的收藏夹，勾选后拉取视频。</p>
          <div className="flex gap-2 ml-3 flex-shrink-0">
            <button onClick={() => setPicker({ ...picker, selected: new Set(allIds) })} className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 hover:bg-purple-200">全选</button>
            <button onClick={() => setPicker({ ...picker, selected: new Set() })} className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200">全不选</button>
          </div>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto mb-5">
          {picker.folders.map(f => (
            <button key={f.id} onClick={() => toggle(f.id)} className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${picker.selected.has(f.id) ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${picker.selected.has(f.id) ? 'bg-purple-500 text-white' : 'border-2 border-gray-300'}`}>
                {picker.selected.has(f.id) && <Check size={16} />}
              </div>
              <div className="flex-1 text-left"><div className="font-bold text-gray-800">{f.title}</div><div className="text-xs text-gray-500">{f.count} 个视频</div></div>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-5 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200">取消</button>
          <button onClick={() => onConfirm(picker.mid, sel)} disabled={!sel.length}
            className="flex-1 px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold disabled:opacity-40 hover:scale-[1.02] transition-transform">
            开始加载 {sel.length ? `(${sel.reduce((s, f) => s + f.count, 0)} 个视频)` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

function LibraryView({ videos, ov, wl, toggleStar, toggleWatched, setBucket }) {
  const [bf, setBf] = useState('all'), [upF, setUpF] = useState(''), [q, setQ] = useState(''), [sort, setSort] = useState('fav_desc'), [hideW, setHideW] = useState(true);
  const ups = useMemo(() => { const m = new Map(); for (const v of videos) m.set(v.up_mid, { mid: v.up_mid, name: v.up_name, count: (m.get(v.up_mid)?.count || 0) + 1 }); return [...m.values()].sort((a, b) => b.count - a.count); }, [videos]);
  const filtered = useMemo(() => {
    let r = videos;
    if (hideW) r = r.filter(v => !ov[v.bvid]?.watched);
    if (bf !== 'all') r = r.filter(v => getBucket(v, ov, wl) === bf);
    if (upF) r = r.filter(v => v.up_mid == upF);
    if (q) { const s = q.toLowerCase(); r = r.filter(v => v.title.toLowerCase().includes(s) || v.up_name.toLowerCase().includes(s) || (v.tname || '').toLowerCase().includes(s)); }
    const S = { fav_desc: (a,b) => b.fav_time-a.fav_time, fav_asc: (a,b) => a.fav_time-b.fav_time, dur_desc: (a,b) => b.duration-a.duration, dur_asc: (a,b) => a.duration-b.duration, title: (a,b) => a.title.localeCompare(b.title, 'zh') };
    return [...r].sort(S[sort]);
  }, [videos, ov, wl, bf, upF, q, sort, hideW]);
  const st = useMemo(() => ({ total: videos.length, watched: videos.filter(v => ov[v.bvid]?.watched).length, starred: videos.filter(v => ov[v.bvid]?.starred).length, listen: videos.filter(v => !ov[v.bvid]?.watched && getBucket(v,ov,wl)==='listen').length, watch: videos.filter(v => !ov[v.bvid]?.watched && getBucket(v,ov,wl)==='watch').length }), [videos, ov, wl]);
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        <StatCard label="总收藏" value={st.total} color="from-purple-400 to-pink-400" emoji="📚" />
        <StatCard label="开车听" value={st.listen} color="from-amber-400 to-orange-400" emoji="🚗" />
        <StatCard label="专注看" value={st.watch} color="from-indigo-400 to-blue-400" emoji="👀" />
        <StatCard label="已看" value={st.watched} color="from-gray-400 to-gray-500" emoji="✅" />
        <StatCard label="精华" value={st.starred} color="from-yellow-400 to-amber-400" emoji="⭐" />
      </div>
      <div className="bg-white rounded-3xl shadow p-4 mb-5">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 bg-gray-100 rounded-full p-1">
            <ChipBtn active={bf==='all'} onClick={()=>setBf('all')}>全部</ChipBtn>
            <ChipBtn active={bf==='listen'} onClick={()=>setBf('listen')}>🚗 听</ChipBtn>
            <ChipBtn active={bf==='watch'} onClick={()=>setBf('watch')}>👀 看</ChipBtn>
          </div>
          <div className="flex-1 relative" style={{minWidth:'180px'}}>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="搜标题、UP 主、分区..." className="w-full pl-9 pr-3 py-2 rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <select value={upF} onChange={e => setUpF(e.target.value)} className="px-3 py-2 rounded-full bg-gray-100 text-sm focus:outline-none">
            <option value="">所有 UP 主</option>
            {ups.map(u => <option key={u.mid} value={u.mid}>{u.name} ({u.count})</option>)}
          </select>
          <select value={sort} onChange={e => setSort(e.target.value)} className="px-3 py-2 rounded-full bg-gray-100 text-sm focus:outline-none">
            <option value="fav_desc">收藏：最新</option><option value="fav_asc">收藏：最早</option>
            <option value="dur_desc">时长：长→</option><option value="dur_asc">时长：短→</option>
            <option value="title">标题</option>
          </select>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 cursor-pointer">
            <input type="checkbox" checked={hideW} onChange={e => setHideW(e.target.checked)} className="rounded" />隐藏已看
          </label>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">显示 {filtered.length} 个视频</p>
      <div className="space-y-3">
        {filtered.map(v => <VideoCard key={v.bvid} v={v} ov={ov} wl={wl} toggleStar={toggleStar} toggleWatched={toggleWatched} setBucket={setBucket} showSwitch />)}
        {!filtered.length && <div className="text-center py-12 text-gray-500"><div className="text-5xl mb-2">🌱</div>没有符合条件的视频</div>}
      </div>
    </div>
  );
}

function TodayView({ videos, ov, wl, config, toggleStar, toggleWatched }) {
  const days = useMemo(() => buildDays(videos, ov, wl, config.listenTarget, config.watchTarget), [videos, ov, wl, config]);
  if (!days.length) return <div className="bg-white rounded-3xl shadow p-12 text-center"><div className="text-6xl mb-3">🎉</div><h3 className="text-xl font-black text-gray-800">所有视频都看完啦！</h3></div>;
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow p-5"><h2 className="text-xl font-black text-gray-800 mb-1">📅 每日推荐</h2><p className="text-sm text-gray-600">🚗 {fmtDurChn(config.listenTarget)} 听 / 👀 {fmtDurChn(config.watchTarget)} 看</p></div>
      {days.map((day, i) => (
        <div key={i} className="bg-white rounded-3xl shadow p-5">
          <h3 className="text-lg font-black text-gray-800 mb-4">{i === 0 ? '🌟 今天' : `第 ${i+1} 天`}</h3>
          {day.listen.length > 0 && <div className="mb-4">
            <div className="flex items-center justify-between mb-2"><h4 className="font-bold text-amber-700 flex items-center gap-1.5"><Car size={18} /> 开车听</h4><span className="text-sm text-amber-700 font-bold">{fmtDurChn(day.lSec)} · {day.listen.length}个</span></div>
            <div className="space-y-2">{day.listen.map(v => <VideoCard key={v.bvid} v={v} ov={ov} wl={wl} toggleStar={toggleStar} toggleWatched={toggleWatched} />)}</div>
          </div>}
          {day.watch.length > 0 && <div>
            <div className="flex items-center justify-between mb-2"><h4 className="font-bold text-indigo-700 flex items-center gap-1.5"><Eye size={18} /> 专注看</h4><span className="text-sm text-indigo-700 font-bold">{fmtDurChn(day.wSec)} · {day.watch.length}个</span></div>
            <div className="space-y-2">{day.watch.map(v => <VideoCard key={v.bvid} v={v} ov={ov} wl={wl} toggleStar={toggleStar} toggleWatched={toggleWatched} />)}</div>
          </div>}
        </div>
      ))}
    </div>
  );
}

function HighlightsView({ videos, ov, wl, toggleStar, toggleWatched }) {
  const starred = videos.filter(v => ov[v.bvid]?.starred).sort((a,b) => b.fav_time - a.fav_time);
  if (!starred.length) return <div className="bg-white rounded-3xl shadow p-12 text-center"><div className="text-6xl mb-3">⭐</div><h3 className="text-xl font-black text-gray-800">还没有精华视频</h3><p className="text-gray-600 mt-2">在视频卡片上点"加精"收录</p></div>;
  return <div><div className="bg-white rounded-3xl shadow p-5 mb-5"><h2 className="text-xl font-black text-gray-800">⭐ 精华回看</h2><p className="text-sm text-gray-600 mt-1">共 {starred.length} 个</p></div><div className="space-y-3">{starred.map(v => <VideoCard key={v.bvid} v={v} ov={ov} wl={wl} toggleStar={toggleStar} toggleWatched={toggleWatched} />)}</div></div>;
}

function SettingsView({ config, setConfig, videos, onReloadFolders, clearWatched, removeWatchedVideos, fullReset }) {
  const ups = useMemo(() => { const m = new Map(); for (const v of videos) m.set(v.up_mid, { mid: v.up_mid, name: v.up_name, count: (m.get(v.up_mid)?.count||0)+1 }); return [...m.values()].sort((a,b) => b.count-a.count); }, [videos]);
  const wlSet = new Set(config.whitelist || []);
  const toggleWl = mid => { const s = new Set(wlSet); s.has(mid) ? s.delete(mid) : s.add(mid); setConfig({ ...config, whitelist: [...s] }); };
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-3xl shadow p-5">
        <h3 className="text-lg font-black text-gray-800">🎯 每日目标时长</h3>
        <p className="text-sm text-gray-600 mb-3">影响「每日清单」自动打包的时长</p>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-bold text-amber-700 mb-1.5">🚗 开车听</label><div className="flex items-center gap-2"><input type="number" step="0.5" min="0.5" max="8" value={config.listenTarget/3600} onChange={e => setConfig({...config, listenTarget: Math.round((parseFloat(e.target.value)||2)*3600)})} className="w-20 px-3 py-2 rounded-xl border-2 border-amber-200 focus:border-amber-400 focus:outline-none font-mono text-lg" /><span>小时</span></div></div>
          <div><label className="block text-sm font-bold text-indigo-700 mb-1.5">👀 专注看</label><div className="flex items-center gap-2"><input type="number" step="0.5" min="0.5" max="8" value={config.watchTarget/3600} onChange={e => setConfig({...config, watchTarget: Math.round((parseFloat(e.target.value)||1)*3600)})} className="w-20 px-3 py-2 rounded-xl border-2 border-indigo-200 focus:border-indigo-400 focus:outline-none font-mono text-lg" /><span>小时</span></div></div>
        </div>
      </div>
      <div className="bg-white rounded-3xl shadow p-5">
        <h3 className="text-lg font-black text-gray-800">{'🎙️ 「总是当听」的 UP 主'}</h3>
        <p className="text-sm text-gray-600 mb-3">勾选后，他们的所有视频都归到「开车听」</p>
        <div className="max-h-64 overflow-y-auto space-y-1.5">
          {ups.map(u => (
            <label key={u.mid} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={wlSet.has(u.mid)} onChange={() => toggleWl(u.mid)} className="w-5 h-5 rounded accent-amber-500" />
              <span className="font-medium text-gray-800">{u.name}</span><span className="text-xs text-gray-500 ml-1">{u.count} 个</span>
            </label>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-3xl shadow p-5">
        <h3 className="text-lg font-black text-gray-800 mb-2">🔄 数据管理</h3>
        <div className="space-y-2">
          {[
            [onReloadFolders, RefreshCw, 'bg-purple-100 text-purple-700 hover:bg-purple-200', '重新选择/加载收藏夹'],
            [clearWatched, Eye, 'bg-blue-100 text-blue-700 hover:bg-blue-200', '清空"已看"标记（视频保留）'],
            [removeWatchedVideos, Trash2, 'bg-orange-100 text-orange-700 hover:bg-orange-200', '从列表移除已看视频'],
            [fullReset, AlertCircle, 'bg-red-100 text-red-700 hover:bg-red-200', '完全重置（清空所有数据）'],
          ].map(([fn, Icon, cls, label]) => (
            <button key={label} onClick={fn} className={`w-full flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-left transition ${cls}`}><Icon size={18} />{label}</button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-3xl shadow p-5 text-sm text-gray-600 space-y-1">
        <p className="font-black text-gray-800 text-lg mb-2">ℹ️ 关于</p>
        <p>当前 UID：<span className="font-mono">{config.mid}</span> · 收藏夹：{config.folders?.length||0} 个 · 视频：{videos.length} 个</p>
        <p className="text-xs text-gray-500 pt-1">数据保存在浏览器本地（localStorage），每个人独立。</p>
      </div>
    </div>
  );
}

export default function App() {
  const [config, setConfig] = useState(null);
  const [videos, setVideos] = useState([]);
  const [ov, setOv] = useState({});
  const [view, setView] = useState('library');
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [picker, setPicker] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [midInput, setMidInput] = useState('');

  useEffect(() => {
    try { const c = LS.get(STORE.config); if (c) setConfig(JSON.parse(c.value)); } catch {}
    try { const v = LS.get(STORE.videos); if (v) setVideos(JSON.parse(v.value)); } catch {}
    try { const o = LS.get(STORE.overrides); if (o) setOv(JSON.parse(o.value)); } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded && config) LS.set(STORE.config, JSON.stringify(config)); }, [config, loaded]);
  useEffect(() => { if (loaded) LS.set(STORE.videos, JSON.stringify(videos)); }, [videos, loaded]);
  useEffect(() => { if (loaded) LS.set(STORE.overrides, JSON.stringify(ov)); }, [ov, loaded]);

  const wl = useMemo(() => new Set(config?.whitelist || []), [config]);

  async function loadFolders(mid) {
    setError(null); setLoading({ msg: '获取收藏夹列表...', cur: 0, tot: 1 });
    try {
      const d = await biliFetch(`https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=${mid}&web_location=333.1387`);
      setLoading(null);
      const folders = (d.list || []).map(f => ({ id: f.id, title: f.title, count: f.media_count }));
      if (!folders.length) { setError('没有找到公开收藏夹。请检查 UID 或把收藏夹设为公开。'); return; }
      setPicker({ mid, folders, selected: new Set(folders.map(f => f.id)) });
    } catch (e) { setLoading(null); setError('加载失败：' + e.message); }
  }

  async function loadVideos(mid, selectedFolders) {
    setError(null); setPicker(null);
    const all = [], seen = new Set();
    let tot = selectedFolders.reduce((s, f) => s + Math.ceil((f.count||20)/20), 0), cur = 0;
    try {
      for (const folder of selectedFolders) {
        let pn = 1, hasMore = true;
        while (hasMore) {
          setLoading({ msg: `加载「${folder.title}」第 ${pn} 页...`, cur, tot });
          const d = await biliFetch(`https://api.bilibili.com/x/v3/fav/resource/list?media_id=${folder.id}&pn=${pn}&ps=20&platform=web&keyword=&order=mtime`);
          for (const m of (d.medias || [])) {
            if (m.type !== 2) continue;
            const bvid = m.bv_id || m.bvid;
            if (!bvid || seen.has(bvid)) continue;
            seen.add(bvid);
            all.push({ bvid, title: m.title||'', intro: m.intro||'', cover: m.cover||'', duration: m.duration||0, up_name: m.upper?.name||'未知', up_mid: m.upper?.mid||0, fav_time: m.fav_time||m.ctime||0, tname: m.tname||'', folder_id: folder.id, folder_title: folder.title });
          }
          hasMore = d.has_more; cur++; pn++;
          await sleep(220);
        }
      }
      setVideos(all); setConfig({ ...(config||DEFAULT_CONFIG), mid, folders: selectedFolders }); setLoading(null); setView('library');
    } catch (e) { setLoading(null); setError('加载视频失败：' + e.message); }
  }

  const toggleStar = bvid => setOv(o => ({ ...o, [bvid]: { ...o[bvid], starred: !o[bvid]?.starred } }));
  const toggleWatched = bvid => setOv(o => ({ ...o, [bvid]: { ...o[bvid], watched: !o[bvid]?.watched } }));
  const setBucket = (bvid, bucket) => setOv(o => ({ ...o, [bvid]: { ...o[bvid], bucket } }));
  function clearWatched() {
    if (!confirm('要清空所有已看记录吗？')) return;
    setOv(o => { const n = {}; for (const [k,v] of Object.entries(o)) { const { watched, ...rest } = v; if (Object.keys(rest).length) n[k] = rest; } return n; });
  }
  function removeWatchedVideos() {
    if (!confirm('要把已看视频彻底移除吗？')) return;
    setVideos(vs => vs.filter(v => !ov[v.bvid]?.watched));
    setOv(o => { const n = {}; for (const [k,v] of Object.entries(o)) { if (!v.watched) n[k] = v; } return n; });
  }
  function fullReset() {
    if (!confirm('要完全重置吗？所有数据都会清空。')) return;
    setConfig(null); setVideos([]); setOv({}); setView('library');
    LS.del(STORE.config); LS.del(STORE.videos); LS.del(STORE.overrides);
  }

  if (!loaded) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 via-purple-100 to-amber-100"><Loader2 className="animate-spin text-pink-500" size={32} /></div>;

  if (loading) {
    const pct = loading.tot > 0 ? Math.min(100, Math.round(loading.cur/loading.tot*100)) : 0;
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-amber-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 mb-6"><Loader2 className="animate-spin text-white" size={36} /></div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">正在加载</h2>
          <p className="text-gray-600 mb-6">{loading.msg}</p>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden"><div className="h-full bg-gradient-to-r from-pink-400 to-purple-500 transition-all duration-300" style={{width: pct+'%'}} /></div>
          <p className="text-sm text-gray-500 mt-3">{loading.cur} / {loading.tot}</p>
        </div>
      </div>
    );
  }

  if (picker) return <FolderPickerView picker={picker} setPicker={setPicker} onConfirm={(mid,sel) => loadVideos(mid,sel)} onCancel={() => setPicker(null)} />;
  if (!config || !videos.length) return <SetupView midInput={midInput} setMidInput={setMidInput} onSubmit={loadFolders} error={error} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-amber-100">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-black bg-gradient-to-r from-pink-500 via-purple-500 to-amber-500 bg-clip-text text-transparent flex items-center gap-2">
            <span className="text-3xl">📺</span> B站收藏整理器
          </h1>
          <div className="flex gap-1 bg-gray-100 rounded-full p-1">
            <TabBtn active={view==='library'} onClick={() => setView('library')} icon={Library}>全部</TabBtn>
            <TabBtn active={view==='today'} onClick={() => setView('today')} icon={Calendar}>每日清单</TabBtn>
            <TabBtn active={view==='highlights'} onClick={() => setView('highlights')} icon={Sparkles}>精华</TabBtn>
            <TabBtn active={view==='settings'} onClick={() => setView('settings')} icon={Settings}>设置</TabBtn>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {view==='library' && <LibraryView videos={videos} ov={ov} wl={wl} toggleStar={toggleStar} toggleWatched={toggleWatched} setBucket={setBucket} />}
        {view==='today' && <TodayView videos={videos} ov={ov} wl={wl} config={config} toggleStar={toggleStar} toggleWatched={toggleWatched} />}
        {view==='highlights' && <HighlightsView videos={videos} ov={ov} wl={wl} toggleStar={toggleStar} toggleWatched={toggleWatched} />}
        {view==='settings' && <SettingsView config={config} setConfig={setConfig} videos={videos} onReloadFolders={() => loadFolders(config.mid)} clearWatched={clearWatched} removeWatchedVideos={removeWatchedVideos} fullReset={fullReset} />}
      </main>
    </div>
  );
}
```

---

## 第三步：构建 & 部署

```bash
npm run build
```

构建完成后 `dist/` 文件夹就是生产版本，没有任何警告。

**部署到 Netlify（免费，推荐）：**
1. 打开 [app.netlify.com/drop](https://app.netlify.com/drop)
2. 把整个 `dist/` 文件夹拖进去
3. 得到 `https://xxx.netlify.app`，发给朋友

**以后更新：** 改完代码 → `npm run build` → 重新拖 `dist/` 到 Netlify 即可自动替换。
