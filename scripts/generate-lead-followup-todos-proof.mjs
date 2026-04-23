import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const originalEnv = {
  LEAD_CAPTURE_LOCAL_PATH: process.env.LEAD_CAPTURE_LOCAL_PATH,
  LEAD_FOLLOWUP_TODOS_LOCAL_PATH: process.env.LEAD_FOLLOWUP_TODOS_LOCAL_PATH,
  LEAD_FOLLOWUP_TODOS_WEBHOOK_URL: process.env.LEAD_FOLLOWUP_TODOS_WEBHOOK_URL,
  LEAD_FOLLOWUP_TODOS_WEBHOOK_AUTH: process.env.LEAD_FOLLOWUP_TODOS_WEBHOOK_AUTH,
  LEAD_CAPTURE_WEBHOOK_URL: process.env.LEAD_CAPTURE_WEBHOOK_URL,
  LEAD_CAPTURE_WEBHOOK_AUTH: process.env.LEAD_CAPTURE_WEBHOOK_AUTH
};

const repoRoot = path.resolve(import.meta.dirname, '..');
const outputsDir = path.join(repoRoot, 'outputs');
fs.mkdirSync(outputsDir, { recursive: true });

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pil-lead-followup-proof-'));
const storePath = path.join(tempDir, 'leads.json');
const historyPath = path.join(tempDir, 'followup-history.json');
process.env.LEAD_CAPTURE_LOCAL_PATH = storePath;
process.env.LEAD_FOLLOWUP_TODOS_LOCAL_PATH = historyPath;
delete process.env.LEAD_FOLLOWUP_TODOS_WEBHOOK_URL;
delete process.env.LEAD_FOLLOWUP_TODOS_WEBHOOK_AUTH;
delete process.env.LEAD_CAPTURE_WEBHOOK_URL;
delete process.env.LEAD_CAPTURE_WEBHOOK_AUTH;

const leadCaptureModulePath = path.resolve(import.meta.dirname, '..', 'api', 'lead-capture.js');
const followupModulePath = path.resolve(import.meta.dirname, '..', 'api', 'lead-followup-todos.js');
const cronModulePath = path.resolve(import.meta.dirname, '..', 'api', 'cron', 'lead-followup-todos.js');
const leadCaptureImported = await import(`file://${leadCaptureModulePath}?proof-seed=${Date.now()}`);
const followupImported = await import(`file://${followupModulePath}?proof-api=${Date.now()}`);
const cronImported = await import(`file://${cronModulePath}?proof-cron=${Date.now()}`);
const leadCaptureHandler = leadCaptureImported.default || leadCaptureImported;
const followupHandler = followupImported.default || followupImported;
const cronHandler = cronImported.default || cronImported;

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}

async function call(handler, req) {
  const res = createRes();
  await handler(req, res);
  if (res.statusCode !== 200) {
    throw new Error(`request failed: ${req.method} ${JSON.stringify(req)} => ${res.statusCode} ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

const seedLeads = [
  {
    id: 'followup-proof-1',
    name: '超期待跟进客户',
    productSlug: 'micro-saas',
    source: 'public-inquiry:feishu-dm',
    channel: '飞书私聊',
    priority: '高',
    stage: '待跟进',
    nextStep: '发单产品链接并确认预算',
    updatedAt: '2026-04-18T00:00:00.000Z'
  },
  {
    id: 'followup-proof-2',
    name: '报价待确认客户',
    productSlug: 'orion-nexus',
    source: 'public-inquiry:wechat-group',
    channel: '微信群',
    priority: '中',
    stage: '已报价',
    nextStep: '今晚确认是否下单',
    updatedAt: '2026-04-18T01:00:00.000Z'
  },
  {
    id: 'followup-proof-3',
    name: '资料已发客户',
    productSlug: 'micro-saas',
    source: 'public-inquiry:xhs',
    channel: '小红书',
    priority: '高',
    stage: '已发送资料',
    nextStep: '明早追问是否需要报价',
    updatedAt: '2026-04-18T02:00:00.000Z'
  }
];

for (const lead of seedLeads) {
  await call(leadCaptureHandler, { method: 'POST', body: { lead } });
}

const getBefore = await call(followupHandler, { method: 'GET' });
const dryRun = await call(followupHandler, { method: 'POST', body: { dryRun: true } });

let forwardedPayload = null;
process.env.LEAD_FOLLOWUP_TODOS_WEBHOOK_URL = 'https://example.com/followup-proof-webhook';
process.env.LEAD_FOLLOWUP_TODOS_WEBHOOK_AUTH = 'Bearer proof';
globalThis.fetch = async (url, options = {}) => {
  if (String(url) !== 'https://example.com/followup-proof-webhook') {
    throw new Error(`unexpected webhook url: ${url}`);
  }
  forwardedPayload = JSON.parse(options.body || '{}');
  return { ok: true, status: 202, json: async () => ({ ok: true }) };
};

const manualPost = await call(followupHandler, { method: 'POST', body: {} });
await call(leadCaptureHandler, {
  method: 'POST',
  body: {
    lead: {
      id: 'followup-proof-4',
      name: '新增待跟进客户',
      productSlug: 'micro-saas',
      source: 'public-inquiry:feishu-group',
      channel: '飞书群',
      priority: '高',
      stage: '待跟进',
      nextStep: '今天补首次触达',
      updatedAt: '2026-04-18T03:00:00.000Z'
    }
  }
});
const getAfterTrend = await call(followupHandler, { method: 'GET' });
const cronPost = await call(cronHandler, { method: 'POST', body: {} });

const proofJson = {
  generatedAt: new Date().toISOString(),
  seedLeads: seedLeads.map(({ id, name, productSlug, source, stage, priority }) => ({ id, name, productSlug, source, stage, priority })),
  checks: {
    getBefore: {
      count: getBefore.payload?.count || 0,
      topLead: getBefore.payload?.report?.topLead?.leadName || null,
      overdueCount: getBefore.payload?.report?.cadenceCounts?.overdue || 0,
      historyCount: Array.isArray(getBefore.history) ? getBefore.history.length : 0,
      historyStorage: getBefore.historyStorage || null
    },
    dryRun: {
      trigger: dryRun.latest?.trigger || null,
      historyCount: Array.isArray(dryRun.history) ? dryRun.history.length : 0,
      forwarded: dryRun.webhook?.forwarded || false,
      dryRun: dryRun.webhook?.dryRun === true
    },
    manualPost: {
      trigger: manualPost.latest?.trigger || null,
      historyCount: Array.isArray(manualPost.history) ? manualPost.history.length : 0,
      topLead: manualPost.latest?.topLead?.leadName || null,
      webhook: manualPost.webhook || null
    },
    getAfterTrend: {
      count: getAfterTrend.payload?.count || 0,
      countDelta: getAfterTrend.payload?.trend?.countDelta ?? null,
      summary: getAfterTrend.payload?.trend?.summary || '',
      topLead: getAfterTrend.payload?.report?.topLead?.leadName || null
    },
    cronPost: {
      trigger: cronPost.latest?.trigger || null,
      historyCount: Array.isArray(cronPost.history) ? cronPost.history.length : 0,
      topLead: cronPost.latest?.topLead?.leadName || null,
      webhook: cronPost.webhook || null
    }
  },
  forwardedPayloadPreview: forwardedPayload
    ? {
        kind: forwardedPayload.kind,
        generatedAt: forwardedPayload.generatedAt,
        summary: forwardedPayload.payload?.summary || '',
        recommendation: forwardedPayload.payload?.report?.recommendation || ''
      }
    : null,
  artifactPaths: {
    markdown: 'outputs/lead-followup-todos-local-proof.md',
    json: 'outputs/lead-followup-todos-local-proof.json'
  }
};

const markdown = [
  '# Passive Income Lab 跟进待办本地验收证明',
  '',
  `- 生成时间：${proofJson.generatedAt}`,
  `- 种子线索：${seedLeads.length} 条`,
  `- 本地线索快照路径：${storePath}`,
  `- 本地待办历史路径：${historyPath}`,
  '',
  '## 验收结论',
  `- GET /api/lead-followup-todos：待办 ${proofJson.checks.getBefore.count} 条，最优先线索 ${proofJson.checks.getBefore.topLead || '暂无'}，已超期 ${proofJson.checks.getBefore.overdueCount} 条，首次读取 historyCount=${proofJson.checks.getBefore.historyCount}`,
  `- POST /api/lead-followup-todos (dryRun)：trigger=${proofJson.checks.dryRun.trigger}，historyCount=${proofJson.checks.dryRun.historyCount}，dryRun=${proofJson.checks.dryRun.dryRun}`,
  `- POST /api/lead-followup-todos：trigger=${proofJson.checks.manualPost.trigger}，historyCount=${proofJson.checks.manualPost.historyCount}，topLead=${proofJson.checks.manualPost.topLead || '暂无'}，webhookStatus=${proofJson.checks.manualPost.webhook?.status || 'n/a'}`,
  `- GET /api/lead-followup-todos（新增 1 条线索后）：countDelta=${proofJson.checks.getAfterTrend.countDelta}，trend=${proofJson.checks.getAfterTrend.summary || '暂无'}`,
  `- POST /api/cron/lead-followup-todos：trigger=${proofJson.checks.cronPost.trigger}，historyCount=${proofJson.checks.cronPost.historyCount}，topLead=${proofJson.checks.cronPost.topLead || '暂无'}，webhookStatus=${proofJson.checks.cronPost.webhook?.status || 'n/a'}`,
  '',
  '## 关键证据',
  `- 历史存储模式：${proofJson.checks.getBefore.historyStorage?.mode || 'unknown'}（durable=${proofJson.checks.getBefore.historyStorage?.durable ?? 'unknown'}）`,
  `- latest.trigger 已依次覆盖：${proofJson.checks.dryRun.trigger} -> ${proofJson.checks.manualPost.trigger} -> ${proofJson.checks.cronPost.trigger}`,
  `- 趋势摘要已出现增量：${proofJson.checks.getAfterTrend.summary || '暂无'}`,
  forwardedPayload
    ? `- webhook 预览：${forwardedPayload.payload?.summary?.split('\n')[0] || forwardedPayload.kind}`
    : '- webhook 预览：未生成',
  '',
  '## 下一步建议',
  '- 把真实 LEAD_FOLLOWUP_TODOS_WEBHOOK_URL 配到线上环境后，再跑一次 /api/cron/lead-followup-todos，并把接收端日志一起归档。',
  '- 若要手机端快速验收，可直接 curl /api/lead-followup-todos 查看 latest/history 与 trend.countDelta 是否增长。',
  ''
].join('\n');

fs.writeFileSync(path.join(outputsDir, 'lead-followup-todos-local-proof.json'), JSON.stringify(proofJson, null, 2));
fs.writeFileSync(path.join(outputsDir, 'lead-followup-todos-local-proof.md'), markdown);

console.log('lead-followup-todos proof 已生成:', {
  markdown: path.join(outputsDir, 'lead-followup-todos-local-proof.md'),
  json: path.join(outputsDir, 'lead-followup-todos-local-proof.json'),
  topLead: proofJson.checks.manualPost.topLead,
  countDelta: proofJson.checks.getAfterTrend.countDelta,
  cronHistoryCount: proofJson.checks.cronPost.historyCount
});

Object.entries(originalEnv).forEach(([key, value]) => {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
});
