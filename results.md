# Results

## KPI（草案）
- 每周至少1个可运行原型
- 每周至少1次外部验证（真实用户反馈/试投放）
- 30天目标：形成可持续迭代的产品与内容资产

## 当前状态
- 进行中（Micro-SaaS 冷启动提示词包上架转化优化）

## 2026-03-15 临时冲刺交付（23:52-23:58）

### 发现
- 预算门槛基线：每日$90，40%=**$36**。
- 当前环境无法可靠获取“当日剩余预算”，结论：**预算信息不可验证**。
- 在预算不可验证前提下采用保守轻量策略（仅复用本地脚本与已有产物，不做高成本外部调用）。
- 当前收益瓶颈仍在“标题购买感知”，而非“条目数量不足”。

### 突破
- 新增可运行离线评估器，对 v1/v2 标题进行“价值词命中 + 角色词惩罚”量化对比。
- 结果：平均分从 **-0.33** 提升到 **6.67**，净提升 **+7.0**，为真实上架 A/B 提供了可验证先验。

### 产出清单
- `evaluate_title_value.py`
- `outputs/title-value-eval-micro-saas.json`
- `outputs/title-value-eval-micro-saas.md`
- 更新：`research-log.md` / `build-log.md` / `ideas-backlog.md` / `results.md`

### 阻塞
- 尚未拿到真实渠道流量，缺少 CTR/加购率/支付转化的实测数据。
- 预算看板不可见，无法做严格“当日剩余预算”阈值控制。

### 下一步
1. 将 v1/v2 商品页同步到同一销售渠道，跑最小 A/B（样本量先做到每版 >=100 访问）。
2. 记录三指标：CTR、加购率、支付转化；按 24h/72h 两个窗口复盘。
3. 若 v2 在支付转化上提升 >=15%，则固化标题重写规则并扩展到餐饮/电商子包。

### 是否建议进入明晚窗口继续推进
- **建议继续推进。** 理由：当前已具备“可运行脚本 + 可验证改进 + 明确下一步实验设计”，只差真实流量验证即可形成收益闭环。

## 2026-03-16 深夜窗口（00:56-01:01）新增成果

### Passive-Income 主线
- 新增自动化：`generate_sales_execution.py`
- 新增产物：
  - `outputs/sales-execution-checklist.md`
  - `outputs/sales-execution-checklist.json`
- 达成：将“提示词包+上架文案”推进到“24h/7d可执行变现清单+阈值判定”。

### Orion Nexus Quant
- 升级回测指标：Sortino、Calmar、WinRate、Trades、Turnover
- 新增稳定性视图：Walk-forward（70/30）
- 新增交易化准备：`paper-prep` 命令，输出 `products/orion-nexus/output/AAPL_paper_trade_plan.json`（仅 paper）

### 安全与预算
- 未执行 curl|sh，未下载可疑二进制，未进行实盘下单。
- 预算可见性问题仍存在：无法在本地环境验证“当日剩余预算”。

## 2026-03-24 凌晨冲刺（00:41-00:46）新增成果

### 本轮目标
- 以最低阻力补齐“真实A/B数据 -> 自动判定 -> 下一步动作”的执行闭环，减少手工复盘时间。

### 新增产出
- `analyze_ab_funnel.py`：A/B 漏斗自动分析（含 two-proportion z-test 近似显著性判定）。
- `outputs/ab-test-micro-saas-2026-03-template.json`：可直接替换实测数据的模板。
- `outputs/ab-test-micro-saas-latest.md`
- `outputs/ab-test-micro-saas-latest.json`

### 验证结果
- 语法校验通过：`python3 -m py_compile analyze_ab_funnel.py`
- 实跑产物已写入 outputs 目录（可在手机端直接查看 markdown 报告）。

### 阻塞
- 当前仍是模板数据，尚未接入真实渠道统计；判定结果仅用于流程验证。
- 预算可见性仍不可验证（无法直接读取当日 token/$ 消耗）。

### 下一步
1. 将 Gumroad/独立站真实曝光与支付数据按同字段写入模板 JSON，或直接在 `web/index.html` 的 A/B Analyzer 中填数运行。
2. 每24小时重跑一次脚本/网页判定，累计到每版点击>=100后再做胜负决策。
3. 若 B 在支付转化上显著领先，批量迁移标题策略到餐饮/电商子包。

## 2026-03-24 早间冲刺（08:00）新增成果

### 本轮目标
- 把离线 A/B 脚本补齐成浏览器可用工具，让电脑和手机端都能直接完成“填数 -> 判定 -> 下一步动作”。

### 新增产出
- `api/ab-funnel.js`
- `web/index.html`（新增 A/B Funnel Analyzer，并保留 Orion Nexus Quant Monitor）

### 验证结果
- Node 本地冒烟通过：POST 模拟请求返回 `B 胜出（可推广）`
- 旧脚本语法继续通过：`python3 -m py_compile analyze_ab_funnel.py`

### 阻塞
- 仍缺真实渠道流量数据；当前网页默认值只是演示样例。
- 预算可见性仍不可验证，无法严格确认当日 token/$ 已用额度。

### 下一步
1. 把真实 Gumroad/独立站数据填进网页工具，开始每日一次判断。
2. 若连续两轮都支持 B，立刻复制到餐饮/跨境电商子包。
3. 为网页补一个“导出 JSON/Markdown 报告”按钮，减少手工记录。

## 2026-03-24 上午追加成果（11:0x）

### 本轮目标
- 把 A/B 判定从“能看结果”推进到“能直接留档/同步”，减少手机端手工整理成本。

### 新增产出
- `web/index.html`：新增导出 JSON / Markdown 报告按钮，并在前端缓存最近一次判定结果。

### 验证结果
- 页面脚本语法检查通过：`node --check /tmp/passive_income_lab_web_check.js`
- A/B API 冒烟仍通过：返回 `200`，并包含 `decision / metrics / nextActions` 等字段。

### 阻塞
- 导出功能已补齐，但仍需要真实渠道数据才能形成有效经营周报。
- 预算可见性仍不可验证。

### 下一步
1. 用真实 Gumroad/独立站数据跑一轮，并把导出的 Markdown 报告沉淀到 `outputs/` 或外部运营记录。
2. 若 B 连续两轮在支付转化显著领先，再批量迁移到其他垂直包。
3. 视需要补“复制到剪贴板 / 分享摘要”按钮，进一步降低移动端操作摩擦。
