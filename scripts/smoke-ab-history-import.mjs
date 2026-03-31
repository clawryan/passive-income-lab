import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import handler from '../api/ab-funnel.js';

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
    this.classList = {
      toggle: () => {},
      add: () => {},
      remove: () => {}
    };
  }

  addEventListener(type, listener) {
    this.listeners.set(type, listener);
  }

  dispatch(type, event = {}) {
    const listener = this.listeners.get(type);
    if (listener) {
      return listener({ target: this, preventDefault() {}, ...event });
    }
    return undefined;
  }

  appendChild() {}
  remove() {}
  click() {}
  select() {}
}

const elements = new Map(ids.map((id) => [id, new Element(id)]));
const ensureElement = (id) => {
  if (!elements.has(id)) {
    elements.set(id, new Element(id));
  }
  return elements.get(id);
};

const storage = new Map();

const context = {
  console,
  setTimeout,
  clearTimeout,
  Blob,
  URL,
  URLSearchParams,
  localStorage: {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
    removeItem(key) {
      storage.delete(key);
    }
  },
  document: {
    body: {
      appendChild() {}
    },
    getElementById(id) {
      return ensureElement(id);
    },
    createElement(tag) {
      return new Element(tag);
    },
    execCommand() {
      return true;
    }
  },
  window: {
    location: new URL('https://example.com/web/?tool=ab-funnel'),
    addEventListener() {},
    confirm() { return true; },
    prompt(_message, defaultValue = '') { return defaultValue; }
  },
  navigator: {
    onLine: true,
    clipboard: {
      async writeText() {}
    },
    share: async () => {},
    canShare: () => true,
    serviceWorker: {
      async register() { return { active: { postMessage() {} } }; },
      ready: Promise.resolve({ active: { postMessage() {} } })
    }
  },
  fetch: async (url, options = {}) => {
    if (String(url).startsWith('/api/ab-funnel')) {
      const req = {
        method: options.method || 'GET',
        body: options.body ? JSON.parse(options.body) : undefined
      };
      const result = { statusCode: 200, body: null };
      const res = {
        status(code) {
          result.statusCode = code;
          return this;
        },
        json(data) {
          result.body = data;
          return this;
        }
      };
      await handler(req, res);
      return {
        ok: result.statusCode >= 200 && result.statusCode < 300,
        status: result.statusCode,
        async json() {
          return result.body;
        }
      };
    }

    if (String(url).startsWith('/api/portfolio')) {
      return {
        ok: true,
        async json() {
          return {
            portfolio: { holdings: ['AAPL'], total_return: 0.12, sharpe: 1.2, max_drawdown: -0.08 },
            benchmark: { SPY: 0.08, QQQ: 0.1 },
            selected: [],
            universe_metrics: []
          };
        }
      };
    }

    throw new Error(`未模拟的 fetch 请求: ${url}`);
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

context.loadAbDemoHistory();
context.document.getElementById('abHistoryFilter').value = 'demo-micro-saas-title-lift';
const bundle = context.buildSelectedAbExperimentBundle();
if (!bundle?.payload?.history?.length) {
  throw new Error('未能构建演示实验分享包');
}

context.localStorage.removeItem('passive-income-lab.abHistory.v1');
context.document.getElementById('abHistoryFilter').value = '';
context.document.getElementById('abRecommendationFilter').value = '';

const importInput = context.document.getElementById('abHistoryImportFile');
importInput.files = [
  {
    async text() {
      return JSON.stringify(bundle.payload);
    }
  }
];

await context.handleAbHistoryImport({
  target: importInput
});

const importedHistory = JSON.parse(context.localStorage.getItem('passive-income-lab.abHistory.v1') || '[]');
const selectedExperiment = context.document.getElementById('abHistoryFilter').value;
const formSnapshot = {
  experimentLabel: context.document.getElementById('experimentLabel').value,
  a_clicks: Number(context.document.getElementById('a_clicks').value),
  b_clicks: Number(context.document.getElementById('b_clicks').value),
  targetLift: Number(context.document.getElementById('targetLift').value),
  targetConfidence: Number(context.document.getElementById('targetConfidence').value),
  targetPower: Number(context.document.getElementById('targetPower').value)
};

if (importedHistory.length !== bundle.payload.history.length) {
  throw new Error(`导入后历史条数不符: ${importedHistory.length} !== ${bundle.payload.history.length}`);
}

if (selectedExperiment !== bundle.selected) {
  throw new Error(`导入后未自动切换实验筛选: ${selectedExperiment} !== ${bundle.selected}`);
}

if (
  formSnapshot.experimentLabel !== bundle.selected ||
  formSnapshot.a_clicks !== 136 ||
  formSnapshot.b_clicks !== 146 ||
  formSnapshot.targetLift !== 15 ||
  formSnapshot.targetConfidence !== 90 ||
  formSnapshot.targetPower !== 80
) {
  throw new Error(`导入后表单回填异常: ${JSON.stringify(formSnapshot)}`);
}

const recommendationBoardHtml = context.document.getElementById('abRecommendationBoard').innerHTML;
if (!recommendationBoardHtml.includes('建议动作统计') || !recommendationBoardHtml.includes('主导动作')) {
  throw new Error(`建议动作统计卡片未成功渲染: ${recommendationBoardHtml}`);
}

console.log('A/B 分享包导入冒烟通过:', {
  importedCount: importedHistory.length,
  selectedExperiment,
  formSnapshot,
  recommendationBoard: recommendationBoardHtml,
  status: context.document.getElementById('abStatus').textContent
});
