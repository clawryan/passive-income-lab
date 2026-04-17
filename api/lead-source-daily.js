const { readSnapshot, buildSnapshotSummary } = require('./lead-capture');

function normalizeProductTitle(slug) {
  if (slug === 'orion-nexus') return 'Orion Nexus Quant 研究包';
  if (slug === 'micro-saas') return 'Micro-SaaS 冷启动提示词包';
  return slug || '未命名产品';
}

function buildPortfolioReport(snapshot = {}) {
  const entries = Array.isArray(snapshot.entries) ? snapshot.entries : [];
  const productsMap = new Map();
  const sourcesMap = new Map();
  let actionableCount = 0;
  let overdueCount = 0;

  for (const entry of entries) {
    const stage = String(entry.stage || '待跟进').trim() || '待跟进';
    const productSlug = String(entry.productSlug || 'micro-saas').trim() || 'micro-saas';
    const source = String(entry.source || entry.channel || 'manual').trim() || 'manual';
    const updatedAt = new Date(entry.updatedAt || entry.createdAt || 0).getTime();
    const ageHours = updatedAt > 0 ? Math.max(0, (Date.now() - updatedAt) / 36e5) : 0;
    const isActionable = ['待跟进', '已发送资料', '已报价'].includes(stage);

    if (isActionable) actionableCount += 1;
    if (isActionable && ageHours >= 72) overdueCount += 1;

    if (!productsMap.has(productSlug)) {
      productsMap.set(productSlug, {
        productSlug,
        productTitle: normalizeProductTitle(productSlug),
        total: 0,
        pending: 0,
        quoted: 0,
        won: 0,
        paused: 0
      });
    }
    const product = productsMap.get(productSlug);
    product.total += 1;
    if (stage === '待跟进' || stage === '已发送资料') product.pending += 1;
    if (stage === '已报价') product.quoted += 1;
    if (stage === '已成交') product.won += 1;
    if (stage === '暂不推进') product.paused += 1;

    if (!sourcesMap.has(source)) {
      sourcesMap.set(source, { source, count: 0, pending: 0, quoted: 0, won: 0, paused: 0, lastUpdatedAt: null });
    }
    const sourceItem = sourcesMap.get(source);
    sourceItem.count += 1;
    if (stage === '待跟进' || stage === '已发送资料') sourceItem.pending += 1;
    if (stage === '已报价') sourceItem.quoted += 1;
    if (stage === '已成交') sourceItem.won += 1;
    if (stage === '暂不推进') sourceItem.paused += 1;
    if (!sourceItem.lastUpdatedAt || new Date(sourceItem.lastUpdatedAt).getTime() < updatedAt) {
      sourceItem.lastUpdatedAt = entry.updatedAt || entry.createdAt || null;
    }
  }

  const products = Array.from(productsMap.values()).sort((a, b) => b.total - a.total || b.quoted - a.quoted || b.won - a.won);
  const sources = Array.from(sourcesMap.values()).sort((a, b) => b.count - a.count || b.quoted - a.quoted || b.won - a.won);

  return {
    generatedAt: new Date().toISOString(),
    updatedAt: snapshot.updatedAt || null,
    totalLeads: entries.length,
    actionableCount,
    overdueCount,
    products,
    sources,
    topProduct: products[0] || null,
    topSource: sources[0] || null,
    snapshotSummary: buildSnapshotSummary(snapshot)
  };
}

function buildLeadSourceDailyPayload(snapshot = {}) {
  const report = buildPortfolioReport(snapshot);
  const sourceHighlights = report.sources.slice(0, 5).map((item, index) => ({
    rank: index + 1,
    source: item.source,
    count: item.count,
    pending: item.pending,
    quoted: item.quoted,
    won: item.won,
    lastUpdatedAt: item.lastUpdatedAt
  }));
  const topSource = report.topSource || sourceHighlights[0] || null;
  const recommendation = topSource
    ? (topSource.quoted > 0 || topSource.won > 0
        ? `优先继续加推 ${topSource.source}，它已经出现${topSource.won > 0 ? '成交' : '报价'}信号。`
        : `先继续补量 ${topSource.source}，它在线索数上领先，但还需要更多报价/成交验证。`)
    : '今天先补首批分发动作，至少跑出 1 个可归因来源。';
  const summaryLines = [
    `Passive Income Lab 来源日报｜${new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
    `总线索：${report.totalLeads || 0}｜可推进：${report.actionableCount || 0}｜超72h未推进：${report.overdueCount || 0}`,
    report.topProduct ? `当前最热产品：${report.topProduct.productTitle}（线索 ${report.topProduct.total}｜已报价 ${report.topProduct.quoted}｜已成交 ${report.topProduct.won}）` : '当前最热产品：暂无',
    topSource ? `当前最有效来源：${topSource.source}（线索 ${topSource.count || 0}｜待跟进 ${topSource.pending || 0}｜已报价 ${topSource.quoted || 0}｜已成交 ${topSource.won || 0}）` : '当前最有效来源：暂无',
    sourceHighlights.length
      ? `Top 来源：${sourceHighlights.map((item) => `${item.rank}. ${item.source}（${item.count}/${item.quoted}/${item.won}）`).join('；')}`
      : 'Top 来源：暂无',
    `建议动作：${recommendation}`
  ];

  return {
    source: 'passive-income-lab',
    kind: 'lead-source-daily-digest',
    generatedAt: report.generatedAt,
    payload: {
      report,
      sourceHighlights,
      recommendation,
      summary: summaryLines.join('\n'),
      markdown: [
        '# Passive Income Lab 来源日报',
        '',
        `- 日期：${new Date().toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
        `- 总线索：${report.totalLeads || 0}`,
        `- 可推进：${report.actionableCount || 0}`,
        `- 超72h未推进：${report.overdueCount || 0}`,
        report.topProduct ? `- 当前最热产品：${report.topProduct.productTitle}（线索 ${report.topProduct.total}｜已报价 ${report.topProduct.quoted}｜已成交 ${report.topProduct.won}）` : '- 当前最热产品：暂无',
        topSource ? `- 当前最有效来源：${topSource.source}（线索 ${topSource.count || 0}｜待跟进 ${topSource.pending || 0}｜已报价 ${topSource.quoted || 0}｜已成交 ${topSource.won || 0}）` : '- 当前最有效来源：暂无',
        '',
        '## Top 来源',
        ...(sourceHighlights.length ? sourceHighlights.map((item) => `- ${item.rank}. ${item.source}｜线索 ${item.count}｜待跟进 ${item.pending}｜已报价 ${item.quoted}｜已成交 ${item.won}`) : ['- 暂无可用来源数据']),
        '',
        '## 建议动作',
        `- ${recommendation}`
      ].join('\n')
    }
  };
}

async function forwardDailyPayload(payload) {
  const url = process.env.LEAD_SOURCE_DAILY_WEBHOOK_URL || process.env.LEAD_CAPTURE_WEBHOOK_URL;
  if (!url) return null;
  const headers = { 'Content-Type': 'application/json' };
  const auth = process.env.LEAD_SOURCE_DAILY_WEBHOOK_AUTH || process.env.LEAD_CAPTURE_WEBHOOK_AUTH;
  if (auth) headers.Authorization = auth;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  return { forwarded: true, ok: response.ok, status: response.status, url };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  try {
    const snapshot = await readSnapshot();
    const payload = buildLeadSourceDailyPayload(snapshot);

    if (req.method === 'GET') {
      return res.status(200).json({ ok: true, ...payload });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const dryRun = body.dryRun === true || body.forward === false;
    const forwardResult = dryRun ? { forwarded: false, dryRun: true } : await forwardDailyPayload(payload);
    return res.status(200).json({ ok: true, ...payload, webhook: forwardResult });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || String(error) });
  }
};

module.exports.buildPortfolioReport = buildPortfolioReport;
module.exports.buildLeadSourceDailyPayload = buildLeadSourceDailyPayload;
module.exports.forwardDailyPayload = forwardDailyPayload;
