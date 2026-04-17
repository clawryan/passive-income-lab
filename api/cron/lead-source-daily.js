const { readSnapshot } = require('../lead-capture');
const { buildLeadSourceDailyPayload, forwardDailyPayload } = require('../lead-source-daily');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  }

  try {
    const snapshot = await readSnapshot();
    const payload = buildLeadSourceDailyPayload(snapshot);
    const forwardResult = await forwardDailyPayload(payload);

    return res.status(200).json({
      ok: true,
      triggeredBy: req.method === 'GET' ? 'cron-get' : 'cron-post',
      ...payload,
      webhook: forwardResult || { forwarded: false, skipped: true, reason: 'LEAD_SOURCE_DAILY_WEBHOOK_URL is not configured' }
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || String(error) });
  }
};
