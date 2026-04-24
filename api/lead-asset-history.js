const fs = require('node:fs');
const path = require('node:path');

const MAX_HISTORY_ENTRIES = 100;

function getLocalStorePath() {
  return process.env.LEAD_ASSET_HISTORY_LOCAL_PATH || '/tmp/passive-income-lab-lead-asset-history.json';
}

function getKvRestUrl() {
  return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
}

function getKvRestToken() {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
}

function getKvStoreKey() {
  return process.env.LEAD_ASSET_HISTORY_KV_KEY || 'passive-income-lab:lead-asset-history:snapshot';
}

function hasKvStore() {
  return Boolean(getKvRestUrl() && getKvRestToken());
}

async function kvRequest(command, ...args) {
  const encodedArgs = args.map((item) => encodeURIComponent(String(item))).join('/');
  const url = `${getKvRestUrl().replace(/\/$/, '')}/${command}${encodedArgs ? `/${encodedArgs}` : ''}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getKvRestToken()}` }
  });
  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new Error(payload.error || `KV request failed: ${response.status}`);
  }
  return payload.result;
}

async function readKvStore() {
  const result = await kvRequest('get', getKvStoreKey());
  if (!result) return { history: [] };
  try {
    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    return parsed && typeof parsed === 'object' ? parsed : { history: [] };
  } catch (_error) {
    return { history: [] };
  }
}

async function writeKvStore(snapshot) {
  await kvRequest('set', getKvStoreKey(), JSON.stringify(snapshot));
}

function readLocalStore() {
  try {
    return JSON.parse(fs.readFileSync(getLocalStorePath(), 'utf8'));
  } catch (_error) {
    return { history: [] };
  }
}

function writeLocalStore(snapshot) {
  fs.mkdirSync(path.dirname(getLocalStorePath()), { recursive: true });
  fs.writeFileSync(getLocalStorePath(), JSON.stringify(snapshot, null, 2));
}

async function readSnapshot() {
  return hasKvStore() ? readKvStore() : readLocalStore();
}

async function writeSnapshot(snapshot) {
  return hasKvStore() ? writeKvStore(snapshot) : writeLocalStore(snapshot);
}

function buildStorageMeta(extra = {}) {
  if (hasKvStore()) {
    return {
      mode: 'vercel-kv',
      durable: true,
      provider: 'vercel-kv-rest',
      key: getKvStoreKey(),
      note: '已启用托管 KV 持久化，适合跨设备回看成交素材外发记录。',
      ...extra
    };
  }
  return {
    mode: 'local-file',
    durable: false,
    path: getLocalStorePath(),
    note: '本地文件存储适合本机 / 调试；若要真正跨设备持久化，建议配置 KV_REST_API_URL / KV_REST_API_TOKEN。',
    ...extra
  };
}

function normalizeAssetHistoryEntry(rawEntry = {}) {
  const now = new Date().toISOString();
  const kind = String(rawEntry.kind || 'won-lead-cases').trim() || 'won-lead-cases';
  const labelMap = {
    'won-lead-cases': '成交案例',
    'quoted-lead-closer': '已报价催单',
    'won-lead-upsell': '复购 / 转介绍'
  };
  const topProduct = rawEntry.topProduct && typeof rawEntry.topProduct === 'object'
    ? {
        name: String(rawEntry.topProduct.name || '未分类').trim() || '未分类',
        count: Number(rawEntry.topProduct.count || 0) || 0
      }
    : null;
  const topSource = rawEntry.topSource && typeof rawEntry.topSource === 'object'
    ? {
        name: String(rawEntry.topSource.name || '未标记来源').trim() || '未标记来源',
        count: Number(rawEntry.topSource.count || 0) || 0
      }
    : null;
  return {
    generatedAt: String(rawEntry.generatedAt || now),
    kind,
    label: String(rawEntry.label || labelMap[kind] || '线索资产').trim() || labelMap[kind] || '线索资产',
    count: Number(rawEntry.count || 0) || 0,
    topProduct,
    topSource,
    summary: String(rawEntry.summary || '').trim()
  };
}

function mergeHistoryEntries(history, incomingEntry) {
  const list = Array.isArray(history) ? [...history] : [];
  const normalized = normalizeAssetHistoryEntry(incomingEntry);
  const deduped = [normalized, ...list.filter((item) => !(item.generatedAt === normalized.generatedAt && item.kind === normalized.kind))];
  return deduped
    .sort((a, b) => new Date(b.generatedAt || 0) - new Date(a.generatedAt || 0))
    .slice(0, MAX_HISTORY_ENTRIES);
}

function buildHistorySummary(snapshot = {}) {
  const history = Array.isArray(snapshot.history) ? snapshot.history : [];
  const kindCounts = {};
  const productCounts = {};
  const sourceCounts = {};
  let totalLeads = 0;
  for (const entry of history) {
    kindCounts[entry.kind] = (kindCounts[entry.kind] || 0) + 1;
    totalLeads += Number(entry.count || 0) || 0;
    if (entry.topProduct?.name) productCounts[entry.topProduct.name] = (productCounts[entry.topProduct.name] || 0) + (Number(entry.topProduct.count || 0) || 0);
    if (entry.topSource?.name) sourceCounts[entry.topSource.name] = (sourceCounts[entry.topSource.name] || 0) + (Number(entry.topSource.count || 0) || 0);
  }
  const topKind = Object.entries(kindCounts).sort((a, b) => b[1] - a[1])[0] || null;
  const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0] || null;
  const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0] || null;
  return {
    updatedAt: snapshot.updatedAt || null,
    count: history.length,
    totalLeads,
    kindCounts,
    topKind: topKind ? { kind: topKind[0], count: topKind[1] } : null,
    topProduct: topProduct ? { name: topProduct[0], count: topProduct[1] } : null,
    topSource: topSource ? { name: topSource[0], count: topSource[1] } : null,
    latest: history[0] || null
  };
}

async function handler(req, res) {
  if (req.method === 'GET') {
    const snapshot = await readSnapshot();
    return res.status(200).json({
      ok: true,
      storage: buildStorageMeta(),
      snapshot: {
        updatedAt: snapshot.updatedAt || null,
        count: Array.isArray(snapshot.history) ? snapshot.history.length : 0,
        history: Array.isArray(snapshot.history) ? snapshot.history : []
      },
      summary: buildHistorySummary(snapshot)
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const entry = body.entry || body.historyEntry;
    if (!entry) {
      return res.status(400).json({ error: 'Missing entry payload' });
    }
    const snapshot = await readSnapshot();
    const history = mergeHistoryEntries(snapshot.history, entry);
    const nextSnapshot = { updatedAt: new Date().toISOString(), history };
    await writeSnapshot(nextSnapshot);
    return res.status(200).json({
      ok: true,
      entry: normalizeAssetHistoryEntry(entry),
      storage: buildStorageMeta(),
      snapshot: {
        updatedAt: nextSnapshot.updatedAt,
        count: history.length,
        history
      },
      summary: buildHistorySummary(nextSnapshot)
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || String(error) });
  }
}

module.exports = handler;
module.exports.readSnapshot = readSnapshot;
module.exports.writeSnapshot = writeSnapshot;
module.exports.buildHistorySummary = buildHistorySummary;
module.exports.normalizeAssetHistoryEntry = normalizeAssetHistoryEntry;
module.exports.mergeHistoryEntries = mergeHistoryEntries;
