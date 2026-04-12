# Passive Income Lab n8n Workflow 模板

用于把浏览器里的线索待办 / 跨产品总览 Webhook 推到飞书机器人。

## 模板类型

1. **lead-followup-todos**
   - 路径：`passive-income-lab/lead-followup-todos`
   - 作用：接收当前筛选范围内的线索跟进待办
   - 优先使用：`payload.summary`

2. **lead-portfolio-summary**
   - 路径：`passive-income-lab/lead-portfolio-summary`
   - 作用：接收跨产品线索总览与 markdown 周报
   - 优先使用：`payload.summary`，长文可切到 `payload.markdown`

## 页面内复制方式

在 `web/index.html` 的“线索 Webhook 出口”里，直接点击：

- `复制待办 n8n Workflow JSON`
- `复制总览 n8n Workflow JSON`

把 JSON 粘贴到 n8n 的 workflow import，即可得到：

- Webhook 节点
- Normalize Message（把 payload 统一收口为飞书文本）
- Send to Feishu Bot（HTTP Request）
- Respond 200

## 导入后需要改的只有 1 处

把 `Send to Feishu Bot` 里的：

`https://open.feishu.cn/open-apis/bot/v2/hook/replace-me`

替换成你自己的飞书机器人地址。

## 说明

- Workflow 内已带 `pinData`，导入后可直接看到示例 payload。
- 若不发飞书，也可把最后一个 HTTP Request 改成 Slack / Telegram / 自建 API。
- 如果目标端不支持浏览器 CORS，建议浏览器先发到 n8n，再由 n8n 转发到最终平台。
