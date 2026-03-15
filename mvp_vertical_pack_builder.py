#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import time
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import List

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "outputs"
OUT.mkdir(exist_ok=True)

SOURCES = [
    {
        "name": "awesome-chatgpt-prompts",
        "repo": "f/awesome-chatgpt-prompts",
        "license": "CC0-1.0",
        "raw": "https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/README.md",
    },
    {
        "name": "awesome-chatgpt-prompts-zh",
        "repo": "PlexPt/awesome-chatgpt-prompts-zh",
        "license": "MIT",
        "raw": "https://raw.githubusercontent.com/PlexPt/awesome-chatgpt-prompts-zh/main/README.md",
    },
    {
        "name": "prompt-engineering-guide",
        "repo": "dair-ai/Prompt-Engineering-Guide",
        "license": "MIT",
        "raw": "https://raw.githubusercontent.com/dair-ai/Prompt-Engineering-Guide/main/README.md",
    },
]

NICHE_PRESETS = {
    "restaurant": {
        "niche": "餐饮门店营销提示词包",
        "include": ["restaurant", "cafe", "food", "menu", "social media", "promotion", "营销", "餐饮", "菜单", "外卖", "门店", "点评", "团购", "文案"],
        "exclude": ["essay", "exam", "linux terminal", "论文", "雅思", "考试"],
        "pricing": "¥39 基础包 / ¥129 季度更新包 / ¥499 店长训练营",
        "output": "prompt-pack-restaurant",
    },
    "ecommerce": {
        "niche": "跨境电商商品营销提示词包",
        "include": ["ecommerce", "e-commerce", "shopify", "amazon", "product description", "ad copy", "sales", "marketing", "conversion", "跨境", "电商", "商品", "详情页", "转化", "广告", "文案", "营销"],
        "exclude": ["essay", "exam", "linux terminal", "论文", "雅思", "考试"],
        "pricing": "¥59 基础包 / ¥199 季度更新包 / ¥699 店铺增长包",
        "output": "prompt-pack-ecommerce",
    },
    "saas": {
        "niche": "SaaS 增长营销提示词包",
        "include": ["saas", "b2b", "startup", "product", "business", "marketing", "sales", "landing page", "onboarding", "churn", "retention", "trial", "pricing page", "email sequence", "conversion", "增长", "留存", "订阅", "续费", "产品营销", "转化"],
        "exclude": ["essay", "exam", "linux terminal", "论文", "雅思", "考试"],
        "pricing": "¥79 基础包 / ¥249 季度更新包 / ¥899 增长顾问包",
        "output": "prompt-pack-saas",
    },
    "micro-saas-launch": {
        "niche": "Micro-SaaS 冷启动营销提示词包",
        "include": ["saas", "startup", "launch", "go-to-market", "landing page", "value proposition", "positioning", "product hunt", "user interview", "customer persona", "offer", "pricing", "retention", "conversion", "广告", "网页设计", "启动创意", "增长", "冷启动", "定位", "卖点", "转化"],
        "exclude": ["essay", "exam", "linux terminal", "sql terminal", "regex", "正则", "论文", "雅思", "考试", "announcements", "updates", "course", "academy", "discord", "twitter"],
        "pricing": "¥69 基础包 / ¥229 季度更新包 / ¥799 启动增长包",
        "output": "prompt-pack-micro-saas-launch"
    },
    "freelancer-leads": {
        "niche": "AI自由职业获客提示词包",
        "include": ["freelance", "client", "proposal", "outreach", "cold email", "lead", "upwork", "fiverr", "portfolio", "case study", "offer", "sales", "marketing", "conversion", "copywriter", "consultant", "consulting", "咨询", "提案", "获客", "外联", "私信", "报价", "文案", "转化"],
        "exclude": ["essay", "exam", "linux terminal", "sql terminal", "regex", "正则", "论文", "雅思", "考试", "announcements", "updates", "course", "academy", "discord", "twitter"],
        "pricing": "¥49 基础包 / ¥169 月更包 / ¥599 私教执行包",
        "output": "prompt-pack-freelancer-leads"
    }
}


@dataclass
class PromptItem:
    title: str
    text: str
    source_repo: str
    source_license: str


def fetch(url: str, retries: int = 2) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "openclaw-mvp"})
    last_err = None
    for attempt in range(retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=45) as r:
                return r.read().decode("utf-8", errors="ignore")
        except Exception as e:
            last_err = e
            if attempt < retries:
                time.sleep(1.5 * (attempt + 1))
    raise last_err


def stars(repo: str) -> int:
    req = urllib.request.Request(f"https://api.github.com/repos/{repo}", headers={"User-Agent": "openclaw-mvp"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode("utf-8", errors="ignore")).get("stargazers_count", 0)
    except Exception:
        return -1


def parse_sections(md: str) -> List[tuple[str, str]]:
    lines = md.splitlines()
    sections, heading, buf = [], "", []

    def flush():
        if heading and buf:
            text = "\n".join(buf).strip()
            if len(text) > 80:
                sections.append((heading, text))

    for ln in lines:
        if re.match(r"^#{2,4}\s+", ln):
            flush()
            heading = re.sub(r"^#{2,4}\s+", "", ln).strip()
            buf = []
        elif ln.strip():
            buf.append(ln)
    flush()
    return sections


def keep(text: str, include: list[str], exclude: list[str]) -> bool:
    t = text.lower()
    return any(k.lower() in t for k in include) and not any(b.lower() in t for b in exclude)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preset", default="restaurant", choices=sorted(NICHE_PRESETS.keys()))
    parser.add_argument("--limit", type=int, default=12)
    args = parser.parse_args()

    cfg = NICHE_PRESETS[args.preset]

    items: List[PromptItem] = []
    metrics = []

    for s in SOURCES:
        md = fetch(s["raw"])
        metrics.append({"repo": s["repo"], "stars": stars(s["repo"]), "license": s["license"]})
        for h, b in parse_sections(md):
            txt = f"{h}\n{b}"
            if keep(txt, cfg["include"], cfg["exclude"]):
                items.append(PromptItem(h, b[:800], s["repo"], s["license"]))

    dedup, seen = [], set()
    for it in items:
        k = it.title.strip().lower()
        if k in seen:
            continue
        seen.add(k)
        dedup.append(it)
        if len(dedup) >= args.limit:
            break

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    out = {
        "generated_at": now,
        "niche": cfg["niche"],
        "source_metrics": metrics,
        "count": len(dedup),
        "pricing": cfg["pricing"],
        "items": [it.__dict__ for it in dedup],
    }

    base = cfg["output"]
    (OUT / f"{base}.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = [f"# {out['niche']}", "", f"Generated: {now}", "", "## Source Metrics"]
    for m in metrics:
        lines.append(f"- {m['repo']} · ⭐ {m['stars']} · {m['license']}")
    lines += ["", f"## Selected Prompts ({len(dedup)})"]
    for i, it in enumerate(dedup, 1):
        lines += [f"### {i}. {it.title}", f"Source: {it.source_repo} ({it.source_license})", "", it.text, ""]
    lines += [
        "## Compliance",
        "- 保留来源与许可证声明。",
        "- 对客户声明：本包为二次整理与本地化，不代表原项目背书。",
        "",
        "## Monetization",
        f"- 建议定价：{out['pricing']}",
    ]
    (OUT / f"{base}.md").write_text("\n".join(lines), encoding="utf-8")

    print(f"Done: {len(dedup)} items -> {base}.md/.json")


if __name__ == "__main__":
    main()
