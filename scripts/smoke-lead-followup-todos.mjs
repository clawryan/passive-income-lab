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

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pil-lead-followup-todos-'));
const storePath = path.join(tempDir, 'leads.json');
const historyPath = path.join(tempDir, 'todos-history.json');
process.env.LEAD_CAPTURE_LOCAL_PATH = storePath;
process.env.LEAD_FOLLOWUP_TODOS_LOCAL_PATH = historyPath;
delete process.env.LEAD_FOLLOWUP_TODOS_WEBHOOK_URL;
delete process.env.LEAD_FOLLOWUP_TODOS_WEBHOOK_AUTH;
delete process.env.LEAD_CAPTURE_WEBHOOK_URL;
delete process.env.LEAD_CAPTURE_WEBHOOK_AUTH;

const leadCaptureModulePath = path.resolve(import.meta.dirname, '..', 'api', 'lead-capture.js');
const todosModulePath = path.resolve(import.meta.dirname, '..', 'api', 'lead-followup-todos.js');
const leadCaptureImported = await import(`file://${leadCaptureModulePath}?seed=${Date.now()}`);
const todosImported = await import(`file://${todosModulePath}?smoke=${Date.now()}`);
const leadCaptureHandler = leadCaptureImported.default || leadCaptureImported;
const todosHandler = todosImported.default || todosImported;

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}

const seedLeads = [
  { id: 'todo-1', name: '马上跟进客户', productSlug: 'micro-saas', source: 'public-inquiry:feishu-dm', channel: '飞书私聊', priority: '高', stage: '待跟进', nextStep: '发单产品链接和 FAQ', updatedAt: '2026-04-17T00:00:00.000Z' },
  { id: 'todo-2', name: '报价待确认客户', productSlug: 'orion-nexus', source: 'public-inquiry:wechat-group', channel: '微信社群', priority: '中', stage: '已报价', nextStep: '今晚确认是否下单', updatedAt: '2026-04-17T01:00:00.000Z' },
  { id: 'todo-3', name: '暂停样本', productSlug: 'micro-saas', source: 'manual', channel: '手动录入', priority: '低', stage: '暂不推进', nextStep: '先不处理', updatedAt: '2026-04-17T02:00:00.000Z' }
];

for (const lead of seedLeads) {
  const res = createRes();
  await leadCaptureHandler({ method: 'POST', body: { lead } }, res);
  if (res.statusCode !== 200) throw new Error(`seed lead failed: ${JSON.stringify(res.body)}`);
}

let res = createRes();
await todosHandler({ method: 'GET' }, res);
if (
  res.statusCode !== 200 ||
  res.body.kind !== 'lead-followup-todos' ||
  res.body.payload?.count !== 2 ||
  !Array.isArray(res.body.payload?.items) ||
  res.body.payload.items[0]?.leadName !== '马上跟进客户' ||
  !String(res.body.payload?.summary || '').includes('最优先线索：马上跟进客户') ||
  !String(res.body.payload?.markdown || '').includes('## 今日最优先待办') ||
  !Array.isArray(res.body.history) ||
  res.body.history.length !== 0 ||
  res.body.latest !== null ||
  res.body.historyStorage?.mode !== 'local-file'
) {
  throw new Error(`GET 跟进待办异常: ${JSON.stringify(res.body)}`);
}

let forwardedPayload = null;
process.env.LEAD_FOLLOWUP_TODOS_WEBHOOK_URL = 'https://example.com/webhook';
process.env.LEAD_FOLLOWUP_TODOS_WEBHOOK_AUTH = 'Bearer demo';
globalThis.fetch = async (url, options = {}) => {
  if (String(url) !== 'https://example.com/webhook') {
    throw new Error(`unexpected url: ${url}`);
  }
  forwardedPayload = JSON.parse(options.body || '{}');
  return { ok: true, status: 200, json: async () => ({ ok: true }) };
};

res = createRes();
await todosHandler({ method: 'POST', body: {} }, res);
if (
  res.statusCode !== 200 ||
  res.body.webhook?.ok !== true ||
  forwardedPayload?.kind !== 'lead-followup-todos' ||
  res.body.latest?.trigger !== 'manual-post' ||
  !Array.isArray(res.body.history) ||
  res.body.history.length !== 1 ||
  res.body.history[0]?.topLead?.leadName !== '马上跟进客户'
) {
  throw new Error(`POST 跟进待办转发异常: ${JSON.stringify(res.body)}`);
}

const extraLead = { id: 'todo-4', name: '资料待跟进客户', productSlug: 'micro-saas', source: 'public-inquiry:xhs', channel: '小红书', priority: '高', stage: '已发送资料', nextStep: '明早问是否需要报价', updatedAt: '2026-04-17T03:00:00.000Z' };
let seedRes = createRes();
await leadCaptureHandler({ method: 'POST', body: { lead: extraLead } }, seedRes);
if (seedRes.statusCode !== 200) throw new Error(`seed extra lead failed: ${JSON.stringify(seedRes.body)}`);

res = createRes();
await todosHandler({ method: 'GET' }, res);
if (
  res.statusCode !== 200 ||
  res.body.payload?.count !== 3 ||
  res.body.payload?.trend?.hasPrevious !== true ||
  res.body.payload?.trend?.countDelta !== 1 ||
  !String(res.body.payload?.summary || '').includes('较上次：待办总数 +1')
) {
  throw new Error(`GET 跟进待办趋势异常: ${JSON.stringify(res.body)}`);
}

res = createRes();
await todosHandler({ method: 'GET', query: { productSlug: 'micro-saas', cadenceLevel: 'overdue' } }, res);
if (
  res.statusCode !== 200 ||
  res.body.payload?.count !== 2 ||
  res.body.payload?.filters?.productSlugs?.[0] !== 'micro-saas' ||
  res.body.payload?.filters?.cadenceLevels?.[0] !== 'overdue' ||
  !String(res.body.payload?.summary || '').includes('筛选范围：产品 micro-saas｜节奏 overdue')
) {
  throw new Error(`GET 跟进待办筛选异常: ${JSON.stringify(res.body)}`);
}

console.log('lead-followup-todos 冒烟通过:', {
  count: res.body.payload.count,
  topLead: res.body.payload.report.topLead?.leadName,
  trend: res.body.payload.trend?.summary,
  forwardedUrl: forwardedPayload ? 'https://example.com/webhook' : null,
  historyCount: res.body.history.length
});

Object.entries(originalEnv).forEach(([key, value]) => {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
});
