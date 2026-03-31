## 2026-03-31 08:0x (Asia/Shanghai)
- 这轮沿着昨晚 results 里写下的下一步，直接把首页“产品货架”从展示层补成带最小 CTA 的成交前动作层，而不是继续给 A/B 面板堆新卡片。
- `web/index.html` 现已为两张产品卡分别新增：
  - **复制购买/咨询文案**：Micro-SaaS 提示词包、Orion 研究包都可一键生成可直接发给潜在用户的中文咨询文案。
  - **载入演示参数**：一键把对应产品的示例实验参数填入下方 A/B Funnel Analyzer，减少手机端/协作者手工回填。
  - **复制/分享报价摘要**：把两款产品合并成一段简洁报价摘要，可直接复制，或在支持 Web Share API 的手机浏览器中调用系统分享面板。
- `README.md` 已同步补充“最小 CTA 已补齐”的能力说明。
- 结果：首页现在不只是告诉访客“能买什么”，还支持立刻进入“复制文案去问价 / 分享报价 / 载入演示验证”这三种成交前动作，更接近真实变现闭环。

# Build Log

## 2026-03-30 22:0x (Asia/Shanghai)
- 这轮没有继续在 A/B 面板里堆更多按钮，而是补了一个更接近收入的缺口：首页此前只有工具，没有“当前到底卖什么”的清晰货架层，访问者即使觉得工具有用，也不一定知道下一步该买哪个产品。
- `web/index.html` 现已新增“可售产品货架（最小变现入口）”，把现成产物收口成 2 个可售方向：
  - **Micro-SaaS 冷启动提示词包**：直接展示适用对象、核心收益、三档价格（¥69 / ¥229 / ¥799）与样例产物路径。
  - **Orion Nexus Quant 研究包**：强调研究/模拟定位、现有回测与 report 产物，以及更高客单的研究演示升级方向。
- 同时补了一段“建议转化路径”，把首页漏斗写清楚：先用 A/B 工具验证，再购买提示词包，需求更深时升级到研究包/定制报告。
- 结果：首页从“工具集合”更接近“可卖产品 + 工具验证 + 升级路径”的最小成交入口，比继续加一个分析卡片更贴近被动收益目标。

## 2026-03-30 20:0x (Asia/Shanghai)
- 这轮没有继续堆新 UI，而是补齐最该先守住的链路验证：此前“当前实验分享包”已经支持导出与导入回填，但仓库里还没有自动化冒烟，后续改页面时容易把手机/电脑接力链路悄悄改坏。
- 新增 `scripts/smoke-ab-history-import.mjs`：直接从 `web/index.html` 提取内联脚本，在 Node VM 中构造最小浏览器环境，先载入演示样本，再导出单实验分享包，最后模拟“导入历史 / 分享包 JSON”。
- 冒烟会校验 3 个关键结果：历史条数成功写回本地存储、实验筛选自动切到 `demo-micro-saas-title-lift`、表单最新参数（如 `a_clicks=136 / b_clicks=146 / targetLift=15`）被自动回填。
- `package.json` 的 `validate` 已升级为三段：`check:web + smoke:ab + smoke:ab-history`；`README.md` 也已同步写明新验证入口。
- 结果：现在这条最接近真实协作接力的链路有了可重复、低成本的回归测试，比继续加一个新按钮更有收益。

## 2026-03-30 11:0x (Asia/Shanghai)
- 这轮没有继续堆新的分析卡片，而是补齐已有“当前实验分享包”的回流链路：此前可以导出单实验 JSON，但导入后只会并入历史，不能自动恢复该实验最新参数，跨设备接力仍要手工回填。
- `web/index.html` 现已增强 `handleAbHistoryImport()`：当导入的是单实验分享包时，会自动识别 `scope / shareLink / history`，写入历史后同步回填该实验最新一轮参数，并自动切换到对应实验筛选。
- 历史区按钮文案已改为“导入历史 / 分享包 JSON”，减少手机端或协作者拿到分享包后不知道该用哪个入口的理解成本。
- `README.md` 已同步更新，明确分享包支持“导出 + 重新导入恢复最新状态”的接力链路。
- 结果：现在单实验分享包不只是“带走历史”，而是可在另一台电脑/手机上直接恢复到最近一次经营状态，更接近真实协作和可售工具的使用闭环。

## 2026-03-29 22:0x (Asia/Shanghai)
- 这轮继续沿着“手机端最后一公里”收口，没有新增分析卡片，而是补齐单实验周报摘要的原生分享能力。
- `web/index.html` 的 A/B 历史区新增“手机原生分享周报摘要”按钮，并实现 `shareSelectedAbWeeklySummary()`；会复用现有周报摘要文本与分享链接，在支持 Web Share API 的手机浏览器中直接调起系统分享面板。
- 兼容降级：若当前浏览器不支持原生分享，则自动回退为复制“周报摘要 + 分享链接”，避免手机端操作断链。
- `README.md` 已同步更新“单实验周报摘要复制 / 分享”能力描述。
- 结果：现在单实验周报交付链路已有 4 种形态——Markdown、JSON、纯文本复制、手机原生分享，进一步压缩协作者接力和手机端汇报摩擦。


## 2026-03-29 08:0x (Asia/Shanghai)
- 这轮不再继续堆新的 A/B 分析卡片，而是补齐“可部署 / 可验证”的最短链路：现有 Web + PWA 已能用，但仓库内缺少统一的本地预览与验证脚手架，导致后续部署、验收和交接成本偏高。
- 新增 `package.json`：补上 `npm run dev`、`npm run check:web`、`npm run smoke:ab`、`npm run validate` 四个脚本，统一本地预览与基础验证入口。
- 新增 `scripts/check-web.mjs`：自动从 `web/index.html` 提取内联脚本并执行 `node --check`，避免继续手工复制到 `/tmp` 才能做语法校验。
- 新增 `scripts/smoke-ab.mjs`：直接调用 `api/ab-funnel.js` 做本地 POST 冒烟，校验 `decision / metrics / nextActions / sampleOk / generatedAt` 等核心字段。
- `README.md` 已同步补充本地预览、Vercel 部署和一键验证步骤，降低把工具部署到手机/电脑可访问地址的阻力。
- 结果：现在仓库具备更清晰的“开发 -> 验证 -> 部署”最小闭环，后续更容易把现有原型推到真实可访问链接上，而不是只停留在本地代码层。

## 2026-03-28 22:0x (Asia/Shanghai)
- 这轮优先补最近几次都卡住的同一个阻塞：虽然已经有当前实验周报 Markdown / JSON / 文本摘要，但缺少一键可复现的样本历史，导致手机端和浏览器里的端到端验收仍要手工造数据。
- `web/index.html` 的 A/B 历史区新增“载入周报演示样本”按钮；实现 `buildAbDemoHistoryEntries()` 与 `loadAbDemoHistory()`，一次写入 3 条同实验的模拟历史，并自动切到该实验筛选与最新表单状态。
- 结果：现在打开页面后无需先跑真实投放数据，也能立刻验证“周报 Markdown / JSON 导出、周报摘要复制、实验分享包”这一整条协作交付链路。
- `README.md` 已同步补充演示样本说明。
- 验证：提取页面内联脚本后 `node --check /tmp/passive_income_lab_web_check.js` 通过；Node VM 冒烟已确认 `loadAbDemoHistory()` 会写入 3 条演示历史，并且 `buildSelectedAbWeeklySummaryText()` 返回包含 `demo-micro-saas-title-lift / 建议动作分布 / 分享链接` 的摘要文本。

## 2026-03-28 20:0x (Asia/Shanghai)
- 没有继续堆新的分析卡片，而是补了一个更适合手机端/聊天场景的最后一公里：`web/index.html` 的 A/B 历史区新增“复制当前实验周报摘要”按钮。
- 新增 `buildSelectedAbWeeklySummaryText()` 与 `copySelectedAbWeeklySummary()`：复用已存在的周报聚合结果，输出可直接贴到飞书/微信/备忘录的纯文本摘要，包含记录数、最新结论、建议动作分布、最佳/最弱 Lift、最新 24h 清单与分享链接。
- 这样周报链路变成三种交付形态：Markdown（人读）、JSON（自动化）、纯文本摘要（消息发送/手机快速复盘），减少“导出了文件还要再手工摘一段摘要”的摩擦。
- `README.md` 已同步更新当前原型能力说明。
- 验证：提取页面内联脚本后 `node --check /tmp/passive_income_lab_web_check.js` 通过；Node VM 冒烟已确认 `buildSelectedAbWeeklySummaryText()` 返回包含“建议动作分布 / 最新 24h 清单 / 分享链接”的文本，且 `copySelectedAbWeeklySummary` 按钮与事件绑定存在。

## 2026-03-28 17:0x (Asia/Shanghai)
- 沿着上一轮的“周报导出”继续收口，没有再加新分析面板，而是把单实验周报补成双格式导出：除了 Markdown，现在还支持结构化 JSON。
- `web/index.html` 新增“导出当前实验周报 JSON”按钮，并把周报聚合逻辑抽成 `buildSelectedAbWeeklyReport()`，统一供 Markdown / JSON 两种导出复用，减少后续字段漂移。
- JSON 周报现包含：实验名、建议动作筛选、分享链接、最新结论与 24h 清单、建议动作分布、最佳/最弱 Lift、历史摘要列表，便于接入手机端自动化、任务系统或后续 API。
- `README.md` 已同步更新当前原型能力说明。
- 验证：提取页面内联脚本后 `node --check /tmp/passive_income_lab_web_check.js` 通过；Node VM 冒烟已确认 `buildSelectedAbWeeklyReport()` 返回 `recommendationSummary/history/extremes/latest.checklist` 等字段，且 `exportSelectedAbWeeklyJson` 按钮与事件绑定存在。

## 2026-03-28 14:0x (Asia/Shanghai)
- 这轮没有继续堆新卡片，而是补上一个真实缺口：`web/index.html` 虽然已有“导出当前实验周报”按钮和事件绑定，但缺少 `buildSelectedAbWeeklyMarkdown()` / `exportSelectedAbWeeklyMarkdown()` 的实际实现。
- 现已补齐单实验周报导出逻辑：基于当前实验与建议动作筛选，自动输出摘要、建议动作分布、最佳/最弱 Lift、最新 24h 清单与历史明细，并下载为 Markdown。
- 目的：把“结果文件里写着有周报导出”修正成“页面里真的能导出周报”，优先修可用性债务而不是继续虚增功能列表。
- 验证：重新提取页面内联脚本后 `node --check /tmp/passive_income_lab_web_check.js` 通过；文本级检查已确认 `function buildSelectedAbWeeklyMarkdown`、`function exportSelectedAbWeeklyMarkdown` 与 `exportSelectedAbWeeklyMd` 按钮事件绑定同时存在。

## 2026-03-28 11:0x (Asia/Shanghai)
- 继续选择“高收益 / 低阻力”的经营沉淀能力：`web/index.html` 的 A/B 历史区新增“导出当前实验周报”按钮。
- 新增 `buildSelectedAbWeeklyMarkdown()` / `exportSelectedAbWeeklyMarkdown()`：在选中某个实验后，自动汇总最新结论、建议动作分布、最佳/最弱 Lift、最新 24h 运营清单，以及该实验历史明细并导出为 Markdown。
- 周报导出会复用当前筛选的建议动作范围；若已按“继续放量 / 先补样 / 暂停加预算”等动作筛选，可直接导出对应经营视角的周报。
- `README.md` 已同步更新当前原型能力说明。
- 验证：提取页面内联脚本后 `node --check /tmp/passive_income_lab_web_check.js` 通过；文本级检查已确认 `exportSelectedAbWeeklyMd` 按钮、`buildSelectedAbWeeklyMarkdown()` 与事件绑定存在。

## 2026-03-28 08:0x (Asia/Shanghai)
- 继续选择“高收益 / 低阻力”的复盘增强：`web/index.html` 新增“建议动作”筛选下拉，可按“继续放量验证 B / 先小额补样 / 暂停加预算”等动作过滤历史记录。
- 历史汇总、历史表格、CSV / Markdown 导出现在都会保留该筛选范围，并在导出里补上 `recommendation` 字段，便于直接整理经营周报或协作者交接。
- 顺手修复了一个真实可用性问题：页面脚本会写入 `abDecisionBoard`，但 DOM 里此前没有对应卡片；现已补齐卡片，避免页面默认 `runAB()` 时因空节点报错。
- `README.md` 与 `results.md` 已同步更新当前能力说明。
- 验证：重新提取内联脚本后 `node --check /tmp/passive_income_lab_web_check.js` 通过；文本级检查已确认 `abRecommendationFilter`、`abDecisionBoard`、`getAbRecommendation()` 与事件绑定存在。

## 2026-03-27 22:0x (Asia/Shanghai)
- 继续选择“高收益 / 低阻力”的移动端闭环：`web/index.html` 新增“手机原生分享摘要 / 手机原生分享当前实验”按钮。
- 新增 `buildSelectedAbExperimentBundle()` 与 `shareText()`，复用现有分享链接和实验分享包逻辑，在支持 Web Share API 的手机浏览器里可直接调起系统分享面板。
- 兼容降级：若浏览器不支持原生分享，则自动回退为复制摘要+链接，或复制当前实验摘要，避免手机端点了按钮却无响应。
- `README.md` 已同步更新当前原型能力说明。
- 验证：提取页面内联脚本后 `node --check /tmp/passive_income_lab_web_check.js` 通过；文本级检查已确认新增 `shareAbSummary` / `shareSelectedAbBundle` 按钮与事件绑定存在。

## 2026-03-27 20:0x (Asia/Shanghai)
- 继续选择“高收益 / 低阻力”的执行闭环增强：`web/index.html` 新增“复制 24h 清单”与“导出运营待办 JSON”按钮。
- 新增 `buildAbExecutionTodoExport()`：把实验名、结论、建议动作、核心转化指标、扩量净额与分时段 checklist 打包成结构化 JSON，方便手机端任务工具或后续自动化接入。
- 保留原有 Markdown/摘要导出，同时新增更轻量的待办交接格式，减少“看完结论还要手工抄到待办系统”的摩擦。
- `README.md` 已同步更新当前原型能力说明。
- 验证：`node --check web/index.html` 无法直接用于 HTML，因此继续采用提取内联脚本方式校验；提取后 `node --check /tmp/passive_income_lab_web_check.js` 通过；Node VM 冒烟已确认 `buildAbExecutionTodoExport()` 返回 `recommendation` 与 5 条 checklist，且按钮事件绑定存在。

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

## 2026-03-25 17:0x (Asia/Shanghai)
- 继续补齐跨设备历史整理链路：`web/index.html` 的 A/B 历史记录区新增“重命名当前实验 / 删除当前实验”按钮。
- 现在可先按实验名称筛选，再直接把当前批次统一重命名，或仅删除该实验在当前浏览器中的本地历史记录，不影响其他批次。
- 删除操作增加二次确认提示；重命名会同步更新历史项的 `experimentLabel` 与导出时使用的 `payload.experiment_label`，避免后续导出周报时实验名不一致。
- 目的：把“跨设备导入合并”进一步推进到“导入后可整理”，降低真实运营中批次命名混乱与错误留档的摩擦。
- 验证：`node --check /tmp/passive_income_lab_web_check.js` 通过；Node 文本检查已确认新增按钮 ID 与 `renameSelectedAbExperiment` / `deleteSelectedAbExperiment` 事件绑定存在。


## 2026-03-25 22:0x (Asia/Shanghai)
- 继续把 A/B 经营面板往“可直接做补样决策”推进：`web/index.html` 新增“补样预算测算”卡片。
- 现在每次判定后会直接给出：距离最小点击阈值还差多少点击、按当前 CPC 预计还要花多少钱、按当前 CTR 反推每个版本大约还需多少展现。
- 单次纯文本摘要、Markdown 报告、历史 CSV 导出也已带上补样预算字段，方便把“是否继续买量”直接同步到运营记录。
- 目的：减少 A/B 尚未达显著时的手工估算，让手机/电脑端都能快速判断“继续补样还是停”。
- 验证：`node --check /tmp/passive_income_lab_web_check.js` 通过；Node VM 冒烟已确认 `estimateAbTopUp()` 输出 50 次补样点击 / ¥60 预算，并且摘要包含“补样测算”段落。

## 2026-03-26 08:0x (Asia/Shanghai)
- 选择了“高收益 / 低阻力”的移动端可用性改进：把 `web/index.html` 补成可安装的 PWA。
- 新增 `web/manifest.webmanifest`、`web/sw.js`、`web/icon.svg`，并在首页加入“安装到主屏 / 桌面”“刷新离线缓存”入口与状态提示。
- 现在用户可把 Passive Income Lab Web Tools 安装到手机主屏或电脑桌面；已访问过的页面壳、manifest、图标与 service worker 可离线打开，降低通勤/碎片时间使用阻力。
- `README.md` 已同步更新，明确当前原型支持 PWA 安装 / 离线访问。
- 验证：`python3 -m json.tool web/manifest.webmanifest` 通过；`node --check web/sw.js` 通过；提取页面脚本后 `node --check /tmp/passive_income_lab_web_check.js` 通过；本地 `python3 -m http.server 8765` 冒烟时，`/web/manifest.webmanifest` 与 `/web/sw.js` 均返回 `200`。

## 2026-03-26 11:0x (Asia/Shanghai)
- 继续补齐 A/B 面板的跨设备接力能力：`web/index.html` 的 A/B 历史区新增“导出当前实验分享包”按钮。
- 现在可先按实验名称筛选，再导出单个实验的 JSON 分享包；包内包含该实验历史、最新结论、导出时间以及可直接打开当前表单状态的 `shareLink`。
- 目的：把“导出全部历史 JSON”进一步推进到“只带走当前经营批次”，便于发给协作者、在另一台设备继续复盘，或沉淀为单实验资产而不混入其他批次。
- `README.md` 已同步更新，明确当前原型支持当前实验分享包导出。
- 验证：`node --check /tmp/passive_income_lab_web_check.js` 通过；文本级检查已确认 `exportSelectedAbExperimentBundle` 函数、`exportSelectedAbShare` 按钮与事件绑定均存在。

## 2026-03-26 14:0x (Asia/Shanghai)
- 选择了更接近真实买量决策的下一步：在 `web/index.html` 新增“目标样本量测算”卡片，并增加 `targetLift / targetConfidence / targetPower` 三个输入。
- 新增 `estimateAbSamplePlan()` 与 `inverseNormalCdf()`：基于双侧两比例近似，按 A 当前支付转化基线估算“若想检测到目标 Paid Lift，大约每版需要多少点击”。
- 单次摘要、Markdown 报告、分享链接回填、实验分享包都已带上目标样本量参数，便于手机/电脑端继续接力同一轮实验。
- 目的：把“是否继续补样”从只看最小点击阈值，推进到“是否值得补到能检测出 15%/20% 提升”的经营判断。
- 验证：`node --check /tmp/passive_income_lab_web_check.js` 通过；Node VM 冒烟已确认示例数据下成功输出 `requiredPerVariant=9998`，且页面摘要包含“目标样本量”段落。

## 2026-03-26 22:0x (Asia/Shanghai)
- 继续把 A/B 面板往“直接判断这轮买量值不值”推进：`web/index.html` 新增“投放上限 / 可承受买量”卡片。
- 新增 `estimateAbSpendGuardrail()`：把已有的客单价、目标样本量、目标 Paid Lift、当前 CPC 组合成 4 个经营判断信号：目标版整体保本 CPC、增量可承受 CPC、补到目标样本量后的预计新增营收上限、以及补样后的收入缓冲。
- 单次摘要、Markdown 报告同步带上投放上限结论，避免用户看完样本量后还要再手算“CPC 高不高、这轮买量会不会把优势吃掉”。
- 目的：把“统计上值不值得补样”进一步收敛成“经营上此刻要不要继续买量”。
- 验证：重新提取页面脚本后 `node --check /tmp/passive_income_lab_web_check.js` 通过；Node VM 冒烟已确认页面成功渲染 `增量可承受 CPC` 文案与新卡片。

## 2026-03-27 08:0x (Asia/Shanghai)
- 继续选择“高收益 / 低阻力”的移动端经营增强：`web/index.html` 新增“CPC 场景敏感度”卡片。
- 新增 `estimateAbCpcSensitivity()`：基于当前扩量点击、A/B 转化与当前 CPC，自动对比 3 档场景（当前 CPC -20% / 当前 CPC / 当前 CPC +20%；若未填 CPC 则退化为 0 / 增量可承受 CPC / 整体保本 CPC）。
- 单次摘要、Markdown 报告同步新增 CPC 场景行，用户可直接看到不同买量价格下 B 净额还能剩多少、相对 A 还多赚多少。
- `README.md` 已同步更新当前原型能力说明。
- 目的：把“知道当前 CPC 能不能投”进一步推进到“知道 CPC 波动后还稳不稳”，更贴近真实投放时的动态出价判断。
- 验证：提取页面脚本后 `node --check /tmp/passive_income_lab_web_check.js` 通过；`api/ab-funnel.js` POST 冒烟仍返回 `200`、`decision`、`sampleOk` 与完整 `metrics`。

## 2026-03-27 11:0x (Asia/Shanghai)
- 继续把 A/B 面板从“能算”推进到“能更快下决策”：`web/index.html` 新增“投放决策信号灯”卡片。
- 新增 `evaluateAbDecisionBoard()`：将统计显著性、补样缺口、CPC 风险、扩量净额压缩成 4 条信号，并给出单条建议动作（继续放量 / 先补样 / 暂停加预算）。
- 单次摘要、Markdown 报告同步新增“信号灯”信息，方便直接贴到运营记录或手机端快速复盘。
- 目的：减少用户在多个表格之间来回比对，把统计判断更直接地转成经营动作。
- 验证：`node --check /tmp/passive_income_lab_web_check.js` 通过；Node VM 冒烟已确认新卡片成功渲染 `建议动作`，且纯文本摘要包含 `信号灯：` 段落。

## 2026-03-27 14:0x (Asia/Shanghai)
- 继续沿着“直接可执行”推进：`web/index.html` 新增“24h 运营清单”卡片。
- 新增 `buildAbExecutionChecklist()` / `buildAbExecutionChecklistLines()`：把判定结论、补样预算、目标样本量、CPC 风险整合成 `现在 / 24h / 72h` 的行动清单。
- 单次纯文本摘要、Markdown 报告同步加入“24h 清单”段落，方便直接复制到运营记录、待办或协作者消息中。
- 继续补齐“分析 -> 执行”的交接链路：A/B 历史区新增“导出当前实验待办 CSV”，把当前实验最新 24h 清单导成可直接进表格/任务系统的行级结构。
- `README.md` 已同步更新，明确当前原型支持 24h 运营清单。
- 目的：把“看懂结论”再往前推一步，变成“拿到结果后今天具体做什么”，更贴近被动收益产品的日常经营闭环。
- 验证：`node --check /tmp/passive_income_lab_web_check.js` 通过；Node VM 冒烟已确认 `abExecutionPlan` 卡片成功渲染，且 Markdown/纯文本摘要包含 `24h 运营清单` / `24h 清单：`。
