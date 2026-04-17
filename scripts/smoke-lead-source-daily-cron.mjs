import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const originalEnv = {
  LEAD_CAPTURE_LOCAL_PATH: process.env.LEAD_CAPTURE_LOCAL_PATH,
  LEAD_SOURCE_DAILY_WEBHOOK_URL: process.env.LEAD_SOURCE_DAILY_WEBHOOK_URL,
  LEAD_SOURCE_DAILY_WEBHOOK_AUTH: process.env.LEAD_SOURCE_DAILY_WEBHOOK_AUTH,
  LEAD_CAPTURE_WEBHOOK_URL: process.env.LEAD_CAPTURE_WEBHOOK_URL,
  LEAD_CAPTURE_WEBHOOK_AUTH: process.env.LEAD_CAPTURE_WEBHOOK_AUTH
};

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pil-lead-source-daily-cron-'));
const storePath = path.join(tempDir, 'leads.json');
process.env.LEAD_CAPTURE_LOCAL_PATH = storePath;
delete process.env.LEAD_SOURCE_DAILY_WEBHOOK_URL;
delete process.env.LEAD_SOURCE_DAILY_WEBHOOK_AUTH;
delete process.env.LEAD_CAPTURE_WEBHOOK_URL;
delete process.env.LEAD_CAPTURE_WEBHOOK_AUTH;

const leadCaptureModulePath = path.resolve(import.meta.dirname, '..', 'api', 'lead-capture.js');
const leadSourceDailyCronModulePath = path.resolve(import.meta.dirname, '..', 'api', 'cron', 'lead-source-daily.js');
const leadCaptureImported = await import(`file://${leadCaptureModulePath}?seed=${Date.now()}`);
const cronImported = await import(`file://${leadSourceDailyCronModulePath}?cron=${Date.now()}`);
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
  { id: 'cron-lead-1', name: 'A', productSlug: 'micro-saas', source: 'public-inquiry:feishu-dm', stage: '待跟进', updatedAt: '2026-04-17T00:00:00.000Z' },
  { id: 'cron-lead-2', name: 'B', productSlug: 'orion-nexus', source: 'public-inquiry:xhs', stage: '已报价', updatedAt: '2026-04-17T01:00:00.000Z' }
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
  res.body.kind !== 'lead-source-daily-digest' ||
  res.body.payload?.report?.totalLeads !== 2
) {
  throw new Error(`GET cron 来源日报异常: ${JSON.stringify(res.body)}`);
}

let forwardedPayload = null;
process.env.LEAD_SOURCE_DAILY_WEBHOOK_URL = 'https://example.com/cron-webhook';
process.env.LEAD_SOURCE_DAILY_WEBHOOK_AUTH = 'Bearer cron-demo';
globalThis.fetch = async (url, options = {}) => {
  if (String(url) !== 'https://example.com/cron-webhook') {
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
  forwardedPayload?.kind !== 'lead-source-daily-digest'
) {
  throw new Error(`POST cron 转发异常: ${JSON.stringify(res.body)}`);
}

console.log('lead-source-daily cron 冒烟通过:', {
  totalLeads: res.body.payload.report.totalLeads,
  topSource: res.body.payload.report.topSource?.source,
  forwardedUrl: res.body.webhook?.url,
  forwardedStatus: res.body.webhook?.status
});

Object.entries(originalEnv).forEach(([key, value]) => {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
});
