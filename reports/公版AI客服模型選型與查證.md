# 換上 Gemma 4，把評測做成護城河

**結論先講。** 公版公部門 AI 客服的預設模型，建議改成 **Gemma 4 31B（dense）為主、Gemma 4 26B-A4B（MoE）負責高併發，較重的多步驟 agent 任務交給 gpt-oss-120b**。這三款都是 Apache 2.0、美國來源，可以在國網中心用 vLLM 地端部署，單張 80GB H100 就放得下。團隊自己在 Gemma 4 上做的繁中／政府用語微調版，則列為正式交付物之一。中國來源的開放權重模型（Qwen、DeepSeek、GLM、Kimi 等）應該**預設排除**。DeepSeek 已經被明文禁用，而且禁用範圍包含「地端下載」；Qwen 等模型目前沒有專門函釋，但「公務機關不得使用大陸廠牌資通訊產品（含軟體）」這條通則涵蓋得很廣，公版作為國家計畫不值得冒這個險。這個排除原則也要延伸到嵌入、重排與語音模型。有一點必須先講清楚：**本報告引用的模型分數，大多來自搜尋摘要與聚合網站，口徑互相衝突**。例如 Gemma 4 31B 的 τ²-bench 分數，有來源寫 59.9%，也有來源寫 86.4%。所以第一季的第一件事，就是用團隊自己的繁中政府評測集做一次模型比試（bake-off）。前一版報告列為「尚未證實」的事項，這次大部分已經查清楚：《人工智慧基本法》在 2026-01-14 公布施行；數位部風險分類框架 v1.0 在 2026-07-07 發布；修正後的資安法在 2025-12-01 施行；Parlant 原生支援 MCP 與真人轉接，但沒有內建 Chatwoot 整合；Chatwoot 的 Captain AI 只有企業版才有；美國 MCP「0%→95%」的數字也有正式報告可以引用。仍然查不到的有：個資會是否已經成立、國網中心推論服務的收費與 SLA，以及幾項國際案例的細節。其他架構建議不變，包括雙軌路線、六項交付物、坐席輔助先行。改變的是，團隊的價值重心從「提供模型」移到四件事上：**評測集、在 Gemma 4 上的在地微調、政府領域資料，以及一致性測試**。

## 模型層：Gemma 4 為預設，gpt-oss-120b 處理重任務，評測決定最後版本

### 候選模型只剩少數幾款同時符合三個條件

公版模型要同時滿足三個條件：非中國來源、授權寬鬆、可以地端部署。這樣篩下來，可選的模型很少。**Gemma 4 在 2026-04-02 發布，Google 第一次把 Gemma 改用 Apache 2.0**（Gemma 1–3 用的是 Google 自訂的使用條款）。Gemma 4 共有四款：E2B、E4B、26B MoE（約 3.8B active）、31B dense。26B 與 31B 支援 256K context，**31B 不量化也能放進單張 80GB H100** ([The Decoder](https://the-decoder.com/googles-gemma-4-is-now-available-with-apache-2-0-licensing-for-the-first-time/)；[TechWyse](https://www.techwyse.com/news/ai-search/google-deepmind-gemma-4-open-models-apache-2-0-release))。整個系列都內建原生 function calling，也可以設定 thinking mode ([Verdent](https://www.verdent.ai/guides/gemma-4-coding-agent-review))。改用 Apache 2.0 後，Gemma 3 自訂條款的法遵疑慮就解除了。gpt-oss-120b／20b 的官方模型卡在 2025-08 公開 ([OpenAI model card](https://arxiv.org/pdf/2508.10925))。120b 是約 117B 參數、約 5.1B active 的 MoE，用 MXFP4 格式可以放進單張 80GB GPU ([GitLab vLLM 部署文件](https://docs.gitlab.com/administration/gitlab_duo_self_hosted/vllm_gpt_oss_120b/))。它的授權是 Apache 2.0 另加使用政策，不過這一點出自研究者的既有知識，採用前要再核對授權檔。

其他候選要嘛有條款疑慮，要嘛資訊還不夠完整。**Llama 4 的授權**有三個問題：月活 7 億以上要另外申請授權、必須顯著標示「Built with Llama」、衍生模型名稱要以 Llama 開頭，另外還有歐盟多模態排除條款 ([The Decoder](https://the-decoder.com/meta-releases-first-multimodal-llama-4-models-leaves-eu-out-in-the-cold/))。命名條款會直接影響公版的品牌，所以不建議用 Llama 4 當預設。**Mistral Small 4** 據稱是 119B 參數、6.5B active 的 MoE，採 Apache 2.0，在 2026-03-16 發布，但這些資訊只出現在聚合網站上，**沒有看到 Mistral 的官方頁面** ([llmreference](https://www.llmreference.com/compare/llama-3.3-nemotron-super-49b-v1/mistral-small-4))。NVIDIA Nemotron 3 Super 的授權與工具呼叫能力也都還沒確認。這兩款先列為「大型備選，待驗證」。

### 中國來源模型：DeepSeek 已明文禁用，其他模型也應預設排除

| 項目 | 官方狀態 | 依據 | 公版建議 |
|---|---|---|---|
| DeepSeek（雲端、App、**地端下載**） | **明文禁用** | 行政院 2025-02-03 宣布；數位部 2025-01-31 認定為危害國家資通安全產品 ([中央社](https://cna.com.tw/news/aipl/202502030237.aspx))；禁用範圍包含斷網下載後使用 ([風傳媒](https://www.storm.mg/article/5327512)；[聯合報](https://udn.com/news/story/6885/8530706)) | 排除 |
| Qwen／GLM／Kimi／MiniMax 開放權重 | 沒有專門函釋 | 適用「公務機關不得使用大陸廠牌資通訊產品（含軟體、硬體、服務）」的通則 ([聯合報](https://udn.com/news/story/6885/8530706))；國安局 2025-11 抽測，**通義千問在 15 項指標中有 11 項違規，是最多的一款**，但這次抽測針對的是 App 與雲端服務 ([自由軍武](https://def.ltn.com.tw/article/breakingnews/5247550)) | 預設排除，並以書面向資安署函詢 |
| 以 Qwen 等為底模的衍生微調 | 灰色地帶，沒有找到官方回應 | — | 公版避免使用 |
| 嵌入／重排／語音（Qwen3-Embedding、BGE、GTE、CosyVoice 等） | 沒有專門規範 | 要注意隱性血緣：**Snowflake Arctic-Embed-m-v2.0 是以阿里 GTE 為底** ([Snowflake](https://www.snowflake.com/en/blog/engineering/snowflake-arctic-embed-2-multilingual/))；BreezyVoice 採用 CosyVoice2 架構 ([T客邦](https://www.techbang.com/posts/128092-mediatek-mr-breeze-3-ai-taiwanese-fraud)) | 同樣套用血緣篩選 |

官方說法其實有矛盾。數位部長曾經公開說，地端 LLM 的資料流可以由使用者自己控制 ([公視](https://news.pts.org.tw/article/736631))，但同一時期的禁令又明確涵蓋地端下載。另外，有一篇台灣企業部落格寫到「政府標案採用中國系模型屬明令禁止」，但那是部落格自己的詮釋，**不是官方原文** ([masonailab](https://masonailab.com/insights/chinese-open-models-us-enterprise-cost-2026/))。2025-12-01 施行的新資安法，已經把「危害國家資通安全產品」提升到法律位階，並授權數位部訂定審查程序 ([理律](https://www.leeandli.com/TW/NewslettersDetail/7505.htm))。但新法有沒有明文涵蓋「開放權重模型」，目前還查不到。所以第一季應該發一份正式公文給資安署，請對方書面回覆以下四個問題：(1) 中國來源的開放權重模型在地端執行，是否屬於限制範圍；(2) 以這類模型為底模做的衍生微調，是否也受限；(3) 嵌入與語音模型是否適用同樣標準；(4) 委外廠商在公版上自行換用模型時，責任怎麼歸屬。這份回函也會變成合規包的一部分。這個問題值得先釐清，原因是業餘測試顯示 Qwen 在繁中知識題上確實很強，部會廠商一定會想用。有部落格在 TMMLU+ 上自測，Qwen3.6-35B-A3B 得到 75%，Gemma 4 26B-A4B 只有 46% ([ai-muninn](https://ai-muninn.com/en/blog/tmmluplus-qwen-vs-gemma-traditional-chinese))。這只是單一來源，測試方法也看不到全文。但如果差距屬實，代表 26B-A4B 這種 active 參數小的 MoE 在知識型題目上比較弱。客服場景的知識主要從檢索來，受到的影響會比較小，但還是要實測。

### 繁中證據指向「Gemma 底模加在地續訓」

台灣唯一有系統的在地評測，是數位部 AIEC 做的。2025-10 第一次公布結果，涵蓋 42 個模型，測的是學測國文、社會與「臺灣價值觀」。結果顯示 **Gemma-3-TAIDE-12b 在 13B 以下的模型中名列前茅，而且分數高於它的原始底模 Gemma-3-12b-it** ([中央社](https://www.cna.com.tw/news/ait/202510030150.aspx))。2026-09 的「臺灣主權 AI 評測」擴大到 188 個模型，前三名是 OpenAI、Anthropic、Google 的閉源模型 ([公視](https://news.pts.org.tw/article/825337))。台智雲自己宣稱，FFM-Gemma4-31B 綜合排名第 9，在公開參數 35B 以下的模型中排第 2 ([經濟日報](https://money.udn.com/money/story/5612/9809272))。不過這是廠商自己的說法，而且和公視「第 10 名是亞太智能機器」的報導互相衝突，要看官方榜單才能確定。這兩筆證據指向同一件事：**以 Gemma 為底模，再做台灣在地續訓，效果明顯**。這正是團隊已經驗證過的能力。現在要做的是換底模，把這套方法遷移到 Gemma 4 31B 上，產出「Gemma 4 繁中政府版」。至於公版平台的品牌，則維持模型中立。gpt-oss-120b、Gemma 4 原版、Llama 4 在 AIEC 上的名次，這次都沒有查到。數位部在 2025-12 發布的「台灣主權 AI 訓練語料庫」([自由財經](https://ec.ltn.com.tw/article/breakingnews/5374176))，可以拿來當微調資料的來源之一。

### Agent 能力分數口徑混亂，只能當排序參考

最接近客服 agent 情境的基準是 τ-bench 與 τ²-bench。**gpt-oss-120b 的官方數字最完整**：τ-bench Retail 在 low、medium、high 三種推理強度下分別是 49.4%、62.0%、67.8%，Airline 分別是 42.6%、48.6%、49.2% ([OpenAI model card](https://arxiv.org/pdf/2508.10925)；[NVIDIA NIM](https://docs.api.nvidia.com/nim/reference/openai-gpt-oss-120b))。Gemma 4 的數字就亂得多。聚合網站轉述 Artificial Analysis 的 τ²-bench 結果：31B 是 59.9%，26B-A4B 是 43.6% ([BenchLM](https://benchlm.ai/benchmarks/tau2-bench))。另一個第三方來源則說，31B 在 τ²-Retail 拿到 86.4%，而 Gemma 3 27B 只有 6.6% ([Verdent](https://www.verdent.ai/guides/gemma-4-coding-agent-review))。差距這麼大，問題可能出在測試設定、版本不同或摘要轉述錯誤，這次查證沒有辦法分辨。比較能確定的方向是：**Gemma 3 不適合再當客服 agent 的主模型**。不論哪一種口徑，Gemma 3 → Gemma 4 在工具呼叫上的進步都很大。另外，目前沒有任何繁中多輪客服 agent 的公開基準，繁中只有函式呼叫基準，例如 Breeze 2 論文用的 BFCL 繁中版 ([arXiv 2501.13921](https://arxiv.org/pdf/2501.13921))，以及 ROCLING 2024 的在地化函式呼叫基準 ([ACL Anthology](https://aclanthology.org/2024.rocling-1.26))。

> **重要提醒：** 以上 Gemma 4、Mistral Small 4 的 τ²／TMMLU+ 數字，以及 FFM 的名次，都來自搜尋摘要、聚合網站或廠商自述，研究環境沒辦法打開 Hugging Face 模型卡逐字核對。**這些數字只能拿來決定哪些模型值得進入比試，不能當成選型結論**。團隊本來就有評測能力，應該用自己的繁中政府評測集重新測過。

### 建議模型陣容

| 層級 | 預設 | 備選 | 參考硬體 | 用途 |
|---|---|---|---|---|
| 小型／高併發 | Gemma 4 26B-A4B-it | gpt-oss-20b；Gemma 4 E4B（語音前端） | 1×L40S 48GB 或 1×H100（FP8） | FAQ、意圖路由、分類 |
| **中型（公版預設）** | **Gemma 4 31B-it** → 團隊的繁中政府微調版 | Gemma 4 26B-A4B | 1×H100／H200 | 附引用的 RAG、一般工具呼叫 |
| 大型（複雜 agent） | gpt-oss-120b（推理強度 medium／high） | Mistral Small 4、Nemotron 3 Super（**兩者授權都待核**） | 1–2×H100／H200 | 多工具串接、案件流程 |
| 安全護欄 | Breeze Guard 26 | Llama Guard 4（只用於英文） | 小卡 | 詐騙、不實資訊、越權 |
| 嵌入 | EmbeddingGemma-300M | multilingual-e5-large、Arctic-Embed-l-v2.0（以 XLM-R 為底） | CPU／小卡 | 檢索 |
| ASR | Breeze-ASR-25（華語）＋Breeze-ASR-26（台語） | Whisper large-v3 | 1×L4／L40S | 第二年電話客服 |

吞吐方面，SemiAnalysis 實測 gpt-oss-120b 在 H100 上用 vLLM FP4，每位使用者 50 tok/s 時，每張 GPU 的總吞吐約 **8,973 tok/s** ([InferenceX](https://inferencex.semianalysis.com/run/gptoss-120b-on-h100))。但 MXFP4 要到 Blackwell 架構才有原生硬體加速，H100 上走的是 Triton kernel ([Spheron](https://www.spheron.network/blog/deploy-gpt-oss-gpu-cloud))。Gemma 4 在 vLLM 上的實測吞吐數字，這次沒有找到。EmbeddingGemma 是 308M 參數、支援 100 多種語言，發布時是 MTEB 上 500M 以下最好的多語嵌入模型 ([Hugging Face](https://huggingface.co/blog/embeddinggemma))，但它在繁中法規檢索上的表現還沒有實測。Breeze ASR 26 是台灣第一個開源的台語 ASR，以 Whisper 微調而成 ([MediaTek Research](https://www.mediatek.com/zh-tw/tek-talk-blogs/mediatek-research-breeze-3))。客語目前沒有成熟的開源 ASR 或 TTS。台灣華語 TTS 也還沒找到同時符合「非中國血緣」與「可商用」的開源選項。簡體字與中國用語外洩的問題，建議三層把關：系統提示、輸出後用 OpenCC s2twp 偵測，再加上微調。外洩率要列為比試的正式指標。

## 開源 harness：Parlant 加 Chatwoot 可行，但中間的 bridge 要自己寫

前一版報告推薦的組合，這次用一手原始碼查證過，結論是**可行，但有三個先前沒看到的細節**。第一，**Parlant 原生支援 MCP**。它的 API 定義了 `"mcp"` 服務類型，也依賴 `fastmcp>=3.2.0` ([services.py](https://github.com/emcie-co/parlant/blob/develop/src/parlant/api/services.py)；[pyproject.toml](https://github.com/emcie-co/parlant/blob/develop/pyproject.toml))。真人轉接的作法是：工具回傳 `mode: manual` 讓 AI 停止回覆，真人的訊息再用 `source="human_agent"` 寫回 session。官方文件提到可以整合 HubSpot、Zendesk，**但沒有提到 Chatwoot** ([human-handoff.md](https://github.com/emcie-co/parlant/blob/develop/docs/production/human-handoff.md))。所以我們要自己寫一個 bridge：Chatwoot 的 Agent Bot webhook 進來後轉成 Parlant 的 session event；Parlant 觸發 manual mode 時，再呼叫 Chatwoot API，把對話從 pending 改成 open。Chatwoot 端的 `bot_handoff!` 本來就是做這件事的 ([conversation.rb](https://github.com/chatwoot/chatwoot/blob/develop/app/models/conversation.rb))。這個 bridge 很適合做成公版的參考元件，開源出去。

第二，**小模型穩不穩定，一定要自己測**。Parlant 的 README 明白寫著「太小的現成模型容易產生不一致的結果」([README](https://github.com/emcie-co/parlant/blob/develop/README.md))，它的 Custom LLM 文件也說，系統需要能穩定輸出複雜 JSON schema 的強模型 ([custom-llms.md](https://github.com/emcie-co/parlant/blob/develop/docs/advanced/custom-llms.md))。官方 Ollama 文件對 gemma3:12b、27b 給了「高準確度」的描述 ([ollama.md](https://github.com/emcie-co/parlant/blob/develop/docs/adapters/nlp/ollama.md))，但這只是廠商文件裡的說法，不是基準數據。**Gemma 4 與 gpt-oss 跑在 Parlant 上，目前沒有任何公開紀錄**。Parlant 透過 LiteLLM adapter 可以設定 base URL，所以能直接接 vLLM 的 OpenAI 相容端點 ([litellm_service.py](https://github.com/emcie-co/parlant/blob/develop/src/parlant/adapters/nlp/litellm_service.py))，再搭配 vLLM 的 structured outputs，可以提高 JSON 輸出的穩定度。另外，Parlant 在 PyPI 上的最新版本是 3.3.2（2026-04-28），到現在約 5.5 個月沒有新的正式版 ([PyPI](https://pypi.org/project/parlant/))。這個專案的活躍度要持續觀察，備案（LangGraph／Microsoft Agent Framework 自建）也要保留。

第三，**Chatwoot 的 Captain AI 只有企業版才有**。Captain 的程式碼放在 `enterprise/` 目錄下 ([enterprise/app/models/captain](https://github.com/chatwoot/chatwoot/tree/develop/enterprise/app/models/captain))，正式上線使用需要有效的 Enterprise License ([enterprise/LICENSE](https://raw.githubusercontent.com/chatwoot/chatwoot/develop/enterprise/LICENSE))，官方定價頁也標明 Community Edition 不包含 Captain ([Chatwoot pricing](https://chatwoot.com/pricing/self-hosted-plans))。好消息是，LINE 通路與 Agent Bot 都在 MIT 授權的核心裡 ([line.rb](https://github.com/chatwoot/chatwoot/blob/develop/app/models/channel/line.rb))。所以公版只用 MIT 核心，AI 部分由 Parlant 透過 Agent Bot API 接入，完全不需要碰 Captain。部署文件裡要寫明「不得啟用 `enterprise/` 目錄的功能」。

其他元件的授權這次都用一手 LICENSE 檔核實了。Dify 的修改版 Apache 授權**確實禁止未經授權的多租戶營運，也不得移除前台 LOGO** ([Dify LICENSE](https://raw.githubusercontent.com/langgenius/dify/main/LICENSE))，所以仍然只能當機關的原型工具。Rasa Open Source 的 README 寫明它已經進入維護模式 ([Rasa README](https://github.com/RasaHQ/rasa))。「Flowise 2026-08 EOL」這個說法找不到任何官方公告，Workday 收購時也公開表示會繼續投資開源 ([Workday](https://newsroom.workday.com/2025-08-14-Workday-Acquires-Flowise,-Bringing-Powerful-AI-Agent-Builder-Capabilities-to-the-Workday-Platform))，所以判定不採信。護欄的部分有一個新發現：**主流的非中國安全分類器都不支援中文**。Llama Guard 4 支援 8 種語言，沒有中文 ([LG4 model card](https://github.com/meta-llama/PurpleLlama/blob/main/Llama-Guard4/12B/MODEL_CARD.md))；Granite Guardian 只用英文資料訓練與測試 ([granite-guardian](https://github.com/ibm-granite/granite-guardian))。研究也發現，護欄能擋下英文的不安全提示，卻會漏掉語意相同的中文提示 ([arXiv 2504.15241](https://arxiv.org/pdf/2504.15241v1))。目前最貼近需求的是聯發科創新基金會的 Breeze Guard。它針對台灣華語，涵蓋詐騙、醫療錯誤資訊、政治操弄等風險 ([arXiv 2603.07286](https://arxiv.org/pdf/2603.07286))，但底模是 Breeze 2（以 Llama 為基礎），權重授權可能繼承 Llama 的條款，還需要確認。個資的部分，**Presidio 預設的 recognizer 沒有任何台灣實體** ([default_recognizers.yaml](https://github.com/microsoft/presidio/blob/main/presidio-analyzer/presidio_analyzer/conf/default_recognizers.yaml))。身分證字號、統一編號、手機號碼要自己用 regex 加檢查碼寫 recognizer。姓名與地址可以用 CKIP 的 NER，它在 OntoNotes 上的 F1 是 81.18%，但 ckip-transformers 的程式碼是 **GPL-3.0** ([ckip-transformers](https://github.com/ckiplab/ckip-transformers))，要注意授權傳染的問題。「台灣 PII recognizer 套件與測試集」本身就可以是公版的一項開源產出。

### 更新後的技術堆疊

| 層 | 首選 | 授權（本次一手核實） | 備選與注意事項 |
|---|---|---|---|
| 對話控制 | Parlant 3.3.x | Apache-2.0 | 需要自寫 Chatwoot bridge；JSON 穩定度要先比試；備案為 LangGraph（MIT）或 MS Agent Framework（MIT） |
| 通路與真人坐席 | Chatwoot MIT 核心（LINE、網頁、Agent Bot） | MIT（`enterprise/` 除外） | **Captain AI 只有企業版，不啟用** |
| 模型服務 | vLLM ＋ LiteLLM | Apache-2.0；LiteLLM 核心 MIT（`enterprise/` 除外） | — |
| 模型 | **Gemma 4 31B／26B-A4B**；**gpt-oss-120b**；團隊的 Gemma 4 繁中政府微調版 | Apache-2.0（gpt-oss 待再核） | 排除中國來源模型；Mistral Small 4 待驗證 |
| 嵌入 | EmbeddingGemma-300M | 待核 Hugging Face 授權 | 避開 BGE、GTE、Qwen3-Embedding、Arctic-m-v2.0 |
| 工具層 | MCP server 樣板＋OpenAPI | 開放規格 | 先做唯讀公開資料 |
| 個資遮罩 | Presidio＋自寫台灣 recognizer | MIT | CKIP 是 GPL-3.0，注意傳染 |
| 護欄 | NeMo Guardrails 框架＋Breeze Guard 26 | Apache-2.0；Breeze Guard 授權待核 | Llama Guard 4 與 Granite Guardian 不支援中文 |
| 評測 | 自建繁中 τ² 自訂領域＋Ragas／DeepEval／Inspect | MIT／Apache-2.0 | τ²-bench 要從 GitHub 安裝，PyPI 上的 `tau2` 是另一個無關套件 |
| 紅隊 | promptfoo＋garak＋PyRIT＋中文題庫 | MIT／Apache-2.0／MIT | promptfoo 已被 OpenAI 收購，官方表示維持 MIT 授權 |
| 觀測 | OpenTelemetry＋Langfuse | 待核 | 寫入前先遮罩個資 |

評測工具的部分，τ²-bench 已經改成 τ³-bench，並在 2026-07 發布 v1.0.1 的評分更新，**1.0.1 以前的結果不能拿來比較** ([tau2-bench README](https://github.com/sierra-research/tau2-bench))。新增自訂領域時，要準備 `policy.md`、`tasks.json`、`db.json` 與工具定義 ([domains README](https://github.com/sierra-research/tau2-bench/blob/main/src/tau2/domains/README.md))。換句話說，政府業務 SOP 可以直接寫成繁中版的 policy.md，使用者模擬器也改用繁中的民眾 persona，這樣就能得到全世界第一套繁中公部門多輪客服基準。

## 國際案例：做成平台的留下來，太早上前台的出事

國際案例的結論和前一版一樣，這次補上了查證細節。美國聯邦政府把共用平台和民眾端 Bot 分開處理。GSA 的 USAi 是給公務員評估模型用的多模型平台，**原本免費，到 2026-09 改成收取平台費加實際用量費** ([Nextgov](https://www.nextgov.com/artificial-intelligence/2026/09/agencies-now-have-pay-use-usai/415816/))。對民眾的 Bot 則由各機關自己建置。OMB M-25-22 規定機關的非公開資料未經同意不得拿去訓練外部模型，也要求避免廠商綁定 ([Perkins Coie](https://legacy.perkinscoie.com/insights/update/white-house-unveils-updated-ai-guidelines-federal-agencies))。M-26-04 則要求新的 LLM 採購納入「承認不確定性」等條款 ([OMB M-26-04](https://www.whitehouse.gov/wp-content/uploads/2025/12/M-26-04-Increasing-Public-Trust-in-Artificial-Intelligence-Through-Unbiased-AI-Principles-1.pdf))。民眾端的成效好壞參半。TIGTA 在 2026-06 稽核 IRS 的聊天服務，發現因為一直被當成「試點」，**完全沒有設定績效指標** ([Journal of Accountancy](https://www.journalofaccountancy.com/issues/2026/oct/tigta-finds-shortcomings-in-irss-chat-service/))。VA 在 2026-08 推出的 LLM 客服 beta，**上線時還不能轉真人** ([aiunderstanding.org／FedScoop](https://aiunderstanding.org/news/fedscoop-reports-va-launches-beta-ai-helpdesk-chatbot))。紐約 MyCity 告訴業者可以抽員工小費、可以拒收現金，兩者都違法；2026-01 新任市長宣布關站 ([The Markup](https://themarkup.org/artificial-intelligence/2026/01/30/mamdani-to-kill-the-nyc-ai-chatbot-we-caught-telling-businesses-to-break-the-law))。成功的例子是州政府自建共用平台。加州 Poppy 在 2026-07 開放給所有部門，由州政府統一處理資安審查與個資偵測，並承諾不拿資料訓練模型 ([CDT](https://www.cdt.ca.gov/newsroom/2026/07/poppy-california-digitals-assistant-now-available-statewide/))。

MCP 工具層的證據這次更紮實了。Census Bureau 的官方 MCP server 已經在 GitHub 上以 CC0 授權開源 ([uscensusbureau](https://github.com/uscensusbureau/us-census-bureau-data-api-mcp))，GPO 也推出了 GovInfo MCP 的 public preview ([govinfo.gov](https://www.govinfo.gov/features/mcp-public-preview))。「0%→95%」的出處也確認了，是 GSA U.S. Digital Corps 在 2026-05-18 發布的報告。精確的說法是：沒有接工具的通用聊天機器人，在 USASpending 的基線是 0%、CDC PLACES 是 2.1%；接上 MCP 後，兩個資料集都約為 95%。測試用的是 Claude Sonnet 4，每個提示跑 10 次 ([Digital Corps](https://digitalcorps.gsa.gov/blogs/model-context-protocol/)；[MCP_Report.pdf](https://digitalcorps.gsa.gov/pdfs/MCP_Report.pdf))。引用時要說明，這是只涵蓋兩個資料集的小規模試點，而且測試用的是閉源模型。換成 Gemma 4 會不會有同樣的效果，正好是我們可以重做的實驗。另一個新案例是 Code for America 在 2026-05-08 和 Anthropic 合作的 SNAP Policy Navigator。它用 MCP 讓第一線個案人員即時查詢聯邦、州、郡的 SNAP 政策 ([Code for America](https://codeforamerica.org/news/anthropic-partnership/))。這又是一個**先輔助公務員、不直接面對民眾**的設計。GSA 也辦過限 .gov 參加的 MCP 黑客松，只用公開資料、在沙箱裡做原型 ([GSA](https://www.gsa.gov/artificial-intelligence/si-community-of-practice/events-and-training/mcp-server-and-ai-agent-government-hackathon))，可以當我們第四季廠商工作坊的範本。

其他國家的教訓不變。**新加坡 VICA** 最接近我們要做的公版：60 多個機關、100 多個 Bot，機關簽一份上架協議後，系統就用 SearchSG 爬機關官網內容來回答 ([GovTech VICA](https://www.tech.gov.sg/products-and-services/for-government-agencies/informational-services/vica/))。**愛沙尼亞 Bürokratt** 用 MIT 授權，每個機關在國家雲上每月約 €150 ([IDB](https://knowledge.iadb.org/en/code-development/open-source-solutions/buerokratt))，但加入的組織不多，代表跨機關聯邦式介接的成本很高。**英國 GOV.UK Chat** 在公開試點中把準確率從 76% 提升到 90% ([Civil Service World](https://www.civilserviceworld.com/professions/article/govuk-ai-chatbot-achieves-90-accuracy))，但 2026-05 正式上線當天，還是被稅務專家抓到錯誤答案 ([ResultSense](https://www.resultsense.com/news/2026-05-15-govuk-chat-launches-tax-advice-criticism/))。**法國 Albert** 從前台聊天機器人，轉型成跨部會的推論與 RAG API 底座 ([Acteurs Publics](https://acteurspublics.fr/articles/de-chatbot-experimental-a-socle-interministeriel-pour-lia-de-letat-le-parcours-dalbert-ia/))。國內有公開成效的案例，都是話務員輔助，例如桃園 1999 導入生成式 AI 知識庫後，平均每通電話省下約 20 秒 ([iThome](https://www.ithome.com.tw/news/160562))。

## 治理：法定期限已經到了，合規包就是部會導入的理由

**《人工智慧基本法》已在 2026-01-14 由總統公布，並自公布日起施行**（華總一義字第11500001671號，全文 20 條）([總統府公布令](https://www.president.gov.tw/File/Doc/80165b6d-cb49-4b49-952f-56e1e6abe51b))。中央主管機關是國科會。第 19 條要求政府機關在以 AI 執行業務或提供服務前，先做風險評估並規劃因應措施，也要訂定使用規範或內控機制 ([國科會法規系統](https://law.nstc.gov.tw/LawContent.aspx?id=GL000592))。行政院的施行規劃訂了三個期限：**各級機關在 2026 年 7 月完成公務使用 AI 的風險評估；一年內完成內控規範；各目的事業主管機關在 2028 年 1 月前完成管理規範與法規調適** ([行政院施行規劃簡報](https://www.ey.gov.tw/File/76681FD3D1A41585?A=C))。數位部依第 16 條，在 2026-07-07 發布了「人工智慧風險分類框架」v1.0。框架採「分類而不分級」的設計，分三大類共 20 個子類別，評估分四個步驟：盤點應用情境、識別風險、評估風險、應對風險 ([iThome](https://www.ithome.com.tw/news/177184))。理律指出，這個框架對非公務機關沒有直接拘束力 ([理律](https://www.leeandli.com/TW/NewslettersDetail/7661.htm))，而且本法沒有罰則。條文的逐字內容，在全國法規資料庫無法連線的情況下沒有核對，正式引用前還要再確認一次。

這些期限對公版很重要。現在是 2026-10，7 月的風險評估期限已經過了，新導入 AI 客服的機關要補做或更新評估。內控規範的期限大約落在 2027 年中，正好在我們這一年計畫的範圍內。所以**合規包應該直接按照風險分類框架的四個步驟，預先填好 AI 客服的常見風險子類別**，部會只要補上自己的業務情境就能用。2023 年的《行政院及所屬機關（構）使用生成式AI參考指引》，這次查不到 2024–2026 年有正式修正版 ([行政院](https://www.ey.gov.tw/Page/9277F759E41CCD91/e63572a7-fb79-4c02-9ea3-b731e7c06a56))，所以它關於揭露、不得輸入機密與個資的要求仍然適用。臺北市在 2024-09 的作業指引裡已經明文寫到，智慧客服可以回答市民常見問題，並導引到專人處理 ([臺北市指引](https://www-ws.gov.taipei/Download.ashx?u=LzAwMS9VcGxvYWQvNzY3L3JlbGZpbGUvNTQ1NTAvMTM2NzkzLzY0NGQxZTIzLTEzYTktNDdmMi1iNzdiLWExMTEyMzg4ZjNmNi5wZGY%3D&n=6Ie65YyX5biC5pS%2F5bqc5L2%2F55So5Lq65bel5pm65oWn5L2c5qWt5oyH5byVLnBkZg%3D%3D&icon=..pdf))，可以當作地方政府的參照範本。數位部沒有專門的「AI 客服」指引，公版的合規包剛好可以補上這個空缺。

**資安法修正版在 2025-09-24 公布，2025-12-01 施行** ([臺北市法規轉載](https://www.laws.taipei.gov.tw/law/LawSearch/LawExport/FL088622?type=0))，但另一個轉載版本註記「部分條文尚未施行」，要以行政院的公告為準。**個資會仍然查不到正式成立的紀錄**。組織法在 2025-05 立法院初審時，關鍵條文保留協商 ([中央社](https://www.cna.com.tw/news/aipl/202505280283.aspx))。2025-10-17 三讀的個資法修正，要求公務機關設置個人資料保護長 ([中央社](https://www.cna.com.tw/news/aipl/202510170211.aspx))。所以如果要用 1999 的通話紀錄做分析或訓練，目前以個資法第 15、16 條為依據，由機關的個資保護長把關，公版預設採「去識別化、服務日誌和訓練資料分開存放」。

採購與部署管道也比較清楚了。數位部的 TryAI 定位是「先試用再採購」，平台上有 32 款以上的模型（包含 Gemma 與 TAIDE），機關可以上傳文件建立業務機器人，也可以用 API 把機器人串接到內部系統，稽核紀錄保存一年 ([moda](https://moda.gov.tw/en/major-policies/ai/gov/19270))。但它是試用環境，不是正式營運平台，而且「AI Bots 市集」這個名稱沒有在任何來源裡出現。正式採購走的是數位產業署的**電腦軟體共同供應契約**。例如 1140204 案中，精誠的「AIGC KMS 生成式 AI 智能知識管理系統：基本版」決標單價是 NT$909,505 ([精誠共契頁](https://www.systexsoftware.com.tw/Price/Content?c=299&parentId=37036))，數位部也有「政府軟體共契 AI 產品」的盤點頁 ([moda](https://moda.gov.tw/major-policies/ai/gov/19268))。1140204 契約在 2026-10-29 到期，下一期共契的品項規格，是公版把「一致性測試」寫進採購條件的機會窗口。算力方面，國網雲端算力中心在 2025-12-12 啟用，主任表示政府機關也能使用，「類似主權雲」([iThome](https://www.ithome.com.tw/news/172794))。但推論服務的申請方式、收費與 SLA，目前都還查不到。

## 公版要交付規格、測試與一個團隊自己的模型

包裝方式不變，仍然比照 GovStack：每個元件都有規格、OpenAPI，以及自動化的一致性測試 ([GovStack](https://govstack.global/?p=8977))。這次的改變是，模型層也要納入一致性測試。原本建議交付六樣東西：介接規格、開源參考實作、一致性測試（L1 API 相容／L2 golden set 加紅隊／L3 pass^k 加轉真人演練）、廠商 SDK 與 adapter 指引、上架協議範本、合規包。這次再加兩項。第七項是**「模型認證」測試套件**。部會廠商想換成其他模型（例如自己買的雲端模型）時，必須在團隊的繁中政府評測集上達到門檻，並通過簡中用語外洩檢測與中國來源模型的血緣聲明。第八項是**團隊的 Gemma 4 繁中政府微調版**，以 Apache 2.0 釋出，附上評測報告。

這樣分工，正好把團隊的長處放在最難被取代的位置。模型本身會一直換代：Gemma 3 到 Gemma 4 只隔了一年，agent 能力就有明顯落差。但**繁中公部門的評測集、政府領域的微調資料，以及一致性測試**，不會因為底模換代就失效，反而每換一次底模，價值就更高。AIEC 的評測已經證明，團隊的在地續訓方法確實能讓模型分數超過原始底模。下一步是把這套方法變成一條可以重複執行的流程：「每當新的 Apache 授權底模推出，就在兩週內產出繁中政府版和評測報告」。使用方式仍然提供兩種：中央代管（在國網中心，每個部會一個 tenant）與部會廠商自架（必須先通過 L2）。整體定位是「TryAI 與共同供應契約之上的 AI 客服規格與驗收層」，不另外做一個平行的平台。

## 兩條線同時跑：先串公開資料，同時從話務紀錄挖出燈塔需求

這部分的建議不變。第一條線把已公開的內容串起來，包括全國法規資料庫（data.gov.tw 上的 XML 批次檔，每月更新，採政府資料開放授權 ([data.gov.tw](https://data.gov.tw/dataset/18289))，**目前查不到官方的即時 REST API**）、各機關 FAQ、MCP 唯讀工具，做出不需要部會提需求就能展示的「公開資訊客服」。第二條線找 2–3 個燈塔機關，從話務紀錄裡挖需求，先做坐席輔助。這次查證有一個實務發現：**臺北、新北、臺中、高雄的 1999 都沒有 FAQ 開放資料集**。臺北只有滿意度資料 ([data.gov.tw](https://data.gov.tw/dataset/132486))，可以直接用的只有臺南市民服務平台的常見問答 JSON ([data.gov.tw](https://data.gov.tw/dataset/171525))，以及新竹市 1999 的熱門問答點閱統計 ([data.gov.tw](https://data.gov.tw/dataset/67515))。所以第一條線的 FAQ 語料要從臺南、新竹起步，或者把「取得 FAQ 原始檔」寫進燈塔機關的合作協議。

挖掘需求的方法維持四個：請機關提供去識別化的話務紀錄，用 LLM 把來電原因分群；用 Top Tasks 方法排出民眾最常辦的事 ([Canada TBS](https://blog.tbs.alpha.canada.ca/2020/09/24/COVID-top-tasks.html))；分析官網的站內搜尋紀錄；派人到第一線跟班。產出是一份排好序的意圖清單，加上分流機會的估算：話務量 × 可由官方內容回答的比例 × 預期攔截率。挑選燈塔機關時，「可以交出紀錄」這一項的權重要再提高，因為這些紀錄同時也是團隊微調與評測需要的政府領域資料。至於先找部會試點還是先串現有服務，**目前沒有任何研究直接比較這兩種策略的成效**，雙軌並行是我們根據證據做的判斷。

### 試點用例選擇檢核表

| # | 檢核項目 | 通過標準 |
|---|---|---|
| 1 | 量大且重複 | 前 20 大意圖佔該通路話務 ≥50%，或每年話務達數萬通以上 |
| 2 | 以資訊查詢為主 | 不涉及資格判定、核准或處分 |
| 3 | 有權威內容，且有人負責更新 | 每個意圖都能對應到官方頁面、法規或 FAQ，並有指定的更新窗口 |
| 4 | 有現成的真人後援 | 已有話務中心、1999 或客服信箱，可以接住轉接 |
| 5 | 有內容負責的長官 | 至少一位科長級以上人員願意簽核內容與上線 |
| 6 | 可量測的基準線 | 已有話務量、平均處理時間、等候時間或放棄率資料 |
| 7 | 個資可控 | 第一階段不需要身分驗證；若需要，能在地端或國網中心部署 |
| 8 | 對抗風險低 | 不是政治敏感或詐騙高發主題，或已有專門的紅隊題庫 |
| 9 | 可以交出紀錄 | 願意提供去識別化的話務或文字紀錄與 FAQ 原始檔，供評測與微調使用 |
| 10 | 可重用 | 其他部會也有同類需求 |
| 11 | 已完成或願意完成 AI 基本法風險評估 | 願意用公版合規包完成第 19 條的評估與內控 |

### 12 個月路線圖

| 季 | 第一條線：平台、模型與公開資料 | 第二條線：燈塔機關 | 里程碑（可驗收） |
|---|---|---|---|
| Q1（M1–3） | **模型比試**：用團隊的繁中政府評測集 v0（約 300 題，含拒答題與工具呼叫題），比較 Gemma 4 31B、26B-A4B、gpt-oss-20b、gpt-oss-120b（Mistral Small 4 確認授權後加入）。指標包括正確率、簡中用語外洩率、pass^k、在 Parlant 下的 JSON schema 成功率、國網中心 H100 上的吞吐。**發函詢問數位部資安署**中國來源開放權重模型（含衍生微調、嵌入與語音模型）的適用範圍。在國網中心建置 vLLM 與 LiteLLM；寫好 Parlant↔Chatwoot bridge；法規 XML 與臺南、新竹 FAQ 的 RAG；3–5 個唯讀 MCP server；規格 v0.1 | 招募 2–3 個燈塔機關，簽上架協議（含紀錄提供條款）；話務分群與 Top Tasks；與 TryAI 及數產署共契窗口接洽 | 比試報告（決定預設模型）；資安署函詢送出；公開資訊客服 demo；每個燈塔機關一份意圖清單與基準線 KPI |
| Q2（M4–6） | 繁中評測集 v1（每個燈塔機關 200–500 題）；建立繁中政府 τ² 自訂領域；**Gemma 4 繁中政府微調 v1**（以 31B 為主）；台灣 PII recognizer；紅隊題庫；Breeze Guard 授權確認後整合 | **坐席輔助 Alpha**：真人核閱後才回覆；轉接介接既有話務系統 | 坐席輔助上線；第一份公開評測報告（原版與微調版對照） |
| Q3（M7–9） | 一致性測試 L1–L3 加模型認證套件（CI 自動執行）；合規包 v1（依風險分類框架四步驟製作的範本、內控檢核表、採購條款、中國來源模型聲明書）；規格 v1.0；依資安署回函更新允許使用的元件清單 | **民眾端 Bot Beta**：限定意圖、強制附引用、轉真人；追蹤端到端解決率與沒有得到服務的比例 | 至少一個 Beta 準確率 ≥90% 並通過紅隊測試；微調版在評測集上勝過原版 |
| Q4（M10–12） | 開源釋出平台、bridge、評測集（去識別化子集）與 Gemma 4 繁中政府版；廠商工作坊（比照 GSA MCP 黑客松）；爭取把一致性測試寫進下一期共契規格；規劃第二年經費 | Beta 擴大；第一個非燈塔部會由自己的廠商依規格介接，並通過 L2 | 成效報告（含失敗案例）；至少一家廠商通過認證；第二年計畫（語音、MyData、跨機關轉介） |

這份路線圖有三個刻意的取捨。第一，**比試排在所有開發工作之前**。原因是 Gemma 4 的公開分數口徑衝突太大，Parlant 搭配小模型的穩定度也完全沒有數據，如果比試結果顯示 31B 在 Parlant 下 JSON 不穩，就要提早改成「Parlant 規則比對用 gpt-oss-120b、生成回覆用 Gemma 4」的混合路由。第二，**身分驗證的個人化查詢與語音電話留到第二年**。第三，**每一季都公開評測結果**，避免重蹈 IRS「試點期間沒有指標」的覆轍。

## 查證結果對照表

| # | 前一版「尚未證實」的事項 | 現在狀態 | 查證結果 |
|---|---|---|---|
| 1 | AI 基本法公布日 | **已證實** | 2026-01-14 公布，自公布日施行，全文 20 條 ([總統府](https://www.president.gov.tw/File/Doc/80165b6d-cb49-4b49-952f-56e1e6abe51b))；條文沒有逐字核對 |
| 2 | 2026-07 風險評估、一年內完成內控的期限 | **已證實** | 出自行政院施行規劃；另有 2028-01 法規調適期限 ([行政院](https://www.ey.gov.tw/File/76681FD3D1A41585?A=C)) |
| 3 | 數位部 AI 風險分類框架是否已發布 | **已證實** | 2026-07-07 發布 v1.0，三大類 20 子類，分類而不分級 ([iThome](https://www.ithome.com.tw/news/177184)) |
| 4 | 生成式 AI 參考指引 2024–2026 是否修正 | **仍未證實** | 沒有找到修正版；2025-02 院會聽取「公務機關使用生成式AI管理規範」報告 ([行政院](https://www.ey.gov.tw/File/256FA8EA44DBFF45?A=C)) |
| 5 | 資安法修正施行日 | **已證實（經法規轉載網站）** | 2025-12-01 施行；有轉載版本註記部分條文未施行，需以行政院公告為準 |
| 6 | 個資會是否成立 | **仍未證實** | 組織法卡在協商；2025-10-17 修法要求設個資保護長 ([中央社](https://www.cna.com.tw/news/aipl/202510170211.aspx)) |
| 7 | TryAI 部署位置與 API | **部分** | 有機器人 API 串接、稽核紀錄保存一年；部署位置與收費未知；「AI Bots 市集」名稱沒有任何來源 |
| 8 | 共同供應契約 AI 品項是否決標 | **部分** | 電腦軟體共契 1140204 已有生成式 AI 品項（如精誠 NT$909,505）；115 年度的新約未查到 |
| 9 | TAIDE 授權是否允許委外商用 | **不再是關鍵路徑** | 預設改用 Apache 2.0 的 Gemma 4／gpt-oss；團隊自己的微調版以 Gemma 4 為底，授權單純 |
| 10 | 國網中心推論服務收費與 SLA | **仍未證實** | 只確認雲端算力中心在 2025-12-12 啟用，可供政府使用 ([iThome](https://www.ithome.com.tw/news/172794)) |
| 11 | Parlant 是否支援 MCP 與轉真人 | **已證實** | 原生支援 MCP；manual mode 加 human_agent 事件；**沒有 Chatwoot 整合，需要自寫 bridge** |
| 12 | Parlant 搭配 8–12B 本地模型的穩定度 | **部分** | 官方明言小模型結果不穩；Gemma 3 12B／27B 只有文件描述；**Gemma 4 與 gpt-oss 沒有任何資料，必須比試** |
| 13 | 中文個資偵測品質 | **部分** | Presidio 沒有台灣 recognizer；CKIP NER F1 81%（新聞語料，GPL-3.0）；沒有台灣 PII 基準 |
| 14 | Presidio、NeMo、garak、PyRIT、Ragas、LangGraph、ADK 授權 | **已證實** | 皆為 MIT 或 Apache-2.0（一手 LICENSE） |
| 15 | Llama Guard 適用性 | **已證實（結果負面）** | Llama 4 社群授權，**不支援中文**；Granite Guardian 只用英文資料訓練 |
| 16 | Chatwoot Captain 授權 | **已證實** | 放在 `enterprise/` 目錄，Community Edition 不包含；LINE 與 Agent Bot 在 MIT 核心 |
| 17 | Flowise 2026-08 EOL | **仍未證實（判定不採信）** | 沒有官方公告；Workday 表示會繼續投資開源 |
| 18 | 美國 MCP「0%→95%」 | **已證實** | GSA Digital Corps 2026-05-18 報告；基線 0%／2.1%，接 MCP 後約 95%，只涵蓋兩個資料集 |
| 19 | Census、GPO MCP | **已證實** | Census 版以 CC0 授權開源；GPO 版為 public preview |
| 20 | MS Agent Framework A2A 原生或 beta | **仍未證實** | 只確認授權為 MIT |
| 21 | Rasa 免費額度 | **仍未證實** | 新發現：Rasa Open Source 已進入維護模式 |
| 22 | USAi 機關數、SSA 2,500 萬通、南韓得標廠商、日本源内授權 | **仍未證實** | 本輪沒有重新查證；引用時要註明來源是二手 |
| 23 | 台北 1999 準確度 90% | **仍未證實** | 只有市府自述 |
| 24 | 歐盟附件 III 生效時程、Pipecat SIP | **仍未證實** | 不影響第一年的決策 |
| 25 | Gemma 4 發布日與授權 | **已證實** | 2026-04-02，Apache 2.0 |
| 新 | Gemma 4 12B 變體、Mistral Small 4 官方規格、Nemotron 3 授權、Breeze Guard 權重授權、BreezyVoice 是否開源、AIEC 完整榜單 | **待查** | 列入第一季比試前的盡職調查 |

## 結論

這次更新最重要的變化，是**模型從資產變成了消耗品**。Gemma 3 到 Gemma 4 只隔一年，授權從自訂條款變成 Apache 2.0，agent 能力也有明顯躍升；下一代模型很可能在這一年計畫結束前就會推出。所以把團隊綁在任何一個模型品牌上，都是錯的押注。真正能累積價值的，是「看到新底模，兩週內產出繁中政府版和評測報告」的能力。這同時代表，團隊在 AIEC 證明過的在地續訓方法，應該從一次性的產品，轉成一條可以重複執行的流程。

第二個變化是，**法遵從背景知識變成了公版的賣點**。AI 基本法的期限已經到了，數位部的風險分類框架已經發布，中國來源模型的界線也還等著主管機關表態。部會廠商最缺的不是另一個聊天機器人，而是一份可以直接交差的風險評估、一張允許使用的元件清單，以及一張證明模型「不是中國來源而且夠好」的認證。如果第一季發出去的資安署函詢能拿到書面回覆，這份回函本身的價值，可能比任何模型的分數都高。
