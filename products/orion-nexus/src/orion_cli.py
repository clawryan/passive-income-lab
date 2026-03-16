#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import math
import pathlib
import urllib.request
import time

BASE = pathlib.Path('passive-income-lab/products/orion-nexus')
DATA = BASE / 'data'
OUT = BASE / 'output'


def fetch_stooq(symbol: str) -> pathlib.Path:
    url = f'https://stooq.com/q/d/l/?s={symbol.lower()}.us&i=d'
    DATA.mkdir(parents=True, exist_ok=True)
    out = DATA / f'{symbol.upper()}_stooq_daily.csv'
    raw = urllib.request.urlopen(url, timeout=20).read().decode('utf-8', errors='ignore')
    lines = [x for x in raw.splitlines() if x.strip()]
    if not lines or 'Date' not in lines[0]:
        raise RuntimeError('stooq data unavailable')
    with out.open('w', encoding='utf-8', newline='') as f:
        w = csv.writer(f)
        w.writerow(['date', 'close'])
        r = csv.DictReader(lines)
        for row in r:
            if row.get('Close') and row['Close'] != '0':
                w.writerow([row['Date'], row['Close']])
    return out


def fetch_yahoo_intraday(symbol: str, interval: str = '5m', range_: str = '5d') -> pathlib.Path:
    url = (
        f'https://query1.finance.yahoo.com/v8/finance/chart/{symbol.upper()}?'
        f'interval={interval}&range={range_}&includePrePost=false&events=div%2Csplit'
    )
    DATA.mkdir(parents=True, exist_ok=True)
    out = DATA / f'{symbol.upper()}_yahoo_{interval}_{range_}.csv'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 OrionNexus/1.0'})
    try:
        raw = urllib.request.urlopen(req, timeout=20).read().decode('utf-8', errors='ignore')
    except Exception:
        time.sleep(2)
        raw = urllib.request.urlopen(req, timeout=20).read().decode('utf-8', errors='ignore')
    payload = json.loads(raw)
    result = payload.get('chart', {}).get('result', [])
    if not result:
        raise RuntimeError('yahoo chart data unavailable')

    rs = result[0]
    timestamps = rs.get('timestamp') or []
    quote = (rs.get('indicators', {}).get('quote') or [{}])[0]
    closes = quote.get('close') or []
    if not timestamps or not closes:
        raise RuntimeError('yahoo chart empty')

    with out.open('w', encoding='utf-8', newline='') as f:
        w = csv.writer(f)
        w.writerow(['datetime', 'close'])
        for ts, c in zip(timestamps, closes):
            if c is None:
                continue
            t = dt.datetime.utcfromtimestamp(ts).isoformat(timespec='seconds')
            w.writerow([t, c])
    return out


def load_close(path: pathlib.Path):
    rows = []
    with path.open('r', encoding='utf-8') as f:
        for r in csv.DictReader(f):
            rows.append((dt.date.fromisoformat(r['date']), float(r['close'])))
    rows.sort(key=lambda x: x[0])
    return rows


def sig_sma(px, s=5, l=20):
    sig = [0] * len(px)
    for i in range(l, len(px)):
        sig[i] = 1 if sum(px[i - s + 1:i + 1]) / s > sum(px[i - l + 1:i + 1]) / l else 0
    return sig


def sig_mom(px, k=15):
    sig = [0] * len(px)
    for i in range(k, len(px)):
        sig[i] = 1 if px[i] > px[i - k] else 0
    return sig


def sig_meanrev(px, n=10, z=1.0):
    sig = [0] * len(px)
    for i in range(n, len(px)):
        w = px[i - n + 1:i + 1]
        mu = sum(w) / n
        sd = (sum((x - mu) ** 2 for x in w) / n) ** 0.5 or 1e-9
        zz = (px[i] - mu) / sd
        sig[i] = 1 if zz < -z else (-1 if zz > z else 0)
    return sig


def backtest(px, sig, fee_bps=2.0):
    eq = [1.0]
    prev = 0
    trades = 0
    daily = []
    for i in range(1, len(px)):
        ret = px[i] / px[i - 1] - 1
        pos = sig[i - 1]
        cost = abs(pos - prev) * fee_bps / 10000
        if pos != prev:
            trades += 1
        dr = pos * ret - cost
        daily.append(dr)
        eq.append(eq[-1] * (1 + dr))
        prev = pos
    return eq, daily, trades


def stats(eq, daily, days, trades):
    tr = eq[-1] - 1
    cagr = eq[-1] ** (365 / max(days, 1)) - 1
    mu = (sum(daily) / len(daily)) if daily else 0
    sd = (sum((x - mu) ** 2 for x in daily) / max(len(daily) - 1, 1)) ** 0.5 if daily else 0
    downside = (sum((min(0, x - 0.0)) ** 2 for x in daily) / max(len(daily), 1)) ** 0.5 if daily else 0
    sharpe = (mu / sd * math.sqrt(252)) if sd > 1e-12 else 0
    sortino = (mu / downside * math.sqrt(252)) if downside > 1e-12 else 0
    peak = eq[0]
    mdd = 0
    for v in eq:
        peak = max(peak, v)
        mdd = min(mdd, v / peak - 1)
    vol = sd * math.sqrt(252)
    calmar = (cagr / abs(mdd)) if mdd < -1e-12 else 0
    wins = [x for x in daily if x > 0]
    win_rate = (len(wins) / len(daily)) if daily else 0
    turnover = trades / max(len(daily), 1)
    return {
        'total_return': tr,
        'cagr': cagr,
        'sharpe': sharpe,
        'sortino': sortino,
        'max_drawdown': mdd,
        'vol_annual': vol,
        'calmar': calmar,
        'win_rate': win_rate,
        'trades': trades,
        'turnover': turnover,
    }


def evaluate_variant(name, px, sig, dates):
    eq, daily, trades = backtest(px, sig)
    m = stats(eq, daily, (dates[-1] - dates[0]).days, trades)
    score = 0.35 * m['cagr'] + 0.25 * m['sharpe'] + 0.15 * m['sortino'] + 0.1 * m['calmar'] + 0.15 * m['max_drawdown']
    return {'strategy': name, 'score': score, **m}


def walk_forward_snapshot(px, dates):
    if len(px) < 120:
        return {'enabled': False, 'reason': 'insufficient_rows'}
    split = int(len(px) * 0.7)
    variants = {
        'SMA(5,20)': sig_sma(px),
        'Momentum(15)': sig_mom(px),
        'MeanRev(10)': sig_meanrev(px),
    }
    wf = []
    for name, sig in variants.items():
        in_px, in_sig, in_dates = px[:split], sig[:split], dates[:split]
        out_px, out_sig, out_dates = px[split - 1:], sig[split - 1:], dates[split - 1:]
        i_eq, i_daily, i_trades = backtest(in_px, in_sig)
        o_eq, o_daily, o_trades = backtest(out_px, out_sig)
        ins = stats(i_eq, i_daily, (in_dates[-1] - in_dates[0]).days, i_trades)
        oos = stats(o_eq, o_daily, (out_dates[-1] - out_dates[0]).days, o_trades)
        stability = (oos['cagr'] / ins['cagr']) if abs(ins['cagr']) > 1e-9 else 0
        wf.append({
            'strategy': name,
            'in_sample_cagr': ins['cagr'],
            'out_sample_cagr': oos['cagr'],
            'out_sample_sharpe': oos['sharpe'],
            'stability_ratio': stability,
        })
    return {'enabled': True, 'split_index': split, 'rows': len(px), 'results': wf}


def run_backtest(symbol: str):
    path = DATA / f'{symbol.upper()}_stooq_daily.csv'
    if not path.exists():
        path = fetch_stooq(symbol)
    rows = load_close(path)
    dates = [d for d, _ in rows]
    px = [p for _, p in rows]
    variants = {
        'SMA(5,20)': sig_sma(px),
        'Momentum(15)': sig_mom(px),
        'MeanRev(10)': sig_meanrev(px),
    }
    res = [evaluate_variant(name, px, sig, dates) for name, sig in variants.items()]
    res.sort(key=lambda x: x['score'], reverse=True)
    wf = walk_forward_snapshot(px, dates)

    OUT.mkdir(parents=True, exist_ok=True)
    payload = {
        'symbol': symbol.upper(),
        'rows': len(rows),
        'generated_at': dt.datetime.now().isoformat(timespec='seconds'),
        'data_source': 'stooq_daily',
        'results': res,
        'walk_forward': wf,
    }
    (OUT / f'{symbol.upper()}_backtest.json').write_text(json.dumps(payload, indent=2), encoding='utf-8')

    md = [
        '# Backtest Report',
        f'Symbol: {symbol.upper()}',
        f'Rows: {len(rows)}',
        '',
        '| Strategy | Total Return | CAGR | Sharpe | Sortino | MaxDD | WinRate | Trades | Score |',
        '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
    ]
    for r in res:
        md.append(
            f"| {r['strategy']} | {r['total_return'] * 100:.2f}% | {r['cagr'] * 100:.2f}% | {r['sharpe']:.2f} | {r['sortino']:.2f} | {r['max_drawdown'] * 100:.2f}% | {r['win_rate'] * 100:.1f}% | {r['trades']} | {r['score']:.4f} |"
        )

    if wf.get('enabled'):
        md += [
            '',
            '## Walk-forward Snapshot (70/30 split)',
            '| Strategy | IS CAGR | OOS CAGR | OOS Sharpe | Stability |',
            '|---|---:|---:|---:|---:|',
        ]
        for x in wf['results']:
            md.append(
                f"| {x['strategy']} | {x['in_sample_cagr'] * 100:.2f}% | {x['out_sample_cagr'] * 100:.2f}% | {x['out_sample_sharpe']:.2f} | {x['stability_ratio']:.2f} |"
            )

    (OUT / f'{symbol.upper()}_backtest.md').write_text('\n'.join(md), encoding='utf-8')
    return res


def render(symbol: str):
    data = json.loads((OUT / f'{symbol.upper()}_backtest.json').read_text(encoding='utf-8'))
    rs = data['results']
    best = max(r['total_return'] for r in rs) if rs else 1
    cards = ''.join([
        f"<div class='c'><h3>{r['strategy']}</h3><p>Return {r['total_return'] * 100:.2f}% | Sharpe {r['sharpe']:.2f} | Sortino {r['sortino']:.2f} | Win {r['win_rate'] * 100:.1f}%</p><div class='w'><div class='b' style='width:{max(6, int((r['total_return'] / best) * 100))}%'></div></div></div>"
        for r in rs
    ])
    html = f"""<html><head><meta charset='utf-8'><style>body{{font-family:sans-serif;background:#0b1020;color:#eaf0ff;padding:20px}}.c{{background:#16203a;border-radius:10px;padding:12px;margin:10px 0}}.w{{background:#0f1730;height:10px;border-radius:999px}}.b{{background:#6bdcff;height:10px;border-radius:999px}}</style></head><body><h1>Orion Nexus: {symbol.upper()} Backtest</h1>{cards}</body></html>"""
    (OUT / f'{symbol.upper()}_report.html').write_text(html, encoding='utf-8')


def paper_prepare(symbol: str, strategy: str = ''):
    from broker_adapter_design import build_paper_trade_plan

    path = OUT / f'{symbol.upper()}_backtest.json'
    if not path.exists():
        run_backtest(symbol)
    data = json.loads(path.read_text(encoding='utf-8'))
    plan = build_paper_trade_plan(data, symbol=symbol.upper(), prefer_strategy=strategy or None)
    out = OUT / f'{symbol.upper()}_paper_trade_plan.json'
    out.write_text(json.dumps(plan, indent=2), encoding='utf-8')
    return out


def main():
    p = argparse.ArgumentParser()
    sp = p.add_subparsers(dest='cmd', required=True)
    pf = sp.add_parser('fetch')
    pf.add_argument('--symbol', default='AAPL')
    pf.add_argument('--source', default='stooq')
    pb = sp.add_parser('backtest')
    pb.add_argument('--symbol', default='AAPL')
    pr = sp.add_parser('render')
    pr.add_argument('--symbol', default='AAPL')
    pp = sp.add_parser('paper-prep')
    pp.add_argument('--symbol', default='AAPL')
    pp.add_argument('--strategy', default='')

    a = p.parse_args()
    if a.cmd == 'fetch':
        if a.source == 'stooq':
            path = fetch_stooq(a.symbol)
            print(f'written: {path}')
            print('source=stooq, latency=daily (non-tick realtime)')
        elif a.source == 'yahoo':
            path = fetch_yahoo_intraday(a.symbol)
            print(f'written: {path}')
            print('source=yahoo chart api, latency=usually minute-level delayed')
        else:
            raise ValueError("--source must be 'stooq' or 'yahoo'")
    elif a.cmd == 'backtest':
        run_backtest(a.symbol)
        print(f'written: {OUT}/{a.symbol.upper()}_backtest.md')
        print(f'written: {OUT}/{a.symbol.upper()}_backtest.json')
    elif a.cmd == 'render':
        render(a.symbol)
        print(f'written: {OUT}/{a.symbol.upper()}_report.html')
    elif a.cmd == 'paper-prep':
        out = paper_prepare(a.symbol, a.strategy)
        print(f'written: {out}')
        print('paper-only payload generated (no live order submitted)')


if __name__ == '__main__':
    main()
