const { readSnapshot } = require('../lead-capture');
const { buildLeadFollowupTodosPayload, forwardTodosPayload, saveTodosHistory, buildHistoryStorageMeta, readHistoryStore } = require('../lead-followup-todos');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  try {
    const snapshot = await readSnapshot();
    const previousHistoryStore = await readHistoryStore();
    const payload = buildLeadFollowupTodosPayload(snapshot, { previousEntry: previousHistoryStore.latest || null });
    const forwardResult = await forwardTodosPayload(payload);
    const webhook = forwardResult || { forwarded: false, skipped: true, reason: 'LEAD_FOLLOWUP_TODOS_WEBHOOK_URL is not configured' };
    const historyStore = await saveTodosHistory(payload, webhook, req.method === 'GET' ? 'cron-get' : 'cron-post');

    return res.status(200).json({
      ok: true,
      triggeredBy: req.method === 'GET' ? 'cron-get' : 'cron-post',
      ...payload,
      webhook,
      latest: historyStore.latest || null,
      history: historyStore.history || [],
      historyStorage: buildHistoryStorageMeta()
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || String(error) });
  }
};
