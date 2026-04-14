const fs = require('node:fs');
const path = require('node:path');

const MAX_SNAPSHOT_ENTRIES = 100;

function getLocalStorePath() {
  return process.env.LEAD_CAPTURE_LOCAL_PATH || '/tmp/passive-income-lab-leads.json';
}

function getKvRestUrl() {
  return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
}

function getKvRestToken() {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
}

function getKvStoreKey() {
  return process.env.LEAD_CAPTURE_KV_KEY || 'passive-income-lab:lead-capture:snapshot';
}

function hasKvStore() {
  return Boolean(getKvRestUrl() && getKvRestToken());
}

async function kvRequest(command, ...args) {
  const encodedArgs = args.map((item) => encodeURIComponent(String(item))).join('/');
  const url = `${getKvRestUrl().replace(/\/$/, '')}/${command}${encodedArgs ? `/${encodedArgs}` : ''}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getKvRestToken()}`
    }
  });
  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new Error(payload.error || `KV request failed: ${response.status}`);
  }
  return payload.result;
}

async function readKvStore() {
  const result = await kvRequest('get', getKvStoreKey());
  if (!result) return { entries: [] };
  try {
    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    return parsed && typeof parsed === 'object' ? parsed : { entries: [] };
  } catch (_error) {
    return { entries: [] };
  }
}

async function writeKvStore(snapshot) {
  await kvRequest('set', getKvStoreKey(), JSON.stringify(snapshot));
}

function readLocalStore() {
  try {
    return JSON.parse(fs.readFileSync(getLocalStorePath(), 'utf8'));
  } catch (_error) {
    return { entries: [] };
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
      mode: process.env.LEAD_CAPTURE_WEBHOOK_URL ? 'vercel-kv+webhook-forward' : 'vercel-kv',
      durable: true,
      provider: 'vercel-kv-rest',
      key: getKvStoreKey(),
      note: '已启用托管 KV 持久化，适合部署后让手机 / 电脑共享线索快照。',
      ...extra
    };
  }
  return {
    mode: process.env.LEAD_CAPTURE_WEBHOOK_URL ? 'local-file+webhook-forward' : 'local-file',
    durable: false,
    path: getLocalStorePath(),
    note: '本地文件存储适合本机 / 调试；若要真正持久化，建议配置 KV_REST_API_URL / KV_REST_API_TOKEN。',
    ...extra
  };
}

function normalizeLead(rawLead = {}) {
  const now = new Date().toISOString();
  return {
    id: String(rawLead.id || `lead-${now}`),
    name: String(rawLead.name || '未命名线索').trim() || '未命名线索',
    contact: String(rawLead.contact || '').trim(),
    channel: String(rawLead.channel || '待确认').trim() || '待确认',
    budget: String(rawLead.budget || '待确认').trim() || '待确认',
    priority: String(rawLead.priority || '中').trim() || '中',
    stage: String(rawLead.stage || '待跟进').trim() || '待跟进',
    need: String(rawLead.need || '待补充需求场景').trim() || '待补充需求场景',
    nextStep: String(rawLead.nextStep || '待确认下一步').trim() || '待确认下一步',
    productSlug: String(rawLead.productSlug || 'micro-saas').trim() || 'micro-saas',
    source: String(rawLead.source || 'manual').trim() || 'manual',
    originPage: String(rawLead.originPage || '').trim(),
    createdAt: String(rawLead.createdAt || now),
    updatedAt: String(rawLead.updatedAt || now)
  };
}

function pickPreferExisting(existingValue, incomingValue, placeholders = []) {
  if (incomingValue === undefined || incomingValue === null) return existingValue;
  const normalizedIncoming = String(incomingValue).trim();
  if (!normalizedIncoming) return existingValue;
  if (placeholders.includes(normalizedIncoming) && existingValue) return existingValue;
  return incomingValue;
}

function mergeEntries(entries, incomingLead) {
  const list = Array.isArray(entries) ? [...entries] : [];
  const index = list.findIndex((item) => item.id === incomingLead.id);
  if (index === -1) {
    list.unshift(incomingLead);
  } else {
    const existing = list[index] || {};
    const currentTs = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
    const incomingTs = new Date(incomingLead.updatedAt || incomingLead.createdAt || 0).getTime();
    list[index] = {
      ...existing,
      ...incomingLead,
      contact: pickPreferExisting(existing.contact, incomingLead.contact),
      channel: pickPreferExisting(existing.channel, incomingLead.channel, ['待确认']),
      budget: pickPreferExisting(existing.budget, incomingLead.budget, ['待确认']),
      priority: pickPreferExisting(existing.priority, incomingLead.priority, ['中']),
      source: pickPreferExisting(existing.source, incomingLead.source, ['manual']),
      originPage: pickPreferExisting(existing.originPage, incomingLead.originPage),
      createdAt: existing.createdAt || incomingLead.createdAt,
      updatedAt: new Date(Math.max(currentTs || 0, incomingTs || 0)).toISOString()
    };
  }
  return list
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, MAX_SNAPSHOT_ENTRIES);
}

function buildSnapshotSummary(snapshot = {}) {
  const entries = Array.isArray(snapshot.entries) ? snapshot.entries : [];
  const stageCounts = {};
  const productCounts = {};
  const sourceCounts = {};
  for (const entry of entries) {
    const stage = String(entry.stage || '待跟进').trim() || '待跟进';
    const product = String(entry.productSlug || 'micro-saas').trim() || 'micro-saas';
    const source = String(entry.source || entry.channel || 'manual').trim() || 'manual';
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    productCounts[product] = (productCounts[product] || 0) + 1;
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  }
  const topStage = Object.entries(stageCounts).sort((a, b) => b[1] - a[1])[0] || null;
  const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0] || null;
  const topSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0] || null;
  return {
    updatedAt: snapshot.updatedAt || null,
    count: entries.length,
    stageCounts,
    productCounts,
    sourceCounts,
    topStage: topStage ? { stage: topStage[0], count: topStage[1] } : null,
    topProduct: topProduct ? { productSlug: topProduct[0], count: topProduct[1] } : null,
    topSource: topSource ? { source: topSource[0], count: topSource[1] } : null
  };
}

async function forwardToWebhook(payload) {
  const url = process.env.LEAD_CAPTURE_WEBHOOK_URL;
  if (!url) return null;
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.LEAD_CAPTURE_WEBHOOK_AUTH) {
    headers.Authorization = process.env.LEAD_CAPTURE_WEBHOOK_AUTH;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  return { forwarded: true, ok: response.ok, status: response.status, url };
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const snapshot = await readSnapshot();
    return res.status(200).json({
      ok: true,
      storage: buildStorageMeta(),
      snapshot: {
        updatedAt: snapshot.updatedAt || null,
        count: Array.isArray(snapshot.entries) ? snapshot.entries.length : 0,
        entries: Array.isArray(snapshot.entries) ? snapshot.entries : []
      },
      summary: buildSnapshotSummary(snapshot)
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (!body.lead) {
      return res.status(400).json({ error: 'Missing lead payload' });
    }
    const lead = normalizeLead(body.lead);
    const snapshot = await readSnapshot();
    const nextEntries = mergeEntries(snapshot.entries, lead);
    const nextSnapshot = { updatedAt: new Date().toISOString(), entries: nextEntries };
    await writeSnapshot(nextSnapshot);
    const forwardResult = await forwardToWebhook({
      kind: 'lead-capture',
      source: body.source || 'passive-income-lab-api',
      lead,
      context: body.context || {},
      snapshot: { count: nextEntries.length, entries: nextEntries }
    });
    return res.status(200).json({
      ok: true,
      lead,
      storage: buildStorageMeta({ webhook: forwardResult }),
      snapshot: { updatedAt: nextSnapshot.updatedAt, count: nextEntries.length, entries: nextEntries },
      summary: buildSnapshotSummary(nextSnapshot)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || String(error) });
  }
};
