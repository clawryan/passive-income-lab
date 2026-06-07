import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const originalEnv = {
  LEAD_CAPTURE_LOCAL_PATH: process.env.LEAD_CAPTURE_LOCAL_PATH,
  KV_REST_API_URL: process.env.KV_REST_API_URL,
  KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
  LEAD_CAPTURE_KV_KEY: process.env.LEAD_CAPTURE_KV_KEY,
  LEAD_CAPTURE_WEBHOOK_URL: process.env.LEAD_CAPTURE_WEBHOOK_URL,
  LEAD_CAPTURE_WEBHOOK_AUTH: process.env.LEAD_CAPTURE_WEBHOOK_AUTH
};

const repoRoot = path.resolve(import.meta.dirname, '..');
const outputsDir = path.join(repoRoot, 'outputs');
fs.mkdirSync(outputsDir, { recursive: true });

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pil-lead-capture-proof-'));
const localStorePath = path.join(tempDir, 'lead-capture-local.json');
process.env.LEAD_CAPTURE_LOCAL_PATH = localStorePath;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.LEAD_CAPTURE_KV_KEY;
delete process.env.LEAD_CAPTURE_WEBHOOK_URL;
delete process.env.LEAD_CAPTURE_WEBHOOK_AUTH;

const modulePath = path.resolve(import.meta.dirname, '..', 'api', 'lead-capture.js');
const localImported = await import(`file://${modulePath}?proof-local=${Date.now()}`);
const localHandler = localImported.default || localImported;

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
    throw new Error(`request failed: ${req.method} => ${res.statusCode} ${JSON.stringify(res.body)}`);
  }
  return res.body;
}

const localInitial = await call(localHandler, { method: 'GET' });
const localLeadCreate = await call(localHandler, {
  method: 'POST',
  body: {
    source: 'public-inquiry-form',
    lead: {
      id: 'proof-lead-local',
      name: '公开询价线索 A',
      contact: 'feishu:demo-user',
      channel: '飞书私聊',
      budget: '¥299',
      priority: '高',
      source: 'public-inquiry:feishu-dm',
      sourceTag: 'feishu-dm',
      referrer: 'feishu-bot',
      utmSource: 'feishu',
      utmMedium: 'dm',
      utmCampaign: 'dev-sprint-3h',
      utmContent: 'micro-saas-card',
      originPage: 'https://example.com/?product=micro-saas&view=inquiry&src=feishu-dm',
      productSlug: 'micro-saas',
      stage: '待跟进',
      need: '需要 7 天冷启动提示词包',
      nextStep: '今晚发报价'
    }
  }
});
const localLeadUpdate = await call(localHandler, {
  method: 'POST',
  body: {
    lead: {
      id: 'proof-lead-local',
      name: '公开询价线索 A',
      productSlug: 'micro-saas',
      stage: '已报价',
      need: '需要 7 天冷启动提示词包',
      nextStep: '明早跟进付款确认',
      updatedAt: '2026-06-07T07:10:00.000Z'
    }
  }
});
const localPayment = await call(localHandler, {
  method: 'POST',
  body: {
    source: 'manual-payment-sync',
    event: {
      leadId: 'proof-lead-local',
      status: 'paid',
      amount: 229,
      currency: 'CNY',
      reference: 'gumroad-proof-001',
      note: '手机端确认已付款',
      nextStep: '发送交付包并请求案例反馈',
      updatedAt: '2026-06-07T07:15:00.000Z',
      paymentAt: '2026-06-07T07:14:00.000Z'
    }
  }
});
const localFinal = await call(localHandler, { method: 'GET' });

const kvMemory = new Map();
process.env.KV_REST_API_URL = 'https://example-kv.test';
process.env.KV_REST_API_TOKEN = 'token-demo';
process.env.LEAD_CAPTURE_KV_KEY = 'pil:proof:lead-capture';
let forwardedWebhookPayload = null;
globalThis.fetch = async (url, options = {}) => {
  const normalizedUrl = String(url);
  if (normalizedUrl.startsWith('https://example-kv.test/')) {
    const pathname = new URL(normalizedUrl).pathname;
    const [command, ...segments] = pathname.split('/').filter(Boolean);
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
  if (normalizedUrl === 'https://example.com/lead-capture-proof-webhook') {
    forwardedWebhookPayload = JSON.parse(options.body || '{}');
    return { ok: true, status: 202, json: async () => ({ ok: true }) };
  }
  throw new Error(`unexpected fetch url: ${normalizedUrl}`);
};
process.env.LEAD_CAPTURE_WEBHOOK_URL = 'https://example.com/lead-capture-proof-webhook';
process.env.LEAD_CAPTURE_WEBHOOK_AUTH = 'Bearer proof-token';

const kvImported = await import(`file://${modulePath}?proof-kv=${Date.now()}`);
const kvHandler = kvImported.default || kvImported;
const kvInitial = await call(kvHandler, { method: 'GET' });
const kvLeadCreate = await call(kvHandler, {
  method: 'POST',
  body: {
    lead: {
      id: 'proof-lead-kv',
      name: 'KV 研究包线索',
      contact: 'wechat:orion-demo',
      channel: '微信群',
      budget: '¥1999',
      priority: '高',
      source: 'public-inquiry:wechat-group',
      sourceTag: 'wechat-group',
      utmSource: 'wechat',
      utmMedium: 'group',
      utmCampaign: 'orion-proof',
      productSlug: 'orion-nexus',
      stage: '已报价',
      need: '需要研究包摘要与回测说明',
      nextStep: '今晚确认是否下单'
    }
  }
});
const kvPayment = await call(kvHandler, {
  method: 'POST',
  body: {
    source: 'payment-webhook-sync',
    event: {
      leadId: 'proof-lead-kv',
      status: 'paid',
      amount: 1999,
      currency: 'CNY',
      reference: 'orion-proof-001',
      note: '研究包付款确认',
      nextStep: '交付研究包并安排复购跟进'
    }
  }
});
const kvFinal = await call(kvHandler, { method: 'GET' });

const proofJson = {
  generatedAt: new Date().toISOString(),
  checks: {
    localInitial: {
      storageMode: localInitial.storage?.mode || null,
      count: localInitial.summary?.count || 0
    },
    localLeadCreate: {
      storageMode: localLeadCreate.storage?.mode || null,
      topSource: localLeadCreate.summary?.topSource?.source || null,
      topUtmCampaign: localLeadCreate.summary?.topUtmCampaign?.utmCampaign || null,
      nextStep: localLeadCreate.lead?.nextStep || null
    },
    localLeadUpdate: {
      stage: localLeadUpdate.lead?.stage || null,
      topStage: localLeadUpdate.summary?.topStage?.stage || null
    },
    localPayment: {
      eventStatus: localPayment.event?.status || null,
      leadStage: localPayment.lead?.stage || null,
      paidLeadCount: localPayment.summary?.paidLeadCount || 0,
      revenueByCurrency: localPayment.summary?.revenueByCurrency || {}
    },
    localFinal: {
      count: localFinal.summary?.count || 0,
      topStage: localFinal.summary?.topStage?.stage || null,
      topProduct: localFinal.summary?.topProduct?.productSlug || null,
      topSource: localFinal.summary?.topSource?.source || null,
      paymentStatusCounts: localFinal.summary?.paymentStatusCounts || {},
      localStoreExists: fs.existsSync(localStorePath)
    },
    kvInitial: {
      storageMode: kvInitial.storage?.mode || null,
      durable: kvInitial.storage?.durable ?? null,
      count: kvInitial.summary?.count || 0
    },
    kvLeadCreate: {
      storageMode: kvLeadCreate.storage?.mode || null,
      webhookStatus: kvLeadCreate.storage?.webhook?.status || null,
      topProduct: kvLeadCreate.summary?.topProduct?.productSlug || null
    },
    kvPayment: {
      eventStatus: kvPayment.event?.status || null,
      leadStage: kvPayment.lead?.stage || null,
      paidLeadCount: kvPayment.summary?.paidLeadCount || 0,
      revenueByCurrency: kvPayment.summary?.revenueByCurrency || {},
      webhookStatus: kvPayment.storage?.webhook?.status || null
    },
    kvFinal: {
      count: kvFinal.summary?.count || 0,
      topStage: kvFinal.summary?.topStage?.stage || null,
      topProduct: kvFinal.summary?.topProduct?.productSlug || null,
      topSource: kvFinal.summary?.topSource?.source || null,
      paymentStatusCounts: kvFinal.summary?.paymentStatusCounts || {},
      storageMode: kvFinal.storage?.mode || null
    }
  },
  forwardedWebhookPreview: forwardedWebhookPayload
    ? {
        kind: forwardedWebhookPayload.kind,
        source: forwardedWebhookPayload.source,
        leadId: forwardedWebhookPayload.lead?.id || null,
        eventStatus: forwardedWebhookPayload.event?.status || null,
        snapshotCount: forwardedWebhookPayload.snapshot?.count || 0,
        paidLeadCount: forwardedWebhookPayload.snapshot?.summary?.paidLeadCount || 0
      }
    : null,
  artifactPaths: {
    markdown: 'outputs/lead-capture-local-proof.md',
    json: 'outputs/lead-capture-local-proof.json'
  }
};

const markdown = [
  '# Passive Income Lab Lead Capture 本地验收证明',
  '',
  `- 生成时间：${proofJson.generatedAt}`,
  `- 本地快照路径：${localStorePath}`,
  `- KV Key：${process.env.LEAD_CAPTURE_KV_KEY}`,
  '',
  '## 验收结论',
  `- 本地模式初始 GET：storage.mode=${proofJson.checks.localInitial.storageMode}，count=${proofJson.checks.localInitial.count}`,
  `- 本地线索写入：topSource=${proofJson.checks.localLeadCreate.topSource || '暂无'}，utmCampaign=${proofJson.checks.localLeadCreate.topUtmCampaign || '暂无'}，nextStep=${proofJson.checks.localLeadCreate.nextStep || '暂无'}`,
  `- 本地报价更新：lead.stage=${proofJson.checks.localLeadUpdate.stage}，summary.topStage=${proofJson.checks.localLeadUpdate.topStage}`,
  `- 本地付款回写：event.status=${proofJson.checks.localPayment.eventStatus}，lead.stage=${proofJson.checks.localPayment.leadStage}，paidLeadCount=${proofJson.checks.localPayment.paidLeadCount}，CNY=${proofJson.checks.localPayment.revenueByCurrency.CNY || 0}`,
  `- 本地最终快照：count=${proofJson.checks.localFinal.count}，topStage=${proofJson.checks.localFinal.topStage}，topProduct=${proofJson.checks.localFinal.topProduct}，topSource=${proofJson.checks.localFinal.topSource}`,
  `- KV 模式初始 GET：storage.mode=${proofJson.checks.kvInitial.storageMode}，durable=${proofJson.checks.kvInitial.durable}，count=${proofJson.checks.kvInitial.count}`,
  `- KV 线索写入：topProduct=${proofJson.checks.kvLeadCreate.topProduct}，webhookStatus=${proofJson.checks.kvLeadCreate.webhookStatus || 'n/a'}`,
  `- KV 付款回写：event.status=${proofJson.checks.kvPayment.eventStatus}，lead.stage=${proofJson.checks.kvPayment.leadStage}，paidLeadCount=${proofJson.checks.kvPayment.paidLeadCount}，CNY=${proofJson.checks.kvPayment.revenueByCurrency.CNY || 0}`,
  `- KV 最终快照：count=${proofJson.checks.kvFinal.count}，topStage=${proofJson.checks.kvFinal.topStage}，topProduct=${proofJson.checks.kvFinal.topProduct}，topSource=${proofJson.checks.kvFinal.topSource}`,
  '',
  '## 关键证据',
  `- 本地文件已落盘：${proofJson.checks.localFinal.localStoreExists ? '是' : '否'}`,
  `- 本地 paymentStatusCounts：${JSON.stringify(proofJson.checks.localFinal.paymentStatusCounts)}`,
  `- KV paymentStatusCounts：${JSON.stringify(proofJson.checks.kvFinal.paymentStatusCounts)}`,
  forwardedWebhookPayload
    ? `- webhook 预览：kind=${proofJson.forwardedWebhookPreview.kind}，leadId=${proofJson.forwardedWebhookPreview.leadId}，eventStatus=${proofJson.forwardedWebhookPreview.eventStatus}，paidLeadCount=${proofJson.forwardedWebhookPreview.paidLeadCount}`
    : '- webhook 预览：未生成',
  '',
  '## 下一步建议',
  '- 拿真实线上 `/api/lead-capture` 地址跑一次手机端公开询价 → 电脑端 GET 快照 → 付款回写真验收。',
  '- 若要把这条证据用于部署验收，可对照 `outputs/lead-capture-kv-deploy.md` 的 cURL 模板替换为线上域名。',
  ''
].join('\n');

fs.writeFileSync(path.join(outputsDir, 'lead-capture-local-proof.json'), JSON.stringify(proofJson, null, 2));
fs.writeFileSync(path.join(outputsDir, 'lead-capture-local-proof.md'), markdown);

console.log('lead-capture proof 已生成:', {
  markdown: path.join(outputsDir, 'lead-capture-local-proof.md'),
  json: path.join(outputsDir, 'lead-capture-local-proof.json'),
  localRevenueCny: proofJson.checks.localPayment.revenueByCurrency.CNY || 0,
  kvRevenueCny: proofJson.checks.kvPayment.revenueByCurrency.CNY || 0,
  kvWebhookStatus: proofJson.checks.kvPayment.webhookStatus || null
});

Object.entries(originalEnv).forEach(([key, value]) => {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
});
