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
    share: async () => {},
    canShare: () => true,
    serviceWorker: {
      async register() { return { active: { postMessage() {} } }; },
      ready: Promise.resolve({ active: { postMessage() {} } })
    }
  },
  fetch: async (url, options = {}) => {
    fetchCalls.push({ url, options });
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
context.document.getElementById('leadWebhookUrl').value = 'https://example.com/hooks/leads';
context.document.getElementById('leadWebhookAuth').value = 'Bearer demo-token';
context.persistLeadWebhookConfig();
const items = context.buildLeadTodoItems();
const summary = context.buildLeadTodoSummaryText(items);
const markdown = context.buildLeadTodoMarkdown(items);
const portfolioSummary = context.buildLeadPortfolioSummaryText();
const portfolioMarkdown = context.buildLeadPortfolioMarkdown();
const todoWebhookPayload = context.buildLeadTodoWebhookPayload();
const portfolioWebhookPayload = context.buildLeadPortfolioWebhookPayload();
const webhookGuide = context.buildLeadWebhookIntegrationGuide();
await context.shareLeadTodoSummary();
await context.shareLeadPortfolioSummary();
await context.copyLeadWebhookCurl();
await context.copyLeadTodoWebhookPayload();
await context.copyLeadPortfolioWebhookPayload();
await context.copyLeadWebhookIntegrationGuide();
await context.sendLeadTodoWebhook();
await context.sendLeadPortfolioWebhook();
context.exportLeadTodoJson();
context.exportLeadTodoMarkdown();
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

if (!portfolioSummary.includes('跨产品线索摘要｜共 4 条') || !portfolioSummary.includes('当前最热产品：Orion Nexus Quant 研究包')) {
  throw new Error(`跨产品线索摘要异常: ${portfolioSummary}`);
}

if (!portfolioMarkdown.includes('# Passive Income Lab 跨产品线索总览') || !portfolioMarkdown.includes('## 产品分布')) {
  throw new Error(`跨产品线索 Markdown 异常: ${portfolioMarkdown}`);
}

if (todoWebhookPayload.kind !== 'lead-followup-todos' || !todoWebhookPayload.payload?.summary?.includes('Passive Income Lab 跟进待办')) {
  throw new Error(`待办 Webhook Payload 异常: ${JSON.stringify(todoWebhookPayload)}`);
}

if (portfolioWebhookPayload.kind !== 'lead-portfolio-summary' || !portfolioWebhookPayload.payload?.summary?.includes('跨产品线索摘要')) {
  throw new Error(`总览 Webhook Payload 异常: ${JSON.stringify(portfolioWebhookPayload)}`);
}

if (!webhookGuide.includes('Passive Income Lab 线索 Webhook 接线说明') || !webhookGuide.includes('lead-followup-todos') || !webhookGuide.includes('n8n')) {
  throw new Error(`Webhook 接线说明异常: ${webhookGuide}`);
}

const portfolioBoardHtml = context.document.getElementById('leadPortfolioBoard').innerHTML;
if (!portfolioBoardHtml.includes('跨产品线索总览') || !portfolioBoardHtml.includes('最优先线索')) {
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
if (!downloadNames.some((name) => name.startsWith('lead-followup-todos-') && name.endsWith('.json'))) {
  throw new Error(`未触发线索待办 JSON 导出: ${JSON.stringify(downloads)}`);
}

if (!downloadNames.some((name) => name.startsWith('lead-followup-todos-') && name.endsWith('.md'))) {
  throw new Error(`未触发线索待办 Markdown 导出: ${JSON.stringify(downloads)}`);
}

if (!downloadNames.some((name) => name.startsWith('lead-portfolio-summary-') && name.endsWith('.json'))) {
  throw new Error(`未触发跨产品线索 JSON 导出: ${JSON.stringify(downloads)}`);
}

if (!downloadNames.some((name) => name.startsWith('lead-portfolio-summary-') && name.endsWith('.md'))) {
  throw new Error(`未触发跨产品线索 Markdown 导出: ${JSON.stringify(downloads)}`);
}

const leadWebhookCalls = fetchCalls.filter((call) => call.url === 'https://example.com/hooks/leads');
if (leadWebhookCalls.length < 2) {
  throw new Error(`未触发线索 Webhook 推送: ${JSON.stringify(fetchCalls)}`);
}

if (!leadWebhookCalls.every((call) => String(call.options?.headers?.Authorization || '') === 'Bearer demo-token')) {
  throw new Error(`线索 Webhook Authorization 异常: ${JSON.stringify(leadWebhookCalls)}`);
}

const webhookKinds = leadWebhookCalls.map((call) => JSON.parse(call.options.body).kind);
if (!webhookKinds.includes('lead-followup-todos') || !webhookKinds.includes('lead-portfolio-summary')) {
  throw new Error(`线索 Webhook kind 异常: ${JSON.stringify(leadWebhookCalls)}`);
}

console.log('线索待办冒烟通过:', {
  count: items.length,
  buckets: items.map((item) => item.timeBucket),
  status: context.document.getElementById('leadStatus').textContent,
  downloads: downloadNames
});
