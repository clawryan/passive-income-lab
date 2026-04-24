import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const originalEnv = {
  LEAD_ASSET_HISTORY_LOCAL_PATH: process.env.LEAD_ASSET_HISTORY_LOCAL_PATH,
  KV_REST_API_URL: process.env.KV_REST_API_URL,
  KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
  LEAD_ASSET_HISTORY_KV_KEY: process.env.LEAD_ASSET_HISTORY_KV_KEY
};

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pil-lead-asset-history-'));
const storePath = path.join(tempDir, 'lead-asset-history.json');
process.env.LEAD_ASSET_HISTORY_LOCAL_PATH = storePath;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.LEAD_ASSET_HISTORY_KV_KEY;

const modulePath = path.resolve(import.meta.dirname, '..', 'api', 'lead-asset-history.js');
const imported = await import(`file://${modulePath}?mode=local-${Date.now()}`);
const handler = imported.default || imported;

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

async function call(handlerFn, req) {
  const res = createRes();
  await handlerFn(req, res);
  if (res.statusCode !== 200) {
    throw new Error(`request failed: ${req.method} => ${res.statusCode} ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

const seedEntries = [
  {
    generatedAt: '2026-04-24T08:00:00.000Z',
    kind: 'won-lead-cases',
    label: '成交案例',
    count: 2,
    topProduct: { name: 'Micro-SaaS 冷启动提示词包', count: 2 },
    topSource: { name: 'feishu-dm', count: 1 },
    summary: '成交案例 2 条｜主产品 Micro-SaaS 冷启动提示词包｜主来源 feishu-dm'
  },
  {
    generatedAt: '2026-04-24T09:00:00.000Z',
    kind: 'quoted-lead-closer',
    label: '已报价催单',
    count: 3,
    topProduct: { name: 'Orion Nexus Quant 研究包', count: 2 },
    topSource: { name: 'wechat-group', count: 2 },
    summary: '已报价催单 3 条｜主产品 Orion Nexus Quant 研究包｜主来源 wechat-group'
  },
  {
    generatedAt: '2026-04-24T10:00:00.000Z',
    kind: 'won-lead-upsell',
    label: '复购 / 转介绍',
    count: 1,
    topProduct: { name: 'Micro-SaaS 冷启动提示词包', count: 1 },
    topSource: { name: 'xhs-post', count: 1 },
    summary: '复购 / 转介绍 1 条｜主产品 Micro-SaaS 冷启动提示词包｜主来源 xhs-post'
  }
];

let result = await call(handler, { method: 'GET' });
if (result.snapshot?.count !== 0 || result.storage?.mode !== 'local-file' || result.summary?.count !== 0) {
  throw new Error(`初始 GET 异常: ${JSON.stringify(result)}`);
}

for (const entry of seedEntries) {
  result = await call(handler, { method: 'POST', body: { entry } });
}
if (
  result.snapshot?.count !== 3 ||
  result.summary?.topProduct?.name !== 'Micro-SaaS 冷启动提示词包' ||
  result.summary?.topSource?.name !== 'wechat-group' ||
  result.summary?.topKind?.kind !== 'won-lead-upsell'
) {
  throw new Error(`连续 POST 后汇总异常: ${JSON.stringify(result)}`);
}

result = await call(handler, {
  method: 'POST',
  body: {
    entry: {
      ...seedEntries[2],
      count: 4,
      summary: '复购 / 转介绍 4 条｜用于验证 generatedAt + kind 去重覆盖'
    }
  }
});
if (
  result.snapshot?.count !== 3 ||
  result.summary?.latest?.kind !== 'won-lead-upsell' ||
  result.summary?.latest?.count !== 4 ||
  result.summary?.totalLeads !== 9
) {
  throw new Error(`重复 POST 覆盖异常: ${JSON.stringify(result)}`);
}

result = await call(handler, { method: 'GET' });
if (!fs.existsSync(storePath) || result.summary?.topSource?.name !== 'wechat-group' || result.summary?.latest?.count !== 4) {
  throw new Error(`最终 GET / 文件存储异常: ${JSON.stringify(result)}`);
}

const kvMemory = new Map();
process.env.KV_REST_API_URL = 'https://example-kv.test';
process.env.KV_REST_API_TOKEN = 'token-demo';
process.env.LEAD_ASSET_HISTORY_KV_KEY = 'pil:test:lead-asset-history';
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

result = await call(kvHandler, { method: 'GET' });
if (result.storage?.mode !== 'vercel-kv' || result.storage?.durable !== true || result.snapshot?.count !== 0) {
  throw new Error(`KV 初始 GET 异常: ${JSON.stringify(result)}`);
}

result = await call(kvHandler, { method: 'POST', body: { entry: seedEntries[0] } });
result = await call(kvHandler, { method: 'POST', body: { entry: seedEntries[1] } });
if (result.snapshot?.count !== 2 || result.summary?.topSource?.name !== 'wechat-group') {
  throw new Error(`KV POST 异常: ${JSON.stringify(result)}`);
}

result = await call(kvHandler, {
  method: 'POST',
  body: {
    entry: {
      ...seedEntries[1],
      count: 5,
      summary: '已报价催单 5 条｜用于验证 KV 覆盖写入'
    }
  }
});
if (result.snapshot?.count !== 2 || result.summary?.latest?.count !== 5 || result.summary?.totalLeads !== 7) {
  throw new Error(`KV 覆盖写入异常: ${JSON.stringify(result)}`);
}

result = await call(kvHandler, { method: 'GET' });
if (
  result.snapshot?.count !== 2 ||
  result.summary?.topKind?.kind !== 'quoted-lead-closer' ||
  result.summary?.topProduct?.name !== 'Orion Nexus Quant 研究包' ||
  result.summary?.latest?.kind !== 'quoted-lead-closer'
) {
  throw new Error(`KV 最终 GET 异常: ${JSON.stringify(result)}`);
}

console.log('lead-asset-history 冒烟通过:', {
  localStorePath: storePath,
  localCount: 3,
  localTopSource: 'wechat-group',
  kvCount: result.snapshot?.count,
  kvMode: result.storage?.mode,
  kvLatestKind: result.summary?.latest?.kind
});

Object.entries(originalEnv).forEach(([key, value]) => {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
});
