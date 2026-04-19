import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const originalEnv = {
  LEAD_CAPTURE_LOCAL_PATH: process.env.LEAD_CAPTURE_LOCAL_PATH,
  LEAD_SOURCE_DAILY_LOCAL_PATH: process.env.LEAD_SOURCE_DAILY_LOCAL_PATH,
  LEAD_SOURCE_DAILY_WEBHOOK_URL: process.env.LEAD_SOURCE_DAILY_WEBHOOK_URL,
  LEAD_SOURCE_DAILY_WEBHOOK_AUTH: process.env.LEAD_SOURCE_DAILY_WEBHOOK_AUTH,
  LEAD_CAPTURE_WEBHOOK_URL: process.env.LEAD_CAPTURE_WEBHOOK_URL,
  LEAD_CAPTURE_WEBHOOK_AUTH: process.env.LEAD_CAPTURE_WEBHOOK_AUTH
};

const repoRoot = path.resolve(import.meta.dirname, '..');
const outputsDir = path.join(repoRoot, 'outputs');
fs.mkdirSync(outputsDir, { recursive: true });

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pil-lead-source-proof-'));
const storePath = path.join(tempDir, 'leads.json');
const historyPath = path.join(tempDir, 'daily-history.json');
process.env.LEAD_CAPTURE_LOCAL_PATH = storePath;
process.env.LEAD_SOURCE_DAILY_LOCAL_PATH = historyPath;
delete process.env.LEAD_SOURCE_DAILY_WEBHOOK_URL;
delete process.env.LEAD_SOURCE_DAILY_WEBHOOK_AUTH;
delete process.env.LEAD_CAPTURE_WEBHOOK_URL;
delete process.env.LEAD_CAPTURE_WEBHOOK_AUTH;

const leadCaptureModulePath = path.resolve(import.meta.dirname, '..', 'api', 'lead-capture.js');
const leadSourceDailyModulePath = path.resolve(import.meta.dirname, '..', 'api', 'lead-source-daily.js');
const cronModulePath = path.resolve(import.meta.dirname, '..', 'api', 'cron', 'lead-source-daily.js');
const leadCaptureImported = await import(`file://${leadCaptureModulePath}?proof-seed=${Date.now()}`);
const leadSourceDailyImported = await import(`file://${leadSourceDailyModulePath}?proof-api=${Date.now()}`);
const cronImported = await import(`file://${cronModulePath}?proof-cron=${Date.now()}`);
const leadCaptureHandler = leadCaptureImported.default || leadCaptureImported;
const leadSourceDailyHandler = leadSourceDailyImported.default || leadSourceDailyImported;
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
    id: 'proof-lead-1',
    name: 'Feishu DM 线索 A',
    productSlug: 'micro-saas',
    source: 'public-inquiry:feishu-dm',
    stage: '待跟进',
    updatedAt: '2026-04-18T00:00:00.000Z'
  },
  {
    id: 'proof-lead-2',
    name: 'Feishu DM 线索 B',
    productSlug: 'micro-saas',
    source: 'public-inquiry:feishu-dm',
    stage: '已报价',
    updatedAt: '2026-04-18T01:00:00.000Z'
  },
  {
    id: 'proof-lead-3',
    name: '微信群线索 C',
    productSlug: 'orion-nexus',
    source: 'public-inquiry:wechat-group',
    stage: '已成交',
    paymentStatus: 'paid',
    paymentAmount: 999,
    paymentCurrency: 'CNY',
    updatedAt: '2026-04-18T02:00:00.000Z'
  }
];

for (const lead of seedLeads) {
  await call(leadCaptureHandler, { method: 'POST', body: { lead } });
}

const getBefore = await call(leadSourceDailyHandler, { method: 'GET' });
const dryRun = await call(leadSourceDailyHandler, { method: 'POST', body: { dryRun: true } });

let forwardedPayload = null;
process.env.LEAD_SOURCE_DAILY_WEBHOOK_URL = 'https://example.com/proof-webhook';
process.env.LEAD_SOURCE_DAILY_WEBHOOK_AUTH = 'Bearer proof';
globalThis.fetch = async (url, options = {}) => {
  if (String(url) !== 'https://example.com/proof-webhook') {
    throw new Error(`unexpected webhook url: ${url}`);
  }
  forwardedPayload = JSON.parse(options.body || '{}');
  return { ok: true, status: 202, json: async () => ({ ok: true }) };
};

const manualPost = await call(leadSourceDailyHandler, { method: 'POST', body: {} });
const cronPost = await call(cronHandler, { method: 'POST', body: {} });

const proofJson = {
  generatedAt: new Date().toISOString(),
  seedLeads: seedLeads.map(({ id, productSlug, source, stage }) => ({ id, productSlug, source, stage })),
  checks: {
    getBefore: {
      totalLeads: getBefore.payload?.report?.totalLeads || 0,
      topSource: getBefore.payload?.report?.topSource?.source || null,
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
      topSource: manualPost.latest?.topSource?.source || null,
      webhook: manualPost.webhook || null
    },
    cronPost: {
      trigger: cronPost.latest?.trigger || null,
      historyCount: Array.isArray(cronPost.history) ? cronPost.history.length : 0,
      topSource: cronPost.latest?.topSource?.source || null,
      webhook: cronPost.webhook || null
    }
  },
  forwardedPayloadPreview: forwardedPayload
    ? {
        kind: forwardedPayload.kind,
        generatedAt: forwardedPayload.generatedAt,
        recommendation: forwardedPayload.payload?.recommendation || '',
        summary: forwardedPayload.payload?.summary || ''
      }
    : null,
  artifactPaths: {
    markdown: 'outputs/lead-source-daily-local-proof.md',
    json: 'outputs/lead-source-daily-local-proof.json'
  }
};

const markdown = [
  '# Passive Income Lab 来源日报本地验收证明',
  '',
  `- 生成时间：${proofJson.generatedAt}`,
  `- 种子线索：${seedLeads.length} 条`,
  `- 本地线索快照路径：${storePath}`,
  `- 本地日报历史路径：${historyPath}`,
  '',
  '## 验收结论',
  `- GET /api/lead-source-daily：总线索 ${proofJson.checks.getBefore.totalLeads}，Top 来源 ${proofJson.checks.getBefore.topSource || '暂无'}，首次读取 historyCount=${proofJson.checks.getBefore.historyCount}`,
  `- POST /api/lead-source-daily (dryRun)：trigger=${proofJson.checks.dryRun.trigger}，historyCount=${proofJson.checks.dryRun.historyCount}，dryRun=${proofJson.checks.dryRun.dryRun}`,
  `- POST /api/lead-source-daily：trigger=${proofJson.checks.manualPost.trigger}，historyCount=${proofJson.checks.manualPost.historyCount}，webhookStatus=${proofJson.checks.manualPost.webhook?.status || 'n/a'}`,
  `- POST /api/cron/lead-source-daily：trigger=${proofJson.checks.cronPost.trigger}，historyCount=${proofJson.checks.cronPost.historyCount}，webhookStatus=${proofJson.checks.cronPost.webhook?.status || 'n/a'}`,
  '',
  '## 关键证据',
  `- 历史存储模式：${proofJson.checks.getBefore.historyStorage?.mode || 'unknown'}（durable=${proofJson.checks.getBefore.historyStorage?.durable ?? 'unknown'}）`,
  `- latest.trigger 已依次覆盖：${proofJson.checks.dryRun.trigger} -> ${proofJson.checks.manualPost.trigger} -> ${proofJson.checks.cronPost.trigger}`,
  `- 手动推送与 cron 推送都保留了 Top 来源：${proofJson.checks.manualPost.topSource || '暂无'} / ${proofJson.checks.cronPost.topSource || '暂无'}`,
  forwardedPayload
    ? `- webhook 预览：${forwardedPayload.payload?.summary?.split('\n')[0] || forwardedPayload.kind}`
    : '- webhook 预览：未生成',
  '',
  '## 下一步建议',
  '- 把真实 LEAD_SOURCE_DAILY_WEBHOOK_URL 配到线上环境后，再跑一次 /api/cron/lead-source-daily，并把接收端日志一起归档。',
  '- 若要手机端快速验收，可直接 curl /api/lead-source-daily 查看 latest/history 是否增长，而不必翻接收端。',
  ''
].join('\n');

fs.writeFileSync(path.join(outputsDir, 'lead-source-daily-local-proof.json'), JSON.stringify(proofJson, null, 2));
fs.writeFileSync(path.join(outputsDir, 'lead-source-daily-local-proof.md'), markdown);

console.log('lead-source-daily proof 已生成:', {
  markdown: path.join(outputsDir, 'lead-source-daily-local-proof.md'),
  json: path.join(outputsDir, 'lead-source-daily-local-proof.json'),
  topSource: proofJson.checks.manualPost.topSource,
  manualHistoryCount: proofJson.checks.manualPost.historyCount,
  cronHistoryCount: proofJson.checks.cronPost.historyCount
});

Object.entries(originalEnv).forEach(([key, value]) => {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
});
