function smaSignal(px, s = 5, l = 20) {
  const sig = new Array(px.length).fill(0);
  for (let i = l; i < px.length; i++) {
    const sAvg = px.slice(i - s + 1, i + 1).reduce((a, b) => a + b, 0) / s;
    const lAvg = px.slice(i - l + 1, i + 1).reduce((a, b) => a + b, 0) / l;
    sig[i] = sAvg > lAvg ? 1 : 0;
  }
  return sig;
}
function momSignal(px, k = 15) {
  const sig = new Array(px.length).fill(0);
  for (let i = k; i < px.length; i++) sig[i] = px[i] > px[i - k] ? 1 : 0;
  return sig;
}
function meanRevSignal(px, n = 10, z = 1) {
  const sig = new Array(px.length).fill(0);
  for (let i = n; i < px.length; i++) {
    const w = px.slice(i - n + 1, i + 1);
    const mu = w.reduce((a, b) => a + b, 0) / n;
    const sd = Math.sqrt(w.reduce((a, x) => a + (x - mu) ** 2, 0) / n) || 1e-9;
    const zz = (px[i] - mu) / sd;
    sig[i] = zz < -z ? 1 : zz > z ? -1 : 0;
  }
  return sig;
}
function signalByName(name, px) {
  if (name === 'momentum') return momSignal(px);
  if (name === 'meanrev') return meanRevSignal(px);
  return smaSignal(px);
}

function backtest(px, sig, feeBps = 2) {
  let eq = 1, peak = 1, mdd = 0, prev = 0, trades = 0;
  const rs = [];
  for (let i = 1; i < px.length; i++) {
    const ret = px[i] / px[i - 1] - 1;
    const pos = sig[i - 1];
    const cost = Math.abs(pos - prev) * feeBps / 10000;
    if (pos !== prev) trades++;
    const r = pos * ret - cost;
    rs.push(r);
    eq *= (1 + r);
    peak = Math.max(peak, eq);
    mdd = Math.min(mdd, eq / peak - 1);
    prev = pos;
  }
  const mu = rs.length ? rs.reduce((a, b) => a + b, 0) / rs.length : 0;
  const sd = rs.length > 1 ? Math.sqrt(rs.reduce((a, x) => a + (x - mu) ** 2, 0) / (rs.length - 1)) : 0;
  const sharpe = sd > 1e-12 ? (mu / sd) * Math.sqrt(252 * 78) : 0;
  const winRate = rs.length ? rs.filter(x => x > 0).length / rs.length : 0;
  return { returns: rs, total_return: eq - 1, sharpe, max_drawdown: mdd, win_rate: winRate, trades };
}

async function loadYahoo(symbol, interval = '5m', range = '5d') {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false&events=div%2Csplit`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 OrionNexus/1.0' } });
  if (!r.ok) throw new Error(`${symbol} yahoo api ${r.status}`);
  const data = await r.json();
  const result = data?.chart?.result?.[0];
  const ts = result?.timestamp || [];
  const close = result?.indicators?.quote?.[0]?.close || [];
  const rows = [];
  for (let i = 0; i < Math.min(ts.length, close.length); i++) {
    if (close[i] == null) continue;
    rows.push({ t: new Date(ts[i] * 1000).toISOString(), c: Number(close[i]) });
  }
  if (!rows.length) throw new Error(`${symbol} empty`);
  return rows;
}

function score(m) {
  return 0.45 * m.total_return + 0.35 * (m.sharpe / 10) + 0.20 * m.max_drawdown;
}

module.exports = async function handler(req, res) {
  try {
    const universe = String(req.query.universe || 'AAPL,NVDA,MSFT,AMZN,META,TSLA').toUpperCase().split(',').map(s => s.trim()).filter(Boolean);
    const strategy = String(req.query.strategy || 'sma').toLowerCase();
    const topN = Math.max(1, Math.min(6, Number(req.query.topN || 3)));

    const all = [];
    for (const s of universe) {
      try {
        const rows = await loadYahoo(s);
        const px = rows.map(x => x.c);
        const sig = signalByName(strategy, px);
        const m = backtest(px, sig);
        const latestSignal = sig[sig.length - 1];
        all.push({
          symbol: s,
          bars: px.length,
          latest_time: rows[rows.length - 1].t,
          latest_price: px[px.length - 1],
          latest_signal: latestSignal,
          reason: latestSignal > 0 ? 'signal=LONG' : latestSignal < 0 ? 'signal=SHORT' : 'signal=FLAT',
          ...m,
          score: score(m)
        });
      } catch (e) {
        all.push({ symbol: s, error: e.message });
      }
    }

    const tradable = all.filter(x => !x.error);
    const selected = tradable
      .filter(x => x.latest_signal !== 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);

    const fallback = selected.length ? selected : tradable.sort((a, b) => b.score - a.score).slice(0, topN);
    const portfolioReturns = [];
    if (fallback.length) {
      const minLen = Math.min(...fallback.map(x => x.returns.length));
      for (let i = 0; i < minLen; i++) {
        portfolioReturns.push(fallback.reduce((acc, x) => acc + x.returns[x.returns.length - minLen + i], 0) / fallback.length);
      }
    }
    let eq = 1, peak = 1, mdd = 0;
    for (const r of portfolioReturns) { eq *= (1 + r); peak = Math.max(peak, eq); mdd = Math.min(mdd, eq / peak - 1); }
    const mu = portfolioReturns.length ? portfolioReturns.reduce((a,b)=>a+b,0)/portfolioReturns.length : 0;
    const sd = portfolioReturns.length>1 ? Math.sqrt(portfolioReturns.reduce((a,x)=>a+(x-mu)**2,0)/(portfolioReturns.length-1)) : 0;
    const sharpe = sd > 1e-12 ? (mu / sd) * Math.sqrt(252 * 78) : 0;

    const [spyRows, qqqRows] = await Promise.all([loadYahoo('SPY'), loadYahoo('QQQ')]);
    const benchReturn = (rows) => rows.length > 1 ? rows[rows.length - 1].c / rows[0].c - 1 : 0;

    res.status(200).json({
      strategy,
      universe,
      selected: fallback.map(x => ({
        symbol: x.symbol,
        reason: x.reason,
        total_return: x.total_return,
        sharpe: x.sharpe,
        max_drawdown: x.max_drawdown,
        win_rate: x.win_rate,
        trades: x.trades,
        latest_price: x.latest_price,
        latest_time: x.latest_time
      })),
      universe_metrics: all,
      portfolio: {
        holdings: fallback.map(x => x.symbol),
        total_return: eq - 1,
        sharpe,
        max_drawdown: mdd
      },
      benchmark: {
        SPY: benchReturn(spyRows),
        QQQ: benchReturn(qqqRows)
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message || String(e) });
  }
};
