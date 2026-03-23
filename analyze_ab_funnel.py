#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import pathlib
from typing import Dict, Tuple

BASE = pathlib.Path('passive-income-lab')
OUT = BASE / 'outputs'


def load_data(path: pathlib.Path) -> Dict:
    return json.loads(path.read_text(encoding='utf-8'))


def rate(numerator: float, denominator: float) -> float:
    if denominator <= 0:
        return 0.0
    return numerator / denominator


def two_prop_z_test(x1: float, n1: float, x2: float, n2: float) -> Tuple[float, float]:
    if min(n1, n2) <= 0:
        return 0.0, 1.0
    p1 = x1 / n1
    p2 = x2 / n2
    p_pool = (x1 + x2) / (n1 + n2)
    denom = math.sqrt(max(p_pool * (1 - p_pool) * (1 / n1 + 1 / n2), 1e-12))
    z = (p2 - p1) / denom
    cdf = 0.5 * (1 + math.erf(abs(z) / math.sqrt(2)))
    p_value = 2 * (1 - cdf)
    return z, p_value


def analyze(payload: Dict) -> Dict:
    a = payload['variants']['A']
    b = payload['variants']['B']

    a_ctr = rate(a['clicks'], a['impressions'])
    b_ctr = rate(b['clicks'], b['impressions'])

    a_checkout = rate(a['checkout_starts'], a['clicks'])
    b_checkout = rate(b['checkout_starts'], b['clicks'])

    a_paid = rate(a['paid_orders'], a['clicks'])
    b_paid = rate(b['paid_orders'], b['clicks'])

    z_paid, p_paid = two_prop_z_test(a['paid_orders'], max(a['clicks'], 1), b['paid_orders'], max(b['clicks'], 1))

    sample_ok = min(a['clicks'], b['clicks']) >= payload.get('min_clicks_per_variant', 100)

    lift_paid = 0.0
    if a_paid > 0:
        lift_paid = (b_paid - a_paid) / a_paid

    decision = '继续收集样本'
    if sample_ok and p_paid < 0.1 and b_paid > a_paid:
        decision = 'B 胜出（可推广）'
    elif sample_ok and p_paid < 0.1 and a_paid > b_paid:
        decision = 'A 胜出（保留当前）'

    return {
        'generated_at': dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'input_file': payload.get('_source', ''),
        'sample_ok': sample_ok,
        'decision': decision,
        'metrics': {
            'A': {
                'ctr': a_ctr,
                'checkout_start_rate': a_checkout,
                'paid_conversion': a_paid,
            },
            'B': {
                'ctr': b_ctr,
                'checkout_start_rate': b_checkout,
                'paid_conversion': b_paid,
            },
            'paid_lift_vs_A': lift_paid,
            'paid_z_score': z_paid,
            'paid_p_value': p_paid,
        },
        'raw': payload['variants'],
    }


def render_markdown(result: Dict) -> str:
    m = result['metrics']
    return '\n'.join([
        '# A/B Funnel Report',
        f"Generated: {result['generated_at']}",
        f"Input: {result['input_file']}",
        '',
        '## 样本充足性',
        f"- sample_ok: **{result['sample_ok']}**",
        '',
        '## 关键指标（A vs B）',
        f"- CTR: {m['A']['ctr']*100:.2f}% vs {m['B']['ctr']*100:.2f}%",
        f"- Checkout Start Rate: {m['A']['checkout_start_rate']*100:.2f}% vs {m['B']['checkout_start_rate']*100:.2f}%",
        f"- Paid Conversion: {m['A']['paid_conversion']*100:.2f}% vs {m['B']['paid_conversion']*100:.2f}%",
        f"- Paid Lift (B vs A): {m['paid_lift_vs_A']*100:.2f}%",
        f"- p-value (paid conversion): {m['paid_p_value']:.4f}",
        '',
        '## 判定',
        f"- **{result['decision']}**",
        '',
        '## 下一步建议',
        '- 若 sample_ok=False：继续引流，直到每版点击 >=100。',
        '- 若 B 胜出：将 B 标题模板扩展到餐饮/跨境电商子包。',
        '- 若结果不显著：只改一个变量继续复测（标题/首屏价值点二选一）。',
    ])


def main() -> None:
    parser = argparse.ArgumentParser(description='Analyze A/B funnel metrics for digital product listings.')
    parser.add_argument('--input', required=True, help='Path to input JSON')
    parser.add_argument('--output-prefix', default='ab-test-micro-saas-latest', help='Output filename prefix under passive-income-lab/outputs')
    args = parser.parse_args()

    input_path = pathlib.Path(args.input)
    payload = load_data(input_path)
    payload['_source'] = str(input_path)

    result = analyze(payload)

    OUT.mkdir(parents=True, exist_ok=True)
    json_path = OUT / f'{args.output_prefix}.json'
    md_path = OUT / f'{args.output_prefix}.md'

    json_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    md_path.write_text(render_markdown(result), encoding='utf-8')

    print(f'written: {json_path}')
    print(f'written: {md_path}')


if __name__ == '__main__':
    main()
