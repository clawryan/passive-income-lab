# Orion Nexus Quant

机构级开源量化研究平台（美股方向）。

## 命名候选
1. **Orion Nexus Quant** ✅（落地）
2. Atlas Helix Capital
3. Quantum Orion Labs

## 今日可运行 CLI
```bash
# 1) 抓取公开可匿名访问数据（Stooq 日频 或 Yahoo 分钟线）
python3 products/orion-nexus/src/orion_cli.py fetch --symbol AAPL --source stooq
python3 products/orion-nexus/src/orion_cli.py fetch --symbol AAPL --source yahoo

# 2) 跑离线回测（3策略聚合评测）
python3 products/orion-nexus/src/orion_cli.py backtest --symbol AAPL

# 3) 生成简洁可视化 HTML
python3 products/orion-nexus/src/orion_cli.py render --symbol AAPL

# 4) 生成 paper-trading 接口准备 payload（仅模拟，不下实盘）
python3 products/orion-nexus/src/orion_cli.py paper-prep --symbol AAPL
```

## 数据来源与延迟说明
- **Stooq (匿名可访问)**: 日线为主，适合研究与回测演示；非逐笔实时。
- **Yahoo Finance Chart API (匿名可访问)**: 可获取近实时分钟线（通常有分钟级延迟，常见约 15 分钟）。
- 本项目当前默认 Stooq 做“今天可跑”演示，避免登录依赖。

## 合规声明
- 仅使用公开数据与开源资料。
- 不承诺收益，不宣传未经验证的超额回报。
