const fs = require('node:fs');
const path = require('node:path');
const { readSnapshot } = require('./lead-capture');

const MAX_HISTORY = 7;

function getLocalHistoryPath() {
  return process.env.LEAD_FOLLOWUP_TODOS_LOCAL_PATH || '/tmp/passive-income-lab-lead-followup-todos.json';
}

function getKvRestUrl() {
  return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
}

function getKvRestToken() {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
}

function getHistoryKvKey() {
  return process.env.LEAD_FOLLOWUP_TODOS_KV_KEY || 'passive-income-lab:lead-followup-todos:history';
}

function hasKvStore() {
  return Boolean(getKvRestUrl() && getKvRestToken());
}

async function kvRequest(command, ...args) {
  const encodedArgs = args.map((item) => encodeURIComponent(String(item))).join('/');
  const url = `${getKvRestUrl().replace(/\/$/, '')}/${command}${encodedArgs ? `/${encodedArgs}` : ''}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getKvRestToken()}`
    }
  });
  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new Error(payload.error || `KV request failed: ${response.status}`);
  }
  return payload.result;
}

async function readHistoryStore() {
  if (hasKvStore()) {
    const result = await kvRequest('get', getHistoryKvKey());
    if (!result) return { latest: null, history: [] };
    try {
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;
      return parsed && typeof parsed === 'object' ? parsed : { latest: null, history: [] };
    } catch (_error) {
      return { latest: null, history: [] };
    }
  }

  try {
    return JSON.parse(fs.readFileSync(getLocalHistoryPath(), 'utf8'));
  } catch (_error) {
    return { latest: null, history: [] };
  }
}

async function writeHistoryStore(store) {
  if (hasKvStore()) {
    await kvRequest('set', getHistoryKvKey(), JSON.stringify(store));
    return;
  }

  fs.mkdirSync(path.dirname(getLocalHistoryPath()), { recursive: true });
  fs.writeFileSync(getLocalHistoryPath(), JSON.stringify(store, null, 2));
}

function buildHistoryStorageMeta() {
  if (hasKvStore()) {
    return {
      mode: 'vercel-kv',
      durable: true,
      provider: 'vercel-kv-rest',
      key: getHistoryKvKey(),
      note: '跟进待办历史已写入托管 KV，可跨设备确认 cron 是否真的跑过。'
    };
  }

  return {
    mode: 'local-file',
    durable: false,
    path: getLocalHistoryPath(),
    note: '跟进待办历史当前仅保存在本地文件，适合本机调试；若要部署后持久化，建议配置 KV_REST_API_URL / KV_REST_API_TOKEN。'
  };
}

function normalizeProductTitle(slug) {
  if (slug === 'orion-nexus') return 'Orion Nexus Quant 研究包';
  if (slug === 'micro-saas') return 'Micro-SaaS 冷启动提示词包';
  return slug || '未命名产品';
}

function buildLandingLink(productSlug) {
  return `https://example.com/passive-income-lab/?product=${encodeURIComponent(productSlug || 'micro-saas')}`;
}

function getTodoBucket(entry = {}) {
  const stage = String(entry.stage || '待跟进').trim() || '待跟进';
  if (stage === '待跟进') return '现在';
  if (stage === '已发送资料' || stage === '已报价') return '24h';
  if (stage === '已成交') return '72h';
  return '本周';
}

function getBucketDeadlineHours(bucket) {
  if (bucket === '现在') return 6;
  if (bucket === '24h') return 24;
  if (bucket === '72h') return 72;
  return 168;
}

function getUpdatedAt(entry = {}) {
  return entry.updatedAt || entry.createdAt || '';
}

function getAgeHours(entry = {}) {
  const raw = getUpdatedAt(entry);
  const ts = raw ? new Date(raw).getTime() : NaN;
  if (!Number.isFinite(ts)) return 0;
  return Math.max(0, Math.round((Date.now() - ts) / 36e5));
}

function getCadenceLevel(entry = {}) {
  const bucket = getTodoBucket(entry);
  const ageHours = getAgeHours(entry);
  const deadlineHours = getBucketDeadlineHours(bucket);
  if (ageHours >= deadlineHours) return 'overdue';
  if (ageHours >= Math.max(1, Math.round(deadlineHours * 0.5))) return 'soon';
  return 'fresh';
}

function getCadenceLabel(level) {
  if (level === 'overdue') return '已超期';
  if (level === 'soon') return '即将超期';
  return '节奏正常';
}

function buildTodoAction(entry = {}) {
  const stage = String(entry.stage || '待跟进').trim() || '待跟进';
  const productTitle = normalizeProductTitle(entry.productSlug);
  if (stage === '待跟进') return `发送 ${productTitle} 的单产品链接 + FAQ，并确认预算/决策时点`;
  if (stage === '已发送资料') return '追问是否看完资料、是否需要报价/演示，并锁定明确回复时间';
  if (stage === '已报价') return '跟进是否确认下单、还有哪些异议，并给出成交截止或下一次触达时间';
  if (stage === '已成交') return '记录交付边界、催收反馈，并争取复购/转介绍素材';
  return entry.nextStep || '待确认下一步';
}

function getPriorityWeight(priority = '') {
  if (priority === '高') return 0;
  if (priority === '中') return 1;
  return 2;
}

function getBucketWeight(bucket = '') {
  if (bucket === '现在') return 0;
  if (bucket === '24h') return 1;
  if (bucket === '72h') return 2;
  return 3;
}

function getCadenceWeight(level = '') {
  if (level === 'overdue') return 0;
  if (level === 'soon') return 1;
  return 2;
}

function buildFollowupItems(snapshot = {}) {
  const entries = Array.isArray(snapshot.entries) ? snapshot.entries : [];
  return entries
    .filter((entry) => String(entry.stage || '待跟进').trim() !== '暂不推进')
    .map((entry) => {
      const productSlug = String(entry.productSlug || 'micro-saas').trim() || 'micro-saas';
      const timeBucket = getTodoBucket(entry);
      const ageHours = getAgeHours(entry);
      const cadenceLevel = getCadenceLevel(entry);
      return {
        leadId: String(entry.id || ''),
        leadName: String(entry.name || '未命名线索').trim() || '未命名线索',
        productSlug,
        productTitle: normalizeProductTitle(productSlug),
        stage: String(entry.stage || '待跟进').trim() || '待跟进',
        priority: String(entry.priority || '中').trim() || '中',
        channel: String(entry.channel || '其他').trim() || '其他',
        source: String(entry.source || entry.channel || 'manual').trim() || 'manual',
        budget: String(entry.budget || '待确认').trim() || '待确认',
        updatedAt: getUpdatedAt(entry),
        timeBucket,
        ageHours,
        cadenceLevel,
        cadenceLabel: getCadenceLabel(cadenceLevel),
        overdueByHours: cadenceLevel === 'overdue' ? Math.max(0, ageHours - getBucketDeadlineHours(timeBucket)) : 0,
        nextAction: buildTodoAction(entry),
        nextStep: String(entry.nextStep || '待确认下一步').trim() || '待确认下一步',
        need: String(entry.need || entry.demand || '').trim(),
        landingLink: buildLandingLink(productSlug)
      };
    })
    .sort((a, b) => {
      return getCadenceWeight(a.cadenceLevel) - getCadenceWeight(b.cadenceLevel)
        || getBucketWeight(a.timeBucket) - getBucketWeight(b.timeBucket)
        || getPriorityWeight(a.priority) - getPriorityWeight(b.priority)
        || b.ageHours - a.ageHours;
    })
    .map((item, index) => ({ ...item, order: index + 1 }));
}

function buildTodoReport(items = []) {
  const bucketCounts = { now: 0, next24h: 0, next72h: 0, thisWeek: 0 };
  const cadenceCounts = { overdue: 0, soon: 0, fresh: 0 };
  const productCounts = {};
  const sourceCounts = {};
  for (const item of items) {
    if (item.timeBucket === '现在') bucketCounts.now += 1;
    else if (item.timeBucket === '24h') bucketCounts.next24h += 1;
    else if (item.timeBucket === '72h') bucketCounts.next72h += 1;
    else bucketCounts.thisWeek += 1;

    cadenceCounts[item.cadenceLevel] = (cadenceCounts[item.cadenceLevel] || 0) + 1;
    productCounts[item.productSlug] = (productCounts[item.productSlug] || 0) + 1;
    sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
  }

  const products = Object.entries(productCounts)
    .map(([productSlug, count]) => ({ productSlug, productTitle: normalizeProductTitle(productSlug), count }))
    .sort((a, b) => b.count - a.count);
  const sources = Object.entries(sourceCounts)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
  const topLead = items[0] || null;
  const recommendation = topLead
    ? (topLead.cadenceLevel === 'overdue'
        ? `先处理 ${topLead.leadName}（${topLead.productTitle}），它已${topLead.timeBucket}超期 ${topLead.overdueByHours}h。`
        : `先推进 ${topLead.leadName}（${topLead.productTitle}），优先完成“${topLead.nextAction}”。`)
    : '当前没有需要跟进的线索，可切换到新的分发实验或补充首批询价入口。';

  return {
    generatedAt: new Date().toISOString(),
    count: items.length,
    bucketCounts,
    cadenceCounts,
    topLead,
    products,
    sources,
    topProduct: products[0] || null,
    topSource: sources[0] || null,
    recommendation
  };
}

function formatDelta(value = 0) {
  if (!value) return '持平';
  return value > 0 ? `+${value}` : `${value}`;
}

function buildTrend(report, previousEntry = null) {
  if (!previousEntry) {
    return {
      hasPrevious: false,
      previousGeneratedAt: null,
      countDelta: null,
      overdueDelta: null,
      soonDelta: null,
      summary: '较上次：暂无可对比历史',
      recommendationHint: '先连续跑满 2 次待办日报，再根据超期/即将超期变化安排补量或清 backlog。'
    };
  }

  const countDelta = (report.count || 0) - (previousEntry.count || 0);
  const overdueDelta = (report.cadenceCounts?.overdue || 0) - (previousEntry.overdueCount || 0);
  const soonDelta = (report.cadenceCounts?.soon || 0) - (previousEntry.soonCount || 0);
  const recommendationHint = overdueDelta > 0
    ? '超期待办在增加，先清最老的“现在/24h”线索，再继续铺新渠道。'
    : countDelta > 0
      ? '待办池仍在增长，优先把最高优先级线索推进到“已发送资料 / 已报价”。'
      : '待办没有增长，适合回到分发入口继续补新线索。';

  return {
    hasPrevious: true,
    previousGeneratedAt: previousEntry.generatedAt || null,
    countDelta,
    overdueDelta,
    soonDelta,
    summary: `较上次：待办总数 ${formatDelta(countDelta)}｜已超期 ${formatDelta(overdueDelta)}｜即将超期 ${formatDelta(soonDelta)}`,
    recommendationHint
  };
}

function buildLeadFollowupTodosPayload(snapshot = {}, options = {}) {
  const items = buildFollowupItems(snapshot);
  const report = buildTodoReport(items);
  const trend = buildTrend(report, options.previousEntry || null);
  const summaryLines = [
    `Passive Income Lab 跟进待办日报｜${new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
    `待办总数：${report.count}｜现在 ${report.bucketCounts.now}｜24h ${report.bucketCounts.next24h}｜72h ${report.bucketCounts.next72h}`,
    `节奏状态：已超期 ${report.cadenceCounts.overdue || 0}｜即将超期 ${report.cadenceCounts.soon || 0}｜节奏正常 ${report.cadenceCounts.fresh || 0}`,
    trend.summary,
    report.topLead ? `最优先线索：${report.topLead.leadName}｜${report.topLead.productTitle}｜${report.topLead.stage}｜${report.topLead.cadenceLabel}` : '最优先线索：暂无',
    report.topSource ? `当前待跟进最多来源：${report.topSource.source}（${report.topSource.count} 条）` : '当前待跟进最多来源：暂无',
    `建议动作：${report.recommendation}${trend.recommendationHint ? ` ${trend.recommendationHint}` : ''}`
  ];

  return {
    source: 'passive-income-lab',
    kind: 'lead-followup-todos',
    generatedAt: report.generatedAt,
    payload: {
      count: items.length,
      items,
      report,
      trend,
      summary: summaryLines.join('\n'),
      markdown: [
        '# Passive Income Lab 跟进待办日报',
        '',
        `- 日期：${new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
        `- 待办总数：${report.count}`,
        `- 时间桶：现在 ${report.bucketCounts.now}｜24h ${report.bucketCounts.next24h}｜72h ${report.bucketCounts.next72h}｜本周 ${report.bucketCounts.thisWeek}`,
        `- 节奏状态：已超期 ${report.cadenceCounts.overdue || 0}｜即将超期 ${report.cadenceCounts.soon || 0}｜节奏正常 ${report.cadenceCounts.fresh || 0}`,
        `- ${trend.summary}`,
        report.topLead ? `- 最优先线索：${report.topLead.leadName}｜${report.topLead.productTitle}｜${report.topLead.stage}｜${report.topLead.cadenceLabel}` : '- 最优先线索：暂无',
        report.topSource ? `- 当前待跟进最多来源：${report.topSource.source}（${report.topSource.count} 条）` : '- 当前待跟进最多来源：暂无',
        '',
        '## 今日最优先待办',
        ...(items.length ? items.slice(0, 5).map((item, index) => `- ${index + 1}. [${item.timeBucket}] ${item.leadName}｜${item.productTitle}｜${item.stage}｜${item.cadenceLabel}｜动作：${item.nextAction}`) : ['- 当前暂无待办']),
        '',
        '## 建议动作',
        `- ${report.recommendation}`,
        `- ${trend.recommendationHint || '继续保持固定节奏复盘。'}`
      ].join('\n')
    }
  };
}

async function forwardTodosPayload(payload) {
  const url = process.env.LEAD_FOLLOWUP_TODOS_WEBHOOK_URL || process.env.LEAD_CAPTURE_WEBHOOK_URL;
  if (!url) return null;
  const headers = { 'Content-Type': 'application/json' };
  const auth = process.env.LEAD_FOLLOWUP_TODOS_WEBHOOK_AUTH || process.env.LEAD_CAPTURE_WEBHOOK_AUTH;
  if (auth) headers.Authorization = auth;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  return { forwarded: true, ok: response.ok, status: response.status, url };
}

function buildHistoryEntry(payload, webhook = null, trigger = 'manual-post') {
  const report = payload?.payload?.report || {};
  return {
    generatedAt: payload.generatedAt,
    kind: payload.kind,
    trigger,
    count: report.count || 0,
    overdueCount: report.cadenceCounts?.overdue || 0,
    soonCount: report.cadenceCounts?.soon || 0,
    nowCount: report.bucketCounts?.now || 0,
    next24hCount: report.bucketCounts?.next24h || 0,
    topLead: report.topLead ? {
      leadId: report.topLead.leadId,
      leadName: report.topLead.leadName,
      productTitle: report.topLead.productTitle,
      stage: report.topLead.stage,
      cadenceLabel: report.topLead.cadenceLabel
    } : null,
    topSource: report.topSource || null,
    summary: payload?.payload?.summary || '',
    webhook: webhook || { forwarded: false, skipped: true }
  };
}

async function saveTodosHistory(payload, webhook = null, trigger = 'manual-post') {
  const entry = buildHistoryEntry(payload, webhook, trigger);
  const current = await readHistoryStore();
  const history = [entry, ...(Array.isArray(current.history) ? current.history : [])]
    .filter((item, index, list) => list.findIndex((candidate) => candidate.generatedAt === item.generatedAt) === index)
    .slice(0, MAX_HISTORY);
  const next = { latest: entry, history };
  await writeHistoryStore(next);
  return next;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  try {
    const snapshot = await readSnapshot();
    const historyStore = await readHistoryStore();
    const payload = buildLeadFollowupTodosPayload(snapshot, { previousEntry: historyStore.latest || null });

    if (req.method === 'GET') {
      return res.status(200).json({
        ok: true,
        ...payload,
        latest: historyStore.latest || null,
        history: historyStore.history || [],
        historyStorage: buildHistoryStorageMeta()
      });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const dryRun = body.dryRun === true || body.forward === false;
    const webhook = dryRun ? { forwarded: false, dryRun: true } : await forwardTodosPayload(payload);
    const nextHistoryStore = await saveTodosHistory(payload, webhook, dryRun ? 'manual-dry-run' : 'manual-post');
    return res.status(200).json({
      ok: true,
      ...payload,
      webhook,
      latest: nextHistoryStore.latest || null,
      history: nextHistoryStore.history || [],
      historyStorage: buildHistoryStorageMeta()
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || String(error) });
  }
};

module.exports.buildLeadFollowupTodosPayload = buildLeadFollowupTodosPayload;
module.exports.forwardTodosPayload = forwardTodosPayload;
module.exports.readHistoryStore = readHistoryStore;
module.exports.saveTodosHistory = saveTodosHistory;
module.exports.buildHistoryEntry = buildHistoryEntry;
module.exports.buildHistoryStorageMeta = buildHistoryStorageMeta;
