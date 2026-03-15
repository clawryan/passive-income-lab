#!/usr/bin/env python3
from __future__ import annotations

import datetime as dt
import json
import pathlib

BASE = pathlib.Path('passive-income-lab')
OUT = BASE / 'outputs'


def load_json(p: pathlib.Path, default):
    if p.exists():
        return json.loads(p.read_text(encoding='utf-8'))
    return default


def build():
    OUT.mkdir(parents=True, exist_ok=True)

    title_eval = load_json(OUT / 'title-value-eval-micro-saas.json', {})
    pack = load_json(OUT / 'prompt-pack-micro-saas-launch-v2.json', {})

    mean_delta = title_eval.get('delta_avg_score', 0)
    prompt_count = pack.get('count', len(pack.get('items', []))) if isinstance(pack, dict) else 0

    now = dt.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    thresholds = {
        'landing_ctr_good': 0.025,
        'checkout_start_good': 0.05,
        'paid_conversion_good': 0.012,
        'refund_rate_max': 0.06,
        'title_score_delta_min': 4.0,
    }

    actions_24h = [
        '在同一销售渠道上架 v1/v2 两版商品页（仅改标题+首屏价值点），保持价格一致。',
        '将 outputs/gumroad-listing-micro-saas-v2.md 作为 v2 商品详情直接粘贴上线。',
        '为两个链接分别加 UTM 参数，开始记录 visits / checkout / paid。',
        '在 2 个既有分发渠道各发 1 条（X/小红书/社群任选），文案不超过 120 字，统一 CTA 到商品页。',
        '当天收集前 10 条用户反馈并标注“价格异议/价值不清/交付疑虑”。',
    ]

    actions_7d = [
        '累计每版 >=100 visits 后比较转化：若 v2 paid conversion 提升 >=15%，将标题模板推广到餐饮/电商子包。',
        '产出一个 2 分钟演示视频（录屏展示 prompt pack 使用流程）并挂到商品页首屏。',
        '推出 tripwire：$9 入门包 + $29 主包 + $79 咨询加购，验证客单价提升路径。',
        '设置自动化周报脚本，固定输出 CTR/checkout/paid/refund 四指标趋势图。',
    ]

    payload = {
        'generated_at': now,
        'context': {
            'title_mean_delta': mean_delta,
            'prompt_count': prompt_count,
            'budget_visibility': 'unknown (cannot verify remaining budget from local env)',
        },
        'thresholds': thresholds,
        'actions_24h': actions_24h,
        'actions_7d': actions_7d,
    }

    (OUT / 'sales-execution-checklist.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding='utf-8')

    md = [
        '# Sales Execution Checklist',
        f'Generated: {now}',
        '',
        '## Baseline Signals',
        f"- 标题价值分净提升（mean delta）: **{mean_delta}**",
        f"- 交付包 prompt 数量: **{prompt_count}**",
        '- 预算可见性: **不可验证（本地环境无法读取当日剩余预算）**',
        '',
        '## 24h 内可执行动作',
    ]
    md += [f'- [ ] {x}' for x in actions_24h]
    md += ['', '## 7天内验证动作']
    md += [f'- [ ] {x}' for x in actions_7d]
    md += ['', '## 量化判定指标与阈值']
    md += [
        f"- Landing CTR >= {thresholds['landing_ctr_good']*100:.2f}%",
        f"- Checkout Start Rate >= {thresholds['checkout_start_good']*100:.2f}%",
        f"- Paid Conversion >= {thresholds['paid_conversion_good']*100:.2f}%",
        f"- Refund Rate <= {thresholds['refund_rate_max']*100:.2f}%",
        f"- Title Score Delta >= {thresholds['title_score_delta_min']:.1f}",
    ]

    (OUT / 'sales-execution-checklist.md').write_text('\n'.join(md), encoding='utf-8')


if __name__ == '__main__':
    build()
    print('written: passive-income-lab/outputs/sales-execution-checklist.md')
    print('written: passive-income-lab/outputs/sales-execution-checklist.json')
