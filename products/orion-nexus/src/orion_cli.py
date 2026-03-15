#!/usr/bin/env python3
from __future__ import annotations

import argparse, csv, datetime as dt, json, math, pathlib, urllib.request

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


def load_close(path: pathlib.Path):
    rows=[]
    with path.open('r',encoding='utf-8') as f:
        for r in csv.DictReader(f):
            rows.append((dt.date.fromisoformat(r['date']), float(r['close'])))
    rows.sort(key=lambda x:x[0])
    return rows


def sig_sma(px,s=5,l=20):
    sig=[0]*len(px)
    for i in range(l,len(px)):
        sig[i]=1 if sum(px[i-s+1:i+1])/s > sum(px[i-l+1:i+1])/l else 0
    return sig

def sig_mom(px,k=15):
    sig=[0]*len(px)
    for i in range(k,len(px)): sig[i]=1 if px[i]>px[i-k] else 0
    return sig

def sig_meanrev(px,n=10,z=1.0):
    sig=[0]*len(px)
    for i in range(n,len(px)):
        w=px[i-n+1:i+1]; mu=sum(w)/n; sd=(sum((x-mu)**2 for x in w)/n)**0.5 or 1e-9
        zz=(px[i]-mu)/sd
        sig[i]=1 if zz<-z else (-1 if zz>z else 0)
    return sig


def backtest(px,sig,fee_bps=2.0):
    eq=[1.0]; prev=0
    for i in range(1,len(px)):
        ret=px[i]/px[i-1]-1
        pos=sig[i-1]
        cost=abs(pos-prev)*fee_bps/10000
        eq.append(eq[-1]*(1+pos*ret-cost)); prev=pos
    return eq


def stats(eq,days):
    tr=eq[-1]-1
    cagr=eq[-1]**(365/max(days,1))-1
    dr=[eq[i]/eq[i-1]-1 for i in range(1,len(eq))]
    mu=sum(dr)/len(dr)
    sd=(sum((x-mu)**2 for x in dr)/max(len(dr)-1,1))**0.5
    sharpe=(mu/sd*math.sqrt(252)) if sd>1e-12 else 0
    peak=eq[0]; mdd=0
    for v in eq:
        peak=max(peak,v); mdd=min(mdd,v/peak-1)
    return {'total_return':tr,'cagr':cagr,'sharpe':sharpe,'max_drawdown':mdd}


def run_backtest(symbol:str):
    path = DATA / f'{symbol.upper()}_stooq_daily.csv'
    if not path.exists():
        path = fetch_stooq(symbol)
    rows=load_close(path); dates=[d for d,_ in rows]; px=[p for _,p in rows]
    variants={
        'SMA(5,20)':sig_sma(px),
        'Momentum(15)':sig_mom(px),
        'MeanRev(10)':sig_meanrev(px),
    }
    res=[]
    for name,sig in variants.items():
        m=stats(backtest(px,sig), (dates[-1]-dates[0]).days)
        score=0.45*m['cagr']+0.35*m['sharpe']+0.2*m['max_drawdown']
        res.append({'strategy':name,'score':score,**m})
    res.sort(key=lambda x:x['score'], reverse=True)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT/f'{symbol.upper()}_backtest.json').write_text(json.dumps({'symbol':symbol.upper(),'rows':len(rows),'results':res},indent=2),encoding='utf-8')
    md=['# Backtest Report',f'Symbol: {symbol.upper()}',f'Rows: {len(rows)}','', '| Strategy | Total Return | CAGR | Sharpe | MaxDD | Score |','|---|---:|---:|---:|---:|---:|']
    for r in res:
        md.append(f"| {r['strategy']} | {r['total_return']*100:.2f}% | {r['cagr']*100:.2f}% | {r['sharpe']:.2f} | {r['max_drawdown']*100:.2f}% | {r['score']:.4f} |")
    (OUT/f'{symbol.upper()}_backtest.md').write_text('\n'.join(md),encoding='utf-8')
    return res


def render(symbol:str):
    data=json.loads((OUT/f'{symbol.upper()}_backtest.json').read_text(encoding='utf-8'))
    rs=data['results']; best=max(r['total_return'] for r in rs) if rs else 1
    cards=''.join([f"<div class='c'><h3>{r['strategy']}</h3><p>Return {r['total_return']*100:.2f}% | Sharpe {r['sharpe']:.2f}</p><div class='w'><div class='b' style='width:{max(6,int((r['total_return']/best)*100))}%'></div></div></div>" for r in rs])
    html=f"""<html><head><meta charset='utf-8'><style>body{{font-family:sans-serif;background:#0b1020;color:#eaf0ff;padding:20px}}.c{{background:#16203a;border-radius:10px;padding:12px;margin:10px 0}}.w{{background:#0f1730;height:10px;border-radius:999px}}.b{{background:#6bdcff;height:10px;border-radius:999px}}</style></head><body><h1>Orion Nexus: {symbol.upper()} Backtest</h1>{cards}</body></html>"""
    (OUT/f'{symbol.upper()}_report.html').write_text(html,encoding='utf-8')


def main():
    p=argparse.ArgumentParser()
    sp=p.add_subparsers(dest='cmd', required=True)
    pf=sp.add_parser('fetch'); pf.add_argument('--symbol',default='AAPL'); pf.add_argument('--source',default='stooq')
    pb=sp.add_parser('backtest'); pb.add_argument('--symbol',default='AAPL')
    pr=sp.add_parser('render'); pr.add_argument('--symbol',default='AAPL')
    a=p.parse_args()
    if a.cmd=='fetch':
        path=fetch_stooq(a.symbol)
        print(f'written: {path}')
        print('source=stooq, latency=daily (non-tick realtime)')
    elif a.cmd=='backtest':
        run_backtest(a.symbol)
        print(f'written: {OUT}/{a.symbol.upper()}_backtest.md')
        print(f'written: {OUT}/{a.symbol.upper()}_backtest.json')
    elif a.cmd=='render':
        render(a.symbol)
        print(f'written: {OUT}/{a.symbol.upper()}_report.html')

if __name__=='__main__':
    main()
