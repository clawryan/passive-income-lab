#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


TITLE_RULES = [
    ("广告商", "7天获客广告活动生成器（定位/卖点/渠道一键成稿）"),
    ("网页设计顾问", "高转化落地页顾问（首页结构+转化文案+CTA）"),
    ("启动创意生成器", "Micro-SaaS 商业点子与验证计划生成器"),
]


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def rewrite_title(title: str) -> str:
    for keyword, rewritten in TITLE_RULES:
        if keyword in title:
            return rewritten
    # fallback: keep original but add value cue
    return f"{title}（业务价值版）"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    src = Path(args.input)
    dst = Path(args.output)

    data = load_json(src)
    items = data.get("items", [])

    rewrites = []
    for item in items:
        old_title = item.get("title", "")
        new_title = rewrite_title(old_title)
        item["title_original"] = old_title
        item["title"] = new_title
        rewrites.append({"old": old_title, "new": new_title})

    data["title_rewrite"] = {
        "framework": "问题/收益导向命名（优先可感知业务结果）",
        "updated_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "changes": rewrites,
    }

    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Done: {dst}")


if __name__ == "__main__":
    main()
