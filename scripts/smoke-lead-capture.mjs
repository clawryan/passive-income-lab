import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pil-lead-capture-'));
const storePath = path.join(tempDir, 'leads.json');
process.env.LEAD_CAPTURE_LOCAL_PATH = storePath;

const modulePath = path.resolve(import.meta.dirname, '..', 'api', 'lead-capture.js');
const imported = await import(`file://${modulePath}`);
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
if (res.statusCode !== 200 || res.body.snapshot.count !== 0) {
  throw new Error(`初始 GET 异常: ${JSON.stringify(res.body)}`);
}

res = createRes();
await handler({ method: 'POST', body: { lead: { id: 'lead-fixed', name: '测试线索A', productSlug: 'micro-saas', stage: '待跟进', need: '需要 7 天冷启动包', nextStep: '今晚发报价' } } }, res);
if (res.statusCode !== 200 || res.body.snapshot.count !== 1 || res.body.lead.name !== '测试线索A') {
  throw new Error(`POST 保存异常: ${JSON.stringify(res.body)}`);
}

res = createRes();
await handler({ method: 'POST', body: { lead: { id: 'lead-fixed', name: '测试线索A', productSlug: 'micro-saas', stage: '已报价', need: '需要 7 天冷启动包', nextStep: '明早催单', updatedAt: '2026-04-13T09:30:00.000Z' } } }, res);
if (res.statusCode !== 200 || res.body.snapshot.count !== 1 || res.body.snapshot.entries[0].stage !== '已报价') {
  throw new Error(`POST 更新异常: ${JSON.stringify(res.body)}`);
}

res = createRes();
await handler({ method: 'GET' }, res);
if (res.body.snapshot.count !== 1 || !fs.existsSync(storePath)) {
  throw new Error(`最终 GET / 文件存储异常: ${JSON.stringify(res.body)}`);
}

console.log('lead-capture 冒烟通过:', { storePath, count: res.body.snapshot.count, stage: res.body.snapshot.entries[0].stage });
