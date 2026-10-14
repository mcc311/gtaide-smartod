# 公版 AI 客服平台：開源權重 LLM 預設模型選型與查證（截至 2026-10-14）

> 查證說明：本輪研究環境中 WebFetch／curl 對 huggingface.co、blog.google、cna.com.tw、ai-muninn.com 皆無法連線（DNS 失敗或 proxy 403），因此**無法逐字讀取原始模型卡與政府公告原文**。下文中：
> - 【搜尋摘要】＝依網路搜尋結果摘要（多來源一致者另行註明），未讀全文；
> - 【訓練知識】＝研究者既有知識（截至 2026-06），本輪未重新查證，正式報告前應以模型卡／授權檔再核；
> - 【推論】＝研究者推論。
> 依任務要求，TAIDE 不列為預設模型。

---

## 一、候選模型盤點（尺寸、授權、發布時間）

### Takeaway
在「非中國來源＋寬鬆授權＋可地端 vLLM/SGLang 部署」三條件下，主力候選為 **Gemma 4（Apache 2.0，2026-04-02 發布；E2B/E4B/26B-A4B MoE/31B dense）** 與 **gpt-oss-20b / gpt-oss-120b（Apache 2.0）**，其次為 Mistral Small 4（Apache 2.0，119B-A6.5B MoE，資訊僅來自聚合站）與 NVIDIA Nemotron 3 系列。Llama 4 授權有 700M MAU、「Built with Llama」標示與歐盟多模態排除條款，對公部門可用但較不乾淨。

### Cited Findings
- 【搜尋摘要，多來源一致】Gemma 4 於 **2026-04-02** 發布，**首度改採 Apache 2.0**（先前 Gemma 1–3 為 Google 自訂 Gemma Terms of Use）；家族共四款：E2B（約 2.3B effective）、E4B（約 4.5B effective）、**26B MoE（約 3.8B active，部分來源稱約 4B）**、**31B dense（30.7B）**；E2B/E4B 為 128K context，26B/31B 為 256K 並支援最長 60 秒影片理解；未量化 31B 可放進單張 80GB H100。 — [The Decoder](https://the-decoder.com/googles-gemma-4-is-now-available-with-apache-2-0-licensing-for-the-first-time/)；[TechWyse](https://www.techwyse.com/news/ai-search/google-deepmind-gemma-4-open-models-apache-2-0-release)；[DataNorth](https://datanorth.ai/news/google-releases-gemma-4-open-models)；[NYU Shanghai RITS](https://rits.shanghai.nyu.edu/ai/google-releases-gemma-4-frontier-open-models-under-apache-2-0/)
  - 注意：任務假設「2026-03 發布」與搜尋結果不符，**實際為 2026-04-02**。
  - 未證實：noze.it 單一來源提到後續「Gemma 4 12B」（約 16GB VRAM），其他來源均只列四款，**未能確認**。 — [noze.it](https://www.noze.it/en/insights/gemma-new-release/)
- 【搜尋摘要】Gemma 4 全系列內建原生 function calling、可設定 thinking mode。 — [BenchLM Gemma 4 比較](https://www.benchlm.ai/compare/gemma-4-31b-vs-gemma-4-e4b)；[Verdent](https://www.verdent.ai/guides/gemma-4-coding-agent-review)
- 【搜尋摘要】gpt-oss-120b／20b 官方模型卡（arXiv 2508.10925，2025-08 發布）。 — [OpenAI gpt-oss model card](https://arxiv.org/pdf/2508.10925)
  - 【訓練知識】gpt-oss 授權為 Apache 2.0（另附 gpt-oss usage policy）；120b 為 117B total / 約 5.1B active MoE，20b 為 21B total / 約 3.6B active；原生 MXFP4，20b 可在約 16GB 記憶體執行；僅文字模態、128K context；以 harmony 格式支援工具呼叫與 reasoning effort（low/medium/high）。
- 【搜尋摘要，僅聚合站】Mistral Small 4：119B total / 6.5B active MoE、Apache 2.0、256K context、**2026-03-16** 發布、支援 function calling。 — [llmreference](https://www.llmreference.com/compare/llama-3.3-nemotron-super-49b-v1/mistral-small-4)；[lmmarketcap](https://lmmarketcap.com/compare/mistral-mistral-small-4-batch/vs/nemotron-3-super)（**未見 Mistral 官方頁，需再核**）
- 【搜尋摘要，僅聚合站】Nemotron 3 Super：約 120B 參數、約 1M context；授權、開放權重狀態與工具呼叫**未由搜尋確認**。 — [lmmarketcap](https://lmmarketcap.com/compare/mistral-mistral-small-4-batch/vs/nemotron-3-super)
  - 【訓練知識】NVIDIA Nemotron 系列多採 NVIDIA Open Model License（允許商用、非 OSI）；Nemotron 3 Nano（30B-A3B 級 hybrid Mamba-Transformer MoE）於 2025-12 釋出。
- 【搜尋摘要】Llama 4 沿用 Llama Community License 並新增：**歐盟境內公司/個人不得使用多模態模型**（終端使用者除外）、**月活 7 億以上需另向 Meta 申請授權**、須顯著標示「Built with Llama」且衍生模型名稱需以「Llama」開頭。 — [The Decoder](https://the-decoder.com/meta-releases-first-multimodal-llama-4-models-leaves-eu-out-in-the-cold/)；[WZ-IT](https://wz-it.com/en/ai/llm-hosting/llama/)
- 【搜尋摘要】中國系開源模型授權：Qwen 多數地端版本為 Apache 2.0，但不同模型與尺寸授權可能不同；另 Qwen3.5-Omni 轉為閉源 API。 — [zonetech 中國開源大模型授權比較](https://zonetech.tw/blogs/china-open-source-llm-guide/)；[Threads tech.pulse](https://www.threads.com/@tech.pulse.ai.tw/post/DW8m9VTEkrC/)
- 【訓練知識】其他：Gemma 3（1B/4B/12B/27B，Gemma Terms of Use，非 Apache，含禁止用途政策）；Microsoft Phi-4 系列（MIT，14B 級，中文能力相對弱）；IBM Granite 4.0（Apache 2.0，2025-10，hybrid Mamba，有 ISO 42001 認證）；Mistral Small 3.2 24B（Apache 2.0）；Mistral Medium 3 **非開放權重**。

### Inferences
- 【推論】Gemma 4 轉 Apache 2.0 消除了 Gemma 3 自訂條款的法遵疑慮，是公部門「公版」最乾淨的選項之一；gpt-oss 同為 Apache 2.0、美國來源。
- 【推論】Gemma 4 26B-A4B 與 gpt-oss-20b/120b 皆為低 active 參數 MoE，對多機關共用的高併發客服特別有利（每 token 計算量小、吞吐高）。
- 【推論】Llama 4 的「Built with Llama」與命名條款會影響公版品牌（例如需命名為 Llama-xxx），不建議作為預設。

### Gaps
- Gemma 4 官方模型卡（ai.google.dev / Hugging Face）與 Apache LICENSE 檔未能直接讀取；是否另附 Prohibited Use Policy 需再核。
- Mistral Small 4、Nemotron 3 Super 的官方授權與規格未從原始來源確認。
- Gemma 4 12B 變體是否存在未能確認。
- FoxBrain 是否已實際開源（2025 年曾預告 5 月底前開源 8B/70B）未找到確證。 — [iThome](https://www.ithome.com.tw/news/168922)

---

## 二、關鍵限制：PRC 來源開源模型（Qwen/DeepSeek/GLM/Kimi）在地端執行是否受禁？

### Takeaway
官方明文「點名」的只有 DeepSeek：2025-02-03 行政院宣布公務機關全面禁用 DeepSeek，**範圍包含雲端服務、App 以及「斷網／地端下載」使用**，依據為 2019 年「各機關對危害國家資通安全產品限制使用原則」及「公務機關不得使用大陸廠牌資通訊產品（含軟體、硬體、服務）」。**未找到**針對 Qwen/GLM/Kimi 開放權重地端執行、或其衍生微調模型的專門函釋；但「大陸廠牌軟體」一般性禁令的文字涵蓋面廣，加上國安局 2025-11 點名通義千問違規項目最多，公版平台採用 Qwen 系（含以 Qwen 為底的微調）**政治與法遵風險極高，實務上應視為不可用**。

### Cited Findings
- 【搜尋摘要】行政院長卓榮泰 2025-02-03 宣布公務機關全面禁用 DeepSeek AI 服務，理由為防範公務資訊外洩。 — [中央社](https://cna.com.tw/news/aipl/202502030237.aspx)
- 【搜尋摘要】禁用範圍包括雲端服務、App 及斷網下載後使用；公立大學及研究機構可依規定報准、採必要管制措施後使用；數發部稱目前未限制民間使用。 — [風傳媒](https://www.storm.mg/article/5327512)；[公視](https://news.pts.org.tw/article/737148)
- 【搜尋摘要】數發部、陸委會表示行政院已明文規定公務機關不得使用大陸廠牌資通訊產品（含軟體、硬體或服務），公務機關已全面禁用 DeepSeek 等 AI 服務，**包含雲端服務、App 及地端下載**。 — [聯合報](https://udn.com/news/story/6885/8530706)
- 【搜尋摘要】數發部稱 DeepSeek 為「危害國家資通安全產品」，依法要求公務機關限制使用，規範可回溯至 2019 年行政院公布之原則。 — [自由財經](https://ec.ltn.com.tw/article/breakingnews/4938149)；[Inside](https://www.inside.com.tw/article/37431-deepseek-raises-cybersecurity-concerns-moda-bans-use-in-government-agencies)
- 【搜尋摘要】矛盾點：數發部長黃彥男曾表示 LLM 分雲端與地端，地端可由使用者自行控制資料流通——與禁令涵蓋地端下載的說法不完全一致。 — [公視](https://news.pts.org.tw/article/736631)；[iThome](https://ithome.com.tw/news/167184)
- 【搜尋摘要】國安局 2025-11 抽測 5 款中製生成式 AI（DeepSeek、豆包、文心一言、通義千問、騰訊元寶），**通義千問 15 項指標中 11 項違規，為最多**；抽測主要針對 App／雲端服務資料蒐集行為，非地端權重。 — [自由軍武](https://def.ltn.com.tw/article/breakingnews/5247550)；[中時](https://www.chinatimes.com/realtimenews/20251116001042-260407)；[聯合報](https://udn.com/news/story/6656/9143661)
- 【搜尋摘要，二手部落格】有台灣企業選型分析稱資安署 2025-02-20 發布公務機關全面禁用 DeepSeek（含地端下載），並將「公務機關與政府標案採用中國系模型」列為明令禁止情境——**此為部落格詮釋，非官方原文**。 — [masonailab](https://masonailab.com/insights/chinese-open-models-us-enterprise-cost-2026/)
- 【搜尋摘要】未找到數發部／國科會對「以 Qwen 微調之台灣模型」的官方回應或採購爭議報導。 — （搜尋無結果）

### Inferences
- 【推論】法律上，「大陸廠牌軟體」禁令＋DeepSeek 先例（明確含地端下載）已足以讓機關資安長拒絕 Qwen/GLM/Kimi/MiniMax 權重；衍生微調（如以 Qwen 為底的 FFM 或其他台廠模型）屬灰色地帶，但公版平台由國家計畫提供，**應主動避免**以免日後被立委或審計質疑。
- 【推論】嵌入／重排模型亦應套用同一原則：Qwen3-Embedding、BGE（BAAI）、GTE（阿里）、以及**以 GTE 為底的 Snowflake Arctic-Embed-m-v2.0** 都有 PRC 血緣疑慮（見第六節）。

### Gaps
- 未取得「各機關對危害國家資通安全產品限制使用原則」原文及是否有針對開放權重模型的函釋／FAQ；建議正式向數發部資安署函詢。
- 未找到 2026 年是否有新增點名 Qwen 的官方清單。

---

## 三、繁體中文（台灣）能力證據

### Takeaway
官方唯一系統性在地評測為數發部 **AIEC（AI 產品與系統評測中心）**：2025-10 首次 42 個模型、2026-05 累計 131 個、2026-09 初「臺灣主權 AI 評測」188 個模型（學測國文、社會、臺灣價值觀）。前三名為 OpenAI/Anthropic/Google 兆級閉源模型；開源方面 **台智雲 FFM-Gemma4-31B 綜合第 9、在 ≤35B 公開參數模型中第 2**，顯示 Gemma 4 31B 作為繁中底模表現佳。獨立 TMMLU+ 數據稀少，Gemma 4 與 Qwen 的比較僅有單一業餘部落格（Gemma 4 26B-A4B 46% vs Qwen3.6-35B-A3B 75%），需自行複測。

### Cited Findings
- 【搜尋摘要】AIEC 2025-10-03 公布首次語言模型評測：42 個模型，指標為高中學測國文、社會與「臺灣價值觀」；大模型 GPT-5 整體最佳，Gemini 2.5 Flash 臺灣價值觀最佳；**Gemma-3-TAIDE-12b 在 13B 以下名列前茅且優於原底模 Gemma-3-12b-it**。 — [中央社](https://www.cna.com.tw/news/ait/202510030150.aspx)；[數位產業署](https://moda.gov.tw/ADI/news/latest-news/19588)；[TechNews](https://infosecu.technews.tw/2025/10/03/aiec-unveils-its-first-model-benchmark-results/)
- 【搜尋摘要】AIEC 2026-05-01 公布新一波國內外開源模型評測，累計 131 個模型。 — [數位產業署](https://moda.gov.tw/ADI/news/latest-news/20538)
- 【搜尋摘要】2026-09-02 數發部公布臺灣主權 AI 評測：188 個模型；前三名為 OpenAI、Anthropic、Google（皆兆級參數）；第 4 名雅婷智慧 Yating-FedGPT-1.10.18（約 300 億參數，學測國文 86.20%、社會 84.00%、臺灣價值觀 100%）；亞太智能機器第 10、鴻海研究院第 12、台智雲 Llama3.3-FFM-70B 第 48。 — [公視](https://news.pts.org.tw/article/825337)；[工商時報](https://www.ctee.com.tw/news/20260903700071-430104)；[TheAI學院](https://www.theai.tw/blog/taiwan-sovereign-ai-benchmark-2026)
- 【搜尋摘要，廠商自述】台智雲 FFM-Gemma4-31B 綜合第 9、FFM-Muse-Glimmer-30B 第 10；在公開參數 ≤35B 模型中第 2、第 3。 — [經濟日報](https://money.udn.com/money/story/5612/9809272)
  - 注意：本則名次（第 9、10）與公視報導「亞太智能機器第 10」可能為不同排序口徑，**存在衝突需看官方榜單**。
- 【搜尋摘要，廠商自述】APMIC ACE-1 於 2026-05 批次宣稱整體第 5、臺灣價值觀滿分。 — [T客邦](https://www.techbang.com/posts/129212-apmic-ace-1-taiwan-ai-values-first)
- 【搜尋摘要】TMMLU+（iKala）為 66 科、小學至專業證照的繁中多選題基準；2024 論文結論為繁中模型仍落後簡中模型。 — [arXiv 2403.01858](https://arxiv.org/html/2403.01858v3)
- 【搜尋摘要，單一業餘來源】DGX Spark 部落格自測 TMMLU+：Qwen3.6-35B-A3B 75%、Gemma 4 26B-A4B 46%（方法未能讀全文，可能受 thinking 模式或答案解析影響）。 — [ai-muninn](https://ai-muninn.com/en/blog/tmmluplus-qwen-vs-gemma-traditional-chinese)
- 【搜尋摘要】數發部 2025-12 發布「台灣主權 AI 訓練語料庫」，正體中文語料供模型在地化訓練。 — [自由財經](https://ec.ltn.com.tw/article/breakingnews/5374176)（經 zonetech/masonailab 等搜尋摘要轉述）

### Inferences
- 【推論】AIEC 結果顯示「Gemma 底模＋台灣在地續訓」效果顯著（Gemma-3-TAIDE-12b > Gemma-3-12b-it；FFM-Gemma4-31B 進前 10），支持以 Gemma 4 31B 為預設底模，並可由團隊自行做繁中／用語對齊微調（此即團隊既有強項）。
- 【推論】Gemma 4 26B-A4B 在 TMMLU+ 的單一低分若屬實，代表 MoE 小 active 版本的知識型題目可能較弱；客服 RAG 場景知識多來自檢索，影響較小，但仍須自建評測。
- 【推論】簡體／中國用語外洩：gpt-oss 與 Gemma 的中文資料多為通用網路語料，預期有一定比例簡中用語；建議在系統提示＋輸出後處理（OpenCC s2twp 檢測）＋微調三層把關。

### Gaps
- 未取得 AIEC 官方完整榜單中 gpt-oss-120b/20b、Gemma 4 原版、Llama 4、Mistral 的名次與分數。
- 未找到 gpt-oss、Llama 4、Mistral Small 4 的 TMMLU+ 公開分數。
- 未找到針對「簡體字／中國用語外洩率」的系統性量測。

---

## 四、Agent 能力：工具呼叫、政策遵循、長上下文

### Takeaway
τ²-bench / τ-bench 是最貼近客服 agent 的基準。gpt-oss-120b 官方 τ-bench：Retail 67.8%、Airline 49.2%（high reasoning）。Gemma 4 31B 在 Artificial Analysis τ²-bench 約 59.9%、26B-A4B 約 43.6%（聚合站），另有第三方稱 31B τ²-Retail 86.4%（vs Gemma 3 27B 6.6%），**口徑不同需複測**。BFCL 方面 gpt-oss-120b 官方未公布，聚合站報 BFCL v4 49.7%（未證實）。

### Cited Findings
- 【搜尋摘要，官方模型卡】gpt-oss-120b τ-bench Retail：49.4%（low）/62.0%（medium）/67.8%（high）；Airline：42.6%/48.6%/49.2%。NVIDIA NIM 文件數字一致。 — [OpenAI model card arXiv 2508.10925](https://arxiv.org/pdf/2508.10925)；[NVIDIA NIM](https://docs.api.nvidia.com/nim/reference/openai-gpt-oss-120b)
- 【搜尋摘要】gpt-oss-120b BFCL：官方模型卡未報告；BenchLM 列 BFCL v4 49.7%（未證實）。 — [SemiAnalysis InferenceX](https://inferencex.semianalysis.com/model/gptoss-120b)；[BenchLM](https://benchlm.ai/models/gpt-oss-120b)
- 【搜尋摘要，聚合站】Artificial Analysis τ²-bench：Gemma 4 31B 59.9%、Gemma 4 26B-A4B 43.6%。 — [BenchLM τ2-bench](https://benchlm.ai/benchmarks/tau2-bench)
- 【搜尋摘要，第三方部落格】Gemma 4 31B τ²-bench Retail 86.4%，Gemma 3 27B 僅 6.6%。 — [Verdent](https://www.verdent.ai/guides/gemma-4-coding-agent-review)
- 【搜尋摘要】Gemma 4 26B/31B 支援 256K context；E2B/E4B 128K。 — [The Decoder](https://the-decoder.com/googles-gemma-4-is-now-available-with-apache-2-0-licensing-for-the-first-time/)

### Inferences
- 【推論】Gemma 3 → Gemma 4 在 agent 能力上是質變（6.6% → 86.4% 若屬實），**Gemma 3 不宜再作為客服 agent 主模型**。
- 【推論】gpt-oss-120b 推理與工具呼叫成熟、vLLM/SGLang 支援完整，適合作「大型／複雜任務」層；但其繁中語感與台灣用語未經 AIEC 公開驗證，需自測。
- 【推論】政策遵循（policy-following）以 τ²-bench 為代理指標；公版平台應建立「繁中政府客服版 τ²」內部測試集（含拒答、轉真人、個資遮罩規則）。

### Gaps
- 未取得 Gemma 4 官方模型卡的 τ²-bench／BFCL 原始數字。
- 未取得 Mistral Small 4、Nemotron 3、Granite 4 的 τ² / BFCL 可信數字。
- 無任何繁中版工具呼叫基準可引用。

---

## 五、硬體與成本（vLLM / SGLang 地端部署）

### Takeaway
gpt-oss-120b（MXFP4）單張 80GB H100 即可服務，InferenceX 實測 H100 FP4 vLLM 約 8,973 tok/s/GPU（每用戶 50 tok/s 目標下）；Gemma 4 31B 未量化可放單張 H100（BF16 約 62GB 權重，KV cache 空間有限，實務建議 FP8 或 2 卡 TP）；Gemma 4 26B-A4B 與 gpt-oss-20b 屬「單卡（含 L40S/48GB 級）即可、高併發」等級。

### Cited Findings
- 【搜尋摘要】gpt-oss-120b 以 MXFP4 可放單張 80GB GPU（H100 或 MI300X）；MXFP4 權重約 60GB，0.92 利用率下約餘 13GB KV cache，約可支撐 1K context 下 20–40 併發。 — [tenten](https://developer.tenten.co/the-most-economical-ways-to-run-gptoss120b)；[GitLab vLLM 部署文件](https://docs.gitlab.com/administration/gitlab_duo_self_hosted/vllm_gpt_oss_120b/)
- 【搜尋摘要】InferenceX：gpt-oss-120b 於 H100 vLLM FP4，每用戶 50 tok/s 時 8,973 tok/s/GPU；每用戶 100 tok/s 時約 5,863 tok/s/GPU（批次聚合值）。 — [SemiAnalysis InferenceX](https://inferencex.semianalysis.com/run/gptoss-120b-on-h100)
- 【搜尋摘要】MXFP4 原生硬體加速需 Blackwell；H100 上 vLLM 以 Triton matmul_ogs kernel 執行（非原生）。 — [Spheron](https://www.spheron.network/blog/deploy-gpt-oss-gpu-cloud)
- 【搜尋摘要】Gemma 4 31B 未量化可放單張 80GB H100。 — [TechWyse](https://www.techwyse.com/news/ai-search/google-deepmind-gemma-4-open-models-apache-2-0-release)
- 【訓練知識】gpt-oss-20b MXFP4 約 16GB 可執行（OpenAI 發布資訊）；本輪搜尋未取得其 vLLM 吞吐數字。

### Inferences
- 【推論】粗估（BF16 權重 = 2 bytes/param）：Gemma 4 31B ≈ 62GB、FP8 ≈ 31GB；26B-A4B BF16 ≈ 52GB、FP8 ≈ 26GB；gpt-oss-120b MXFP4 ≈ 60–65GB；gpt-oss-20b ≈ 13–16GB。H200（141GB）單卡可容納 31B BF16＋大量 KV cache。
- 【推論】公版多機關共用建議：大型層 gpt-oss-120b 每 1–2 張 H100/H200 一個副本；中型層 Gemma 4 31B 每 1 張 H100（FP8）一個副本；以併發需求水平擴展。MoE（26B-A4B、gpt-oss）每 token 計算量僅約 4–5B active，吞吐顯著高於 dense 31B。
- 【推論】NCHC/TWCC 以 H100/H200 為主（研究者知識，未本輪查證），與上述配置相容。

### Gaps
- 未取得 Gemma 4 31B / 26B-A4B 在 vLLM/SGLang 的實測吞吐數字。
- 未查證 TWCC／NCHC 現行 GPU 型號與數量。

---

## 六、建議分層陣容＋嵌入／重排＋語音

### Takeaway
建議預設：**中型（預設）＝Gemma 4 31B-it（Apache 2.0，可再做繁中／政府用語微調）**；**小型／高併發＝Gemma 4 26B-A4B 或 gpt-oss-20b**（邊緣／單卡 L40S）；**大型／複雜 agent＝gpt-oss-120b**（τ-bench 官方數據最完整、單卡 H100 可跑）；Mistral Small 4（119B-A6.5B，Apache）列為大型備選待驗證。嵌入首選 **EmbeddingGemma-300M**（Google、100+ 語言），重排避開 BGE/Qwen/GTE 系；語音 ASR 選 **Breeze-ASR-25（台灣華語）／Breeze-ASR-26（台語，Apache 2.0）**，客語無成熟開源選項。

### Cited Findings
- 【搜尋摘要】EmbeddingGemma：308M 參數、2K context、100+ 語言，發布時為 MTEB 上 500M 以下最佳純文字多語嵌入模型。 — [Hugging Face Blog](https://huggingface.co/blog/embeddinggemma)；[arXiv 2509.20354](https://arxiv.org/pdf/2509.20354)
- 【搜尋摘要】Snowflake Arctic-Embed 2.0：medium（305M）**以阿里 GTE-multilingual 為底**、large（568M）以 XLM-R-Large 為底，皆 8,192 tokens。 — [Snowflake Engineering Blog](https://www.snowflake.com/en/blog/engineering/snowflake-arctic-embed-2-multilingual/)；[arXiv 2412.04506](https://arxiv.org/pdf/2412.04506)
- 【搜尋摘要】Breeze 3 系列（2026-03）：Breeze ASR 26 與 Breeze Guard 26 開源；Breeze ASR 26 為台灣首個開源台語 ASR，以 Whisper 微調、約 10,000 小時台語合成語音訓練，主要輸出國語漢字而非臺羅；技術部落格稱 Apache 2.0。Breeze Guard 26 以 Breeze 2 8B 為底，12,000+ 筆台灣風險情境（詐騙、不實資訊）資料訓練。 — [MediaTek Research Breeze 3](https://www.mediatek.com/zh-tw/tek-talk-blogs/mediatek-research-breeze-3)；[電腦王阿達](https://www.koc.com.tw/archives/639154)；[iThome 鐵人賽文章](https://ithelp.ithome.com.tw/articles/10406792)；[工商時報](https://www.ctee.com.tw/news/20260304701327-430201)
- 【搜尋摘要】BreezyVoice 26（台語 TTS）基於 CosyVoice2 架構（**CosyVoice 為阿里巴巴 FunAudioLLM 專案，屬 PRC 血緣**），未確認是否開源。 — [T客邦](https://www.techbang.com/posts/128092-mediatek-mr-breeze-3-ai-taiwanese-fraud)
- 【搜尋摘要】南大團隊台語學伴整合 Breeze ASR 26，台語辨識率宣稱破 95%。 — [1111 人力銀行新聞](https://www.1111.com.tw/news/jobns/166167)
- 【訓練知識，未查證】其他候選：Breeze-ASR-25（Whisper-large-v2 微調、台灣華語＋中英混用、Apache 2.0）；OpenAI Whisper large-v3（MIT）；multilingual-e5-large（Microsoft，MIT）；IBM Granite-Embedding multilingual（Apache 2.0）；Nomic Embed v2 MoE（Apache 2.0，多語）；**Jina embeddings v3／reranker v2 multilingual 為 CC-BY-NC（非商用）且 v4 以 Qwen2.5-VL 為底**，不建議；Gemma 4 E2B/E4B 原生語音輸入可作備案。

### Inferences
- 【推論】建議陣容（截至 2026-10）：

| 層級 | 預設 | 備選 | 參考硬體 | 用途 |
|---|---|---|---|---|
| 小（邊緣／高併發 FAQ） | Gemma 4 26B-A4B-it | gpt-oss-20b；Gemma 4 E4B（極低成本/語音前端） | 1×L40S 48GB 或 1×H100（FP8） | 單輪 FAQ、分類、意圖路由 |
| 中（**公版預設**） | **Gemma 4 31B-it**（＋團隊繁中/政府用語微調） | Gemma 4 26B-A4B | 1×H100/H200（FP8 或 BF16） | RAG 附引註、一般工具呼叫 |
| 大（複雜 agent/多步驟） | gpt-oss-120b（reasoning medium/high） | Mistral Small 4（待驗證）、Nemotron 3 Super（授權待核） | 1–2×H100/H200 | 多工具串接、表單/案件流程 |
| 安全護欄 | Breeze Guard 26（Llama 衍生，需遵 Llama 授權） | gpt-oss-safeguard（訓練知識，未查證） | 小卡 | 詐騙/不實資訊/越權過濾 |
| 嵌入 | EmbeddingGemma-300M | multilingual-e5-large、Granite-Embedding-multilingual、Arctic-Embed-l-v2.0（XLM-R 底，非 GTE 底的 m 版） | CPU/小卡 | 檢索 |
| 重排 | 以 Gemma/gpt-oss 小模型做 LLM rerank，或自行以 EmbeddingGemma 微調 cross-encoder | mmarco 系 multilingual cross-encoder（未查證） | 小卡 | 引註精準度 |
| ASR | Breeze-ASR-25（華語）＋Breeze-ASR-26（台語） | Whisper large-v3 | 1×L4/L40S | 電話客服 |
| TTS | 待評估（BreezyVoice 有 CosyVoice 血緣且授權未明） | — | — | — |

- 【推論】PRC 血緣篩選原則應擴及嵌入（Qwen3-Embedding、BGE、GTE、Arctic-m-v2.0）與語音（CosyVoice、FunASR、Paraformer）。
- 【推論】團隊既有 Gemma-3-TAIDE 微調經驗（AIEC 證實優於原底模）可直接遷移至 Gemma 4 31B，做「底模換代＋在地對齊」，而非把 TAIDE 品牌模型當預設。

### Gaps
- 客語 ASR/TTS：未找到成熟開源模型（客委會相關資源本輪未查）。
- 台灣華語 TTS 的非 PRC 血緣、可商用開源選項未找到。
- 繁中重排模型（非 BGE/Qwen/Jina-NC）缺乏可引用的基準數字。
- EmbeddingGemma 在繁中檢索（如 TW 法規 QA）上的實測分數未找到。
