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
  fetch: async () => ({ ok: true, async json() { return {}; } })
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
const items = context.buildLeadTodoItems();
const summary = context.buildLeadTodoSummaryText(items);
context.exportLeadTodoJson();

if (!items.length) {
  throw new Error('未生成线索待办');
}

if (!items.some((item) => item.timeBucket === '现在') || !items.some((item) => item.timeBucket === '24h')) {
  throw new Error(`线索待办时间桶异常: ${JSON.stringify(items)}`);
}

if (!summary.includes('Passive Income Lab 跟进待办') || !summary.includes('[现在]')) {
  throw new Error(`线索待办摘要异常: ${summary}`);
}

const lastDownload = downloads.at(-1);
if (!lastDownload || !lastDownload.download.startsWith('lead-followup-todos-') || !lastDownload.download.endsWith('.json')) {
  throw new Error(`未触发线索待办 JSON 导出: ${JSON.stringify(downloads)}`);
}

console.log('线索待办冒烟通过:', {
  count: items.length,
  buckets: items.map((item) => item.timeBucket),
  status: context.document.getElementById('leadStatus').textContent,
  lastDownload
});
