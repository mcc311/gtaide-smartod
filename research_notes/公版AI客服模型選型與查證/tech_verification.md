# 公版AI客服開源技術堆疊查證（as of 2026-10-14）

查證方法：直接抓取 GitHub raw LICENSE / README / 原始碼（raw.githubusercontent.com、shallow clone）、PyPI/npm registry；新聞類以 WebSearch 取得。限制：本環境 WebFetch 無法連線（parlant.io、huggingface.co、fedscoop.com、govinfo.gov、chatwoot.com DNS 失敗），GitHub REST API 被擋，故部分項目僅能以搜尋摘要或 repo 內檔案佐證，已標註「已驗證（一手）」vs「僅二手/未驗證」。

## 1. Parlant (emcie-co/parlant)

### Takeaway
Parlant 為 Apache-2.0，PyPI 最新 3.3.2（2026-04-28）；原生支援 MCP 工具服務、以 session「manual mode」+ `human_agent` 事件做真人轉接（無內建 Chatwoot 整合，需自行串接）；可經 LiteLLM（可設 base URL，故可接 vLLM/OpenAI 相容端點）或 Ollama 使用自架模型，但官方明言小模型結果不穩、需能穩定輸出複雜 JSON schema。

### Cited Findings
- 授權：LICENSE 為 Apache License 2.0（一手）— [LICENSE](https://raw.githubusercontent.com/emcie-co/parlant/develop/LICENSE)
- 版本：PyPI 最新 3.3.2，上傳 2026-04-28；3.3.1 為 2026-04-14、3.3.0 為 2026-03-15（一手）— [PyPI parlant](https://pypi.org/project/parlant/)；CHANGELOG 有 [Unreleased] 段升級 fastmcp>=3.2.0、litellm>=1.83.0 修 CVE — [CHANGELOG](https://github.com/emcie-co/parlant/blob/develop/CHANGELOG.md)。注意：截至 2026-10 PyPI 無 3.3.2 之後版本，約 5.5 個月無新正式版（以 PyPI 為準）。
- MCP：原生支援。`src/parlant/api/services.py` 定義 service kind `"mcp"`（"Integration with tool servers using the popular MCP (Model Context Protocol)"），並有 `MCPToolClient`（`core/services/tools/mcp_service.py`）；依賴 `fastmcp>=3.2.0`、`mcp>=1.23.0`（一手）— [services.py](https://github.com/emcie-co/parlant/blob/develop/src/parlant/api/services.py)、[pyproject.toml](https://github.com/emcie-co/parlant/blob/develop/pyproject.toml)。另 docs 指出 Parlant 工具一律綁定 guideline，guideline 命中才執行 — [tools.md](https://github.com/emcie-co/parlant/blob/develop/docs/concepts/customization/tools.md)
- 真人轉接：官方文件「Human Handoff」：(a) 以工具回傳 `control={"mode": "manual"}` 讓 AI 停止自動回覆；(b) 外部系統用 client SDK `sessions.update(mode="manual")` 接手；(c) 真人訊息以 `create_event(source="human_agent", participant={id, display_name})` 寫回 session；另有 `human_agent_on_behalf_of_ai_agent` 來源。文件稱可整合 HubSpot、Zendesk 或自建平台，未提 Chatwoot（一手）— [human-handoff.md](https://github.com/emcie-co/parlant/blob/develop/docs/production/human-handoff.md)、[sessions.py SessionModeDTO auto/manual](https://github.com/emcie-co/parlant/blob/develop/src/parlant/api/sessions.py)
- 自架模型：內建 NLP adapters 含 openai、litellm、ollama、openrouter、azure、vertex、gemini、mistral、together、qwen、zhipu、deepseek、modelscope 等（無獨立 vLLM adapter）。LiteLLM adapter 讀 `LITELLM_PROVIDER_MODEL_NAME`、`LITELLM_PROVIDER_BASE_URL`、`LITELLM_PROVIDER_API_KEY`，可指向 vLLM 的 OpenAI 相容端點（一手，原始碼）— [litellm_service.py](https://github.com/emcie-co/parlant/blob/develop/src/parlant/adapters/nlp/litellm_service.py)；CHANGELOG 3.0.2 (2025-08-27) 新增 Ollama service 與 SDK 的 LiteLLM 支援，3.1.0 (2026-01-05) 支援 LiteLLM proxy URL — [CHANGELOG](https://github.com/emcie-co/parlant/blob/develop/CHANGELOG.md)
- 模型大小/品質：README：「You can also use any model and provider via LiteLLM, but they need to be good ones - off-the-shelf models which are too small tend to produce inconsistent results.」推薦 Emcie、OpenAI、Anthropic — [README](https://github.com/emcie-co/parlant/blob/develop/README.md)。Custom LLM 文件：Parlant 使用複雜 JSON schema，需「powerful model」或以大模型為 teacher、針對 Parlant 資料微調的 SLM — [custom-llms.md](https://github.com/emcie-co/parlant/blob/develop/docs/advanced/custom-llms.md)。Ollama 文件預設 `gemma3:4b`，稱 gemma3:1b「may struggle with complex schemas」、gemma3:12b「High accuracy for complex tasks」、gemma3:27b「Very high accuracy」— [ollama.md](https://github.com/emcie-co/parlant/blob/develop/docs/adapters/nlp/ollama.md)
- 非英語：僅見 CHANGELOG「Preserve draft message language during canned response recomposition」；docs 未見中文/多語專章（一手，grep 結果）— [CHANGELOG](https://github.com/emcie-co/parlant/blob/develop/CHANGELOG.md)
- 生產用戶：README 稱「deployed in production at the most stringent organizations, including banks」，引述 Slice Bank、JPMorgan Chase（個人職稱引言）、Oracle 工程師（README 拼成 "Orcale"）— [README](https://github.com/emcie-co/parlant/blob/develop/README.md)

### Inferences
- 與 Chatwoot 串接需自行寫 bridge：Chatwoot Agent Bot webhook → Parlant session event；Parlant 工具觸發 manual mode 時同時呼叫 Chatwoot API 將對話轉為 open（handoff）。
- 8–30B 本地模型：官方 Ollama 文件對 12B/27B Gemma 3 給正面描述，但屬廠商文件而非基準數據；Gemma 4 / gpt-oss-20b 無官方測試紀錄，需 PoC 實測 JSON schema 穩定度（vLLM 的 guided decoding/structured outputs 可輔助）。
- README 中的銀行引言為個人推薦，不等於機構正式背書。

### Gaps
- 無法連 parlant.io（DNS 失敗），未能確認官網是否有更新的 vLLM/繁中說明或 3.3.2 之後的版本。
- 未找到 Gemma 4、gpt-oss-20b、Qwen 等在 Parlant 上的公開評測或 issue 報告。
- 未找到 Parlant 繁體中文客服生產案例。

## 2. Chatwoot

### Takeaway
LICENSE 確認「enterprise/ 目錄以外為 MIT Expat、enterprise/ 為 Chatwoot Enterprise License」；Captain 程式碼位於 enterprise/，屬商業授權且官方定價頁標示 Community Edition 不含 Captain；LINE channel 與 Agent Bot（含 bot_handoff）皆在 MIT 核心。

### Cited Findings
- 授權拆分原文：「All content that resides under the "enterprise/" directory … is licensed under … "enterprise/LICENSE"… Content outside … is available under the "MIT Expat" license」（一手）— [LICENSE](https://raw.githubusercontent.com/chatwoot/chatwoot/develop/LICENSE)
- Enterprise License：生產使用需同意 Chatwoot Subscription Terms 並持有正確 seat 數的有效 Enterprise License；可為開發/測試目的複製修改（一手）— [enterprise/LICENSE](https://raw.githubusercontent.com/chatwoot/chatwoot/develop/enterprise/LICENSE)
- Captain 位置：`enterprise/app/models/captain/assistant.rb` 存在（HTTP 200），`app/models/captain/assistant.rb` 不存在（404）→ Captain 為 enterprise 授權（一手）— [enterprise/app/models/captain](https://github.com/chatwoot/chatwoot/tree/develop/enterprise/app/models/captain)
- 定價：Community Edition $0、Captain AI「not included」；Captain 隨 Premium/Enterprise 方案；官方 help center 文件對所需方案描述略有出入（二手摘要）— [Self-hosted plans](https://chatwoot.com/pricing/self-hosted-plans)、[Enable Captain on self-hosted](https://www.chatwoot.com/hc/user-guide/articles/1755284287-how-to-enable-captain-on-self_hosted-installations)
- LINE：`app/models/channel/line.rb` 位於 MIT 核心（一手）— [line.rb](https://github.com/chatwoot/chatwoot/blob/develop/app/models/channel/line.rb)；官方功能頁：以 LINE Messaging API channel access token + channel secret 設定 — [LINE integration](https://www.chatwoot.com/features/line-integration)
- Agent Bot：`app/models/agent_bot.rb` 在 MIT 核心；routes 有 `agent_bots` 資源與 inbox `set_agent_bot`；`Conversation` 在 bot 收件匣的對話預設為 `pending`，`bot_handoff!` 僅在 pending 時將狀態轉 open 並 dispatch handoff 事件（一手）— [conversation.rb](https://github.com/chatwoot/chatwoot/blob/develop/app/models/conversation.rb)、[routes.rb](https://github.com/chatwoot/chatwoot/blob/develop/config/routes.rb)；官方開發者文件：AgentBot 接收 `message_created` 等事件，以自有邏輯/AI 回覆，將狀態改為 open 即轉真人 — [Chatwoot docs](https://www.chatwoot.com/docs/product)
- 版本：develop 分支 package.json `"version": "4.18.0"`（一手）— [package.json](https://github.com/chatwoot/chatwoot/blob/develop/package.json)

### Inferences
- 政府自架可只用 MIT 核心（收件匣、LINE、Agent Bot、API），AI 部分以外部 bot（Parlant 等）透過 Agent Bot API 接入，避開 Captain 的商業授權。需留意 enterprise/ 目錄雖在同一 repo，生產環境啟用其功能即需授權。

### Gaps
- chatwoot.com 文件無法直接抓取，Captain 所需方案（Premium vs Enterprise）以官方定價頁為準，需採購時再確認。

## 3. 授權查證（LICENSE 檔）

### Takeaway
多數元件為 MIT/Apache-2.0；需注意的「非純 OSI」或混合授權：Dify（修改版 Apache，禁止未授權多租戶與移除前端 logo）、Chatwoot/LiteLLM/Flowise（enterprise 目錄商業授權）、Llama Guard（Llama 社群授權）；Rasa Open Source 已進入維護模式。

### Cited Findings（皆為一手 LICENSE，除另註）
- LangGraph：MIT — [LICENSE](https://raw.githubusercontent.com/langchain-ai/langgraph/main/LICENSE)
- Google ADK (adk-python)：Apache-2.0 — [LICENSE](https://raw.githubusercontent.com/google/adk-python/main/LICENSE)
- Microsoft Agent Framework：MIT — [LICENSE](https://raw.githubusercontent.com/microsoft/agent-framework/main/LICENSE)
- Ragas：Apache-2.0 — [LICENSE](https://raw.githubusercontent.com/explodinggradients/ragas/main/LICENSE)
- DeepEval：Apache-2.0 — [LICENSE](https://raw.githubusercontent.com/confident-ai/deepeval/main/LICENSE)
- promptfoo：MIT（LICENSE「Copyright (c) Promptfoo 2025」，npm 最新 0.124.1，license MIT）— [LICENSE](https://raw.githubusercontent.com/promptfoo/promptfoo/main/LICENSE)、[npm](https://www.npmjs.com/package/promptfoo)。OpenAI 於 2026-03-09 宣布收購；README 更新稱「Promptfoo has joined OpenAI. Promptfoo remains open source and MIT licensed.」；技術將整合進 OpenAI Frontier（二手報導）— [GitHub README](https://github.com/promptfoo/promptfoo)、[SDxCentral](https://www.sdxcentral.com/news/openai-acquires-ai-testing-firm-to-beef-up-agentic-security/)
- garak (NVIDIA)：Apache-2.0 — [LICENSE](https://raw.githubusercontent.com/NVIDIA/garak/main/LICENSE)
- PyRIT (Azure)：MIT — [LICENSE](https://raw.githubusercontent.com/Azure/PyRIT/main/LICENSE)
- Inspect AI：MIT，Copyright UK AI Security Institute — [LICENSE](https://raw.githubusercontent.com/UKGovernmentBEIS/inspect_ai/main/LICENSE)
- Microsoft Presidio：MIT — [LICENSE](https://raw.githubusercontent.com/microsoft/presidio/main/LICENSE)
- NeMo Guardrails：Apache-2.0（SPDX）— [LICENSE](https://raw.githubusercontent.com/NVIDIA/NeMo-Guardrails/main/LICENSE.md)
- Llama Guard 4：Llama 4 Community License（非 OSI）；支援語言沿用 Llama Guard 3：English, French, German, Hindi, Italian, Portuguese, Spanish, Thai（**不含中文**）— [LG4 MODEL_CARD](https://github.com/meta-llama/PurpleLlama/blob/main/Llama-Guard4/12B/MODEL_CARD.md)、[LG3 MODEL_CARD](https://github.com/meta-llama/PurpleLlama/blob/main/Llama-Guard3/8B/MODEL_CARD.md)
- IBM Granite Guardian：repo Apache-2.0；README：「The model is only trained and tested on English data.」— [LICENSE](https://raw.githubusercontent.com/ibm-granite/granite-guardian/main/LICENSE)、[README](https://github.com/ibm-granite/granite-guardian)
- LiteLLM：enterprise/ 目錄另依 enterprise/LICENSE，其餘 MIT — [LICENSE](https://raw.githubusercontent.com/BerriAI/litellm/main/LICENSE)
- vLLM：Apache-2.0 — [LICENSE](https://raw.githubusercontent.com/vllm-project/vllm/main/LICENSE)
- Dify：「modified version of the Apache License 2.0」；(a) 未經 Dify 書面授權不得以原始碼經營多租戶環境（一 tenant = 一 workspace）；(b) 使用 Dify 前端時不得移除/修改 console 或應用中的 LOGO 與版權資訊；貢獻者同意 producer 可調整授權；末段「© 2025 LangGenius, Inc.」並稱互動設計受外觀專利保護（**多租戶/logo 條款確認**）— [LICENSE](https://raw.githubusercontent.com/langgenius/dify/main/LICENSE)
- Flowise：`packages/server/src/enterprise` 與 IdentityManager.ts 等為 Commercial License，其餘 Apache-2.0 — [LICENSE](https://raw.githubusercontent.com/FlowiseAI/Flowise/main/LICENSE.md)。Workday 於 2025-08-14 宣布收購 Flowise，稱將投資其開源基礎 — [Workday 新聞稿](https://newsroom.workday.com/2025-08-14-Workday-Acquires-Flowise,-Bringing-Powerful-AI-Agent-Builder-Capabilities-to-the-Workday-Platform)、[Flowise blog](https://blog.flowiseai.com/workday-flowise)
- Rasa Open Source：Apache-2.0；README 明示「Rasa Open Source is currently in maintenance mode. The future … is Hello Rasa and CALM.」PyPI `rasa` 最新 3.6.21 — [LICENSE](https://raw.githubusercontent.com/RasaHQ/rasa/main/LICENSE.txt)、[README](https://github.com/RasaHQ/rasa)、[PyPI](https://pypi.org/project/rasa/)
- τ-bench (tau2-bench)：MIT, Copyright 2025 Sierra Research — [LICENSE](https://raw.githubusercontent.com/sierra-research/tau2-bench/main/LICENSE)

### Inferences
- Dify 條款直接影響「公版多機關共用」：若以 workspace 區隔各機關＝多租戶，需取得商業授權，或改為每機關單租戶部署、或不用 Dify 前端。
- 「Flowise EOL」說法：未找到任何官方 EOL 公告；LICENSE 仍為 Apache-2.0 + enterprise 商業目錄，Workday 公開立場為持續投資開源。此說法應視為**未證實**。

### Gaps
- ShieldGemma 授權（Gemma Terms of Use）與語言範圍：huggingface.co 無法連線，未一手確認。
- 無法用 GitHub API 取得 Flowise/Rasa 最近 commit 日期以佐證活躍度。

## 4. 台灣 PII 偵測（中文）

### Takeaway
Presidio 預設 recognizer 無任何台灣（或中文）實體，身分證字號、統一編號、手機、健保卡號需以 regex+checksum 自訂 recognizer；人名/地址/機構可用 CKIP 繁中 NER（但 ckip-transformers 程式為 GPL-3.0）。未找到台灣 PII 專用公開基準。

### Cited Findings
- Presidio default_recognizers.yaml 列 US/UK/SG/AU/NG/IN/ES/IT/PH/PL/FI/KR/SE/ZA 等 recognizer，無 TW/CN（一手）— [default_recognizers.yaml](https://github.com/microsoft/presidio/blob/main/presidio-analyzer/presidio_analyzer/conf/default_recognizers.yaml)
- Presidio 多語需替換 NlpEngine（spaCy/Stanza/transformers）並建立對應 recognizer 與 context words（二手摘要 Presidio 文件）— [presidio-analyzer PyPI](https://pypi.org/project/presidio-analyzer/)
- ckip-transformers：GPL-3.0（一手）— [LICENSE](https://raw.githubusercontent.com/ckiplab/ckip-transformers/master/LICENSE)；NER F1：bert-base-chinese 81.18%、albert-base 79.47%、bert-tiny 74.21%、albert-tiny 71.17%；NER 訓練於 OntoNotes 5.0 中文部分以 OpenCC 轉繁體 — [README](https://github.com/ckiplab/ckip-transformers)

### Inferences
- 結構化 ID（身分證：1 英文字母+9 碼含檢查碼；統編 8 碼含檢查邏輯；09 開頭手機）用 Presidio PatternRecognizer + validate_result checksum 即可高精度；地址與姓名需 NER（CKIP 或微調模型）。ckip-transformers 程式為 GPL-3.0，HF 上模型權重授權需另查；若擔心 GPL 傳染，可只用模型權重透過 transformers 推論（需確認權重授權）。
- OntoNotes NER F1 約 81% 為一般新聞語料，客服對話上的 PII 召回率需自建測試集評估。

### Gaps
- 未找到公開的台灣 PII（身分證/健保卡號/地址）偵測基準或現成 Presidio 台灣 recognizer 套件。
- 健保卡號格式（12 碼卡號）未能以一手來源確認。

## 5. 繁中可用、非中國來源之護欄/安全分類器

### Takeaway
主流非 PRC 分類器多不正式支援中文：Llama Guard 3/4 支援 8 語不含中文、Granite Guardian 僅英文訓練測試。最貼近需求的是聯發科創新基金會 MediaTek Research 的 Breeze Guard（台灣華語、Breeze 2 8B 基底，附 TS-Bench）。

### Cited Findings
- Llama Guard 4 語言沿用 LG3：English, French, German, Hindi, Italian, Portuguese, Spanish, Thai — [LG4 card](https://github.com/meta-llama/PurpleLlama/blob/main/Llama-Guard4/12B/MODEL_CARD.md)、[LG3 card](https://github.com/meta-llama/PurpleLlama/blob/main/Llama-Guard3/8B/MODEL_CARD.md)
- Granite Guardian「only trained and tested on English data」— [README](https://github.com/ibm-granite/granite-guardian)；IBM 稱在 GuardBench 其他語言（法德義西）表現仍佳，未含中文 — [IBM Research blog](https://research.ibm.com/blog/granite-guardian-tops-guardbench)
- 研究顯示護欄可擋英文不安全提示卻漏判語意等價中文提示 — [arXiv 2504.15241](https://arxiv.org/pdf/2504.15241v1)
- Breeze Guard：針對台灣華語、建於 Breeze 2 8B、以在地資料微調，涵蓋詐騙、醫療錯誤資訊、歧視、政治操弄，於 TS-Bench 優於通用基線 — [arXiv 2603.07286](https://arxiv.org/pdf/2603.07286)；2026 年 2 月 MR Breeze 3 系列發布 Breeze Guard 26 並開源 — [MediaTek Breeze 3 blog](https://www.mediatek.com/zh-tw/tek-talk-blogs/mediatek-research-breeze-3)
- NeMo Guardrails（Apache-2.0）為框架，可掛任一分類器/LLM 自我檢查 — [LICENSE](https://raw.githubusercontent.com/NVIDIA/NeMo-Guardrails/main/LICENSE.md)

### Inferences
- 建議以 Breeze Guard 為繁中主分類器，Llama Guard 4 / Granite Guardian 作英文或翻譯後輔助；Breeze 2 基於 Llama 3.2，權重授權可能繼承 Llama 授權，需確認。
- Qwen3Guard 等 PRC 模型雖支援中文，依「非 PRC」要求排除（本次未查證）。

### Gaps
- Breeze Guard 權重授權、確切大小與 HF 位置未能一手確認（HF 被擋）。
- ShieldGemma 語言支援未確認；未找到第三方繁中護欄比較評測。

## 6. 評測：τ²/τ³-bench 與繁中 agent 基準

### Takeaway
sierra-research/tau2-bench 為 MIT；README 已標示「τ³-bench is here!」並於 2026-07 發 v1.0.1 評分更新；新增自訂領域須依 domains README 建 data_model/tools/environment 與 tasks.json/policy.md/db.json。繁中僅有函式呼叫基準（BFCL 繁中版、ROCLING 2024 在地化），無繁中多輪客服 agent 基準。

### Cited Findings
- LICENSE MIT（Copyright 2025 Sierra Research）— [LICENSE](https://raw.githubusercontent.com/sierra-research/tau2-bench/main/LICENSE)
- README：「τ³-bench is here!」；「July 2026 — v1.0.1 grading update」修正 `banking_knowledge` 任務，<1.0.1 結果不可比；可用領域：mock、airline、retail、telecom、banking_knowledge；支援文字半雙工與語音全雙工評測；75+ 任務品質修正 — [README](https://github.com/sierra-research/tau2-bench)
- 自訂領域結構：`data_model.py`（DB 子類）、`tools.py`（ToolKitBase 子類）、選用 `user_tools.py`、`environment.py`（get_environment/get_tasks/get_tasks_split）；資料於 `data/tau2/domains/<name>/`：tasks.json、split_tasks.json（至少 `base` split）、policy.md、db.json/toml；`evaluation_criteria.actions` 用於推導目標 DB 終態 — [domains README](https://github.com/sierra-research/tau2-bench/blob/main/src/tau2/domains/README.md)
- 注意：PyPI 上名為 `tau2` 的套件（v2.4.0, gitlab chilton-group）與 τ-bench 無關，需從 GitHub 安裝 — [PyPI tau2](https://pypi.org/project/tau2/)
- 繁中函式呼叫：Breeze 2 論文使用「Function Calling Leaderboard for ZHTW」（BFCL 繁中翻譯版）— [arXiv 2501.13921](https://arxiv.org/pdf/2501.13921)；ROCLING 2024 在地化台灣函式呼叫基準（改編 Gorilla）— [ACL Anthology 2024.rocling-1.26](https://aclanthology.org/2024.rocling-1.26)；TMLU/TMMLU+ 為知識測驗非 agent — [TMMLU+](https://arxiv.org/html/2403.01858v3)

### Inferences
- 可將政府業務（如戶政/稅務 FAQ + 查詢工具）建成 τ² 自訂 domain：policy.md 用繁中 SOP、user simulator 用繁中 persona，即得繁中多輪客服基準。

### Gaps
- 未確認 τ³ 是否另有獨立 repo/名稱；ZHTW BFCL 資料集是否公開未確認。

## 7. 政府 MCP 案例查證

### Takeaway
Census Bureau 官方 MCP（GitHub uscensusbureau，CC0）、GPO GovInfo MCP public preview、GSA MCP hackathon、Code for America × Anthropic SNAP Policy Navigator（2026-05-08，MCP）均可證實；「0%→95%」出自 GSA U.S. Digital Corps fellows 的 MCP 試點報告（FedScoop 報導），但精確說法是：基線 USASpending 0%、CDC PLACES 2.1%，加 MCP 後兩資料集約 95%。

### Cited Findings
- Census：repo `uscensusbureau/us-census-bureau-data-api-mcp`，README「Bringing official Census Bureau statistics to AI assistants」、CC0-1.0、TypeScript MCP SDK、需 Census Data API key 與 Docker（一手）— [README](https://github.com/uscensusbureau/us-census-bureau-data-api-mcp)；報導稱 Census 與 GPO 均於 GitHub 釋出 MCP，Census 版尚未涵蓋全部資料 — [Paubox](https://www.paubox.com/blog/feds-adopt-open-source-protocol-to-connect-ai-chatbots-with-public-data)
- GPO：GovInfo MCP「public preview」，提供 LLM/agent 官方支援方式查詢 GovInfo 內容與 metadata，既有網站/API 不變 — [govinfo.gov MCP public preview](https://www.govinfo.gov/features/mcp-public-preview)；Congressional Data Task Force 2025-12-12 紀錄提及 — [recap](https://congressionaldata.org/congressional-data-task-force-recap-december-12-2025/)
- GSA hackathon：「MCP Server and AI Agent Government Hackathon」，由 AI CoP 的 AI Tooling Meetup Group 舉辦，夥伴 Databricks、OpenAI、IBM；限 .gov/.mil、沙箱、僅公開資料、成果為原型不部署 — [GSA event page](https://www.gsa.gov/artificial-intelligence/si-community-of-practice/events-and-training/mcp-server-and-ai-agent-government-hackathon)
- Code for America × Anthropic：2026-05-08 宣布，SNAP Policy Navigator 基於 MCP，提供聯邦/州/郡 SNAP 政策即時查詢給 caseworker — [Code for America](https://codeforamerica.org/news/anthropic-partnership/)、[GovExec](https://www.govexec.com/technology/2026/05/anthropic-code-america-pilot-ai-tools-snap/413464/)、[Nextgov](https://www.nextgov.com/artificial-intelligence/2026/05/anthropic-and-nonprofit-partner-streamline-benefits-administration-ai/413455)
- 0%→95%：FedScoop 報導 U.S. Digital Corps fellows 試點：ChatGPT/Gemini 基線 USASpending 0%、CDC PLACES 2.1%，接 MCP 後兩資料集 95%；以 Claude Sonnet 4 每提示 10 次試驗；GSA Digital Corps 2026-05-18 發布報告「Improving LLM Access to Federal Open Data」— [FedScoop](https://fedscoop.com/federal-goverment-mcp-improve-ai-access-public-data/)、[Digital Corps blog](https://digitalcorps.gsa.gov/blogs/model-context-protocol/)、[MCP_Report.pdf](https://digitalcorps.gsa.gov/pdfs/MCP_Report.pdf)

### Inferences
- 引用「0%→95%」時應註明：小規模 fellows 試點、兩個資料集、基線為無工具的通用聊天機器人，非機關正式量產指標。

### Gaps
- FedScoop、govinfo.gov、GSA 頁面無法直接抓取，數字依搜尋摘要；GPO MCP 的 GitHub repo 名稱與正式發布日期（2025-12 或 2026-01）來源不一；GSA hackathon 舉辦日期未確認。
