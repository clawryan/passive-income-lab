const { readSnapshot } = require('../lead-capture');
const { buildLeadSourceDailyPayload, forwardDailyPayload, saveDailyHistory, buildHistoryStorageMeta } = require('../lead-source-daily');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  try {
    const snapshot = await readSnapshot();
    const payload = buildLeadSourceDailyPayload(snapshot);
    const forwardResult = await forwardDailyPayload(payload);
    const webhook = forwardResult || { forwarded: false, skipped: true, reason: 'LEAD_SOURCE_DAILY_WEBHOOK_URL is not configured' };
    const historyStore = await saveDailyHistory(payload, webhook, req.method === 'GET' ? 'cron-get' : 'cron-post');

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
