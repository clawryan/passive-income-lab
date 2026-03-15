#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def load_pack(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def build_listing(pack: dict, product_name: str, target_user: str) -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    items = pack.get("items", [])
    sample_titles = [it.get("title", "") for it in items[:3]]

    lines = [
        f"# {product_name}",
        "",
        f"更新时间：{now}",
        "",
        "## 这个产品解决什么问题",
        f"面向{target_user}，帮助你在 7 天内完成定位、卖点提炼、落地页文案与首轮获客沟通，避免‘不知道写什么、怎么卖’。",
        "",
        "## 你将获得",
        f"- 精选提示词：{len(items)} 条（可直接复制使用）",
        "- 可复用工作流：定位 -> 卖点 -> 文案 -> 转化",
        "- 合规声明模板：可直接放在商品页",
        "",
        "## 样例模块（节选）",
    ]
    for i, title in enumerate(sample_titles, 1):
        lines.append(f"- 模块{i}：{title}")

    lines += [
        "",
        "## 使用方式（5分钟上手）",
        "1. 选择一个提示词模板",
        "2. 替换你的行业/目标客户/产品信息",
        "3. 生成文案后进行一次人工校对",
        "4. 发布到落地页、邮件或社媒",
        "",
        "## FAQ",
        "- Q: 我是新手能用吗？",
        "  A: 可以，模板都按‘输入字段+输出格式’设计。",
        "- Q: 能直接商用吗？",
        "  A: 可以商用你的输出结果；提示词包本身为公开资料二次整理，已保留来源和许可证。",
        "",
        "## 合规说明",
        "- 本产品为公开资料二次整理与本地化，不代表原项目背书。",
        "- 已在交付文件中保留来源仓库与许可证信息。",
        "",
        "## 定价建议",
        f"- {pack.get('pricing', '¥69 基础包 / ¥229 季度更新包 / ¥799 启动增长包')}",
    ]
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="prompt pack json path")
    parser.add_argument("--name", default="Micro-SaaS 冷启动提示词包")
    parser.add_argument("--target", default="独立开发者与小团队")
    parser.add_argument("--output", default="outputs/gumroad-listing-micro-saas.md")
    args = parser.parse_args()

    input_path = Path(args.input)
    out_path = Path(args.output)

    pack = load_pack(input_path)
    content = build_listing(pack, args.name, args.target)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(content, encoding="utf-8")
    print(f"Done: {out_path}")


if __name__ == "__main__":
    main()
