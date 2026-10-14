# 開源客服 / 對話代理框架評估（公版公部門 AI 客服底座候選）— 截至 2026-10

> 研究方法說明：本次 session 的 GitHub API（gh 與 api.github.com）被環境封鎖，無法即時抓取 stars/release 時間；star 數取自 GitHub 頁面 WebFetch 或第三方頁面，均標註來源。rasa.com 無法連線（DNS 失敗），Rasa 授權條款取自 Rasa 官方論壇與 PyPI 及第三方。凡無來源者放在 Gaps。

---

## Q1. 哪些框架最適合「客服」場景？（Rasa CALM、Parlant、Botpress、Dify、Flowise、Chatwoot、Typebot、OpenAI Agents SDK、LangGraph、Google ADK、MS Agent Framework、Pipecat/LiveKit 等）

### Takeaway
沒有單一開源專案能同時涵蓋「對話引擎 + 多通路 + 真人轉接 + 評測」。最適合當公版底座的組合是：**客服行為控制層用 Parlant（Apache-2.0，專為 customer-facing 規範遵循設計）或 Rasa CALM（但需商業授權）**，**通路與真人坐席層用 Chatwoot（核心 MIT，原生支援 LINE）**，**語音用 Pipecat（BSD-2）或 LiveKit Agents（Apache-2.0）**；Dify 雖最成熟、生態最大，但其「修改版 Apache」禁止多租戶營運，對「公版再散布給廠商」構成法律風險。

### Cited Findings

**Parlant（emcie-co/parlant）— 客服專用「行為控制 harness」**
- 授權 Apache 2.0（"free for commercial use"），約 18.3k stars / 1.6k forks — [GitHub emcie-co/parlant](https://github.com/emcie-co/parlant)
- 核心機制：Guidelines（condition→action 規則，每回合比對）、Relationships（規則間排他/相依）、Journeys（多回合 SOP 流程）、Canned Responses（關鍵時刻使用預先核可模板，可杜絕幻覺）、Tools（僅在條件符合時觸發）、Glossary（領域詞彙/同義詞）、Explainability（每個決策以 OpenTelemetry 追蹤）— [GitHub emcie-co/parlant](https://github.com/emcie-co/parlant)
- LLM：官方列 Emcie、OpenAI、Anthropic，並稱可透過 LiteLLM 接任意 provider；但 README 警告「off-the-shelf models which are too small tend to produce inconsistent results」— [GitHub emcie-co/parlant](https://github.com/emcie-co/parlant)
- 自稱在銀行等嚴格組織上線，README 列有 Slice Bank、JPMorgan Chase 等推薦語（屬廠商自述）— [GitHub emcie-co/parlant](https://github.com/emcie-co/parlant)
- README 稱由小型團隊積極開發 — [dev.co Parlant 介紹](https://dev.co/ai/frameworks/parlant)
- README 頁面未提及真人轉接（human handoff）與 MCP — [GitHub emcie-co/parlant](https://github.com/emcie-co/parlant)

**Rasa（CALM / Rasa Pro）**
- Rasa Pro 為 open-core：程式碼可見、可客製，但執行需授權；PyPI 說明有免費 Developer License 與供小規模正式環境的 Extended Developer License，大規模正式上線需付費授權 — [PyPI rasa-pro](https://pypi.org/project/rasa-pro/)；[Rasa 論壇 Extended License 公告](https://forum.rasa.com/t/announcing-the-free-extended-license-for-the-developer-edition/62959)
- 免費授權據 Rasa 官方頁描述為每月最多 1,000 對話（員工使用 100）— 經搜尋摘要轉述 [Rasa Developer Edition 頁](https://rasa.com/rasa-pro-developer-edition-license-key-request)（本次無法直接連線驗證）
- 第三方稱 Growth 方案約 US$35,000/年起，Enterprise 另議 — [Voiceflow Rasa Review 2026](https://www.voiceflow.com/blog/rasa-chatbot)（競爭對手內容，需保留）
- 經典 Rasa Open Source 仍為 Apache-2.0，但多個第三方稱已進入 maintenance mode，CALM 只在 Rasa Pro — [IntuitionLabs](https://intuitionlabs.ai/articles/open-source-chatbots-local-deployment)；[issoh.co.jp](https://www.issoh.co.jp/tech/details/8262/)（未經 Rasa 官方確認）
- PyPI 上可見版本 3.11.x、3.12.x、3.13.x — [PyPI rasa-pro 3.13.1](https://pypi.org/project/rasa-pro/3.13.1/)

**Dify（langgenius/dify）— 最大的低程式碼 LLM App 平台**
- 158.4k stars / 25.1k forks — [GitHub langgenius/dify](https://github.com/langgenius/dify)
- 功能：視覺化 workflow、RAG（PDF/PPT 擷取）、Agent（含 sandbox）、MCP server 連接、Marketplace 工具、LLMOps 日誌與 Opik/Langfuse/Arize Phoenix 整合；支援「any OpenAI API-compatible models」（可接 vLLM 服務的 TAIDE/gpt-oss）；自架需 ≥2 核 / 4GiB、Docker Compose ≥2.24 — [GitHub langgenius/dify](https://github.com/langgenius/dify)
- 授權為「修改版 Apache 2.0」：(a) 未經書面授權不得以 Dify 原始碼營運多租戶環境（一個 workspace = 一個 tenant）；(b) 不得移除/修改 Dify 前台的 LOGO 與版權資訊 — [Dify LICENSE](https://github.com/langgenius/dify/blob/main/LICENSE)
- LINE 串接需第三方套件，例如 linedify（Dify↔LINE bot）— [PyPI linedify](https://pypi.org/project/linedify)

**Chatwoot — 開源全通路客服坐席（真人轉接層）**
- LICENSE：`enterprise/` 目錄以外為 MIT Expat；`enterprise/` 另有獨立授權 — [Chatwoot LICENSE](https://github.com/chatwoot/chatwoot/blob/develop/LICENSE)
- 社群版官方稱 MIT — [Chatwoot Community](https://www.chatwoot.com/community)
- 原生支援 LINE 通路（需 LINE Official Account → Messaging API channel ID/secret/token）— [Chatwoot LINE 設定文件](https://developers.chatwoot.com/contributing-guide/line-channel-setup)；[DPS.MEDIA 指南](https://dps.media/en/complete-guide-on-how-to-integrate-chatwoot-with-line-channel-official-account/)
- Captain AI 不在免費自架版；自架付費 Premium（約 $19/agent/月）、Enterprise（約 $99/agent/月）才含 Captain 與 SLA、稽核日誌等 — [eesel Chatwoot pricing 2026](https://www.eesel.ai/blog/chatwoot-pricing)（第三方）
- 可與 Typebot 等 bot 整合 — [GitHub typebot.io](https://github.com/baptisteArno/typebot.io)

**Botpress**
- 官方文件：Botpress v12（唯一可自架版）已 sunset，不再提供下載或新部署；現行平台為雲端 — [Botpress v12 文件](https://botpress.com/docs/studio/guides/advanced/v12/)
- v12 程式碼為 AGPL-3.0 — [botpress/v12 Issue #39](https://github.com/botpress/v12/issues/39)
- 第三方指出現行 Botpress 無受支援的自架路徑 — [getagent.chat vs Botpress](https://getagent.chat/vs-botpress/)（競品頁）

**Typebot**
- 授權 FSL-1.1-Apache-2.0：禁止「Competing Use」（不得作為替代 Typebot 的商業產品/服務提供），兩年後該版本轉為 Apache 2.0 — [Typebot LICENSE](https://github.com/baptisteArno/typebot.io/blob/main/LICENSE)
- 約 10.5k stars；可 Docker 自架；有 OpenAI、Chatwoot 整合；以 web 嵌入為主 — [GitHub typebot.io](https://github.com/baptisteArno/typebot.io)

**Flowise**
- Workday 於 2025-08-14 宣布收購 Flowise，CTO 表示將持續投資開源 — [SiliconANGLE](https://siliconangle.com/2025/08/15/workday-acquires-flowise-boost-ai-powered-workflows/)；[Nasdaq 新聞稿](https://www.nasdaq.com/press-release/workday-acquires-flowise-bringing-powerful-ai-agent-builder-capabilities-workday)
- 第三方比較頁稱 Flowise 為 Apache 2.0 且「2026 年 8 月 end of life」— [getdynamiq Dify alternatives](https://www.getdynamiq.ai/post/best-dify-alternatives-for-ai-workflow-automation)；此 EOL 說法**無其他來源佐證**，搜尋收購相關報導均未提及 EOL — [Flowise aiwiki](https://aiwiki.ai/wiki/flowise)

**OpenAI Agents SDK + 客服 demo**
- openai/openai-cs-agents-demo：MIT，約 6.6k stars；航空客服情境，Triage Agent 分派至 Flight Info / Booking & Cancellation / Seat / FAQ / Refunds 等專責 agent；展示 handoff 與兩個 guardrail（Relevance、Jailbreak）；Python 後端 + Next.js/ChatKit 前端；文件只說明 OPENAI_API_KEY — [GitHub openai-cs-agents-demo](https://github.com/openai/openai-cs-agents-demo)
- Agents SDK 原語：agents、handoffs、guardrails、sessions、human-in-the-loop、voice；2026-04 加入 sandbox 執行與 TS parity；仍在 1.0 以下版本 — [morphllm 2026 framework 比較](https://www.morphllm.com/ai-agent-framework)（第三方）

**Microsoft Agent Framework（取代 Semantic Kernel + AutoGen）**
- 1.0 GA 於 2026-04-03，統一 AutoGen 與 Semantic Kernel，原生 MCP；workflow 支援 sequential/concurrent/handoff/group，含 checkpoint、HITL、time travel；AutoGen 進入 maintenance mode — [Sean Kim blog](https://blog.imseankim.com/microsoft-agent-framework-1-0-ga-mcp-a2a-devui-autogen-semantic-kernel/)；[Atlan](https://atlan.com/know/ai-agent/microsoft/agent-framework/)
- A2A 是否原生有矛盾：一說為 beta adapter 套件，一說原生 — [Atlan](https://atlan.com/know/ai-agent/microsoft/agent-framework/) vs [digitalapplied](https://www.digitalapplied.com/blog/microsoft-agent-framework-1-0-dotnet-python-guide)

**Google ADK**
- 2026 初推出 Java 1.0 與 Go 1.0，共四語言 SDK；支援 MCP tools 與 A2A — [morphllm](https://www.morphllm.com/ai-agent-framework)；[LangChain frameworks 頁](https://www.langchain.com/resources/ai-agent-frameworks)（第三方，Python 版號未確認）

**語音：Pipecat vs LiveKit Agents**
- Pipecat BSD-2（~12.2k stars）、LiveKit Agents Apache-2.0（~10.5k stars），皆可全自架 — [forasoft 比較](https://www.forasoft.com/blog/article/pipecat-vs-livekit-agents)
- LiveKit 雲端控制面為閉源 — [futureagi LiveKit alternatives](https://futureagi.com/blog/livekit-alternatives-2026/)
- Pipecat transport：Daily、LiveKit、Twilio、Local、SmallWebRTC；建議電話/自訂 transport 選 Pipecat，WebRTC 多方選 LiveKit — [channel.tel](https://www.channel.tel/blog/pipecat-vs-livekit-voice-framework-decision)
- LiveKit 自稱 2026-01 週下載約 40 萬 vs Pipecat 9 萬（廠商數據）— [LiveKit field guide](https://livekit.io/field-guides/guide/livekit-vs-pipecat)

### Inferences
- **客服專用度排序**：Parlant ≈ Rasa CALM（皆以「規則/流程可控」為設計核心）> OpenAI Agents SDK demo（handoff + guardrail 範式清楚但綁 OpenAI）> MS Agent Framework / Google ADK / LangGraph（通用編排，需自建客服語意）> Dify/Flowise（低程式碼，適合 FAQ/RAG，但 SOP 嚴格遵循較弱）。
- Botpress（自架已 sunset）與 Typebot（FSL 禁競品使用）**不適合**作為公版底座。
- Flowise 被 Workday 收購後長期治理不確定，應列為觀察。
- 建議架構（推論）：**Parlant（或 LangGraph/MS Agent Framework 自建）做對話決策 + vLLM 服務 TAIDE/gpt-oss（OpenAI-compatible 端點，經 LiteLLM）+ Chatwoot 做 LINE/web/email 通路與真人坐席 + Pipecat 做電話語音 + Langfuse/OTel 做日誌 + tau2-bench 式模擬評測**。Dify 可作為各機關「FAQ/RAG 快速原型」選項，但不作為再散布的公版核心。

### Gaps
- 無法透過 GitHub API 取得 Rasa、LangGraph、ADK、MS Agent Framework、Chatwoot、Flowise 的即時 star 數與最新 release 日期（環境封鎖）。
- Parlant 是否支援 MCP、內建 human handoff，以及搭配 7–20B 級本地模型（TAIDE-8B、gpt-oss-20b）的實測一致性，未找到資料。
- LangGraph（MIT 推定）、Google ADK（Apache-2.0 推定）的授權本次未取得一手 LICENSE 頁驗證。
- Chatwoot `enterprise/LICENSE` 具體條款未讀取。
- Pipecat/LiveKit 的 SIP 電話接入細節 2026 年狀態未確認。

---

## Q2. 哪些授權對「政府公版、再散布給廠商」是安全的？

### Takeaway
**安全（寬鬆授權）**：Parlant（Apache-2.0）、Chatwoot 核心（MIT，排除 enterprise/）、OpenAI cs demo（MIT）、Pipecat（BSD-2）、LiveKit Agents（Apache-2.0）。**有條件/高風險**：Dify（禁多租戶、禁改 LOGO）、Typebot（FSL 禁競品用途）、Botpress v12（AGPL 且已 sunset）、Rasa Pro（需商業授權，免費額度僅小規模）。

### Cited Findings
- Dify：不得未經書面授權以原始碼營運多租戶；不得改前台 LOGO/版權 — [Dify LICENSE](https://github.com/langgenius/dify/blob/main/LICENSE)；二手來源指出單一公司內部使用可，對外轉售需商業授權 — [dev.to Dify Pricing Teardown](https://dev.to/beton/dify-pricing-teardown-2026-42g5)
- Typebot FSL-1.1-Apache-2.0：禁 Competing Use，兩年後轉 Apache — [Typebot LICENSE](https://github.com/baptisteArno/typebot.io/blob/main/LICENSE)
- Chatwoot：enterprise/ 外為 MIT — [Chatwoot LICENSE](https://github.com/chatwoot/chatwoot/blob/develop/LICENSE)
- Botpress v12：AGPL-3.0 — [botpress/v12 #39](https://github.com/botpress/v12/issues/39)
- Rasa Pro：執行需授權，大規模正式上線需付費 — [PyPI rasa-pro](https://pypi.org/project/rasa-pro/)
- Parlant：Apache 2.0 — [GitHub emcie-co/parlant](https://github.com/emcie-co/parlant)
- Pipecat BSD-2 / LiveKit Agents Apache-2.0 — [forasoft](https://www.forasoft.com/blog/article/pipecat-vs-livekit-agents)
- Promptfoo 被 OpenAI 收購（2026-03-09），OpenAI 表示維持現有開源授權 — [OpenAI 公告](https://openai.com/index/openai-to-acquire-promptfoo/)；[TechCrunch](https://techcrunch.com/2026/03/09/openai-acquires-promptfoo-to-secure-its-ai-agents/)

### Inferences
- 公版若由中央建置、各機關/廠商各自部署（單租戶），Dify 條款 (a) 在單機關部署可能不觸發，但「公版平台由一個營運單位服務多機關 workspace」即屬多租戶，需 LangGenius 書面授權；且條款 (b) 使公版無法改成政府品牌前台。建議法務個別審查。
- AGPL 對政府自用並非絕對禁止，但對「交付給廠商再改作」會產生原始碼公開義務，增加採購與資安合規負擔。
- 建議公版核心只採 Apache-2.0 / MIT / BSD 元件，並在採購規範中要求廠商衍生品維持相容授權。

### Gaps
- 未查證台灣政府（數位發展部/國發會）對開源授權的正式採購指引。
- LangGraph、Google ADK、MS Agent Framework、Ragas、garak、PyRIT、Inspect 之 LICENSE 未在本次以一手來源驗證（一般認知為 MIT/Apache，但未列為已證實）。

---

## Q3. 決定性流程（SOP/業務規則）、工具呼叫/API、MCP、真人轉接、日誌/分析如何處理？

### Takeaway
「確定性 SOP」是客服框架真正的分水嶺：Parlant 用 Guidelines + Journeys + Canned Responses；Rasa CALM 用 flows（業務邏輯決定性執行，LLM 只負責理解）；通用框架（OpenAI SDK、MS Agent Framework）以 handoff/workflow 圖實作。真人轉接最好交給 Chatwoot 這類坐席系統，而非框架本身。

### Cited Findings
- Parlant：Journeys = 多回合 SOP 流程；Canned Responses = 關鍵時刻預核可回覆；Tools 僅在條件比對成立時觸發；決策以 OpenTelemetry 追蹤 — [GitHub emcie-co/parlant](https://github.com/emcie-co/parlant)
- Parlant guideline 範例：退款請求 → 必須先查訂單狀態並呼叫工具 — [dev.co Parlant](https://dev.co/ai/frameworks/parlant)
- OpenAI cs demo：Triage→專責 agent handoff；Relevance/Jailbreak guardrails — [GitHub openai-cs-agents-demo](https://github.com/openai/openai-cs-agents-demo)
- MS Agent Framework：workflow 支援 handoff 模式、checkpoint、human-in-the-loop、原生 MCP — [Sean Kim blog](https://blog.imseankim.com/microsoft-agent-framework-1-0-ga-mcp-a2a-devui-autogen-semantic-kernel/)
- Dify：Agent 可連 MCP servers、自訂 API；LLMOps 日誌 + Langfuse/Opik/Phoenix — [GitHub langgenius/dify](https://github.com/langgenius/dify)
- Chatwoot：統一收件匣涵蓋多通路（含 LINE），作為真人坐席 — [Chatwoot channels](https://www.chatwoot.com/features/channels)；[GitHub chatwoot](https://github.com/chatwoot/chatwoot)
- 真人轉接觸發建議：檢索信心低、高風險意圖（退款、帳務爭議、取消）、使用者要求真人、連續失敗兩次 — [Social Intents](https://www.socialintents.com/blog/ai-chatbot-hallucination-in-customer-service/)
- AWS 範例：幻覺偵測分數低於門檻即轉真人而非回覆 — [AWS ML Blog](https://aws.amazon.com/blogs/machine-learning/reducing-hallucinations-in-large-language-models-with-custom-intervention-using-amazon-bedrock-agents/)

### Inferences
- 公部門 SOP（如申辦資格判斷、法定期限）應以「規則/流程層」決定性執行，LLM 僅做意圖理解與自然語言生成；法定措辭用 canned/模板回覆。Parlant 與 Rasa CALM 的設計最貼近此需求。
- 機關既有系統串接宜以 MCP server 封裝（Dify、MS Agent Framework、ADK 皆支援），讓公版與底層框架解耦。

### Gaps
- Rasa CALM flows 與 Chatwoot handoff 的官方整合細節，本次未能存取 rasa.com 驗證。
- Parlant↔Chatwoot 轉接整合是否有現成方案，未找到資料。

---

## Q4. 客服代理的評測與紅隊工具

### Takeaway
客服 agent 的標準評測是 Sierra 的 τ-bench 系列（τ²-bench 已在 telecom 領域接近飽和，2026 年 repo 已更名 τ³-bench，加入 banking_knowledge 與全雙工語音）；RAG 用 Ragas/DeepEval；測試與紅隊用 promptfoo（已被 OpenAI 收購但維持開源）、garak、PyRIT、Inspect。公版應仿 τ-bench 建立「中文公部門領域」模擬使用者 + 資料庫狀態比對的評測集。

### Cited Findings
- τ-bench 原始論文（Sierra，2024）：以模擬使用者 + 工具 + 政策文件評測客服 agent，並提出 pass^k 一致性指標 — [arXiv 2406.12045](https://arxiv.org/abs/2406.12045)
- τ²-bench：dual-control（使用者與 agent 皆可操作環境）的 telecom 領域；原論文 GPT-4.1 僅約 0.34 — [arXiv 2506.07982](https://arxiv.org/pdf/2506.07982)；[canagentswork 摘要](https://www.canagentswork.com/benchmarks/tau2-bench/)
- 2026 年 telecom pass^1 接近天花板（多模型 97–98%）；Sierra 驗證 Qwen3.5-397B-A17B 97.8%（2026-02-27）；pass^4 與 banking knowledge（最佳 55.2% pass^1）仍有區辨力 — [benchmarkingagents τ³](https://benchmarkingagents.com/tau3-bench/)；[Artificial Analysis](https://artificialanalysis.ai/evaluations/tau2-bench)（各來源最高分 97.8/98.2/99% 不一致，混用驗證與自報數據）
- τ³-bench 位於 sierra-research/tau2-bench repo，五個 task family：mock、retail、airline、telecom、banking_knowledge，並加入全雙工語音評測 — [benchmarkingagents τ³](https://benchmarkingagents.com/tau3-bench/)
- Promptfoo：OpenAI 2026-03-09 宣布收購，維持開源；>35 萬開發者、>25% Fortune 500 使用 — [OpenAI](https://openai.com/index/openai-to-acquire-promptfoo/)；[SecurityWeek](https://www.securityweek.com/openai-to-acquire-ai-security-startup-promptfoo/)
- garak（NVIDIA）：100+ 攻擊 probe（prompt injection、資料外洩、越獄）；PyRIT（Microsoft）：紅隊攻擊編排；Inspect AI 為英國 AISI 框架 — [youngju.dev 2026 evals 指南](https://www.youngju.dev/blog/culture/2026-05-16-ai-safety-evals-red-teaming-2026-inspect-ai-garak-pyrit-promptfoo-openai-evals-deep-dive)
- Ragas 指標：context precision/recall、faithfulness、answer relevancy — [jimmysong.io Ragas](https://jimmysong.io/ai/ragas)
- DeepEval：50+ 指標涵蓋 RAG/agent/chatbot/安全，Pytest 整合，支援多回合 — [Keywords AI 比較](https://keywordsai.co/market-map/compare/deepeval-vs-ragas)

### Inferences
- τ²/τ³ 公開領域（英文航空/零售/電信）對台灣公部門無直接代表性；公版應借用其「模擬使用者 + 政策文件 + 終態 DB 比對 + pass^k」方法，自建繁中政府服務任務集（如戶政、稅務、健保 FAQ + 申辦流程）。
- pass^k（同任務多次皆成功）比 pass^1 更符合公部門「一致性」要求。
- 紅隊：garak（模型層）+ promptfoo/PyRIT（應用層）+ 中文越獄/政治敏感題庫。

### Gaps
- 未找到繁體中文或台灣公部門客服專用的公開 benchmark。
- TAIDE / gpt-oss 在 τ²-bench 的分數未找到。
- Ragas、garak、PyRIT、Inspect 的確切授權未以一手來源驗證。

---

## Q5. 實務上的生產陷阱

### Takeaway
最常見的失敗是「捏造政策」（Air Canada 案）、檢索失誤、LLM 忽略檢索內容，以及沒有真人退路造成使用者卡住；小模型在規則遵循上不穩定。

### Cited Findings
- Air Canada 聊天機器人捏造不存在的退款政策，為典型幻覺事故 — [Evidently AI](https://www.evidentlyai.com/blog/llm-hallucination-examples)
- Ericsson Llama 客服案例：幻覺、檢索漏抓、LLM 丟棄檢索內容佔約 80%（22/28）錯誤；加更多 context 反而可能加重幻覺 — [arXiv 2408.09277](https://arxiv.org/pdf/2408.09277)
- 「沒有真人轉接的 chatbot 是陷阱」，使用者會卡住循環 — [Social Intents](https://www.socialintents.com/blog/ai-chatbot-hallucination-in-customer-service/)
- 解題率高的模型仍可能最常捏造；應偏好會婉拒/轉接的模型（廠商測試）— [IrisAgent](https://irisagent.com/blog/best-llms-for-customer-support-chatbot-2026/)
- Parlant 警告太小的現成模型會產生不一致結果 — [GitHub emcie-co/parlant](https://github.com/emcie-co/parlant)
- TAIDE：國科會 2023-04 啟動；TAIDE-LX-7B（Llama 2）可商用、13B 僅研究，後續 Llama 3 基礎 TAIDE-LX-8B — [Taiwan News](https://www.taiwannews.com.tw/en/news/5085740)；[ai.taiwan.gov.tw](https://ai.taiwan.gov.tw/news/taiwan-developed-generative-ai-system-to-expand-applications-premier/)

### Inferences
- 若底層模型是 8B 級 TAIDE，guideline/journey 類框架的多規則比對可能不穩，宜：(1) 關鍵回覆用 canned response；(2) 意圖分類/規則比對另用較大模型（如 gpt-oss-120b 經 vLLM）或分層；(3) 以 pass^k 評測驗證。
- 公部門回覆涉及法定權利義務，應強制「依據引用 + 不確定即轉真人」。

### Gaps
- 未找到 Hacker News 上 2025–2026 的具體從業者討論串（搜尋僅回傳廠商內容）。
- 未找到台灣政府既有 AI 客服（如 1999、各部會 LINE 官方帳號）的公開失敗/成功案例檢討。

---

## 總結推薦（供報告撰寫者）

| 元件 | 推薦 | 授權 | 理由 / 風險 |
|---|---|---|---|
| 對話決策核心 | **Parlant**（首選）；備選 LangGraph 或 MS Agent Framework 自建 | Apache-2.0 | 客服專用 guidelines/journeys/canned responses、OTel 可解釋性；風險：小團隊、小模型一致性 |
| 商用備選 | Rasa Pro CALM | 商業（open-core） | SOP 決定性最強；但公版再散布需授權費 |
| 快速原型/FAQ RAG | Dify | 修改版 Apache | 生態最大(158k★)、MCP、OpenAI-compatible；多租戶與 LOGO 限制 |
| 通路 + 真人坐席 | **Chatwoot** | MIT（enterprise/ 除外） | 原生 LINE、web、email；Captain AI 需付費（公版不需，用自家 agent） |
| 語音/電話 | **Pipecat**（電話）/ LiveKit Agents（WebRTC） | BSD-2 / Apache-2.0 | 皆可自架 |
| 模型服務 | vLLM（OpenAI-compatible）+ LiteLLM | — | TAIDE / gpt-oss / Llama 互換 |
| 評測 | τ²/τ³-bench 方法論 + Ragas/DeepEval + promptfoo | 開源 | 自建繁中公部門任務集，以 pass^k 驗收 |
| 紅隊 | garak + PyRIT + promptfoo | 開源 | 模型層 + 應用層 |
| 排除 | Botpress（自架 sunset、AGPL）、Typebot（FSL）、Flowise（收購後治理不確定，待觀察） | | |
