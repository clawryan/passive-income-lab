- 这轮继续沿着“7 天渠道分发节奏”补最小可执行闭环，而不是再多写一层说明文档：`web/index.html` 的公开询价区新增 **导出 7 天节奏 ICS**，可把 Day 1~Day 7 的分发与复盘节奏直接扔进手机 / 电脑日历。
- 新增 **导出剩余节奏 ICS**：会读取当前 Day 1~Day 7 的“待执行 / 已执行 / 已复盘”状态，只把尚未复盘的剩余动作重排为接下来几天的提醒，避免中途换设备后还得手工删掉已完成日历项。
- `scripts/smoke-lead-todos.mjs` 已同步覆盖这条链路：除了原有完整 7 天 ICS，还会断言剩余 ICS 自动跳过已复盘的 Day 1、保留 Day 2 起的提醒，并确认 `.ics` 下载文件名真实触发。
- 结果：7 天分发实验现在不只“能开始”，也更容易在中途继续跑下去；如果前两天已做完，手机上可直接重导入剩余提醒，而不必重新导入整周后再手工清理。
- 新增 `getInquiryCadenceReminderAt()`、`buildInquiryCadenceIcs()`、`exportInquiryCadenceIcs()`；每一天都会生成独立日历事件，默认早上 09:00 提醒、提前 30 分钟弹窗，并在事件描述里带上当天目标、动作、复盘问题、优先渠道 / 候补渠道以及单产品页链接。
- `scripts/smoke-lead-todos.mjs` 已同步扩展：不仅校验 7 天节奏 JSON / 文本，还会断言 ICS 内容中存在 `VCALENDAR / VALARM / URL`，并确认 `.ics` 下载文件名真的被触发，避免以后只剩一个看起来能点的按钮。
- 结果：渠道实验不再只停留在“复制文本 / 导出 JSON”，而是更接近真实被手机日历持续提醒的一周执行计划。
- 这轮没有继续扩新的日报字段，而是补了一个更接近“真实可运营”的低阻力缺口：`api/lead-source-daily.js` 与 `api/cron/lead-source-daily.js` 现在会把每次生成/发送的日报自动写入最近 7 次 `latest/history` 留档，方便直接确认 cron 是否真的跑过、上一次推送看到的是什么。
- 新增本地文件 / KV 兼容的日报历史存储逻辑；`GET /api/lead-source-daily` 会返回 `latest/history`，`POST /api/lead-source-daily` 与 cron 触发则会在转发后同步落档，并记录 `trigger`、`topSource`、`recommendation` 与 webhook 结果。
- 对应 `scripts/smoke-lead-source-daily.mjs` 与 `scripts/smoke-lead-source-daily-cron.mjs` 已扩展断言：不仅校验摘要和 webhook 转发，还会确认历史条目真的写入、最近一次触发来源正确。
- 结果：来源日报不再只是“理论上能定时推送”，而是已经自带最小运行痕迹，后续做线上真验收时更容易判断问题卡在“没触发”还是“已触发但接收端没收”。
- 这轮没有再停留在“来源日报 API 已能手动调用”，而是把它推进成仓库内可直接定时跑的最小 cron 入口：新增 `api/cron/lead-source-daily.js`，会直接读取 `lead-capture` 快照、生成真实 `lead-source-daily-digest`，并转发到 `LEAD_SOURCE_DAILY_WEBHOOK_URL`。
- `vercel.json` 已内置 `/api/cron/lead-source-daily` 的 `0 1 * * *` 调度（Asia/Shanghai 09:00），`outputs/lead-source-daily-scheduler-examples.md` 也从“手写样例 payload”更新成“直接调用仓库真实 API / cron 入口”的照抄文档。
- 新增 `scripts/smoke-lead-source-daily-cron.mjs`，并把它并入 `npm run validate`；现在不仅能校验来源日报 API 本身，还能回归 `cron -> 生成 payload -> webhook 转发/跳过` 这条链路。
- 结果：来源日报终于从“有模板、有 API”推进到“仓库自带定时入口 + 验证脚本”，离真正的被动播报更近一步。
- 这轮没有再扩新 API 字段，而是把已经写进 `web/index.html` 的“远程付款回写”链路补成了真正可交付状态：README 现在明确写出手机端可直接用当前编辑线索回填 `leadId / amount / currency / reference / note`，并一键回写 `status=paid` 到 `/api/lead-capture`。
- `scripts/smoke-lead-todos.mjs` 已新增对付款回写前端链路的冒烟：会模拟“编辑远程线索 → 自动回填付款表单 → 提交付款事件 → 校验 `leadPaymentStatus / leadCaptureStatus` 与请求载荷”，避免这块功能以后悄悄坏掉却没人发现。
- 结果：付款回写不再只是埋在页面里的隐藏能力，而是已经进入 README + 自动化验证闭环，更适合下一步拿真实支付 webhook / n8n 做真联调。
- 这轮没有继续扩 KV 写入逻辑，而是补了一个更接近“真上线验收”的低阻力缺口：`GET /api/lead-capture` 现在除了返回全量 `entries`，还会额外返回 `summary.updatedAt / stageCounts / productCounts / topStage / topProduct`，方便部署后直接用手机或 cURL 判断远程快照是否真的在累积、当前卡在哪个产品/阶段。
- `api/lead-capture.js` 新增 `buildSnapshotSummary()`，并在 GET / POST 响应里同步带出 `summary` 与 `snapshot.updatedAt`；这样无论是公开询价刚写入，还是电脑端二次确认，都不必每次手看完整快照。
- `scripts/smoke-lead-capture.mjs` 已扩展为同时断言本地文件模式与 KV 模式下的 `summary.topStage / summary.topProduct`，避免这层摘要只停留在文档里。
- `outputs/lead-capture-kv-deploy.md` 与 `README.md` 已同步补充 `jq '.summary'` 的验收方法，让首次线上 smoke 更快收口。
- 结果：Lead Capture 从“可持久化”再推进到“可更快验收持久化是否真的在工作”，更利于尽快做一次手机提交 → 电脑确认的真实验证。
- 这轮继续沿着“别再只靠 /tmp，本轮该把 lead capture 变成可长期部署”的下一步推进：`/api/lead-capture` 现已支持检测 `KV_REST_API_URL + KV_REST_API_TOKEN`（兼容 Upstash/Vercel KV REST）后把线索快照写入托管 KV，未配置时继续回退到本地文件。
- `api/lead-capture.js` 新增 `readKvStore / writeKvStore / buildStorageMeta`，GET / POST 响应也会明确返回当前存储模式（`vercel-kv` 或 `local-file`）与 durable 状态，方便部署后确认自己是否真的已经持久化。
- `scripts/smoke-lead-capture.mjs` 现同时覆盖本地文件模式与 KV 模式：前者验证原有 GET / POST / 合并更新不回退，后者用 fetch stub 验证 REST `get/set` 持久化链路。
- `README.md` 已补充托管 KV 持久化说明与部署提示，减少后续在 Vercel 上还得翻代码确认该配什么环境变量。
- 结果：线索远程采集从“可演示的 serverless 快照”推进到“部署后可持续保留的最小远程 CRM 存储”，更接近手机录入、电脑继续跟进的真实多端闭环。
- 这轮优先补了一个更接近真实跨设备成交推进的缺口：线索虽然已经能导出 JSON / 推 webhook，但手机和电脑之间仍要手工传文件。
- `web/index.html` 新增“线索远程采集 / 快照”区，支持保存 Lead Capture API URL / Authorization、手动提交当前线索到远程 API、以及拉取远程快照后自动合并回本地。
- 新增 `api/lead-capture.js`：提供最小 GET / POST serverless 接口；默认把线索快照落到本机 `/tmp/passive-income-lab-leads.json`，并可选继续转发到 `LEAD_CAPTURE_WEBHOOK_URL`。
- 新增 `scripts/smoke-lead-capture.mjs`，并扩展 `scripts/smoke-lead-todos.mjs` 覆盖远程采集按钮与快照合并链路。
- 结果：现在可先用本仓库自带 API 做最小远程线索采集 / 快照，再视情况接 webhook 到 n8n / 数据库，离“手机录入、电脑继续跟进”更近一步。

## 2026-04-12 08:0x (Asia/Shanghai)
- 这轮没有再补单产品文案，而是先解决多产品并行时最容易卡住的执行判断：虽然线索板已经能按当前筛选导出待办，但一旦 Micro-SaaS 和 Orion 同时推进，仍要自己手工判断“今天到底先跟哪条线索”。
- `web/index.html` 在线索区新增 **跨产品线索总览** 卡片，以及 4 个动作：**复制跨产品线索摘要**、**手机原生分享跨产品线索摘要**、**导出跨产品线索 JSON**、**导出跨产品线索 Markdown**。
- 新增 `getLeadPortfolioReport()` / `buildLeadPortfolioSummaryText()` / `buildLeadPortfolioMarkdown()` / `renderLeadPortfolioBoard()`，把总线索数、可推进待办、时间桶、当前最热产品与最优先线索统一收口，避免多产品经营时还要人工脑补优先级。
- `scripts/smoke-lead-todos.mjs` 已扩展为同时校验跨产品线索摘要、总览卡片渲染，以及 Markdown / JSON 导出链路，确保这块不是只多了按钮。
- 结果：现在除了单产品跟进待办，还能一眼看到跨产品视角下“总共有多少可推进线索、当前最热产品是谁、今天最该先跟谁”，更贴近真实成交推进。

## 2026-04-11 17:0x (Asia/Shanghai)
- 这轮没有继续加新报表字段，而是补掉一个更贴近手机端使用的输出缺口：多产品经营总览之前只能复制或导出文件，真要发飞书/微信时还得先复制再切应用。
- `web/index.html` 在多产品经营区新增 **手机原生分享多产品经营摘要** 按钮；调用现有 `shareText()`，支持在手机浏览器里直接调起系统分享面板，不支持时自动回退为复制摘要。
- 新增 `shareProductOpsPortfolioSummary()`，复用 `buildProductOpsPortfolioSummaryText()` 作为统一文案源，避免“复制版摘要”和“分享版摘要”字段漂移。
- `README.md` 已同步把能力说明更新为“复制 / 分享 / 导出”。
- 结果：现在多产品经营总览和单产品经营摘要一样，已经可以直接在手机端一键转发，不必先下载 Markdown / JSON 或手工复制后再切应用。

## 2026-04-11 14:0x (Asia/Shanghai)
- 这轮继续沿着“经营看板输出层”往前推，但不再只盯单产品：当前已经能导出单产品经营摘要 / Markdown / JSON，可一旦同时推进两条产品线，复盘时还得手工把数据拼回一条总览，手机端尤其烦。
- `web/index.html` 在产品经营区新增“多产品经营总览”卡片，以及 3 个动作：**复制多产品经营摘要**、**导出多产品经营周报 Markdown**、**导出多产品经营 JSON**。
- 新增 `buildProductOpsPortfolioReport()` / `buildProductOpsPortfolioSummaryText()` / `buildProductOpsPortfolioMarkdown()`，把所有产品的线索阶段、CTA 点击、转化率、最近点击时间与当前主推产品统一收口为一份全局经营报告。
- `renderProductOpsBoard()` 现会同步渲染单产品看板 + 多产品总览，演示样本载入后可直接看到全局线索数、总成交数与当前主推产品。
- `scripts/smoke-product-ops.mjs` 已扩展为同时校验单产品报告与多产品总览渲染 / JSON 导出链路，避免总览只停留在按钮层。
- 结果：现在除了看某一个产品，还能一键拿到“本周全局该主推谁、总共还有多少待跟进、成交有没有开始集中”的经营总览，更适合发飞书/微信周报或接后续自动化。

## 2026-04-11 08:0x (Asia/Shanghai)
- 这轮继续沿着“产品经营看板”做低阻力增量，没有再扩新产品，而是补齐更适合自动化接力与验收的输出层：此前已有经营摘要复制 / 分享和 Markdown 周报，但缺结构化 JSON，也缺不用手工造数据的演示样本。
- `web/index.html` 在产品经营区新增两个动作：**导出当前产品经营 JSON**、**载入产品经营演示样本**。
- 新增 `buildProductOpsReport()`，把线索阶段、CTA 点击、转化率、最近点击时间与下一步建议统一收口为结构化报告；Markdown 周报也改为复用同一份聚合结果，减少字段漂移。
- 新增 `loadProductOpsDemo()`：一键写入 2 个产品的演示线索与 CTA 点击数据，方便在手机/电脑端直接验收经营摘要、看板渲染与导出链路。
- 新增 `scripts/smoke-product-ops.mjs` 与 `npm run smoke:product-ops`，并把它并入 `npm run validate`，确保产品经营看板不是只加按钮，而是有自动化冒烟守住。
- 结果：产品经营层从“可看 / 可分享 Markdown”推进到“可导出 JSON / 可一键注入演示数据 / 可自动化回归”，更适合后续接手机端任务流、自动化脚本或协作者交接。

## 2026-04-10 22:0x (Asia/Shanghai)
- 这轮沿着上次 results 里写下的下一步，优先把“产品经营看板”补成可直接拿去汇报/转发的输出层，而不是继续停留在浏览器内查看：经营数据如果不能一键发给自己或协作者，手机端复盘还是会断在最后一步。
- `web/index.html` 在“联系 / 支付入口占位”卡片下新增 3 个动作：**复制当前产品经营摘要**、**手机原生分享经营摘要**、**导出当前产品经营周报**。
- 新增 `formatProductOpsTimestamp()`、`buildSelectedProductOpsSummaryText()`、`copySelectedProductOpsSummary()`、`shareSelectedProductOpsSummary()`、`buildProductOpsWeeklyMarkdown()`、`exportSelectedProductOpsMarkdown()`，把现有产品经营看板中的线索阶段、CTA 点击、转化率与下一步建议收口成可复制文本和 Markdown 周报。
- `renderProductOpsBoard()` 现同步复用统一时间格式；README 也已补充“经营摘要可直接复制 / 分享 / 导出”说明。
- 结果：当前产品页不再只是“本地看一眼经营看板”，而是已经能把经营摘要直接丢进飞书/微信，或导出为 Markdown 留档，更接近真实经营周报场景。

## 2026-04-03 08:0x (Asia/Shanghai)
- 这轮沿着昨晚写下的下一步，优先补“按产品统计线索到成交率 / CTA 是否真的被点过”的经营可见性，而不是继续堆新的说明文本。
- `web/index.html` 在“联系 / 支付入口占位”卡片下新增 `productOpsBoard`，会按产品汇总当前线索数、成交率、联系点击、支付点击，以及 `联系→线索率 / 支付→成交率` 两个占位转化指标。
- 新增 `PRODUCT_CHANNEL_METRICS_KEY`、`loadProductChannelMetrics()`、`recordProductChannelClick()`、`buildProductOpsSummary()`、`renderProductOpsBoard()`；点击“打开联系入口 / 打开支付入口”时会自动在浏览器本地累积 CTA 点击计数。
- `renderLeadBoard()`、`renderSelectedChannelConfig()`、`saveSelectedProductChannelConfig()`、`selectProductLanding()` 已同步刷新经营看板，确保切换产品、保存入口配置、更新线索阶段后都能立即看到最新经营状态。
- 结果：现在首页不只知道“有没有线索”，还知道“哪个产品更值得主推 / CTA 有没有被点击 / 当前更该催报价还是优化支付入口”，更接近最小经营看板。

## 2026-04-02 22:0x (Asia/Shanghai)
- 这轮不再继续堆 FAQ 或线索导入细节，而是补一个更接近真实成交的低阻力缺口：虽然首页已有产品说明与购买文案，但仍缺“确认后往哪联系 / 去哪付款”的最小外链 CTA。
- `web/index.html` 新增“联系 / 支付入口占位”卡片；可按当前选中的单产品分别保存联系按钮文案、联系链接、支付按钮文案、支付链接，并写入浏览器本地。
- 新增 `PRODUCT_CHANNEL_CONFIG_KEY`、`loadProductChannelConfigs()`、`renderSelectedChannelConfig()`、`saveSelectedProductChannelConfig()`、`buildSelectedChannelSummary()`、`openProductChannelLink()`，支持切换产品时自动加载对应入口配置、一键复制入口摘要、直接打开联系 / 支付外链。
- `buildProductLandingSummary()` 与 `buildProductPurchaseSummary()` 已同步带出当前配置的入口状态；单产品说明页与购买说明不再只会说“之后再补链接”，而是能在已配置时直接给出真实入口。
- `README.md` 已同步补充“联系 / 支付入口可配置占位”能力说明。
- 结果：页面从“能解释产品、记录线索”进一步推进到“可为每个产品挂上真实联系 / 支付落点”，更接近可直接转发并成交的最小闭环。

## 2026-04-02 08:0x (Asia/Shanghai)
- 这轮优先补一个比“再加说明文案”更接近真实成交接力的缺口：线索虽然已支持导出 JSON，但手机/电脑切换后还不能把历史包重新导回浏览器，导致本地 CRM 只能单向带走、不能恢复。
- `web/index.html` 新增“导入线索 JSON”入口与隐藏文件选择器，支持读取此前导出的 `leads` 包，并通过 `normalizeImportedLead()` / `mergeImportedLeads()` 按 `id + updatedAt` 自动合并去重。
- `renderLeadBoard()` 已补上对 `renderLeadFunnelBoard()` 的真实调用；现在无论查看全部线索还是某个状态筛选，都会同步看到“待跟进 / 已发送资料 / 已报价 / 已成交 / 暂不推进”的漏斗总览与下一步建议。
- 结果：线索板不再只是“本机记录 + 单向导出”，而是已经能在手机和电脑之间恢复历史，并用漏斗视角快速判断该先清空首触达、催报价，还是复盘成交。
- 这轮直接沿着昨早 results 里写下的下一步推进，没有再加新的说明文案，而是把线索板补到更接近真实成交推进：咨询进来后，最烦的不是缺文案，而是每次状态变化都要重填一遍。
- `web/index.html` 的“线索收集 / 跟进卡”现已新增 **回填编辑** 与 **一键状态推进**：表格内可直接点“编辑”把某条线索回填到表单，也可一键切到“待跟进 / 已发送资料 / 已报价 / 已成交”。
- 新增 `currentLeadEditId`、`setLeadEditingState()`、`resetLeadForm()`、`editLeadEntry()`、`quickUpdateLeadStage()`，并让 `saveLeadEntry()` 支持“新建 / 更新”双模式，避免修改线索时再生成重复记录。
- `renderLeadBoard()` 已同步补上快捷动作列：除了展示状态与下一步，还会直接给出编辑按钮和 4 个常用阶段按钮；切换到“已发送资料 / 已报价 / 已成交”时，会自动写入更贴近该阶段的默认下一步。
- `README.md` 已同步补充“线索可回填编辑 / 一键推进状态”能力说明。
- 结果：产品页后的最小 CRM 不再只是“记下来”，而是已能在手机/电脑端继续推进到报价、成交，比继续堆 FAQ 更贴近收益。

## 2026-04-01 08:0x (Asia/Shanghai)
- 这轮没有继续堆新的报价说明，而是把昨晚新增的线索板推进成更像轻量 CRM 的状态：咨询进来后，真正阻塞成交的常常不是“没文案”，而是跟进状态散落在脑子里，后续也难整理给手机端或协作者接手。
- `web/index.html` 的“线索收集 / 跟进卡”现已新增 **跟进状态**（待跟进 / 已发送资料 / 已报价 / 已成交 / 暂不推进）、**状态筛选** 与 **排序视角**，可更快看出当前堆积在哪个阶段。
- 新增 `buildLeadCsv()` / `exportLeadCsv()`，现在除了 JSON 备份，还可直接导出 CSV，便于导入表格、任务工具或让协作者在手机端继续跟进。
- `buildLeadFollowupText()`、`saveLeadEntry()`、`renderLeadBoard()` 已同步带上状态与更新时间，保存线索后会直接在板上显示“最新状态 + 下一步”。
- `README.md` 已同步补充线索状态与 CSV 导出能力说明。
- 结果：产品页之后的下一步不再只是“记下一条线索”，而是已经能按跟进阶段整理、筛选并导出，比继续加 FAQ 更接近真实成交推进。

## 2026-03-31 22:0x (Asia/Shanghai)
- 这轮没有继续堆更多说明文本，而是补了一个更接近收入的执行层：单产品页之后，下一步通常不是再解释一遍，而是把潜在客户记下来、明确预算与下一步跟进。
- `web/index.html` 新增“线索收集 / 跟进卡”，支持记录客户名/来源渠道/预算判断/优先级/需求场景/下一步承诺，并默认关联当前选中的产品单页。
- 新增 `loadProductLeads()` / `saveProductLeads()` / `renderLeadBoard()`：线索默认保存在浏览器本地，最多保留最近 30 条，适合手机端快速登记，也可在电脑端继续查看。
- 新增 `buildLeadFollowupText()` / `copyLeadFollowup()` / `exportLeadJson()` / `loadLeadForSelectedProduct()`：可按当前产品一键生成跟进模板、复制跟进摘要，或导出 JSON 做跨设备接力。
- `README.md` 已同步补充“线索收集 / 跟进卡”能力说明。
- 结果：首页现在不仅能“发产品说明”，还能顺手把潜在线索结构化沉淀下来，比继续加一段 FAQ 更接近真实成交推进。

## 2026-03-31 20:0x (Asia/Shanghai)
- 这轮没有继续堆 FAQ 文本，而是把首页货架补成“可单独转发的产品页”形态：很多咨询场景并不需要先看完整货架，而是需要一个只讲某一个产品的单链接。
- `web/index.html` 现已新增“单产品分享页”面板，会根据 URL 参数 `?product=micro-saas` 或 `?product=orion-nexus` 自动切换到对应产品说明视角，并高亮当前产品卡片。
- 新增 `buildProductLandingSummary()` / `buildProductLandingLink()` / `selectProductLanding()`：把单产品价格、适用对象、交付内容、推荐成交路径与样例路径收口成可直接复制/分享的单页说明。
- 新增“复制当前产品单页链接 / 手机分享当前产品单页 / 复制当前产品单页说明 / 载入当前产品演示参数”四个动作；既能直接把单链接发给潜在用户，也能继续落到下方 A/B Analyzer 做演示验证。
- `README.md` 已同步补充“单产品分享页可直接转发”的能力说明。
- 结果：首页现在不仅能给出总货架，还能把任一产品收口成更适合私聊分发的单页入口，比继续加一个分析卡片更贴近真实成交链路。

## 2026-03-31 17:0x (Asia/Shanghai)
- 这轮没有再给 A/B 面板加新图表，而是把首页货架再往成交闭环推进半步：补齐“购买 / 联系说明”文本层，解决 FAQ 发完后，对方还会继续追问“那下一步怎么买、怎么聊、是否已接支付”的最后一段口径问题。
- `web/index.html` 的“最小 CTA”区现已新增两项动作：
  - **复制购买 / 联系说明**：输出统一文本，包含成交顺序、当前价格口径、页面定位（成交前说明页，不是已接支付订单页）、研究/模拟边界与建议发送模板。
  - **手机原生分享购买 / 联系说明**：在支持 Web Share API 的手机浏览器中可直接调起系统分享面板；不支持时自动退化为复制文本。
- 新增 `buildProductPurchaseSummary()`、`copyProductPurchaseBundle()`、`shareProductPurchaseBundle()`，把“报价摘要 / FAQ / 购买说明”三段成交前话术补成更完整的一套，避免私聊时临门一脚口径漂移。
- `README.md` 已同步补充“购买 / 联系说明可直接发”的能力说明。
- 结果：首页现在不仅能告诉访客“卖什么、FAQ 是什么”，还支持直接发出“下一步怎么买 / 如何继续沟通”的统一说明，更接近真实私聊成交链路。

## 2026-03-31 14:0x (Asia/Shanghai)
- 这轮没有再加新导出格式，而是补齐一个已经摆在页面里的经营缺口：A/B 历史区右侧原本已有“建议动作统计”卡片占位，但没有真正渲染逻辑，手机端看历史时仍要靠肉眼逐条数“补样 / 放量 / 暂停”。
- `web/index.html` 现已新增 `renderAbRecommendationBoard(history)`，会基于当前筛选范围自动汇总各类建议动作的 **次数 + 占比 + 主导动作**，并在 `renderAbHistory()` 时同步刷新。
- 这意味着：无论是看全部实验，还是只看某个实验 / 某类建议动作，右侧卡片都会即时反映当前经营状态，更接近真实周会里的“动作堆积分布”。
- `scripts/smoke-ab-history-import.mjs` 已补充回归校验：导入演示分享包后，除了验证历史写回、本轮实验自动切换、表单参数回填，还会断言 `abRecommendationBoard` 中真实出现 `建议动作统计 / 主导动作` 文本，避免之后页面改动把这张卡片再次变成空壳。
- `README.md` 已同步补充“建议动作统计看板”的能力说明。
- 结果：这轮不是让页面“多一个按钮”，而是让已经存在的历史区真正长出一个能帮人快速判断当前经营节奏的看板。

## 2026-03-31 11:0x (Asia/Shanghai)
- 没有继续给 A/B 面板堆新卡片，而是顺着早上那轮“最小 CTA”继续补成交前解释层：很多咨询并不是卡在没有报价，而是卡在对方还要追问“适合谁、交付什么、有没有风险”。
- `web/index.html` 的首页货架区现已新增两项动作：
  - **复制产品 FAQ / 交付说明**：一键生成可直接发给潜在用户的 FAQ 文本，覆盖“现在能买什么 / 适合谁 / 交付什么 / 怎么判断值不值得买 / 是否含实盘代操”等常见问题。
  - **手机原生分享 FAQ / 交付说明**：在支持 Web Share API 的手机浏览器中可直接调起系统分享面板；不支持时自动退化为复制文本。
- 同时新增 `buildProductFaqSummary()`、`copyProductFaqBundle()`、`shareProductFaqBundle()`，把 FAQ 内容收敛成一份可复用文本，避免报价摘要和 FAQ 口径漂移。
- `README.md` 已同步补充“FAQ / 交付说明可直接发”的能力说明。
- 结果：首页现在不仅能“告诉访客卖什么”和“复制去问价”，还能直接把成交前最常见的解释文本发出去，更贴近真实私聊成交链路。

## 2026-03-31 08:0x (Asia/Shanghai)
- 这轮沿着昨晚 results 里写下的下一步，直接把首页“产品货架”从展示层补成带最小 CTA 的成交前动作层，而不是继续给 A/B 面板堆新卡片。
- `web/index.html` 现已为两张产品卡分别新增：
  - **复制购买/咨询文案**：Micro-SaaS 提示词包、Orion 研究包都可一键生成可直接发给潜在用户的中文咨询文案。
  - **载入演示参数**：一键把对应产品的示例实验参数填入下方 A/B Funnel Analyzer，减少手机端/协作者手工回填。
  - **复制/分享报价摘要**：把两款产品合并成一段简洁报价摘要，可直接复制，或在支持 Web Share API 的手机浏览器中调用系统分享面板。
- `README.md` 已同步补充“最小 CTA 已补齐”的能力说明。
- 结果：首页现在不只是告诉访客“能买什么”，还支持立刻进入“复制文案去问价 / 分享报价 / 载入演示验证”这三种成交前动作，更接近真实变现闭环。

# Build Log

## 2026-04-24 22:00 (Asia/Shanghai)
- 这轮没有继续扩成交素材外发记录的 UI，而是补了一个更低阻力、但对持续开发更关键的回归缺口：给 `/api/lead-asset-history` 单独加了 **smoke 脚本**，并正式并入 `npm run validate`。这样“成交素材外发记录远程快照”不再只有一次性的 proof，而是每次迭代都能自动校验。
- 新增 `scripts/smoke-lead-asset-history.mjs`：会分别验证 **本地文件模式** 与 **KV 模式** 下的 `GET / POST`、`generatedAt + kind` 去重覆盖、`summary.totalLeads / topKind / topProduct / topSource / latest` 聚合结果，以及存储模式是否正确切换为 `local-file / vercel-kv`。
- `package.json` 已新增 `npm run smoke:lead-asset-history`，并把它串进 `npm run validate`；`README.md` 也已同步补上脚本说明，避免功能有了但日常回归没守住。
- 结果：成交素材外发记录这条链路现在具备 **proof 留档 + smoke 回归** 双保险，更适合后续继续往真实线上验收或自动化复盘推进。

## 2026-04-24 08:00 (Asia/Shanghai)
- 这轮没有继续把成交素材日志往远程存储层拉，而是先补一个更低阻力、但已经足够接近真实经营复盘的缺口：**成交素材外发记录筛选 / 摘要 / 导出**。此前页面虽然会留存最近 12 次外发摘要，但还只能在卡片里粗看，想发给自己或协作者复盘今天推过什么，仍得手工整理。
- `web/index.html` 现已为“成交素材外发记录”补齐 **素材类型筛选**（成交案例 / 已报价催单 / 复购转介绍）以及 **复制外发摘要 / 导出 JSON / 导出 Markdown** 三个动作；对应新增 `getLeadAssetHistoryFilter()`、`getFilteredLeadAssetHistory()`、`buildLeadAssetHistoryReport()`、`buildLeadAssetHistorySummaryText()`、`buildLeadAssetHistoryMarkdown()`、`copyLeadAssetHistorySummary()`、`exportLeadAssetHistoryJson()`、`exportLeadAssetHistoryMarkdown()`。
- `scripts/smoke-lead-todos.mjs` 已同步覆盖这条链路：不仅断言外发历史继续正常落盘/渲染，还会校验筛选后报告、摘要文本与 `lead-asset-history-*.json|md` 下载文件名，确认这次不是只多了按钮。
- 验证已通过：`npm run check:web`、`node scripts/smoke-lead-todos.mjs`、`npm run validate`。
- 结果：成交素材区从“只能回看最近几次”推进到“可按类型复盘并直接留档/转发”，更适合把当天的社会证明、催单动作和复购触达沉淀成轻量增长日志。

## 2026-04-23 08:00 (Asia/Shanghai)
- 这轮直接沿着昨晚 results 里已经连续指向的下一步推进：不再只补本地导出，而是把 **成交案例 / 已报价催单 / 复购转介绍** 三类成交素材真正接进现有线索 Webhook 出口。
- `web/index.html` 的“线索 Webhook 出口”现已新增 12 个动作：三类素材分别支持 **一键推送到 Webhook**、**复制 Webhook Payload**、**复制飞书卡片 Payload**、**复制 n8n Workflow JSON**；对应新增 `buildLeadAssetWebhookPayload()`、`sendLeadAssetWebhook()`、`buildLeadAssetFeishuCardPayload()`、`copyLeadAssetWebhookPayload()`、`copyLeadAssetFeishuCardPayload()`、`copyLeadAssetN8nWorkflow()`。
- 现有 `buildLeadN8nWorkflow()`、`buildLeadWorkerTemplate()`、`buildLeadWebhookIntegrationGuide()` 也已扩展支持 `won-lead-cases / quoted-lead-closer / won-lead-upsell` 三种新 `kind`，这样已有飞书机器人 / n8n / Worker 中转不必另造一套协议。
- `scripts/smoke-lead-todos.mjs` 已同步覆盖三类素材的 Webhook Payload / 飞书卡片 / n8n Workflow 构造，以及三次真实 `sendLeadAssetWebhook()` 调用；`npm run check:web`、`node scripts/smoke-lead-todos.mjs`、`npm run validate` 均通过。
- 结果：成交素材不再只是“导出后手工转发”，而是已经能直接接进现有机器人和自动化链路，更接近真实的催单、社会证明和复购经营闭环。

## 2026-04-22 22:0x (Asia/Shanghai)
- 这轮没有再扩新 API，而是补一个紧挨着刚做完手机分享能力、同时更利于协作/自动化的低阻力缺口：线索区的 **成交案例 / 已报价催单 / 复购转介绍** 三类成交素材此前只能复制、分享或导出 Markdown，还缺结构化 JSON，导致想喂给自动化、协作者或手机端二次处理时还得再手工拆文本。
- `web/index.html` 现已为这三类素材各补 1 个 **JSON 导出** 动作：`exportWonLeadCasesJson()`、`exportQuotedLeadCloserJson()`、`exportWonLeadUpsellJson()`；对应新增 `buildWonLeadCasesJson()`、`buildQuotedLeadCloserJson()`、`buildWonLeadUpsellJson()`，会统一导出 `summary + count + leads[]`，并把 `productTitle / suggestedAction / suggestedMessage / landingLink` 等关键成交字段一起结构化带出。
- `scripts/smoke-lead-todos.mjs` 已同步覆盖三类 JSON 构建与下载校验，断言导出文件名真实出现 `won-lead-cases-*.json / quoted-lead-closer-*.json / won-lead-upsell-*.json`，避免这次只是页面多了按钮。
- `README.md` 已同步把这三类素材更新为“复制 / 手机分享 / Markdown / JSON 导出”，减少文档和真实能力漂移。
- 结果：线索区的成交素材现在不只适合手工转发，也更适合喂给 webhook / n8n / 协作者继续加工，离“私聊成交动作 → 结构化资产沉淀”更近一步。

## 2026-04-22 20:0x (Asia/Shanghai)
- 这轮没有再扩新 API，而是补一个更贴近真实私聊成交推进的低阻力缺口：线索区虽然已经能复制“成交案例 / 已报价催单 / 复购转介绍”三类摘要，但手机端还不能像待办摘要那样直接调起系统分享，导致发到飞书 / 微信前仍要手工复制再切应用。
- `web/index.html` 现已补齐 **手机原生分享成交案例**、**手机原生分享已报价催单**、**手机原生分享复购 / 转介绍** 三个动作，并新增 `shareWonLeadCaseSummary()`、`shareQuotedLeadCloserSummary()`、`shareWonLeadUpsellSummary()`；在支持 Web Share API 的手机浏览器中可直接转发，不支持时自动回退为复制摘要。
- `scripts/smoke-lead-todos.mjs` 已同步覆盖这三条分享链路，断言分享标题真实包含“成交案例摘要 / 已报价催单摘要 / 复购 / 转介绍摘要”，避免这次只是页面多了按钮却没绑定逻辑。
- 结果：线索区现在除了能整理成交素材，还能更顺手地在手机端把社会证明、催单话术和复购 / 转介绍文案直接发出去，更接近真实变现动作。


## 2026-04-21 17:00 (Asia/Shanghai)
- 这轮直接沿着上一轮写下的下一步推进，没有再扩新 API，而是补一个更贴近“连续 7 天真的把渠道实验跑下去”的低阻力缺口：**7 天渠道分发节奏 / 每日复盘模板**。
- `web/index.html` 的公开询价区新增 2 个动作：**复制 7 天分发节奏**、**导出 7 天节奏 JSON**；会基于当前批量来源标签，自动给出 Day 1~Day 7 的目标、动作、复盘问题，并区分优先渠道与候补渠道。
- 新增 `buildInquiryCadencePlan()` / `buildInquiryCadencePlanText()` / `copyInquiryCadencePlan()` / `exportInquiryCadenceJson()`，把原先“今天先发哪些渠道”继续推进到“这周每天看什么、改什么、保留什么”。
- `scripts/smoke-lead-todos.mjs` 已同步覆盖这条链路，断言 7 天节奏 JSON、文本清单和导出文件名，避免它只是多了两个按钮。
- 结果：公开询价入口现在不只会生成链接、话术和当天实验清单，还能直接产出一份可在手机端连续执行 7 天的分发节奏，更接近真实增长执行。

## 2026-04-21 14:00 (Asia/Shanghai)
- 这轮没有继续堆新的来源日报模板，而是顺着上午已经补好的“渠道追踪链接包 + 分发文案包”再往前推一步，补了一个更贴近真实执行的低阻力缺口：**渠道实验清单**。
- `web/index.html` 的公开询价区新增 2 个动作：**复制渠道实验清单**、**导出渠道实验 JSON**；会基于当前批量来源标签，自动整理出每个渠道的追踪询价链接、渠道类型、成功信号与 24h 后的默认跟进动作。
- 新增 `buildInquiryExperimentPlan()` / `buildInquiryExperimentPlanText()` / `copyInquiryExperimentPlan()` / `exportInquiryExperimentJson()`，把“链接 + 文案”进一步收口成“今天先发哪些渠道、之后看什么信号、没反馈先改什么”的执行清单。
- `scripts/smoke-lead-todos.mjs` 已同步覆盖这条链路，断言渠道实验 JSON 结构、文本清单内容与下载文件名，避免它只是新加了两个按钮。
- 结果：公开询价入口现在不只会生成链接和话术，还能直接产出最小增长实验清单，更适合在手机端照着发、24h 后再按来源日报复盘。

## 2026-04-19 08:00 (Asia/Shanghai)
- 这轮没有再扩新日报字段，而是补了一个更接近“可交付验收”的低阻力缺口：新增 `scripts/generate-lead-source-daily-proof.mjs`，会自动种入演示线索，顺序执行 `GET /api/lead-source-daily`、`POST dryRun`、手动 webhook 转发、`POST /api/cron/lead-source-daily`，并把结果固化成 `outputs/lead-source-daily-local-proof.md` 与 `outputs/lead-source-daily-local-proof.json`。
- `package.json` 新增 `npm run proof:lead-source-daily`，方便以后每次改来源日报逻辑后都快速再生成一份可分享的“latest/history 确实在增长”的本地证据，而不只是看终端日志。
- `README.md` 已同步补充 proof 脚本入口与用途说明。
- 结果：来源日报链路现在不只“能跑 / 能留档”，还多了一份可重复生成的本地验收产物，后续要做线上真验收时更容易对照“本地预期 vs 部署环境返回”。

## 2026-04-17 17:00 (Asia/Shanghai)
- 这轮没有继续堆更多“如何定时”的样例，而是把来源日报真正补成仓库内可直接触发的 serverless 入口：新增 `api/lead-source-daily.js`，直接读取 `/api/lead-capture` 同源快照并生成真实 `lead-source-daily-digest` payload。
- `GET /api/lead-source-daily` 现在会返回 `summary / markdown / recommendation / sourceHighlights / report`；`POST /api/lead-source-daily` 则可在配置 `LEAD_SOURCE_DAILY_WEBHOOK_URL`（或复用 `LEAD_CAPTURE_WEBHOOK_URL`）时直接转发日报，未配置时也可先 `dryRun` 验收。
- 新增 `scripts/smoke-lead-source-daily.mjs`，会先写入 3 条演示线索，再断言来源日报的 `topSource / summary / markdown` 和 webhook 转发都可用；`package.json` 的 `validate` 也已纳入这条回归。
- `README.md` 已同步补上 API 与验证说明。
- 结果：来源日报从“能复制模板 / 能照着挂定时器”推进到“仓库内已有真实日报 API，可直接被 cron、Vercel Cron、GitHub Actions 或外部 webhook 调用”，更接近真正被动播报。

## 2026-04-17 14:00 (Asia/Shanghai)
- 这轮继续沿着上午写下的下一步推进，没有再扩页面按钮，而是把“来源日报自动化模板”补成可直接照着挂定时器的样例层。
- 新增 `outputs/lead-source-daily-scheduler-examples.md`，集中给出 **最小 cURL 模板**、**本地/macOS/Linux cron 样例**、**GitHub Actions 定时样例**、**Vercel Cron 样例**，并明确各自适合场景、所需环境变量与验收方式。
- `README.md` 已同步补充“来源日报定时触发样例已补齐”，让仓库入口页就能看到这份调度样例，不必翻历史记录才知道怎么把日报挂到定时器。
- 结果：来源日报从“可复制自动化模板”继续推进到“可直接照抄最小调度配置”，更接近真正每天被动播报。

## 2026-04-17 08:00 (Asia/Shanghai)
- 这轮沿着昨晚 results 里写下的最低阻力下一步推进，没有再扩本地报表，而是把“来源日报”真正补成可直接接自动化的模板层。
- `web/index.html` 在线索 Webhook 区新增 2 个动作：**复制来源日报 n8n Workflow JSON**、**复制来源日报 Cloudflare Worker 模板**；现有 `buildLeadN8nWorkflow()` / `buildLeadWorkerTemplate()` 也已扩展支持 `lead-source-daily-digest`。
- `scripts/smoke-lead-todos.mjs` 已同步覆盖来源日报 workflow / Worker 模板 / 接线说明断言，确保这条链路不是只多了按钮。
- 新增 `outputs/lead-source-daily-automation-guide.md`，把“来源日报 -> n8n / Worker -> 飞书机器人”的最短接线步骤、payload 结构与 dry-run 验收收口成可直接照着做的说明。
- 结果：来源日报从“可手动推送”推进到“可直接复制自动化模板”，离被动播报更近一步。

## 2026-04-16 08:0x (Asia/Shanghai)
- 这轮优先补了一个更贴近真实分发验证、同时阻力很低的缺口：公开询价与远程快照虽然已经保留 `source / channel`，但跨产品总览还看不出“哪个来源更值得继续推”，导致渠道实验仍要手工翻单条线索。
- `web/index.html` 的 `getLeadPortfolioReport()` 现已新增 `sources / topSource` 聚合，会按 `entry.source -> entry.channel -> manual` 汇总来源分布，并统计各来源的线索数、待跟进、已报价、已成交。
- 跨产品线索摘要、总览卡片、Markdown / JSON 导出已同步带上“当前最有效来源”与来源分布 Top 列表，手机端现在能直接判断该继续推 `public-inquiry:feishu-dm` 还是别的渠道，而不用手翻明细。
- `scripts/smoke-lead-todos.mjs` 已补充断言，确保总览摘要 / 看板 / Markdown 真正包含来源归因信息，而不只是数据结构里多了字段。
- 目的：把已有线索闭环从“能收 / 能跟 / 能回写付款”再往前推一步，变成“能快速看到哪个分发来源更可能带来成交”，更接近真实增长实验。


## 2026-04-14 22:0x (Asia/Shanghai)
- 这轮没有继续堆更多本地报表，而是补了一个更接近真实获客验证的低阻力缺口：公开询价链接虽然已经能留资，但还看不出到底是飞书私聊、微信群还是别的分发渠道带来的线索。
- `web/index.html` 的公开询价区新增 **渠道来源标签** 输入；复制或打开询价链接时会自动附带 `?src=...`，提交后会把来源写入 `lead.source / lead.channel`，并在状态提示中回显，适合直接做最小渠道归因。
- `api/lead-capture.js` 的 `GET /api/lead-capture` 摘要现新增 `sourceCounts / topSource`，可直接用手机或 cURL 看远程快照里哪种来源带来的线索最多。
- 顺手修掉一个真实数据风险：同一条 lead 后续更新阶段时，默认值不再把原先的 `contact / channel / source / originPage` 冲掉；`mergeEntries()` 现会优先保留已有有效信息。
- `scripts/smoke-lead-capture.mjs` 已扩展为断言 `public-inquiry:feishu-dm` 来源与 `topSource` 摘要，避免这层归因只停留在 UI 文案。
- 结果：公开询价从“能留资”推进到“能留资 + 能看最小来源归因 + 更新阶段不丢来源数据”，更利于下一步验证哪种分发动作最值得持续做。

## 2026-04-14 14:0x (Asia/Shanghai)
- 这轮没有继续扩 API 字段，而是补掉一个更接近“真部署可用”的低阻力缺口：虽然 `api/lead-capture.js` 已支持托管 KV，但首次接入时还缺一份把环境变量、验证命令和常见故障收口在一起的部署清单。
- 新增 `outputs/lead-capture-kv-deploy.md`，把 `KV_REST_API_URL / KV_REST_API_TOKEN / LEAD_CAPTURE_KV_KEY`、Vercel + Upstash/KV REST 接入顺序、GET/POST 验收 cURL，以及 `storage.mode` 应如何判断是否真的持久化写清楚。
- `README.md` 已同步补充该清单入口，减少“代码已经支持，但上线时还得翻源码确认该配什么”的摩擦。
- 结果：把 lead capture 从“代码层支持托管 KV”再推进到“部署层可直接照单执行”，更利于尽快完成手机留资 → 远程持久化 → 电脑拉回快照的真验收。

## 2026-04-13 22:0x (Asia/Shanghai)
- 这轮优先补了一个比“继续优化自己录线索”更接近真实获客的低阻力缺口：虽然已有单产品分享页、线索板和远程 Lead Capture API，但潜在客户仍不能自己在手机端直接留资，仍要靠我手动转录。
- `web/index.html` 新增 **对外询价 / 留资表单** 卡片：可为当前产品一键复制 `?product=...&view=inquiry` 公开询价链接、切到询价视图、填写称呼 / 联系方式 / 预算 / 需求，并直接提交到 `/api/lead-capture`（或已保存的自定义 Lead Capture API）。
- 新增 `buildProductInquiryLink()` / `renderPublicInquiryPanel()` / `submitPublicInquiry()` / `copySelectedInquiryLink()` / `openSelectedInquiryView()` / `loadPublicInquiryTemplate()`，把“单产品页”推进成“可直接发给潜在客户填写的最小留资入口”。
- `api/lead-capture.js` 已扩展保留 `contact / source / originPage` 字段；`scripts/smoke-lead-capture.mjs` 也补上对公开询价来源字段的断言，避免这条链路只停留在按钮层。
- 结果：现在不仅能自己录线索，也能把一个公开询价链接直接丢给潜在客户，让手机端访客先留资，再回到线索板 / Webhook / 日历提醒链路继续推进。

## 2026-04-13 20:0x (Asia/Shanghai)
- 这轮优先补了一个更贴近“手机上直接执行”的低阻力缺口：虽然线索待办已经能复制 / 分享 / 导出 JSON / Markdown，但真要在手机或电脑上准时跟进，仍常常得再手工抄进日历或提醒工具。
- `web/index.html` 在线索待办区新增 **导出当前筛选跟进待办 ICS** 按钮，可把当前筛选范围内的待办直接导出为日历文件。
- 新增 `buildLeadTodoIcs()` / `getLeadTodoReminderAt()` / `exportLeadTodoIcs()`，会按“现在 / 24h / 72h”自动生成对应提醒时间，并附带建议动作、下一步、需求痛点与单产品链接。
- `scripts/smoke-lead-todos.mjs` 已扩展为校验 ICS 内容结构（`BEGIN:VCALENDAR / SUMMARY / VALARM`）与 `.ics` 文件下载，避免这块只停留在按钮层。
- 结果：线索板从“能整理待办”推进到“能直接落进手机/电脑日历提醒”，更接近真实成交跟进闭环。

## 2026-04-13 08:0x (Asia/Shanghai)
- 这轮继续沿着昨晚 results 里写下的最低阻力路径推进，没有再扩 webhook 协议本身，而是补齐“飞书里看起来像正式提醒”的输出层：此前已经能复制 payload 示例和 n8n workflow，但如果想直接发成飞书卡片，还要自己再拼 interactive card JSON。
- `web/index.html` 在线索 Webhook 区新增 2 个动作：**复制待办飞书卡片 Payload**、**复制总览飞书卡片 Payload**。
- 新增 `buildLeadFeishuCardPayload()`、`copyLeadTodoFeishuCardPayload()`、`copyLeadPortfolioFeishuCardPayload()`，把现有待办/总览 payload 收口成可直接交给飞书机器人或中转服务的 interactive card JSON。
- `buildLeadWebhookIntegrationGuide()` 已同步补上飞书卡片 payload 入口说明，避免页面能力与接线文档漂移。
- `scripts/smoke-lead-todos.mjs` 已扩展为断言两类飞书卡片 payload 的 `msg_type=interactive` 与关键标题文案，确保这次不是只多了按钮。
- 结果：现在 Webhook 区已经同时具备**原始 payload**、**n8n workflow**、**飞书卡片 payload** 三层输出，首次把线索提醒接到飞书的摩擦又少了一步。

## 2026-04-12 17:0x (Asia/Shanghai)
- 这轮没有继续扩 webhook 能力边界，而是优先补掉“会发了，但第一次怎么接”这个最低阻力却最影响落地的缺口：上轮已经能把待办/总览推到 webhook，但缺少可直接拿去喂给飞书机器人中转、n8n、Make 的 payload 示例和接线说明。
- `web/index.html` 在线索 Webhook 区新增 3 个动作：**复制待办 Webhook Payload 示例**、**复制总览 Webhook Payload 示例**、**复制飞书 / n8n 接线说明**。
- 新增 `buildLeadTodoWebhookPayload()` / `buildLeadPortfolioWebhookPayload()` / `buildLeadWebhookIntegrationGuide()`，把现有真实结构直接整理成可复制的 JSON 示例与接线说明，而不是再手写一份容易漂移的文档。
- 新增留档文件 `outputs/lead-webhook-integration-guide.md`，把推荐接法、字段含义、飞书/n8n 最小映射和 CORS 注意事项收口到仓库里，方便后续直接转给自己或协作者。
- 结果：现在不只“能推 webhook”，还可以在页面里直接复制 payload 与接线说明，显著降低第一次把线索待办接到外部自动化的摩擦。

## 2026-04-12 20:0x (Asia/Shanghai)
- 这轮继续沿着“第一次接起来”往前走，但不再只给说明文档：直接补一层 **可导入 n8n 的 workflow JSON 模板**，把“看说明自己搭”推进到“复制 JSON -> 导入 -> 改飞书地址”。
- `web/index.html` 在线索 Webhook 区新增 2 个动作：**复制待办 n8n Workflow JSON**、**复制总览 n8n Workflow JSON**。
- 新增 `buildLeadN8nWorkflow()`、`copyLeadTodoN8nWorkflow()`、`copyLeadPortfolioN8nWorkflow()`，生成带 `Webhook -> Normalize Message -> Send to Feishu Bot -> Respond 200` 的最小 n8n 流程，并附带 `pinData` 示例 payload。
- 更新 `buildLeadWebhookIntegrationGuide()`，把“页面已可直接复制 n8n workflow JSON”写进接线说明，减少说明和页面能力漂移。
- 新增留档 `outputs/lead-webhook-n8n-workflows.md`，说明两类模板用途、导入方式与导入后唯一需要替换的 Feishu Bot 地址。
- 结果：线索自动化不再停留在“知道字段结构”，而是已经能把最小 n8n 中转流直接复制出来，更接近真实联调闭环。

## 2026-04-12 14:0x (Asia/Shanghai)
- 这轮没有继续堆新的本地报表，而是优先补一个更接近真实成交接力的缺口：线索板虽然已经能导出 JSON / Markdown / 分享摘要，但仍默认困在浏览器本地，想接飞书机器人、n8n、Make 或自建自动化时还得手工再搬一次。
- `web/index.html` 在线索区新增“线索 Webhook 出口”，支持保存 `Webhook URL + Authorization`，并提供 4 个动作：保存配置、复制测试 cURL、推送当前筛选待办、推送跨产品总览。
- 新增 `LEAD_WEBHOOK_CONFIG_KEY`、`loadLeadWebhookConfig()`、`renderLeadWebhookConfig()`、`buildLeadWebhookCurl()`、`postLeadWebhook()`、`sendLeadTodoWebhook()`、`sendLeadPortfolioWebhook()`；推送负载统一带 `source / kind / generatedAt / payload`，方便下游自动化按类型路由。
- 顺手修掉 `buildLeadFollowupText()` 在部分演示/导入数据下可能出现 `需求：undefined` 的脏输出，统一回退到 `entry.need || entry.demand || 默认文案`。
- `scripts/smoke-lead-todos.mjs` 已扩展为校验 Webhook 配置保存、测试 cURL 复制，以及“当前筛选待办 / 跨产品总览”两类 POST 推送，避免这块只停留在按钮层。
- 结果：线索链路从“可在本地记录 / 导出”推进到“可一键推送进外部自动化”，更接近手机端真实跟进与跨设备同步闭环。

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

## 2026-04-15 08:0x (Asia/Shanghai)
- 这轮直接补上最近 results 里最接近收入闭环的缺口：虽然线索已经能远程采集和多端同步，但“已成交 / 已付款”还只能手工改状态，缺少可被支付页、人工确认或自动化节点回写的最小接口。
- `api/lead-capture.js` 现已支持 `POST { event: { leadId, status, amount, currency, reference, note } }`：可把既有线索远程回写为付款事件，默认会把 `status=paid` 映射到 `stage=已成交`，并补上 `paymentAmount / paymentCurrency / paymentReference / paymentAt / paymentNote`。
- `GET /api/lead-capture` 的 `summary` 也已扩展出 `paymentStatusCounts / paidLeadCount / paidAmount / revenueByCurrency`，这样手机端用 cURL 或任意 webhook 中转都能直接看到“目前已确认多少单、累计多少收入”。
- `scripts/smoke-lead-capture.mjs` 已同步扩展，覆盖本地文件模式与 KV 模式下的“线索保存 → 报价更新 → 付款事件回写 → 汇总收入”链路，避免这块只停留在接口说明层。
- 目的：把线索闭环从“能收集、能催单”推进到“已付款后能远程回写并沉淀最小收入看板”，更接近真实被动收益产品的经营动作。
- 验证：`node scripts/smoke-lead-capture.mjs` 通过；`npm run validate` 通过。

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

## 2026-04-11 11:0x (Asia/Shanghai)
- 继续沿着“导入后马上能执行”推进线索闭环：`web/index.html` 在线索区新增“复制当前筛选跟进待办”与“导出当前筛选跟进待办 JSON”。
- 新增 `buildLeadTodoItems()` / `buildLeadTodoSummaryText()`：按当前筛选范围把待跟进、已发送资料、已报价、已成交线索自动整理成 `现在 / 24h / 72h` 三档待办，并附带建议动作、原始下一步与单产品链接。
- `importLeadJsonFile()` 导入完成后会直接提示“当前可推进待办数”，减少手机/电脑接力后还要手工再数一遍的摩擦。
- 新增 `scripts/smoke-lead-todos.mjs`，并把 `npm run validate` 扩展为覆盖线索待办摘要 / JSON 导出链路。
- `README.md` / `package.json` 已同步更新。
- 目的：把“线索导入恢复”进一步推进到“导入后立即知道先跟谁、做什么”，更接近轻量 CRM → 待办执行的闭环。
- 继续补齐“整理完待办就发出去”的最后一公里：线索区新增“手机原生分享跟进待办”和“导出当前筛选跟进待办 Markdown”，使导入后的待办可直接转发到飞书/微信或沉淀为周报附件。
- 把待办摘要构建拆成 `buildLeadTodoSummaryLines()`，统一驱动纯文本与 Markdown 输出，避免手机分享与文件导出各写一套逻辑。
- `scripts/smoke-lead-todos.mjs` 现同时覆盖跟进待办分享入口、JSON 导出与 Markdown 导出，减少后续 UI 调整时把交接链路悄悄改坏。

## 2026-04-15 22:0x (Asia/Shanghai)
- 这轮没有再加新的本地报表，而是优先补一个更容易真接起来的低阻力缺口：既然页面已经能产出待办 / 总览 payload、n8n workflow 和飞书卡片，下一步最值得做的是给“不想先装 n8n、但又被 CORS / 鉴权卡住”的场景一份可直接粘贴的中转模板。
- `web/index.html` 的线索 Webhook 区新增 2 个动作：**复制待办 Cloudflare Worker 模板**、**复制总览 Cloudflare Worker 模板**。
- 新增 `buildLeadWorkerTemplate()`，默认生成带 `OPTIONS + CORS`、`Authorization` 校验占位、`kind` 校验、dry-run 预览与飞书文本转发逻辑的 Worker 代码；未配置 `FEISHU_BOT_WEBHOOK` 时先返回预览，便于低成本联调。
- `buildLeadWebhookIntegrationGuide()` 已同步加入 Worker 接法说明；`scripts/smoke-lead-todos.mjs` 现会校验两份 Worker 模板包含 `env.FEISHU_BOT_WEBHOOK` 与对应 `kind`，避免只多了按钮。
- 新增 `outputs/lead-webhook-worker-template.md`，把上线步骤、环境变量和 dry-run 验收方法留档。
- 目的：把“浏览器能发 payload”推进到“更容易真接上可公开部署的 webhook relay”，减少为了联通飞书机器人还得临时写中转脚本的阻力。

## 2026-04-17 11:0x (Asia/Shanghai)
- 这轮没有再加新报表，而是补了一个更接近实际分发/复盘动作的 UI 缺口：来源日报相关能力原本已经有 payload、飞书卡片、n8n 与 Worker 模板，但页面上缺少“推送来源日报到 Webhook / 复制来源日报 Webhook Payload 示例”按钮，也无法直接导出日报文件。
- `web/index.html` 现已把这两个已有动作显式补到线索 Webhook 区，并新增“导出来源日报 Markdown / JSON”按钮，直接复用现有 `buildLeadSourceDailyWebhookPayload()` 产出的 `summary / markdown / report / sourceHighlights`。
- 目的：把“来源日报能生成”推进到“来源日报能直接发、能留档、能被协作者接走”，减少每次还要手工复制多段文本或临时翻 DevTools 的摩擦。
- 验证：`npm run validate` 通过；`scripts/smoke-lead-todos.mjs` 已新增来源日报 Markdown / JSON 导出断言，确认下载文件名与内容链路都存在。

## 2026-04-24 17:0x (Asia/Shanghai)
- 这轮没有再加新 UI，而是优先补一个更接近真实协作验收的低阻力缺口：给 `api/lead-asset-history.js` 增加**本地 proof 生成脚本**，把“成交案例 / 已报价催单 / 复购转介绍”的外发记录链路沉淀成可重复生成的证据。
- 新增 `scripts/generate-lead-asset-history-proof.mjs` 与 `npm run proof:lead-asset-history`；脚本会使用独立临时本地存储，依次跑 `GET /api/lead-asset-history`、连续 `POST` 三类素材记录、再用同一 `generatedAt + kind` 重复写入验证去重覆盖，最后把 `summary.topKind / topProduct / topSource / latest` 留档到 `outputs/lead-asset-history-local-proof.md|json`。
- `README.md` / `package.json` 已同步补上 proof 入口，方便后续在手机 / 电脑或协作者环境里快速复现这条日志链路，而不用手工拼请求。
- 目的：把“成交素材外发记录可远程快照”从仅有 smoke test，推进到“有可分享的本地验收证明”，为下一步真实线上 URL 联调做准备。
- 验证：`npm run proof:lead-asset-history` 已生成 `outputs/lead-asset-history-local-proof.md|json`；额外运行 `node scripts/smoke-lead-todos.mjs` 通过，确认这次补的 proof 没把既有素材导出 / Webhook / 远程快照链路带坏。
