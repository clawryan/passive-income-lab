import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const repoRoot = path.resolve(import.meta.dirname, '..');
const htmlPath = path.join(repoRoot, 'web', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1].trim())
  .filter(Boolean);

if (!scripts.length) {
  throw new Error('未找到可执行的内联脚本');
}

const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);

class Element {
  constructor(id = '') {
    this.id = id;
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.files = [];
    this.style = {};
    this.dataset = {};
    this.download = '';
    this.href = '';
    this.listeners = new Map();
    this.classList = { toggle() {}, add() {}, remove() {} };
  }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  appendChild() {}
  remove() {}
  click() {}
  select() {}
}

const elements = new Map(ids.map((id) => [id, new Element(id)]));
const ensureElement = (id) => {
  if (!elements.has(id)) elements.set(id, new Element(id));
  return elements.get(id);
};
const storage = new Map();
const downloads = [];
const fetchCalls = [];
const paymentEvents = [];
const shareCalls = [];
const remoteLeadSnapshot = [
  {
    id: 'remote-lead-1',
    name: '远程线索演示',
    productSlug: 'orion-nexus',
    channel: '飞书私聊',
    budget: '¥500-999',
    priority: '高',
    stage: '已发送资料',
    need: '需要先看回测说明',
    nextStep: '今晚补演示链接',
    createdAt: '2026-04-13T08:00:00.000Z',
    updatedAt: '2026-04-13T08:30:00.000Z'
  }
];

const context = {
  console,
  setTimeout,
  clearTimeout,
  Blob,
  URL,
  URLSearchParams,
  localStorage: {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  },
  document: {
    body: { appendChild() {} },
    getElementById(id) { return ensureElement(id); },
    createElement(tag) {
      if (tag === 'a') {
        return {
          click() { downloads.push({ download: this.download, href: this.href }); },
          remove() {},
          set href(value) { this._href = value; },
          get href() { return this._href; },
          set download(value) { this._download = value; },
          get download() { return this._download; }
        };
      }
      return new Element(tag);
    },
    execCommand() { return true; }
  },
  window: {
    location: new URL('https://example.com/web/?product=micro-saas'),
    addEventListener() {},
    open() {},
    confirm() { return true; },
    prompt(_message, defaultValue = '') { return defaultValue; }
  },
  navigator: {
    onLine: true,
    clipboard: { async writeText() {} },
    share: async (payload) => { shareCalls.push(payload); },
    canShare: () => true,
    serviceWorker: {
      async register() { return { active: { postMessage() {} } }; },
      ready: Promise.resolve({ active: { postMessage() {} } })
    }
  },
  fetch: async (url, options = {}) => {
    fetchCalls.push({ url, options });
    if (String(url).includes('/api/lead-capture')) {
      if ((options.method || 'GET') === 'POST') {
        const body = JSON.parse(options.body || '{}');
        if (body.event) {
          const matchedLead = {
            id: body.event.leadId,
            name: '远程线索演示',
            productSlug: 'orion-nexus',
            channel: '飞书私聊',
            budget: '¥500-999',
            priority: '高',
            stage: '已成交',
            need: '需要先看回测说明',
            nextStep: body.event.nextStep || '已收款，下一步发送交付包、确认反馈与转介绍机会',
            paymentAmount: Number(body.event.amount || 0),
            paymentCurrency: body.event.currency || 'CNY',
            paymentReference: body.event.reference || '',
            paymentNote: body.event.note || '',
            paymentStatus: body.event.status || 'paid',
            createdAt: '2026-04-13T08:00:00.000Z',
            updatedAt: '2026-04-13T09:00:00.000Z'
          };
          paymentEvents.push(body.event);
          return {
            ok: true,
            status: 200,
            async json() {
              return {
                ok: true,
                lead: matchedLead,
                event: body.event,
                storage: { mode: 'local-file' },
                summary: { paidLeadCount: 1, revenueByCurrency: { CNY: matchedLead.paymentAmount } },
                snapshot: { count: remoteLeadSnapshot.length, entries: [matchedLead, ...remoteLeadSnapshot.slice(1)] }
              };
            }
          };
        }
        const lead = body.lead || {};
        return {
          ok: true,
          status: 200,
          async json() {
            return {
              ok: true,
              storage: { mode: 'local-file' },
              snapshot: { count: remoteLeadSnapshot.length + 1, entries: [lead, ...remoteLeadSnapshot] }
            };
          }
        };
      }
      return {
        ok: true,
        status: 200,
        async json() {
          return { ok: true, snapshot: { count: remoteLeadSnapshot.length, entries: remoteLeadSnapshot } };
        }
      };
    }
    return { ok: true, status: 200, async json() { return {}; } };
  }
};

context.globalThis = context;
context.window.window = context.window;
context.window.document = context.document;
context.window.navigator = context.navigator;
context.window.URL = URL;
context.window.URLSearchParams = URLSearchParams;
context.window.localStorage = context.localStorage;
context.window.fetch = context.fetch;

vm.createContext(context);
vm.runInContext(scripts.join('\n\n'), context, { filename: 'web/index.html::<script>' });

context.loadProductOpsDemo();
context.document.getElementById('publicInquirySourceBatch').value = 'feishu-dm\nwechat-group\nxhs-post';
const inquiryBatchLinks = context.buildInquiryBatchLinks('microSaas', context.document.getElementById('publicInquirySourceBatch').value);
const inquiryBatchSummary = context.buildInquiryBatchLinksSummary('microSaas');
const inquiryOutreachPack = context.buildInquiryOutreachPack('microSaas');
const inquiryOutreachMarkdown = context.buildInquiryOutreachMarkdown('microSaas');
const inquiryExperimentPlan = context.buildInquiryExperimentPlan('microSaas');
const inquiryExperimentPlanText = context.buildInquiryExperimentPlanText('microSaas');
context.document.getElementById('leadCaptureApiUrl').value = '/api/lead-capture';
context.document.getElementById('leadCaptureApiAuth').value = 'Bearer lead-capture-demo';
context.persistLeadCaptureConfig();
await context.sendCurrentLeadCapture();
await context.pullLeadCaptureSnapshot();
context.editLeadEntry('remote-lead-1');
context.fillLeadPaymentFromEditor();
context.document.getElementById('leadPaymentAmount').value = '229';
context.document.getElementById('leadPaymentCurrency').value = 'CNY';
context.document.getElementById('leadPaymentReference').value = 'gumroad-order-001';
context.document.getElementById('leadPaymentNote').value = '手机端确认已收款，准备发交付包';
await context.sendLeadPaymentEvent();

context.document.getElementById('leadWebhookUrl').value = 'https://example.com/hooks/leads';
context.document.getElementById('leadWebhookAuth').value = 'Bearer demo-token';
context.persistLeadWebhookConfig();
const items = context.buildLeadTodoItems();
const summary = context.buildLeadTodoSummaryText(items);
const markdown = context.buildLeadTodoMarkdown(items);
const ics = context.buildLeadTodoIcs(items);
const portfolioSummary = context.buildLeadPortfolioSummaryText();
const portfolioMarkdown = context.buildLeadPortfolioMarkdown();
const quotedCloserSummary = context.buildQuotedLeadCloserSummary();
const quotedCloserMarkdown = context.buildQuotedLeadCloserMarkdown();
const wonUpsellSummary = context.buildWonLeadUpsellSummary();
const wonUpsellMarkdown = context.buildWonLeadUpsellMarkdown();
const todoWebhookPayload = context.buildLeadTodoWebhookPayload();
const portfolioWebhookPayload = context.buildLeadPortfolioWebhookPayload();
const todoN8nWorkflow = context.buildLeadN8nWorkflow('lead-followup-todos');
const portfolioN8nWorkflow = context.buildLeadN8nWorkflow('lead-portfolio-summary');
const sourceDailyN8nWorkflow = context.buildLeadN8nWorkflow('lead-source-daily-digest');
const todoWorkerTemplate = context.buildLeadWorkerTemplate('lead-followup-todos');
const portfolioWorkerTemplate = context.buildLeadWorkerTemplate('lead-portfolio-summary');
const sourceDailyWorkerTemplate = context.buildLeadWorkerTemplate('lead-source-daily-digest');
const webhookGuide = context.buildLeadWebhookIntegrationGuide();
const todoFeishuCardPayload = context.buildLeadFeishuCardPayload('lead-followup-todos');
const portfolioFeishuCardPayload = context.buildLeadFeishuCardPayload('lead-portfolio-summary');
const sourceDailyDigest = context.buildLeadSourceDailyDigest();
const sourceDailyWebhookPayload = context.buildLeadSourceDailyWebhookPayload();
const sourceDailyFeishuCardPayload = context.buildLeadSourceDailyFeishuCardPayload();
context.persistLeadSourceDailyPayload(sourceDailyWebhookPayload);
const trendLeads = context.loadProductLeads();
trendLeads.unshift({
  id: 'trend-lead-1',
  name: '趋势新增线索',
  productSlug: 'micro-saas',
  source: '知乎',
  stage: '待跟进',
  priority: '中',
  need: '想看交付样例',
  nextStep: '今天补报价说明',
  createdAt: '2026-04-19T09:00:00.000Z',
  updatedAt: '2026-04-19T09:00:00.000Z'
});
context.saveProductLeads(trendLeads);
const sourceDailyTrendPayload = context.buildLeadSourceDailyWebhookPayload();
const leadSourceDailyHistory = context.readLeadSourceDailyHistory();
await context.shareLeadTodoSummary();
await context.shareLeadPortfolioSummary();
await context.copyInquiryBatchLinks();
context.exportInquiryBatchJson();
await context.copyInquiryOutreachPack();
context.exportInquiryOutreachMarkdown();
await context.copyInquiryExperimentPlan();
context.exportInquiryExperimentJson();
await context.copyLeadWebhookCurl();
await context.copyLeadTodoWebhookPayload();
await context.copyLeadPortfolioWebhookPayload();
await context.copyLeadWebhookIntegrationGuide();
await context.copyLeadTodoN8nWorkflow();
await context.copyLeadPortfolioN8nWorkflow();
await context.copyLeadSourceDailyN8nWorkflow();
await context.copyLeadTodoWorkerTemplate();
await context.copyLeadPortfolioWorkerTemplate();
await context.copyLeadSourceDailyWorkerTemplate();
await context.copyLeadTodoFeishuCardPayload();
await context.copyLeadPortfolioFeishuCardPayload();
await context.copyLeadSourceDailyDigest();
await context.shareLeadSourceDailyDigest();
await context.copyLeadSourceDailyWebhookPayload();
await context.copyLeadSourceDailyFeishuCardPayload();
context.exportLeadSourceDailyMarkdown();
context.exportLeadSourceDailyJson();
await context.sendLeadTodoWebhook();
await context.sendLeadPortfolioWebhook();
await context.sendLeadSourceDailyWebhook();
await context.copyQuotedLeadCloserSummary();
context.exportQuotedLeadCloserMd();
await context.copyWonLeadUpsellSummary();
context.exportWonLeadUpsellMd();
context.exportLeadTodoJson();
context.exportLeadTodoMarkdown();
context.exportLeadTodoIcs();
context.exportLeadPortfolioJson();
context.exportLeadPortfolioMarkdown();

if (!items.length) {
  throw new Error('未生成线索待办');
}

if (!items.some((item) => item.timeBucket === '现在') || !items.some((item) => item.timeBucket === '24h')) {
  throw new Error(`线索待办时间桶异常: ${JSON.stringify(items)}`);
}

if (!summary.includes('Passive Income Lab 跟进待办') || !summary.includes('[现在]')) {
  throw new Error(`线索待办摘要异常: ${summary}`);
}

if (!markdown.includes('# Passive Income Lab 跟进待办') || !markdown.includes('## 1. [')) {
  throw new Error(`线索待办 Markdown 异常: ${markdown}`);
}

if (!ics.includes('BEGIN:VCALENDAR') || !ics.includes('SUMMARY:[现在] 跟进') || !ics.includes('BEGIN:VALARM')) {
  throw new Error(`线索待办 ICS 异常: ${ics}`);
}

if (!portfolioSummary.includes('跨产品线索摘要｜共 6 条') || !portfolioSummary.includes('当前最热产品：Orion Nexus Quant 研究包') || !portfolioSummary.includes('当前最有效来源：')) {
  throw new Error(`跨产品线索摘要异常: ${portfolioSummary}`);
}

if (!portfolioMarkdown.includes('# Passive Income Lab 跨产品线索总览') || !portfolioMarkdown.includes('## 产品分布') || !portfolioMarkdown.includes('## 来源分布')) {
  throw new Error(`跨产品线索 Markdown 异常: ${portfolioMarkdown}`);
}

if (inquiryBatchLinks.length !== 3 || inquiryBatchLinks[0]?.sourceTag !== 'feishu-dm' || !inquiryBatchLinks.every((item) => String(item.inquiryLink || '').includes('view=inquiry') && String(item.inquiryLink || '').includes('src='))) {
  throw new Error(`渠道追踪链接包异常: ${JSON.stringify(inquiryBatchLinks)}`);
}

if (!inquiryBatchSummary.includes('渠道追踪询价链接包') || !inquiryBatchSummary.includes('feishu-dm') || !inquiryBatchSummary.includes('wechat-group') || !inquiryBatchSummary.includes('xhs-post')) {
  throw new Error(`渠道追踪链接摘要异常: ${inquiryBatchSummary}`);
}

if (!inquiryOutreachPack.includes('渠道分发文案包') || !inquiryOutreachPack.includes('飞书私聊') || !inquiryOutreachPack.includes('建议 CTA')) {
  throw new Error(`分发文案包异常: ${inquiryOutreachPack}`);
}

if (!inquiryOutreachMarkdown.includes('# Micro-SaaS 冷启动提示词包 渠道分发文案包') || !inquiryOutreachMarkdown.includes('```text') || !inquiryOutreachMarkdown.includes('xhs-post')) {
  throw new Error(`分发文案 Markdown 异常: ${inquiryOutreachMarkdown}`);
}

if (inquiryExperimentPlan.totalChannels !== 3 || inquiryExperimentPlan.plan[0]?.sourceTag !== 'feishu-dm' || !inquiryExperimentPlan.checklist?.length) {
  throw new Error(`渠道实验 JSON 异常: ${JSON.stringify(inquiryExperimentPlan)}`);
}

if (!inquiryExperimentPlanText.includes('渠道实验清单') || !inquiryExperimentPlanText.includes('今日动作：') || !inquiryExperimentPlanText.includes('执行提醒：')) {
  throw new Error(`渠道实验文本异常: ${inquiryExperimentPlanText}`);
}

if (!quotedCloserSummary.includes('已报价催单摘要') || !quotedCloserSummary.includes('建议催单文案')) {
  throw new Error(`已报价催单摘要异常: ${quotedCloserSummary}`);
}

if (!quotedCloserMarkdown.includes('# Passive Income Lab 已报价催单包') || !quotedCloserMarkdown.includes('## 线索 1｜')) {
  throw new Error(`已报价催单 Markdown 异常: ${quotedCloserMarkdown}`);
}

if (!wonUpsellSummary.includes('复购 / 转介绍摘要') || !wonUpsellSummary.includes('建议跟进文案')) {
  throw new Error(`复购 / 转介绍摘要异常: ${wonUpsellSummary}`);
}

if (!wonUpsellMarkdown.includes('# Passive Income Lab 复购与转介绍包') || !wonUpsellMarkdown.includes('## 客户 1｜')) {
  throw new Error(`复购 / 转介绍 Markdown 异常: ${wonUpsellMarkdown}`);
}

if (todoWebhookPayload.kind !== 'lead-followup-todos' || !todoWebhookPayload.payload?.summary?.includes('Passive Income Lab 跟进待办')) {
  throw new Error(`待办 Webhook Payload 异常: ${JSON.stringify(todoWebhookPayload)}`);
}

if (portfolioWebhookPayload.kind !== 'lead-portfolio-summary' || !portfolioWebhookPayload.payload?.summary?.includes('跨产品线索摘要') || !portfolioWebhookPayload.payload?.sourceHighlights?.length) {
  throw new Error(`总览 Webhook Payload 异常: ${JSON.stringify(portfolioWebhookPayload)}`);
}
if (!portfolioWebhookPayload.payload.sourceHighlights.some((item) => item.source === '朋友圈')) {
  throw new Error(`总览来源归因未进入 Webhook Payload: ${JSON.stringify(portfolioWebhookPayload.payload.sourceHighlights)}`);
}

if (!webhookGuide.includes('Passive Income Lab 线索 Webhook 接线说明') || !webhookGuide.includes('lead-followup-todos') || !webhookGuide.includes('Cloudflare Worker') || !webhookGuide.includes('sourceHighlights') || !webhookGuide.includes('copyLeadSourceDailyN8nWorkflow') || !webhookGuide.includes('copyLeadSourceDailyWorkerTemplate')) {
  throw new Error(`Webhook 接线说明异常: ${webhookGuide}`);
}

if (todoN8nWorkflow.name !== 'Passive Income Lab｜跟进待办 -> 飞书' || !todoN8nWorkflow.nodes?.some((node) => node.name === 'Send to Feishu Bot')) {
  throw new Error(`待办 n8n workflow 异常: ${JSON.stringify(todoN8nWorkflow)}`);
}

if (portfolioN8nWorkflow.name !== 'Passive Income Lab｜跨产品总览 -> 飞书' || !portfolioN8nWorkflow.pinData?.Webhook?.[0]?.json?.payload?.summary?.includes('跨产品线索摘要')) {
  throw new Error(`总览 n8n workflow 异常: ${JSON.stringify(portfolioN8nWorkflow)}`);
}

if (sourceDailyN8nWorkflow.name !== 'Passive Income Lab｜来源日报 -> 飞书' || !sourceDailyN8nWorkflow.pinData?.Webhook?.[0]?.json?.payload?.summary?.includes('Passive Income Lab 来源日报') || !sourceDailyN8nWorkflow.nodes?.some((node) => node.parameters?.path === 'passive-income-lab/lead-source-daily-digest')) {
  throw new Error(`来源日报 n8n workflow 异常: ${JSON.stringify(sourceDailyN8nWorkflow)}`);
}

if (!todoWorkerTemplate.includes('env.FEISHU_BOT_WEBHOOK') || !todoWorkerTemplate.includes('lead-followup-todos')) {
  throw new Error(`待办 Worker 模板异常: ${todoWorkerTemplate}`);
}

if (!portfolioWorkerTemplate.includes('env.FEISHU_BOT_WEBHOOK') || !portfolioWorkerTemplate.includes('lead-portfolio-summary')) {
  throw new Error(`总览 Worker 模板异常: ${portfolioWorkerTemplate}`);
}

if (!sourceDailyWorkerTemplate.includes('env.FEISHU_BOT_WEBHOOK') || !sourceDailyWorkerTemplate.includes('lead-source-daily-digest') || !sourceDailyWorkerTemplate.includes('Passive Income Lab 来源日报')) {
  throw new Error(`来源日报 Worker 模板异常: ${sourceDailyWorkerTemplate}`);
}

if (todoFeishuCardPayload.msg_type !== 'interactive' || !JSON.stringify(todoFeishuCardPayload).includes('跟进待办')) {
  throw new Error(`待办飞书卡片 Payload 异常: ${JSON.stringify(todoFeishuCardPayload)}`);
}

if (portfolioFeishuCardPayload.msg_type !== 'interactive' || !JSON.stringify(portfolioFeishuCardPayload).includes('跨产品线索总览') || !JSON.stringify(portfolioFeishuCardPayload).includes('当前最有效来源') || !JSON.stringify(portfolioFeishuCardPayload).includes('来源分布')) {
  throw new Error(`总览飞书卡片 Payload 异常: ${JSON.stringify(portfolioFeishuCardPayload)}`);
}

if (!sourceDailyDigest.includes('Passive Income Lab 来源日报') || !sourceDailyDigest.includes('当前最有效来源') || !sourceDailyDigest.includes('建议动作') || !sourceDailyDigest.includes('较上次：暂无可对比历史')) {
  throw new Error(`来源日报摘要异常: ${sourceDailyDigest}`);
}

if (sourceDailyWebhookPayload.kind !== 'lead-source-daily-digest' || !sourceDailyWebhookPayload.payload?.summary?.includes('Passive Income Lab 来源日报') || !sourceDailyWebhookPayload.payload?.sourceHighlights?.length || !sourceDailyWebhookPayload.payload?.markdown?.includes('# Passive Income Lab 来源日报') || !sourceDailyWebhookPayload.payload?.trend || sourceDailyWebhookPayload.payload?.trend?.hasPrevious !== false) {
  throw new Error(`来源日报 Webhook Payload 异常: ${JSON.stringify(sourceDailyWebhookPayload)}`);
}

if (!sourceDailyTrendPayload.payload?.trend?.hasPrevious || sourceDailyTrendPayload.payload?.trend?.totalLeadsDelta !== 1 || sourceDailyTrendPayload.payload?.trend?.actionableDelta !== 1 || !String(sourceDailyTrendPayload.payload?.summary || '').includes('较上次：总线索 +1｜可推进 +1')) {
  throw new Error(`来源日报趋势对比异常: ${JSON.stringify(sourceDailyTrendPayload)}`);
}

if (!Array.isArray(leadSourceDailyHistory) || !leadSourceDailyHistory.length || leadSourceDailyHistory[0]?.totalLeads !== sourceDailyWebhookPayload.payload?.report?.totalLeads) {
  throw new Error(`来源日报历史未成功落盘: ${JSON.stringify(leadSourceDailyHistory)}`);
}

if (sourceDailyFeishuCardPayload.msg_type !== 'interactive' || !JSON.stringify(sourceDailyFeishuCardPayload).includes('来源日报') || !JSON.stringify(sourceDailyFeishuCardPayload).includes('Top 来源明细') || !JSON.stringify(sourceDailyFeishuCardPayload).includes('较上次')) {
  throw new Error(`来源日报飞书卡片 Payload 异常: ${JSON.stringify(sourceDailyFeishuCardPayload)}`);
}

if (typeof sourceDailyDigest !== 'string' || !sourceDailyDigest.trim()) {
  throw new Error(`来源日报摘要未生成有效文本: ${sourceDailyDigest}`);
}

if (shareCalls.length < 3) {
  throw new Error(`原生分享调用次数不足: ${JSON.stringify(shareCalls)}`);
}

if (!shareCalls.some((payload) => String(payload?.title || '').includes('来源日报')) || !shareCalls.some((payload) => String(payload?.title || '').includes('跟进待办')) || !shareCalls.some((payload) => String(payload?.title || '').includes('跨产品线索摘要'))) {
  throw new Error(`原生分享载荷异常: ${JSON.stringify(shareCalls)}`);
}

const portfolioBoardHtml = context.document.getElementById('leadPortfolioBoard').innerHTML;
if (!portfolioBoardHtml.includes('跨产品线索总览') || !portfolioBoardHtml.includes('最优先线索') || !portfolioBoardHtml.includes('当前最有效来源')) {
  throw new Error(`跨产品线索总览未成功渲染: ${portfolioBoardHtml}`);
}

const cadenceBoardHtml = context.document.getElementById('leadCadenceBoard').innerHTML;
if (!cadenceBoardHtml.includes('跟进时效看板') || !cadenceBoardHtml.includes('最需催办')) {
  throw new Error(`跟进时效看板未成功渲染: ${cadenceBoardHtml}`);
}

if (!items.some((item) => ['已超期', '即将超期', '节奏正常'].includes(item.cadenceLabel))) {
  throw new Error(`线索时效标签异常: ${JSON.stringify(items)}`);
}

const downloadNames = downloads.map((item) => item.download);
if (!downloadNames.some((name) => name.startsWith('inquiry-link-batch-') && name.endsWith('.json'))) {
  throw new Error(`未触发渠道追踪链接 JSON 导出: ${JSON.stringify(downloads)}`);
}

if (!downloadNames.some((name) => name.startsWith('inquiry-outreach-pack-') && name.endsWith('.md'))) {
  throw new Error(`未触发分发文案 Markdown 导出: ${JSON.stringify(downloads)}`);
}

if (!downloadNames.some((name) => name.startsWith('inquiry-experiment-plan-') && name.endsWith('.json'))) {
  throw new Error(`未触发渠道实验 JSON 导出: ${JSON.stringify(downloads)}`);
}

if (!downloadNames.some((name) => name.startsWith('lead-followup-todos-') && name.endsWith('.json'))) {
  throw new Error(`未触发线索待办 JSON 导出: ${JSON.stringify(downloads)}`);
}

if (!downloadNames.some((name) => name.startsWith('lead-followup-todos-') && name.endsWith('.md'))) {
  throw new Error(`未触发线索待办 Markdown 导出: ${JSON.stringify(downloads)}`);
}

if (!downloadNames.some((name) => name.startsWith('lead-followup-todos-') && name.endsWith('.ics'))) {
  throw new Error(`未触发线索待办 ICS 导出: ${JSON.stringify(downloads)}`);
}

if (!downloadNames.some((name) => name.startsWith('quoted-lead-closer-') && name.endsWith('.md'))) {
  throw new Error(`未触发已报价催单 Markdown 导出: ${JSON.stringify(downloads)}`);
}

if (!downloadNames.some((name) => name.startsWith('won-lead-upsell-') && name.endsWith('.md'))) {
  throw new Error(`未触发复购 / 转介绍 Markdown 导出: ${JSON.stringify(downloads)}`);
}

if (!downloadNames.some((name) => name.startsWith('lead-portfolio-summary-') && name.endsWith('.json'))) {
  throw new Error(`未触发跨产品线索 JSON 导出: ${JSON.stringify(downloads)}`);
}

if (!downloadNames.some((name) => name.startsWith('lead-portfolio-summary-') && name.endsWith('.md'))) {
  throw new Error(`未触发跨产品线索 Markdown 导出: ${JSON.stringify(downloads)}`);
}

if (!downloadNames.some((name) => name.startsWith('lead-source-daily-digest-') && name.endsWith('.md'))) {
  throw new Error(`未触发来源日报 Markdown 导出: ${JSON.stringify(downloads)}`);
}

if (!downloadNames.some((name) => name.startsWith('lead-source-daily-digest-') && name.endsWith('.json'))) {
  throw new Error(`未触发来源日报 JSON 导出: ${JSON.stringify(downloads)}`);
}

const leadCaptureCalls = fetchCalls.filter((call) => String(call.url).includes('/api/lead-capture'));
if (leadCaptureCalls.length < 3) {
  throw new Error(`未触发完整远程 Lead Capture 请求（提交/拉取/付款回写）: ${JSON.stringify(fetchCalls)}`);
}

if (!leadCaptureCalls.some((call) => (call.options.method || 'GET') === 'POST') || !leadCaptureCalls.some((call) => (call.options.method || 'GET') === 'GET')) {
  throw new Error(`远程 Lead Capture 方法异常: ${JSON.stringify(leadCaptureCalls)}`);
}

if (!leadCaptureCalls.every((call) => String(call.options?.headers?.Authorization || '') === 'Bearer lead-capture-demo')) {
  throw new Error(`远程 Lead Capture Authorization 异常: ${JSON.stringify(leadCaptureCalls)}`);
}

const paymentCall = leadCaptureCalls.find((call) => {
  if ((call.options.method || 'GET') !== 'POST') return false;
  const body = JSON.parse(call.options.body || '{}');
  return Boolean(body.event);
});
if (!paymentCall) {
  throw new Error(`未触发付款回写请求: ${JSON.stringify(leadCaptureCalls)}`);
}
const paymentBody = JSON.parse(paymentCall.options.body || '{}');
if (paymentBody.event.leadId !== 'remote-lead-1' || paymentBody.event.status !== 'paid' || Number(paymentBody.event.amount) !== 229) {
  throw new Error(`付款回写载荷异常: ${JSON.stringify(paymentBody)}`);
}
if (!paymentEvents.length || paymentEvents[0].reference !== 'gumroad-order-001') {
  throw new Error(`付款回写事件未记录: ${JSON.stringify(paymentEvents)}`);
}
if (!context.document.getElementById('leadPaymentStatus').textContent.includes('已回写付款：远程线索演示｜CNY 229')) {
  throw new Error(`付款回写状态异常: ${context.document.getElementById('leadPaymentStatus').textContent}`);
}
if (!context.document.getElementById('leadCaptureStatus').textContent.includes('付款回写成功：local-file｜CNY 229')) {
  throw new Error(`付款回写汇总异常: ${context.document.getElementById('leadCaptureStatus').textContent}`);
}

const leadWebhookCalls = fetchCalls.filter((call) => call.url === 'https://example.com/hooks/leads');
if (leadWebhookCalls.length < 2) {
  throw new Error(`未触发线索 Webhook 推送: ${JSON.stringify(fetchCalls)}`);
}

if (!leadWebhookCalls.every((call) => String(call.options?.headers?.Authorization || '') === 'Bearer demo-token')) {
  throw new Error(`线索 Webhook Authorization 异常: ${JSON.stringify(leadWebhookCalls)}`);
}

const webhookKinds = leadWebhookCalls.map((call) => JSON.parse(call.options.body).kind);
if (!webhookKinds.includes('lead-followup-todos') || !webhookKinds.includes('lead-portfolio-summary') || !webhookKinds.includes('lead-source-daily-digest')) {
  throw new Error(`线索 Webhook kind 异常: ${JSON.stringify(leadWebhookCalls)}`);
}

console.log('线索待办冒烟通过:', {
  count: items.length,
  buckets: items.map((item) => item.timeBucket),
  status: context.document.getElementById('leadStatus').textContent,
  downloads: downloadNames
});
