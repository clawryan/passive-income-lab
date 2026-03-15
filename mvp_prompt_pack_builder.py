#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import List

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "outputs"
OUT.mkdir(exist_ok=True)

INCLUDE = ["marketing", "sales", "seo", "copywriting", "customer", "营销", "销售", "文案", "客服", "广告", "市场", "电商", "商业"]
EXCLUDE = ["雅思", "论文", "考试", "linux终端", "作曲家"]

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
]

@dataclass
class PromptItem:
    title: str
    text: str
    source_repo: str
    source_license: str


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "openclaw-mvp"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="ignore")


def stars(repo: str) -> int:
    req = urllib.request.Request(f"https://api.github.com/repos/{repo}", headers={"User-Agent": "openclaw-mvp"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8", errors="ignore")).get("stargazers_count", 0)


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
        else:
            if ln.strip():
                buf.append(ln)
    flush()
    return sections


def keep(text: str) -> bool:
    t = text.lower()
    return any(k.lower() in t for k in INCLUDE) and not any(b.lower() in t for b in EXCLUDE)


def main() -> None:
    items: List[PromptItem] = []
    metrics = []

    for s in SOURCES:
        md = fetch(s["raw"])
        metrics.append({"repo": s["repo"], "stars": stars(s["repo"]), "license": s["license"]})
        for h, b in parse_sections(md):
            txt = f"{h}\n{b}"
            if keep(txt):
                items.append(PromptItem(h, b[:800], s["repo"], s["license"]))

    dedup, seen = [], set()
    for it in items:
        k = it.title.lower()
        if k in seen:
            continue
        seen.add(k)
        dedup.append(it)
        if len(dedup) >= 10:
            break

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    out = {
        "generated_at": now,
        "niche": "中文中小商家营销提示词包",
        "source_metrics": metrics,
        "count": len(dedup),
        "pricing": "$9 基础包 / $29 行业包 / $99 企业内训包",
        "items": [it.__dict__ for it in dedup],
    }

    (OUT / "prompt-pack.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = [f"# {out['niche']}", "", f"Generated: {now}", "", "## Source Metrics"]
    for m in metrics:
        lines.append(f"- {m['repo']} · ⭐ {m['stars']} · {m['license']}")
    lines += ["", f"## Selected Prompts ({len(dedup)})"]
    for i, it in enumerate(dedup, 1):
        lines += [f"### {i}. {it.title}", f"Source: {it.source_repo} ({it.source_license})", "", it.text, ""]
    lines += ["## Compliance", "- 保留来源与许可证声明。", "- 商业售卖时附上免责说明（非原作者背书）。", "", "## Monetization", f"- 建议定价：{out['pricing']}"]
    (OUT / "prompt-pack.md").write_text("\n".join(lines), encoding="utf-8")

    print(f"Done: {len(dedup)} items")


if __name__ == "__main__":
    main()
