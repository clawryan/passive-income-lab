const fs = require('node:fs');
const path = require('node:path');

const LOCAL_STORE_PATH = process.env.LEAD_CAPTURE_LOCAL_PATH || '/tmp/passive-income-lab-leads.json';
const MAX_SNAPSHOT_ENTRIES = 100;

function readLocalStore() {
  try {
    return JSON.parse(fs.readFileSync(LOCAL_STORE_PATH, 'utf8'));
  } catch (_error) {
    return { entries: [] };
  }
}

function writeLocalStore(snapshot) {
  fs.mkdirSync(path.dirname(LOCAL_STORE_PATH), { recursive: true });
  fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(snapshot, null, 2));
}

function normalizeLead(rawLead = {}) {
  const now = new Date().toISOString();
  return {
    id: String(rawLead.id || `lead-${now}`),
    name: String(rawLead.name || '未命名线索').trim() || '未命名线索',
    channel: String(rawLead.channel || '待确认').trim() || '待确认',
    budget: String(rawLead.budget || '待确认').trim() || '待确认',
    priority: String(rawLead.priority || '中').trim() || '中',
    stage: String(rawLead.stage || '待跟进').trim() || '待跟进',
    need: String(rawLead.need || '待补充需求场景').trim() || '待补充需求场景',
    nextStep: String(rawLead.nextStep || '待确认下一步').trim() || '待确认下一步',
    productSlug: String(rawLead.productSlug || 'micro-saas').trim() || 'micro-saas',
    createdAt: String(rawLead.createdAt || now),
    updatedAt: String(rawLead.updatedAt || now)
  };
}

function mergeEntries(entries, incomingLead) {
  const list = Array.isArray(entries) ? [...entries] : [];
  const index = list.findIndex((item) => item.id === incomingLead.id);
  if (index === -1) {
    list.unshift(incomingLead);
  } else {
    const currentTs = new Date(list[index].updatedAt || list[index].createdAt || 0).getTime();
    const incomingTs = new Date(incomingLead.updatedAt || incomingLead.createdAt || 0).getTime();
    if (incomingTs >= currentTs) {
      list[index] = { ...list[index], ...incomingLead };
    }
  }
  return list
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, MAX_SNAPSHOT_ENTRIES);
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
    const snapshot = readLocalStore();
    return res.status(200).json({
      ok: true,
      storage: {
        mode: process.env.LEAD_CAPTURE_WEBHOOK_URL ? 'local-file+webhook-forward' : 'local-file',
        path: LOCAL_STORE_PATH,
        durable: false,
        note: '本地文件存储适合本机 / 调试；若要真正持久化，建议再接 webhook 到 n8n / 数据库。'
      },
      snapshot: {
        count: Array.isArray(snapshot.entries) ? snapshot.entries.length : 0,
        entries: Array.isArray(snapshot.entries) ? snapshot.entries : []
      }
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
    const snapshot = readLocalStore();
    const nextEntries = mergeEntries(snapshot.entries, lead);
    const nextSnapshot = { updatedAt: new Date().toISOString(), entries: nextEntries };
    writeLocalStore(nextSnapshot);
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
      storage: {
        mode: forwardResult ? 'local-file+webhook-forward' : 'local-file',
        path: LOCAL_STORE_PATH,
        durable: false,
        webhook: forwardResult
      },
      snapshot: { count: nextEntries.length, entries: nextEntries }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || String(error) });
  }
};
