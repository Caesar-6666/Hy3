# 人生模拟 · Hy3 版（Life Simulator powered by Hy3）

> 一款由 **WorkBuddy** 协作构建的「卡牌肉鸽 + 人生模拟」网页游戏。本章人生的**长篇叙事由腾讯混元 Hy3 大模型实时撰写**，展示 Hy3 在「创意中文长文本生成」这一真实场景下的能力。
>
> 本仓库为 **2026 犀牛鸟开源人才培养活动** 的参赛作品，目标分支 `rhinobird2026`。

---

## 一、Hy3 在系统中承担的角色

本应用是一个完整的人生模拟游戏（开局选词条 → 每阶段抽五维卡 → 逐张翻面做取舍抉择 → 撰写本章人生 → 80 岁落幕生成永久档案与 S~D 评级）。其中：

- **核心叙事引擎 = Hy3 API**。每一阶段玩家做完 5 张卡牌的抉择后，游戏会把「阶段名 + 年龄 + 五张卡片事件 + 玩家抉择 + 前情回响」打包成结构化 Prompt，调用 Hy3 的 `chat/completions` 接口，**由 Hy3 生成一段 300–500 字、符合年龄事实、文学化的人生章节**。游戏进行中实时呈现这篇长篇正文；落幕档案里则存一份本地生成的简略版供快速回看。
- **游戏引擎本身 = 浏览器前端**（纯 HTML/JS，无后端依赖）。卡牌系统、五维数值、评级、档案库等全部在客户端运行。
- **严格满足活动要求**：全链路**仅通过 API 调用 Hy3**。本项目使用腾讯云 **TokenHub** 提供的 Hy3 OpenAI 兼容接口（`https://tokenhub.tencentmaas.com/v1`，model `hy3`），不做任何本地推理 / 微调 / 部署。
- **健壮性兜底**：当未配置 Key、网络异常、或接口超时（60s）时，自动回退到规则化叙事，保证游戏永不卡死；并在界面给出「已用本地叙事兜底」提示。

```
玩家抉择 ──► 结构化 Prompt ──► Hy3 API ──► 长篇人生章节 ──► 游戏界面 / 人生档案
                          ▲
                   (无 Key / 超时 / 报错) ──► 本地规则化叙事兜底
```

---

## 二、快速开始

### 方式 A：纯本地叙事（无需 Key，立刻能玩）
直接用浏览器打开 `index.html` 即可。此模式下本章人生由本地规则生成（用于体验玩法、录 demo 1）。

### 方式 B：接入 Hy3（真·AI 叙事，满足参赛要求）

> ⚠️ **必须用本地代理，不能浏览器直连。** 腾讯云 TokenHub 的 `/chat/completions` 接口**不响应浏览器的 CORS 预检（`OPTIONS` 请求返回 `405 Method Not Allowed`）**，浏览器会直接拦截真实 POST——即便 Key 和地址都正确也连不上（用 `curl` 能通只是因为它不发预检）。因此统一走下面的本地代理。

**本地代理（唯一推荐跑法）**
```bash
# 1) 进入本目录，启动代理（默认端口 8787，可用 PORT 环境变量覆盖）
node proxy.js

# 2) 浏览器打开代理同时托管的首页（同源，天然无 CORS / 混合内容问题）
#    http://localhost:8787
```
- 打开 `http://localhost:8787` 后，点右上角 **⚙** 进入 Hy3 设置；
- 填入你的 TokenHub API Key；Base URL 默认已是 `http://localhost:8787/v1`、Model `hy3`；
- 点「测试连接」显示「✅ 连接成功」后即可开玩，本章人生即由 Hy3 实时撰写。
- 进阶：若不想在页面填 Key，可用 `HY3_API_KEY=sk-你的key node proxy.js` 启动，页面 Key 留空也能用（代理会注入环境变量里的 Key）。

> 说明：`proxy.js` 已在本地完成「静态托管 + `/v1` 接口转发」，所以**一条命令 + 一个网址**即可，无需额外静态服务器。

---

## 三、如何获取 Hy3 API Key

1. 登录 **腾讯云控制台 → TokenHub**（`console.cloud.tencent.com/tokenhub`），在模型详情页 `hy3` 获取 API 密钥，得到形如 `sk-xxxx` 的 Key；
2. 在游戏 ⚙ 设置中填入，或作为 `HY3_API_KEY` 环境变量交给本地代理（`HY3_API_KEY=sk-你的key node proxy.js`）。

> 注意：Key 仅保存在你本机浏览器 localStorage（页面直填时）或你的环境变量（代理模式），**仓库中不含任何密钥明文**。

---

## 四、提交 PR 到犀牛鸟活动

1. Fork `Tencent-Hunyuan/Hy3`；
2. 切到活动专用分支 `rhinobird2026`；
3. 将本目录作为子目录（建议 `apps/rensheng-monix/`）放入，或以**独立仓库**形式提交并在 PR 中附上项目说明 + 仓库链接；
4. PR 说明中标注：本项目由 WorkBuddy 协作构建，Hy3 承担「人生章节实时撰写」角色（详见本 README 第六节与 `SUBMISSION_TEXT.md`）；
5. 在 Issue #4 评论区回复「已认领本任务」（认领窗口 7/1–7/31，请确保已在窗口内完成），并在提交 PR 后贴上 PR 链接。

活动硬性要求核对：
- ✅ 全程 API 调用 Hy3，无本地推理
- ✅ 至少 1 个可交互前端（本网页游戏）
- ✅ 开源 + 本 README 写明 Hy3 角色
- ✅ 记录 CodeBuddy/WorkBuddy 协作块（见第六节）
- ✅ 至少 2 个端到端 demo（见 `DEMO_SCRIPTS.md`）

---

## 五、必录的 2 个端到端 Demo（≤2 min 视频 / GIF）

> 完整逐镜脚本（画面 / 操作 / 口播 / 时长）见仓库内 **`DEMO_SCRIPTS.md`**。录屏工具任选（OBS / QuickTime / 浏览器录屏插件），每个 demo 控制在 2 分钟内。

- **Demo 1 · 玩法全流程（无需 Key，本地叙事即可）**：开局选词条 → 抽 5 卡逐张抉择 → 撰写本章人生 → 走完 5 阶段落幕评级 → 查看人生档案库。
- **Demo 2 · Hy3 真·AI 叙事（必须走本地代理）**：通过 `http://localhost:8787` 打开 → ⚙ 填 Key → 测试连接 ✅ → 翻面抉择后由 Hy3 实时生成大段人生章节 → 对比多章文风，证明是 Hy3 实时生成而非固定模板。

---

## 六、CodeBuddy / WorkBuddy 协作记录

本项目的以下部分由 **WorkBuddy（CodeBuddy 同系）** 在对话中协作完成：
- `index.html` 整体的卡牌肉鸽框架、五维数值系统、评级与档案库；
- **Hy3 接入层**：`callHy3Chapter()`（构造 Prompt + 调用 `chat/completions`）、`loadSettings/saveSettings`（Key 管理与 localStorage 持久化，确保密钥不进仓库）、`testHy3()`（连接自检+真实错误回显）、以及「无 Key / 超时 / 报错 → 本地叙事兜底」的健壮性逻辑；
- **`proxy.js` 本地代理**：为绕过 TokenHub 的 CORS 预检（`OPTIONS 405`）而设计，同时承担静态托管与 `/v1` 转发；
- **调试过程**：通过复现 CORS 预检失败，定位「浏览器不能直连 TokenHub」这一根因，并据此确定本地代理为唯一跑法；
- 本 `README.md`、`DEMO_SCRIPTS.md`、`SUBMISSION_TEXT.md`（含 Hy3 角色说明、运行方式、提交与 demo 录制指引）。

人工完成部分：活动报名、API Key 申请、最终录屏与 PR 提交。

---

## 七、文件结构

```
人生模拟-Hy3/
├── index.html        # 游戏本体（含 Hy3 接入层与本地兜底）
├── proxy.js          # 本地代理（静态托管 + /v1 转发，绕过 CORS 预检）
├── README.md         # 本说明（含 Hy3 角色与协作记录）
├── DEMO_SCRIPTS.md   # 2 段端到端 demo 的逐镜录制脚本
└── SUBMISSION_TEXT.md# PR 描述与 Issue #4 评论文案草稿
```

## 八、许可证
本项目代码以 Apache License 2.0 开源（与 Hy3 上游一致）。
