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

function meanRevSignal(px, n = 10, z = 1.0) {
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

function backtest(px, sig, feeBps = 2.0) {
  let eq = 1.0;
  let peak = 1.0;
  let mdd = 0;
  let prev = 0;
  let trades = 0;
  let wins = 0;
  const daily = [];

  for (let i = 1; i < px.length; i++) {
    const ret = px[i] / px[i - 1] - 1;
    const pos = sig[i - 1];
    const cost = Math.abs(pos - prev) * feeBps / 10000;
    if (pos !== prev) trades++;
    const dr = pos * ret - cost;
    if (dr > 0) wins++;
    daily.push(dr);
    eq *= 1 + dr;
    peak = Math.max(peak, eq);
    mdd = Math.min(mdd, eq / peak - 1);
    prev = pos;
  }

  const mu = daily.length ? daily.reduce((a, b) => a + b, 0) / daily.length : 0;
  const sd = daily.length > 1
    ? Math.sqrt(daily.reduce((a, x) => a + (x - mu) ** 2, 0) / (daily.length - 1))
    : 0;
  const annBars = 252 * 78;
  const sharpe = sd > 1e-12 ? (mu / sd) * Math.sqrt(annBars) : 0;

  return {
    total_return: eq - 1,
    sharpe,
    max_drawdown: mdd,
    win_rate: daily.length ? wins / daily.length : 0,
    trades
  };
}

async function loadYahoo(symbol, interval = "5m", range = "5d") {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false&events=div%2Csplit`;
  const r = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 OrionNexusWeb/1.0" }
  });
  if (!r.ok) throw new Error(`Yahoo API ${r.status}`);
  const data = await r.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error("No Yahoo result");
  const ts = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];

  const rows = [];
  for (let i = 0; i < Math.min(ts.length, closes.length); i++) {
    if (closes[i] == null) continue;
    rows.push({
      datetime: new Date(ts[i] * 1000).toISOString(),
      close: Number(closes[i])
    });
  }
  if (!rows.length) throw new Error("Empty rows");
  return rows;
}

module.exports = async function handler(req, res) {
  try {
    const symbol = String(req.query.symbol || "AAPL").toUpperCase();
    const rows = await loadYahoo(symbol, "5m", "5d");
    const px = rows.map((x) => x.close);

    const strategies = {
      "SMA(5,20)": smaSignal(px),
      "Momentum(15)": momSignal(px),
      "MeanRev(10)": meanRevSignal(px)
    };

    const results = Object.fromEntries(
      Object.entries(strategies).map(([k, sig]) => [k, backtest(px, sig)])
    );

    const latest = {
      time: rows[rows.length - 1].datetime,
      price: rows[rows.length - 1].close,
      "SMA(5,20)": strategies["SMA(5,20)"][px.length - 1],
      "Momentum(15)": strategies["Momentum(15)"][px.length - 1],
      "MeanRev(10)": strategies["MeanRev(10)"][px.length - 1]
    };

    return res.status(200).json({
      symbol,
      bars: rows.length,
      start: rows[0].datetime,
      end: rows[rows.length - 1].datetime,
      latest,
      results
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
}
