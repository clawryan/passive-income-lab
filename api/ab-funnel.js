function rate(numerator, denominator) {
  if (!denominator || denominator <= 0) return 0;
  return numerator / denominator;
}

function twoPropZTest(x1, n1, x2, n2) {
  if (Math.min(n1, n2) <= 0) return { z: 0, pValue: 1 };
  const p1 = x1 / n1;
  const p2 = x2 / n2;
  const pPool = (x1 + x2) / (n1 + n2);
  const denom = Math.sqrt(Math.max(pPool * (1 - pPool) * (1 / n1 + 1 / n2), 1e-12));
  const z = (p2 - p1) / denom;
  const cdf = 0.5 * (1 + erf(Math.abs(z) / Math.sqrt(2)));
  const pValue = 2 * (1 - cdf);
  return { z, pValue };
}

function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * ax);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

function decide(payload) {
  const a = payload.variants?.A || {};
  const b = payload.variants?.B || {};
  const minClicks = Number(payload.min_clicks_per_variant || 100);

  const metrics = {
    A: {
      ctr: rate(Number(a.clicks || 0), Number(a.impressions || 0)),
      checkoutStartRate: rate(Number(a.checkout_starts || 0), Number(a.clicks || 0)),
      paidConversion: rate(Number(a.paid_orders || 0), Number(a.clicks || 0))
    },
    B: {
      ctr: rate(Number(b.clicks || 0), Number(b.impressions || 0)),
      checkoutStartRate: rate(Number(b.checkout_starts || 0), Number(b.clicks || 0)),
      paidConversion: rate(Number(b.paid_orders || 0), Number(b.clicks || 0))
    }
  };

  const { z, pValue } = twoPropZTest(
    Number(a.paid_orders || 0),
    Math.max(Number(a.clicks || 0), 1),
    Number(b.paid_orders || 0),
    Math.max(Number(b.clicks || 0), 1)
  );

  const sampleOk = Math.min(Number(a.clicks || 0), Number(b.clicks || 0)) >= minClicks;
  const liftPaidVsA = metrics.A.paidConversion > 0
    ? (metrics.B.paidConversion - metrics.A.paidConversion) / metrics.A.paidConversion
    : 0;

  let decision = '继续收集样本';
  if (sampleOk && pValue < 0.1 && metrics.B.paidConversion > metrics.A.paidConversion) {
    decision = 'B 胜出（可推广）';
  } else if (sampleOk && pValue < 0.1 && metrics.A.paidConversion > metrics.B.paidConversion) {
    decision = 'A 胜出（保留当前）';
  }

  return {
    generatedAt: new Date().toISOString(),
    sampleOk,
    decision,
    metrics: {
      ...metrics,
      paidLiftVsA: liftPaidVsA,
      paidZScore: z,
      paidPValue: pValue
    },
    nextActions: [
      sampleOk ? '样本已达阈值，可按支付转化与显著性决定是否扩量。' : `继续引流，先把每个版本点击补到 >= ${minClicks}。`,
      decision.startsWith('B 胜出') ? '把 B 的标题/首屏价值点复制到其他垂直子包继续验证。' : '若未显著，只改一个变量继续复测。'
    ],
    raw: payload.variants
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    if (!body.variants?.A || !body.variants?.B) {
      return res.status(400).json({ error: 'Missing variants.A / variants.B payload' });
    }
    return res.status(200).json(decide(body));
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
};
