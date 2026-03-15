# 技术架构草图

## 数据层
- Provider 接口：`fetch(symbol, start, end, interval)`
- 当前实现：Stooq(日线)、Yahoo Chart(近实时分钟线)
- 输出标准：`date, close` CSV

## 回测层
- 策略接口：输入价格序列，输出仓位信号 {-1,0,1}
- 成本：bps 交易费模型
- 执行：next-bar close 模拟

## 执行层（Broker Adapter）
统一抽象：
- `get_account()`
- `get_positions()`
- `place_order(symbol, side, qty, type, tif)`
- `cancel_order(order_id)`

覆盖计划：
1. Alpaca API（文档友好，paper 便利）
2. Interactive Brokers（机构能力强）
3. Tradier（REST 简洁，适合原型）

## 风控层
- Pre-trade gate：
  - 单笔风险上限（如账户净值 0.5%）
  - 单标的最大仓位（如 20%）
  - 日内最大亏损阈值（如 2%）
- Post-trade monitor：
  - 最大回撤阈值触发降杠杆/停机

## 评估层
- Total Return / CAGR / Sharpe / Max Drawdown
- 输出 Markdown + JSON + HTML
