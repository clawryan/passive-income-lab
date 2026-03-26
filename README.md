# Passive Income Lab

目标：30天内，围绕可落地、合规、可盈利的数字化被动收益方向，完成“调研 -> 原型 -> 验证 -> 迭代 -> 公开沉淀”。

## 原则
- 先做能跑通的小闭环，再扩张。
- 只做可验证的事，不刷无意义提交。
- 安全优先：不执行未知脚本、不跑可疑二进制。
- 合规优先：不碰灰产、侵权、欺诈。

## 目录
- `ideas-backlog.md`：候选方向池
- `research-log.md`：调研日志
- `build-log.md`：构建与实验记录
- `results.md`：阶段成果与指标
- `plan-30d.md`：30天路线图
- `web/index.html`：浏览器入口（A/B Funnel Analyzer + Orion Nexus Quant Monitor）
- `api/ab-funnel.js`：数字产品 A/B 漏斗判定 API

## 当前可直接操作原型
- **数字产品 A/B Funnel Analyzer**：输入曝光/点击/结账/支付，输出显著性、胜负判定、下一步动作。
- **Orion Nexus Quant Monitor**：查看策略信号、组合收益、基准对比（研究/模拟）。
- **PWA 安装 / 离线访问**：`web/index.html` 现已补齐 manifest + service worker，可安装到手机主屏或电脑桌面，并支持离线打开已缓存的工具壳。
- **当前实验分享包**：A/B 历史区支持按实验筛选后导出单个实验的 JSON 分享包，内含历史记录、最新结论与分享链接，便于跨设备或协作者接力复盘。
