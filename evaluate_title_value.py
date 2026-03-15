#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path


VALUE_TOKENS = [
    "获客",
    "转化",
    "增长",
    "验证",
    "计划",
    "落地页",
    "生成器",
    "一键",
    "7天",
    "商业",
]
ROLE_TOKENS = ["作为", "担任", "充当"]


@dataclass
class TitleScore:
    title: str
    value_hits: list[str]
    role_hits: list[str]
    score: int


def calc_score(title: str) -> TitleScore:
    value_hits = [token for token in VALUE_TOKENS if token in title]
    role_hits = [token for token in ROLE_TOKENS if token in title]
    score = len(value_hits) * 2 - len(role_hits)
    return TitleScore(
        title=title,
        value_hits=value_hits,
        role_hits=role_hits,
        score=score,
    )


def load_titles(path: Path) -> list[str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return [item.get("title", "") for item in data.get("items", [])]


def evaluate(titles: list[str]) -> dict:
    rows = [calc_score(title) for title in titles]
    total = sum(row.score for row in rows)
    avg = round(total / len(rows), 2) if rows else 0
    return {
        "count": len(rows),
        "avg_score": avg,
        "rows": [
            {
                "title": row.title,
                "value_hits": row.value_hits,
                "role_hits": row.role_hits,
                "score": row.score,
            }
            for row in rows
        ],
    }


def build_markdown(v1: dict, v2: dict) -> str:
    delta = round(v2["avg_score"] - v1["avg_score"], 2)
    lines = [
        "# 标题价值度对比（v1 vs v2）",
        "",
        f"- v1 平均分：{v1['avg_score']}",
        f"- v2 平均分：{v2['avg_score']}",
        f"- 提升：{delta}",
        "",
        "评分规则：每命中一个价值词 +2；每命中一个角色词 -1。",
        "",
        "## v1 明细",
    ]
    for row in v1["rows"]:
        lines.append(
            f"- {row['title']} | 分数={row['score']} | 价值词={','.join(row['value_hits']) or '无'} | 角色词={','.join(row['role_hits']) or '无'}"
        )

    lines += ["", "## v2 明细"]
    for row in v2["rows"]:
        lines.append(
            f"- {row['title']} | 分数={row['score']} | 价值词={','.join(row['value_hits']) or '无'} | 角色词={','.join(row['role_hits']) or '无'}"
        )
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--v1", required=True)
    parser.add_argument("--v2", required=True)
    parser.add_argument("--json-out", required=True)
    parser.add_argument("--md-out", required=True)
    args = parser.parse_args()

    v1_titles = load_titles(Path(args.v1))
    v2_titles = load_titles(Path(args.v2))

    v1 = evaluate(v1_titles)
    v2 = evaluate(v2_titles)

    report = {
        "v1": v1,
        "v2": v2,
        "delta_avg_score": round(v2["avg_score"] - v1["avg_score"], 2),
        "note": "用于上架标题A/B前的离线价值感知基线评估",
    }

    json_path = Path(args.json_out)
    md_path = Path(args.md_out)
    json_path.parent.mkdir(parents=True, exist_ok=True)
    md_path.parent.mkdir(parents=True, exist_ok=True)

    json_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    md_path.write_text(build_markdown(v1, v2), encoding="utf-8")
    print(f"Done: {json_path} and {md_path}")


if __name__ == "__main__":
    main()
