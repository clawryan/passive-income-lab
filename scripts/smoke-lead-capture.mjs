import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const originalEnv = {
  LEAD_CAPTURE_LOCAL_PATH: process.env.LEAD_CAPTURE_LOCAL_PATH,
  KV_REST_API_URL: process.env.KV_REST_API_URL,
  KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
  LEAD_CAPTURE_KV_KEY: process.env.LEAD_CAPTURE_KV_KEY
};

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pil-lead-capture-'));
const storePath = path.join(tempDir, 'leads.json');
process.env.LEAD_CAPTURE_LOCAL_PATH = storePath;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.LEAD_CAPTURE_KV_KEY;

const modulePath = path.resolve(import.meta.dirname, '..', 'api', 'lead-capture.js');
const imported = await import(`file://${modulePath}?mode=local-${Date.now()}`);
const handler = imported.default || imported;

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
}

let res = createRes();
await handler({ method: 'GET' }, res);
if (res.statusCode !== 200 || res.body.snapshot.count !== 0 || res.body.storage.mode !== 'local-file' || res.body.summary?.count !== 0) {
  throw new Error(`初始 GET 异常: ${JSON.stringify(res.body)}`);
}

res = createRes();
await handler({ method: 'POST', body: { lead: { id: 'lead-fixed', name: '测试线索A', contact: 'wechat:test-a', source: 'public-inquiry:feishu-dm', originPage: 'https://example.com/web/?product=micro-saas&view=inquiry&src=feishu-dm', productSlug: 'micro-saas', stage: '待跟进', need: '需要 7 天冷启动包', nextStep: '今晚发报价' } } }, res);
if (res.statusCode !== 200 || res.body.snapshot.count !== 1 || res.body.lead.name !== '测试线索A' || res.body.lead.contact !== 'wechat:test-a' || res.body.lead.source !== 'public-inquiry:feishu-dm') {
  throw new Error(`POST 保存异常: ${JSON.stringify(res.body)}`);
}

res = createRes();
await handler({ method: 'POST', body: { lead: { id: 'lead-fixed', name: '测试线索A', productSlug: 'micro-saas', stage: '已报价', need: '需要 7 天冷启动包', nextStep: '明早催单', updatedAt: '2026-04-13T09:30:00.000Z' } } }, res);
if (res.statusCode !== 200 || res.body.snapshot.count !== 1 || res.body.snapshot.entries[0].stage !== '已报价') {
  throw new Error(`POST 更新异常: ${JSON.stringify(res.body)}`);
}

res = createRes();
await handler({ method: 'GET' }, res);
if (res.body.snapshot.count !== 1 || !fs.existsSync(storePath) || res.body.summary?.topStage?.stage !== '已报价' || res.body.summary?.topProduct?.productSlug !== 'micro-saas' || res.body.summary?.topSource?.source !== 'public-inquiry:feishu-dm') {
  throw new Error(`最终 GET / 文件存储异常: ${JSON.stringify(res.body)}`);
}

const kvMemory = new Map();
process.env.KV_REST_API_URL = 'https://example-kv.test';
process.env.KV_REST_API_TOKEN = 'token-demo';
process.env.LEAD_CAPTURE_KV_KEY = 'pil:test:snapshot';
globalThis.fetch = async (url, options = {}) => {
  const normalizedUrl = String(url);
  const pathname = new URL(normalizedUrl).pathname;
  const [command, ...segments] = pathname.split('/').filter(Boolean);
  if (normalizedUrl.startsWith('https://example-kv.test/')) {
    if (options.method !== 'POST') {
      return { ok: false, status: 405, json: async () => ({ error: 'method not allowed' }) };
    }
    if (command === 'get') {
      const key = decodeURIComponent(segments[0] || '');
      return { ok: true, status: 200, json: async () => ({ result: kvMemory.get(key) || null }) };
    }
    if (command === 'set') {
      const key = decodeURIComponent(segments[0] || '');
      const value = decodeURIComponent(segments.slice(1).join('/'));
      kvMemory.set(key, value);
      return { ok: true, status: 200, json: async () => ({ result: 'OK' }) };
    }
  }
  throw new Error(`未处理的 fetch: ${normalizedUrl}`);
};

const importedKv = await import(`file://${modulePath}?mode=kv-${Date.now()}`);
const kvHandler = importedKv.default || importedKv;

res = createRes();
await kvHandler({ method: 'GET' }, res);
if (res.statusCode !== 200 || res.body.storage.mode !== 'vercel-kv' || res.body.storage.durable !== true) {
  throw new Error(`KV 初始 GET 异常: ${JSON.stringify(res.body)}`);
}

res = createRes();
await kvHandler({ method: 'POST', body: { lead: { id: 'lead-kv', name: 'KV线索', productSlug: 'orion-nexus', stage: '待跟进', nextStep: '发研究包摘要' } } }, res);
if (res.statusCode !== 200 || res.body.snapshot.count !== 1 || res.body.storage.mode !== 'vercel-kv' || res.body.summary?.topProduct?.productSlug !== 'orion-nexus') {
  throw new Error(`KV POST 异常: ${JSON.stringify(res.body)}`);
}

res = createRes();
await kvHandler({ method: 'GET' }, res);
if (res.body.snapshot.count !== 1 || res.body.snapshot.entries[0].id !== 'lead-kv' || res.body.summary?.topStage?.stage !== '待跟进') {
  throw new Error(`KV 最终 GET 异常: ${JSON.stringify(res.body)}`);
}

console.log('lead-capture 冒烟通过:', {
  localStorePath: storePath,
  localCount: 1,
  localStage: '已报价',
  localTopSource: 'public-inquiry:feishu-dm',
  kvCount: res.body.snapshot.count,
  kvMode: res.body.storage.mode
});

Object.entries(originalEnv).forEach(([key, value]) => {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
});
