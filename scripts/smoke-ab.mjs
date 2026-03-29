import handler from '../api/ab-funnel.js';

const payload = {
  min_clicks_per_variant: 100,
  variants: {
    A: { impressions: 1200, clicks: 108, checkout_starts: 22, paid_orders: 6 },
    B: { impressions: 1180, clicks: 116, checkout_starts: 29, paid_orders: 10 }
  }
};

const req = { method: 'POST', body: payload };
const result = {};
const res = {
  status(code) {
    result.statusCode = code;
    return this;
  },
  json(data) {
    result.body = data;
    return this;
  }
};

await handler(req, res);

if (result.statusCode !== 200) {
  console.error('A/B API 冒烟失败：状态码异常', result.statusCode, result.body);
  process.exit(1);
}

const requiredKeys = ['decision', 'metrics', 'nextActions', 'sampleOk', 'generatedAt'];
const missing = requiredKeys.filter((key) => !(key in (result.body || {})));
if (missing.length) {
  console.error('A/B API 冒烟失败：缺少字段', missing, result.body);
  process.exit(1);
}

console.log('A/B API 冒烟通过:', {
  statusCode: result.statusCode,
  decision: result.body.decision,
  sampleOk: result.body.sampleOk,
  paidLiftVsA: result.body.metrics?.paidLiftVsA,
  paidPValue: result.body.metrics?.paidPValue
});
