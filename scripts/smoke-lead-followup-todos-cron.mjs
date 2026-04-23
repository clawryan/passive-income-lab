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

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pil-lead-followup-cron-'));
const storePath = path.join(tempDir, 'leads.json');
const historyPath = path.join(tempDir, 'followup-history.json');
process.env.LEAD_CAPTURE_LOCAL_PATH = storePath;
process.env.LEAD_FOLLOWUP_TODOS_LOCAL_PATH = historyPath;
delete process.env.LEAD_FOLLOWUP_TODOS_WEBHOOK_URL;
delete process.env.LEAD_FOLLOWUP_TODOS_WEBHOOK_AUTH;
delete process.env.LEAD_CAPTURE_WEBHOOK_URL;
delete process.env.LEAD_CAPTURE_WEBHOOK_AUTH;

const leadCaptureModulePath = path.resolve(import.meta.dirname, '..', 'api', 'lead-capture.js');
const cronModulePath = path.resolve(import.meta.dirname, '..', 'api', 'cron', 'lead-followup-todos.js');
const leadCaptureImported = await import(`file://${leadCaptureModulePath}?seed=${Date.now()}`);
const cronImported = await import(`file://${cronModulePath}?cron=${Date.now()}`);
const leadCaptureHandler = leadCaptureImported.default || leadCaptureImported;
const cronHandler = cronImported.default || cronImported;

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}

const seedLeads = [
  {
    id: 'followup-cron-1',
    name: '超期待跟进客户',
    productSlug: 'micro-saas',
    source: 'public-inquiry:feishu-dm',
    channel: '飞书私聊',
    priority: '高',
    stage: '待跟进',
    nextStep: '立刻发单产品页和 FAQ',
    updatedAt: '2026-04-17T00:00:00.000Z'
  },
  {
    id: 'followup-cron-2',
    name: '报价待催单客户',
    productSlug: 'orion-nexus',
    source: 'public-inquiry:xhs',
    channel: '小红书',
    priority: '中',
    stage: '已报价',
    nextStep: '今晚确认是否下单',
    updatedAt: '2026-04-17T01:00:00.000Z'
  }
];

for (const lead of seedLeads) {
  const res = createRes();
  await leadCaptureHandler({ method: 'POST', body: { lead } }, res);
  if (res.statusCode !== 200) throw new Error(`seed lead failed: ${JSON.stringify(res.body)}`);
}

let res = createRes();
await cronHandler({ method: 'GET', headers: { 'x-vercel-cron': '1' } }, res);
if (
  res.statusCode !== 200 ||
  res.body.ok !== true ||
  res.body.triggeredBy !== 'cron-get' ||
  res.body.webhook?.skipped !== true ||
  res.body.kind !== 'lead-followup-todos' ||
  res.body.payload?.count !== 2 ||
  res.body.payload?.report?.topLead?.leadName !== '超期待跟进客户' ||
  res.body.latest?.trigger !== 'cron-get' ||
  !Array.isArray(res.body.history) ||
  res.body.history.length !== 1
) {
  throw new Error(`GET cron 跟进待办异常: ${JSON.stringify(res.body)}`);
}

let forwardedPayload = null;
process.env.LEAD_FOLLOWUP_TODOS_WEBHOOK_URL = 'https://example.com/followup-cron-webhook';
process.env.LEAD_FOLLOWUP_TODOS_WEBHOOK_AUTH = 'Bearer followup-demo';
globalThis.fetch = async (url, options = {}) => {
  if (String(url) !== 'https://example.com/followup-cron-webhook') {
    throw new Error(`unexpected url: ${url}`);
  }
  forwardedPayload = JSON.parse(options.body || '{}');
  return { ok: true, status: 202, json: async () => ({ ok: true }) };
};

res = createRes();
await cronHandler({ method: 'POST', body: {} }, res);
if (
  res.statusCode !== 200 ||
  res.body.triggeredBy !== 'cron-post' ||
  res.body.webhook?.ok !== true ||
  res.body.webhook?.status !== 202 ||
  forwardedPayload?.kind !== 'lead-followup-todos' ||
  res.body.latest?.trigger !== 'cron-post' ||
  !Array.isArray(res.body.history) ||
  res.body.history.length < 1
) {
  throw new Error(`POST cron 跟进待办转发异常: ${JSON.stringify(res.body)}`);
}

const extraLead = {
  id: 'followup-cron-3',
  name: '资料待回收客户',
  productSlug: 'micro-saas',
  source: 'public-inquiry:wechat-group',
  channel: '微信群',
  priority: '高',
  stage: '已发送资料',
  nextStep: '明早问是否需要报价',
  updatedAt: '2026-04-17T02:00:00.000Z'
};

let seedRes = createRes();
await leadCaptureHandler({ method: 'POST', body: { lead: extraLead } }, seedRes);
if (seedRes.statusCode !== 200) throw new Error(`seed extra lead failed: ${JSON.stringify(seedRes.body)}`);

res = createRes();
await cronHandler({ method: 'GET', headers: { 'x-vercel-cron': '1' } }, res);
if (
  res.statusCode !== 200 ||
  res.body.triggeredBy !== 'cron-get' ||
  res.body.payload?.count !== 3 ||
  res.body.payload?.trend?.hasPrevious !== true ||
  res.body.payload?.trend?.countDelta !== 1 ||
  res.body.payload?.trend?.overdueDelta !== 1 ||
  !String(res.body.payload?.summary || '').includes('较上次：待办总数 +1｜已超期 +1')
) {
  throw new Error(`GET cron 跟进待办趋势异常: ${JSON.stringify(res.body)}`);
}

console.log('lead-followup-todos cron 冒烟通过:', {
  count: res.body.payload.count,
  topLead: res.body.payload.report.topLead?.leadName,
  trend: res.body.payload.trend?.summary,
  forwardedUrl: forwardedPayload ? 'https://example.com/followup-cron-webhook' : null,
  forwardedStatus: res.body.webhook?.status,
  historyCount: res.body.history.length
});

Object.entries(originalEnv).forEach(([key, value]) => {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
});
