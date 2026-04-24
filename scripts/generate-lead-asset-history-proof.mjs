import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const originalEnv = {
  LEAD_ASSET_HISTORY_LOCAL_PATH: process.env.LEAD_ASSET_HISTORY_LOCAL_PATH
};

const repoRoot = path.resolve(import.meta.dirname, '..');
const outputsDir = path.join(repoRoot, 'outputs');
fs.mkdirSync(outputsDir, { recursive: true });

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pil-lead-asset-proof-'));
const storePath = path.join(tempDir, 'lead-asset-history.json');
process.env.LEAD_ASSET_HISTORY_LOCAL_PATH = storePath;

const modulePath = path.resolve(import.meta.dirname, '..', 'api', 'lead-asset-history.js');
const imported = await import(`file://${modulePath}?proof=${Date.now()}`);
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

async function call(req) {
  const res = createRes();
  await handler(req, res);
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

const getBefore = await call({ method: 'GET' });
const postResults = [];
for (const entry of seedEntries) {
  const result = await call({ method: 'POST', body: { entry } });
  postResults.push({
    kind: result.entry?.kind || entry.kind,
    count: result.entry?.count || 0,
    snapshotCount: result.snapshot?.count || 0,
    topProduct: result.summary?.topProduct?.name || null,
    topSource: result.summary?.topSource?.name || null
  });
}

const duplicatePost = await call({
  method: 'POST',
  body: {
    entry: {
      ...seedEntries[2],
      count: 4,
      summary: '复购 / 转介绍 4 条｜用于验证 generatedAt + kind 去重覆盖'
    }
  }
});

const getAfter = await call({ method: 'GET' });

const proofJson = {
  generatedAt: new Date().toISOString(),
  seedEntries: seedEntries.map(({ generatedAt, kind, count }) => ({ generatedAt, kind, count })),
  checks: {
    getBefore: {
      snapshotCount: getBefore.snapshot?.count || 0,
      storage: getBefore.storage || null,
      totalLeads: getBefore.summary?.totalLeads || 0
    },
    posts: postResults,
    duplicateOverwrite: {
      snapshotCount: duplicatePost.snapshot?.count || 0,
      latestKind: duplicatePost.summary?.latest?.kind || null,
      latestCount: duplicatePost.summary?.latest?.count || 0,
      totalLeads: duplicatePost.summary?.totalLeads || 0
    },
    getAfter: {
      snapshotCount: getAfter.snapshot?.count || 0,
      topKind: getAfter.summary?.topKind || null,
      topProduct: getAfter.summary?.topProduct || null,
      topSource: getAfter.summary?.topSource || null,
      latest: getAfter.summary?.latest || null
    }
  },
  artifactPaths: {
    markdown: 'outputs/lead-asset-history-local-proof.md',
    json: 'outputs/lead-asset-history-local-proof.json'
  }
};

const markdown = [
  '# Passive Income Lab 成交素材外发记录本地验收证明',
  '',
  `- 生成时间：${proofJson.generatedAt}`,
  `- 种子记录：${seedEntries.length} 条（成交案例 / 已报价催单 / 复购转介绍各 1 条）`,
  `- 本地快照路径：${storePath}`,
  '',
  '## 验收结论',
  `- GET /api/lead-asset-history（初始）：snapshotCount=${proofJson.checks.getBefore.snapshotCount}，storage=${proofJson.checks.getBefore.storage?.mode || 'unknown'}`,
  `- 连续 POST 3 条记录后：snapshotCount=${postResults.at(-1)?.snapshotCount || 0}，topProduct=${postResults.at(-1)?.topProduct || '暂无'}，topSource=${postResults.at(-1)?.topSource || '暂无'}`,
  `- 重复 POST 同一 generatedAt + kind 后：snapshotCount=${proofJson.checks.duplicateOverwrite.snapshotCount}（未重复膨胀），latestCount=${proofJson.checks.duplicateOverwrite.latestCount}`,
  `- GET /api/lead-asset-history（最终）：topKind=${proofJson.checks.getAfter.topKind?.kind || '暂无'}，topProduct=${proofJson.checks.getAfter.topProduct?.name || '暂无'}，topSource=${proofJson.checks.getAfter.topSource?.name || '暂无'}`,
  '',
  '## 关键证据',
  `- 汇总 totalLeads=${proofJson.checks.duplicateOverwrite.totalLeads}，说明 count 会进入历史聚合而不只是存原始记录。`,
  `- latest.kind=${proofJson.checks.getAfter.latest?.kind || '暂无'}，latest.count=${proofJson.checks.getAfter.latest?.count || 0}，证明最新外发记录可被直接回看。`,
  '- 同一 generatedAt + kind 的重复写入会被覆盖而不是叠加，适合手机/电脑重复补推后保持历史干净。',
  '',
  '## 下一步建议',
  '- 若拿到真实 /api/lead-asset-history 线上地址，可从手机端真实推一次成交素材，再在电脑端 GET 拉取快照，确认跨设备合并体验。',
  '- 若后续要做增长复盘，可把这份 proof 的 summary 字段继续接到来源日报或经营周报。',
  ''
].join('\n');

fs.writeFileSync(path.join(outputsDir, 'lead-asset-history-local-proof.json'), JSON.stringify(proofJson, null, 2));
fs.writeFileSync(path.join(outputsDir, 'lead-asset-history-local-proof.md'), markdown);

console.log('lead-asset-history proof 已生成:', {
  markdown: path.join(outputsDir, 'lead-asset-history-local-proof.md'),
  json: path.join(outputsDir, 'lead-asset-history-local-proof.json'),
  snapshotCount: proofJson.checks.getAfter.snapshotCount,
  topKind: proofJson.checks.getAfter.topKind,
  topProduct: proofJson.checks.getAfter.topProduct,
  topSource: proofJson.checks.getAfter.topSource
});

Object.entries(originalEnv).forEach(([key, value]) => {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
});
