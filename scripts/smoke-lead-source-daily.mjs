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

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pil-lead-source-daily-'));
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
const leadCaptureImported = await import(`file://${leadCaptureModulePath}?seed=${Date.now()}`);
const leadSourceDailyImported = await import(`file://${leadSourceDailyModulePath}?smoke=${Date.now()}`);
const leadCaptureHandler = leadCaptureImported.default || leadCaptureImported;
const leadSourceDailyHandler = leadSourceDailyImported.default || leadSourceDailyImported;

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}

const seedLeads = [
  { id: 'lead-1', name: 'A', productSlug: 'micro-saas', source: 'public-inquiry:feishu-dm', stage: '待跟进', updatedAt: '2026-04-17T00:00:00.000Z' },
  { id: 'lead-2', name: 'B', productSlug: 'micro-saas', source: 'public-inquiry:feishu-dm', stage: '已报价', updatedAt: '2026-04-17T01:00:00.000Z' },
  { id: 'lead-3', name: 'C', productSlug: 'orion-nexus', source: 'public-inquiry:wechat-group', stage: '已成交', paymentStatus: 'paid', paymentAmount: 999, paymentCurrency: 'CNY', updatedAt: '2026-04-17T02:00:00.000Z' }
];

for (const lead of seedLeads) {
  const res = createRes();
  await leadCaptureHandler({ method: 'POST', body: { lead } }, res);
  if (res.statusCode !== 200) throw new Error(`seed lead failed: ${JSON.stringify(res.body)}`);
}

let res = createRes();
await leadSourceDailyHandler({ method: 'GET' }, res);
if (
  res.statusCode !== 200 ||
  res.body.kind !== 'lead-source-daily-digest' ||
  res.body.payload?.report?.totalLeads !== 3 ||
  res.body.payload?.report?.topSource?.source !== 'public-inquiry:feishu-dm' ||
  !String(res.body.payload?.summary || '').includes('当前最有效来源：public-inquiry:feishu-dm') ||
  !String(res.body.payload?.markdown || '').includes('## Top 来源') ||
  !Array.isArray(res.body.history) ||
  res.body.history.length !== 0 ||
  res.body.latest !== null ||
  res.body.historyStorage?.mode !== 'local-file' ||
  res.body.historyStorage?.durable !== false
) {
  throw new Error(`GET 来源日报异常: ${JSON.stringify(res.body)}`);
}

let forwardedPayload = null;
process.env.LEAD_SOURCE_DAILY_WEBHOOK_URL = 'https://example.com/webhook';
process.env.LEAD_SOURCE_DAILY_WEBHOOK_AUTH = 'Bearer demo';
globalThis.fetch = async (url, options = {}) => {
  if (String(url) !== 'https://example.com/webhook') {
    throw new Error(`unexpected url: ${url}`);
  }
  forwardedPayload = JSON.parse(options.body || '{}');
  return { ok: true, status: 200, json: async () => ({ ok: true }) };
};

res = createRes();
await leadSourceDailyHandler({ method: 'POST', body: {} }, res);
if (
  res.statusCode !== 200 ||
  res.body.webhook?.ok !== true ||
  forwardedPayload?.kind !== 'lead-source-daily-digest' ||
  res.body.latest?.trigger !== 'manual-post' ||
  !Array.isArray(res.body.history) ||
  res.body.history.length !== 1 ||
  res.body.history[0]?.topSource?.source !== 'public-inquiry:feishu-dm'
) {
  throw new Error(`POST 转发异常: ${JSON.stringify(res.body)}`);
}

const lead4 = { id: 'lead-4', name: 'D', productSlug: 'orion-nexus', source: 'public-inquiry:xhs', stage: '待跟进', updatedAt: '2026-04-17T03:00:00.000Z' };
let seedRes = createRes();
await leadCaptureHandler({ method: 'POST', body: { lead: lead4 } }, seedRes);
if (seedRes.statusCode !== 200) throw new Error(`seed lead 4 failed: ${JSON.stringify(seedRes.body)}`);

res = createRes();
await leadSourceDailyHandler({ method: 'GET' }, res);
if (
  res.statusCode !== 200 ||
  res.body.payload?.report?.totalLeads !== 4 ||
  res.body.payload?.trend?.hasPrevious !== true ||
  res.body.payload?.trend?.totalLeadsDelta !== 1 ||
  res.body.payload?.trend?.actionableDelta !== 1 ||
  !String(res.body.payload?.summary || '').includes('较上次：总线索 +1｜可推进 +1')
) {
  throw new Error(`GET 趋势对比异常: ${JSON.stringify(res.body)}`);
}

console.log('lead-source-daily 冒烟通过:', {
  totalLeads: res.body.payload.report.totalLeads,
  topSource: res.body.payload.report.topSource?.source,
  trend: res.body.payload.trend?.summary,
  forwardedUrl: forwardedPayload ? 'https://example.com/webhook' : null,
  historyCount: res.body.history.length
});

Object.entries(originalEnv).forEach(([key, value]) => {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
});
