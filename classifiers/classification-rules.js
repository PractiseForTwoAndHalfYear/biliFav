"use strict";

const LISTEN_KEYWORDS = [
    '访谈', '对话', '专访', '杂谈', '闲聊', '聊聊', '唠嗑', '漫谈', '播客', '电台',
    'podcast', '演讲', '圆桌', '谈话', '分享会', '对谈', '聊天', '闲谈', '畅聊',
];

const LISTEN_TNAME_KEYWORDS = ['演讲', '访谈', '播客', '脱口秀'];

const TOPIC_RULES = [
    { key: 'dev', label: '编程开发', keywords: ['编程', '代码', '程序员', '前端', '后端', '全栈', 'javascript', 'typescript', 'python', 'react', 'vue', 'node', '数据库', '算法'] },
    { key: 'ai-tech', label: 'AI/科技', keywords: ['ai', '人工智能', '大模型', 'chatgpt', 'openai', '机器学习', '深度学习', '科技', '数码', '硬件', '芯片'] },
    { key: 'game', label: '游戏', keywords: ['游戏', '主机', 'steam', '任天堂', '原神', '王者', '英雄联盟', 'lol', '单机', '攻略', '实况'] },
    { key: 'learn', label: '学习教程', keywords: ['教程', '入门', '课程', '公开课', '学习', '指南', '教学', '从零', '训练营', '知识'] },
    { key: 'career', label: '职场商业', keywords: ['职场', '商业', '创业', '管理', '产品经理', '面试', '简历', '副业', '商业模式', '公司'] },
    { key: 'life', label: '生活经验', keywords: ['生活', '旅行', '家居', '做饭', '美食', '健身', '心理', '读书', '经验', 'vlog'] },
    { key: 'media', label: '影视音乐', keywords: ['电影', '影视', '音乐', '乐评', '影评', '纪录片', '动画', '番剧', '剪辑', '解说'] },
];

const DURATION_BUCKETS = [
    { key: 'short', label: '短视频', max: 10 * 60 },
    { key: 'medium', label: '中等', max: 30 * 60 },
    { key: 'long', label: '长视频', max: 90 * 60 },
    { key: 'extra-long', label: '超长', max: Infinity },
];

function normalizeText(value) {
    return String(value || '').toLowerCase();
}

function getSearchText(video) {
    return normalizeText([video.title, video.intro, video.tname, video.up_name].filter(Boolean).join(' '));
}

function hasKeyword(text, keywords) {
    return keywords.some(keyword => text.includes(normalizeText(keyword)));
}

function classifyBucket(video, whitelistSet) {
    if (whitelistSet.has(video.up_mid))
        return 'listen';
    const text = getSearchText(video);
    if (hasKeyword(text, LISTEN_KEYWORDS))
        return 'listen';
    const tname = normalizeText(video.tname);
    if (hasKeyword(tname, LISTEN_TNAME_KEYWORDS))
        return 'listen';
    return 'watch';
}

function classifyTopic(video) {
    const text = getSearchText(video);
    return TOPIC_RULES.find(rule => hasKeyword(text, rule.keywords)) || { key: 'other', label: '其他主题', keywords: [] };
}

function classifyDuration(video) {
    const duration = Number(video.duration) || 0;
    return DURATION_BUCKETS.find(rule => duration <= rule.max) || DURATION_BUCKETS[DURATION_BUCKETS.length - 1];
}
