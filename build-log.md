# Build Log

## 2026-03-16 00:38 (Asia/Shanghai)
- 新增产品线：`products/orion-nexus`
- 交付文档：定位/架构/对标矩阵/迁移与风控/治理与贡献指南
- 交付代码：`src/orion_cli.py`（fetch/backtest/render）
- 交付架构骨架：`src/broker_adapter_design.py`（Alpaca/IBKR/Tradier + 风险闸门）
- 运行验证：AAPL 数据抓取、回测报告、HTML可视化成功产出

## 预算
- 预算信息不可验证（无法可靠读取当日累计成本与剩余额度）。
- 策略：保守低消耗，本地脚本+少量公开接口调用。

## 2026-03-16 01:00 (Asia/Shanghai)
- Orion Nexus 回测引擎升级：新增 Sortino / Calmar / WinRate / Trades / Turnover 指标。
- 新增 walk-forward 快照（70/30）并写入 `products/orion-nexus/output/AAPL_backtest.md`。
- 新增 paper-trading 准备命令：`paper-prep`，输出 `AAPL_paper_trade_plan.json`（仅模拟，不下实盘）。
- 主线新增自动化脚本：`generate_sales_execution.py`，产出 24h/7d 变现动作与量化阈值清单。
- 运行验证完成：backtest/render/paper-prep/checklist 全部可执行并已生成产物。

## 2026-03-24 00:45 (Asia/Shanghai)
- 新增 A/B 漏斗判定脚本：`analyze_ab_funnel.py`（输入曝光/点击/结账/支付，输出显著性与行动建议）。
- 新增模板数据：`outputs/ab-test-micro-saas-2026-03-template.json`。
- 生成最新报告：`outputs/ab-test-micro-saas-latest.md` 与 `outputs/ab-test-micro-saas-latest.json`。
- 验证：`python3 -m py_compile analyze_ab_funnel.py` 与脚本实跑通过。

## 2026-03-24 08:xx (Asia/Shanghai)
- 新增 API：`api/ab-funnel.js`，将离线 A/B 漏斗判定补成 Web 接口（POST JSON 即返回决策/显著性/下一步）。
- 升级 Web 入口：`web/index.html`，现在首页同时支持：
  - 数字产品 A/B Funnel Analyzer（手机/电脑可直接填数使用）
  - Orion Nexus Quant Portfolio Monitor（保留）
- 目的：把“真实渠道数据 -> 判定 -> 扩量动作”从本地脚本推进到浏览器可操作原型，降低复盘阻力。
- 验证：`node -e "const h=require('./api/ab-funnel'); ..."` 本地接口冒烟通过；`python3 -m py_compile analyze_ab_funnel.py` 仍通过。

## 2026-03-24 11:0x (Asia/Shanghai)
- 补齐 A/B Web 工具导出能力：`web/index.html` 新增“导出 JSON 报告 / 导出 Markdown 报告”按钮。
- 前端在每次判定后缓存最近一次结果，可直接下载 `ab-funnel-report-*.json` 或 `ab-funnel-report-*.md`，方便手机端留档与复盘。
- 验证：提取页面内联脚本后执行 `node --check /tmp/passive_income_lab_web_check.js` 通过；A/B API 冒烟仍返回 200 与完整指标字段。

## 2026-03-24 14:0x (Asia/Shanghai)
- 继续降低移动端操作摩擦：`web/index.html` 新增“复制摘要到剪贴板 / 复制分享链接”按钮。
- A/B 表单状态现在可编码进 URL 查询参数；在手机/电脑之间打开分享链接时，会自动回填本轮输入数据并直接运行判定。
- 新增纯文本摘要生成逻辑，方便把结论直接贴到运营群、笔记或任务系统。
- 验证：`node --check /tmp/passive_income_lab_web_check.js` 通过；`node` 本地调用 `api/ab-funnel.js` 仍返回 200 与完整指标字段。

## 2026-03-24 17:0x (Asia/Shanghai)
- 给 `web/index.html` 的 A/B Funnel Analyzer 新增“历史记录”模块：自动缓存最近 12 次判定结果，展示时间、结论、A/B 支付转化、Lift、p-value 与较上次变化。
- 新增“清空历史”按钮，方便在开始新一轮渠道实验前重置本地记录。
- 目的：把单次判定工具推进成“可连续跟踪趋势”的轻量经营面板，适合手机/电脑端日更复盘。
- 验证：页面脚本再次通过 `node --check /tmp/passive_income_lab_web_check.js`；A/B API 本地冒烟返回 200，前端默认加载会自动写入并渲染历史表。

## 2026-03-24 20:0x (Asia/Shanghai)
- 继续补齐经营复盘能力：`web/index.html` 的 A/B 历史记录模块新增“导出历史 CSV / 导出历史 Markdown”按钮。
- 导出内容包含时间、结论、样本达标、A/B 支付转化、Lift、p-value、z-score，以及最小点击阈值/点击/支付订单等关键字段，适合做周报、复盘或二次分析。
- 目的：把浏览器内本地缓存的历史记录变成可带走的经营数据资产，降低手机端连续实验后的整理成本。
- 验证：页面脚本通过 `node --check /tmp/passive_income_lab_web_check.js`；提取并执行历史导出函数后，成功生成 CSV 与 Markdown 文本预览。

## 2026-03-24 22:0x (Asia/Shanghai)
- 继续解决多轮实验混淆问题：`web/index.html` 的 A/B Funnel Analyzer 新增“实验名称 / 批次”输入框。
- 分享链接现在会携带 `experimentLabel` 参数；跨设备打开时会自动回填实验名称与本轮输入数据。
- A/B 历史记录表、历史 CSV/Markdown 导出、单次 Markdown 报告、复制摘要均增加实验名称字段，便于区分 Gumroad/独立站、不同标题版本与不同日期批次。
- 目的：把单条实验结论升级为“可分批次经营日志”，为接下来接入真实流量后的连续复盘做准备。
- 验证：从 `web/index.html` 提取内联脚本后执行 `node --check /tmp/passive_income_lab_web_check.js` 通过；`api/ab-funnel.js` 本地冒烟仍返回 `200`、`decision`、`metrics` 与 `nextActions`。
## 2026-03-25 08:0x (Asia/Shanghai)
- 继续提升 A/B 经营面板的复盘效率：`web/index.html` 新增“实验筛选”下拉框与“批次汇总”卡片。
- 现在可按实验名称筛选历史记录，并在同一界面查看该批次的记录数、样本达标次数、B 胜出次数、平均 Paid Lift、最新结论。
- 历史 CSV / Markdown 导出已改为遵循当前筛选范围，便于直接导出单个实验批次做周报或阶段复盘。
- 目的：把“多批次历史留档”进一步推进到“按实验快速复盘”，降低真实流量接入后的经营分析成本。
- 验证：从 `web/index.html` 提取内联脚本后执行 `node --check /tmp/passive_income_lab_web_check.js` 通过。

## 2026-03-25 11:0x (Asia/Shanghai)
- 把 A/B 判定进一步推向“能直接做放量决策”：`web/index.html` 新增客单价、扩量点击数、单次点击成本输入，并新增“扩量收益测算”卡片。
- 现在每次判定后会同步给出 A/B 在目标扩量点击下的预计订单、预计营收、预计净额，以及“若选择 B”的增量订单/营收/净额。
- 单次摘要、Markdown 报告、历史 CSV / Markdown 导出都已带上收益测算字段，方便把统计显著性直接转换成经营判断。
- 目的：减少“判定完还要手算值不值得扩量”的摩擦，更贴近被动收益产品的日常运营场景。
- 验证：`node --check /tmp/passive_income_lab_web_check.js` 通过；Node VM 冒烟已确认 `abEconomics` 成功渲染增量营收字段；`api/ab-funnel.js` POST 冒烟仍返回 `200`、`decision`、`metrics`。

## 2026-03-25 14:0x (Asia/Shanghai)
- 继续解决“手机/电脑各自保存一份历史”的断点：`web/index.html` 新增“导出历史 JSON / 导入历史 JSON”按钮，并支持通过隐藏文件选择器导入本地备份。
- 新增历史记录归一化与去重合并逻辑：导入时会按 `generatedAt + experimentLabel + clicks + paid_orders` 聚合，避免同一批次重复写入。
- 导出的 JSON 会带 `exportedAt / scope / count / history` 元数据，既可做跨设备迁移，也可作为经营实验的原始备份。
- 目的：让 A/B 经营面板真正支持跨设备连续复盘，而不再被浏览器本地存储割裂。
- 验证：`node --check /tmp/passive_income_lab_web_check.js` 通过；Node + JSDOM 冒烟验证已确认 JSON 导出与导入去重链路可用。
