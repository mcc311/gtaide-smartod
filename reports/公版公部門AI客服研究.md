# 先建平台底座，再點亮燈塔部會

**結論先講。** 目前沒有任何一個開源專案能一次包辦「對話引擎、多通路、轉真人、評測」。授權最乾淨、也最貼近客服需求的組合是：**Parlant（Apache-2.0）負責對話控制，Chatwoot（核心 MIT）負責 LINE／網頁通路與真人坐席，vLLM＋LiteLLM 負責模型服務，再仿照 τ-bench 建一套繁中評測集**。Dify 生態最大，但它的修改版授權禁止多租戶營運，也不准改前台 LOGO，只適合當原型工具，不能當要再散布的公版核心。國際經驗的方向很一致：**做成「平台」的會留下來**，例如新加坡 VICA、法國 Albert API、日本源内；**太早擴張到民眾前台、又碰高風險題目的會出事**，例如紐約 MyCity 被關站、GOV.UK Chat 上線第一天就被稅務專家抓到錯誤答案。所以我們建議這一年分兩條線同時跑。第一條線在第一季，用已公開的內容（全國法規資料庫、data.gov.tw、各機關 FAQ）做出「公開資訊客服」與 MCP 工具層，讓部會不用提需求就有東西可看。第二條線同時找 2–3 個話務量大、題目以資訊查詢為主的燈塔機關，從話務紀錄挖需求，先做「坐席輔助」，再開放對民眾的 Bot。公版要交付的不只是程式碼，而是一整包東西：**介接規格、參考實作、一致性測試、合規包**。合規包要能讓部會直接用來完成《人工智慧基本法》要求的風險評估與內控，而且應該對齊數位部 TryAI 與共同供應契約的採購路徑，不要另起爐灶。

## 開源 harness 的分水嶺在「確定性 SOP」，不在模型

客服框架好不好，關鍵是能不能讓業務規則**確定性地執行**，LLM 只負責聽懂問題、把答案講成自然語言。從這個角度看，**Parlant** 最接近公部門需要的樣子。它用 Guidelines（條件→動作規則）、Journeys（多回合 SOP）、Canned Responses（關鍵時刻只用預先核可的模板）、Glossary（領域詞彙），再加上以 OpenTelemetry 記錄每個決策的可解釋性，而且授權是 Apache-2.0、約 18.3k stars ([GitHub emcie-co/parlant](https://github.com/emcie-co/parlant))。但有兩個地方要說清楚。第一，它的 README 自己警告「太小的現成模型會產生不一致結果」。第二，README 沒有提到真人轉接，也沒有提到 MCP。這代表**拿 8B／12B 級的 TAIDE 直接跑 Parlant 的多規則比對，穩不穩目前沒有任何實測數據**，必須由我們自己用評測來驗證。**Rasa CALM** 在 SOP 確定性上一樣強，但 Rasa Pro 是 open-core，正式上線需要商業授權 ([PyPI rasa-pro](https://pypi.org/project/rasa-pro/))。免費額度據稱每月 1,000 次對話，但這個數字本次無法連上 rasa.com 核實。所以 Rasa 不適合當可再散布的公版，只能當部會自購的商用選項。

通用編排框架各有長處。OpenAI 的客服 demo（MIT）把 Triage 分派、handoff 與 Relevance／Jailbreak guardrail 示範得很清楚，但只支援 OpenAI API ([GitHub openai-cs-agents-demo](https://github.com/openai/openai-cs-agents-demo))。Microsoft Agent Framework 在 2026-04 推出 1.0 GA，原生支援 MCP、handoff workflow、checkpoint 與 human-in-the-loop ([Sean Kim blog](https://blog.imseankim.com/microsoft-agent-framework-1-0-ga-mcp-a2a-devui-autogen-semantic-kernel/))，只是 A2A 到底是原生支援還是 beta adapter，各來源說法互相矛盾。這兩者加上 LangGraph、Google ADK，適合當 Parlant 的備案，但客服語意（規則、話術、轉接條件）都要自己做。

**Dify** 生態最大（158.4k stars），支援 MCP、OpenAI 相容端點與 Langfuse 日誌，最適合各機關快速做 FAQ／RAG 原型 ([GitHub langgenius/dify](https://github.com/langgenius/dify))。但它的修改版 Apache 授權有兩條限制：**未經書面授權不得營運多租戶，也不得移除前台 LOGO 與版權資訊** ([Dify LICENSE](https://github.com/langgenius/dify/blob/main/LICENSE))。如果公版由一個單位統一服務多個部會的 workspace，就會踩到第一條；第二條則讓前台沒辦法換成政府品牌。其他幾個也要排除。Botpress 可自架的 v12 已經 sunset，而且是 AGPL ([Botpress v12 文件](https://botpress.com/docs/studio/guides/advanced/v12/))。Typebot 的 FSL 授權禁止「競品用途」([Typebot LICENSE](https://github.com/baptisteArno/typebot.io/blob/main/LICENSE))。Flowise 在 2025-08 被 Workday 收購 ([SiliconANGLE](https://siliconangle.com/2025/08/15/workday-acquires-flowise-boost-ai-powered-workflows/))；有一篇第三方文章說它會在「2026-08 end of life」，但**沒有任何其他來源佐證**，所以只列為觀察，不採信。

真人轉接這一層，不建議由對話框架自己做，應該交給坐席系統。**Chatwoot** 除了 `enterprise/` 目錄以外都是 MIT ([Chatwoot LICENSE](https://github.com/chatwoot/chatwoot/blob/develop/LICENSE))，而且原生支援 LINE Official Account 通路 ([Chatwoot LINE 設定](https://developers.chatwoot.com/contributing-guide/line-channel-setup))，這對台灣幾乎是必要條件。它的 Captain AI 是付費功能，但公版用自己的 agent，不需要它。語音方面，Pipecat（BSD-2）適合電話與自訂 transport，LiveKit Agents（Apache-2.0）適合 WebRTC，兩者都可以全自架 ([forasoft](https://www.forasoft.com/blog/article/pipecat-vs-livekit-agents))。評測方面，業界標準是 Sierra 的 τ-bench 系列，作法是「模擬使用者＋政策文件＋終態資料庫比對＋pass^k 一致性」([arXiv 2406.12045](https://arxiv.org/abs/2406.12045))。τ²-bench 的 telecom 領域在 2026 年已經接近飽和，多個模型 pass^1 達 97–98%；banking_knowledge 領域的最佳成績只有 55.2%，還有鑑別力 ([benchmarkingagents τ³](https://benchmarkingagents.com/tau3-bench/))。但這些公開任務都是英文的航空、零售、電信，**目前找不到任何繁中或台灣公部門的公開客服 benchmark**，所以我們要自己建一套，而這套評測本身就可以是公版最有價值的資產之一。紅隊測試可以組合 promptfoo（2026-03 被 OpenAI 收購，官方表示維持開源，[OpenAI](https://openai.com/index/openai-to-acquire-promptfoo/)）、NVIDIA garak 與 Microsoft PyRIT。不過 garak、PyRIT、Ragas、LangGraph、ADK 的授權條款，本次都沒有用一手來源驗證。

### 建議技術堆疊

| 層 | 首選 | 授權 | 備選／說明 |
|---|---|---|---|
| 對話控制（SOP、規則、制式回覆） | Parlant | Apache-2.0 | MS Agent Framework 或 LangGraph 自建；Rasa Pro 給部會自購 |
| 通路＋真人坐席 | Chatwoot（LINE、網頁、email） | MIT（`enterprise/` 除外） | 介接既有 1999／話務系統的 handoff API |
| 語音／電話（第二年） | Pipecat | BSD-2 | LiveKit Agents（Apache-2.0）；SIP 細節未確認 |
| 模型服務 | vLLM（OpenAI 相容）＋ LiteLLM 閘道 | Apache-2.0 | TAIDE（Gemma-3-TAIDE-12B／Llama3.1-TAIDE-8B）、Gemma 4（Apache-2.0）、gpt-oss，以及部會核可的雲端模型 |
| 檢索（RAG） | 法規 XML＋機關 FAQ＋官網爬取，強制附引用 | — | Dify 只當機關原型工具，不進公版核心 |
| 工具／資料層 | MCP server 樣板＋OpenAPI | MCP 為開放規格 | 先做唯讀公開資料，再做 MyData／TW FidO 身分驗證查詢 |
| 個資遮罩與 guardrail | Presidio、NeMo Guardrails、Llama Guard（**本次未驗證**） | 待核 | 中文身分證、地址、電話的偵測品質需要實測 |
| 觀測／日誌 | OpenTelemetry＋Langfuse | 待核 | 寫入前先遮罩個資；服務日誌與訓練資料分開存放 |
| 評測 | 自建繁中 τ-bench 式任務集＋Ragas／DeepEval | 待核 | 以 pass^k 驗收 |
| 紅隊 | promptfoo＋garak＋PyRIT＋中文越獄與政治敏感題庫 | 待核 | 對應 OWASP Agentic Top 10 |

## 各國的贏家都做成平台，輸家都太早上前台

美國聯邦的作法分成三層。第一層是 GSA 營運的**多模型共用平台 USAi**，2025-08 上線，用來讓各機關評估模型 ([FedScoop](https://fedscoop.com/usai-general-services-administration-artificial-intelligence-google-meta-anthropic-claude/))。第二層是 **OneGov 集中議價**，例如 ChatGPT Enterprise 每機關 US$1 用一年 ([Nextgov](https://www.nextgov.com/acquisition/2025/08/openai-give-federal-agencies-chatgpt-access-1-year/407266/))。第三層是 **FedRAMP 20x 的 AI 優先審查** ([GSA](https://www.gsa.gov/about-gsa/newsroom/news-releases/gsa-fedramp-prioritize-20x-authorizations-for-ai-08252025))。在這三層之上，再用 OMB 備忘錄把契約條款統一下來。M-25-22 規定機關的非公開資料未經同意不得拿去訓練外部模型，也要求避免廠商綁定、採用績效導向契約 ([Perkins Coie](https://legacy.perkinscoie.com/insights/update/white-house-unveils-updated-ai-guidelines-federal-agencies))。M-26-04 要求所有新的 LLM 採購都要納入「承認不確定性」等條款 ([OMB M-26-04](https://www.whitehouse.gov/wp-content/uploads/2025/12/M-26-04-Increasing-Public-Trust-in-Artificial-Intelligence-Through-Unbiased-AI-Principles-1.pdf))。對我們最重要的教訓是財務面：**USAi 一開始免費，到 2026-09 已經改成收平台費加實際用量費** ([Nextgov](https://www.nextgov.com/artificial-intelligence/2026/09/agencies-now-have-pay-use-usai/415816/))，OneGov 的 US$1 方案到期後也只做了短期展延 ([Washington Technology](https://www.washingtontechnology.com/contracts/2026/09/anthropic-extends-1-user-onegov-deal-month/416062/))。公版如果第一天沒有規劃永續經費，部會在試用期結束後就會遇到預算斷崖。另外要注意，USAi 主要是給公務員用的內部評估平台。**美國對民眾的客服 Bot 仍由各機關自己建置、自己採購**，USAi 本身也沒有開源。

美國對民眾的 Bot，成效證據不多，而且好壞參半。TIGTA 在 2026-06 稽核 IRS 的聊天服務，發現 Bot 有 29 則回答資訊不足、44 個關鍵字或問題無法辨識，而且因為一直被當成「試點」，**完全沒有設定績效指標**。報表上甚至出現一名客服同時處理 603 個對話的錯誤資料（系統上限其實是 3）([Journal of Accountancy](https://www.journalofaccountancy.com/issues/2026/oct/tigta-finds-shortcomings-in-irss-chat-service/))。SSA 的語音 Bot 在 2025-09 自動處理了約 510 萬通電話中的 160 萬通 ([AARP](https://www.aarp.org/social-security/ai-customer-service/))；但根據 OIG 稽核的摘要，FY2025 約有 2,500 萬通電話最後沒有得到服務，而這些電話沒被算進等候時間指標 ([PSCA](https://www.psca.org/news/psca-news/2025/12/social-security-call-wait-times-improved-in-fy-2025/)，此處為搜尋摘要）。VA 在 2026-08 推出 LLM 客服 beta，**上線時還不能轉真人** ([aiunderstanding.org／FedScoop](https://aiunderstanding.org/news/fedscoop-reports-va-launches-beta-ai-helpdesk-chatbot))。最典型的失敗是**紐約 MyCity**：它告訴業者可以抽員工小費、可以拒收現金，兩者都違法；市府當時只加了免責聲明，沒有改系統 ([TechRadar](https://www.techradar.com/pro/faulty-ai-that-told-people-to-break-the-law-defended-by-new-york-mayor))。2026-01，新任市長 Mamdani 以「功能上無法使用」為由宣布關站 ([The Markup](https://themarkup.org/artificial-intelligence/2026/01/30/mamdani-to-kill-the-nyc-ai-chatbot-we-caught-telling-businesses-to-break-the-law))，但實際下線日期沒有得到獨立確認。在州層級，成功的模式是**州政府自建的共用平台**。加州 Poppy 在 2026-07 開放給所有部門，由州政府統一處理資安審查、個資偵測，並承諾不拿資料訓練模型，部門因此不必各自辦理採購與資安審查 ([CDT](https://www.cdt.ca.gov/newsroom/2026/07/poppy-california-digitals-assistant-now-available-statewide/))。加州稅務機關 CDTFA 則是**坐席輔助**的例子：AI 先擬答，經真人核閱後才回給納稅人，每通電話約省 1.5% 時間 ([GovTech Insider](https://insider.govtech.com/california/news/cdtfa-moves-genai-assistant-into-call-center-production-environment))。風險很低，但效益也很有限。

其他國家的案例更有參考價值。**新加坡 VICA 最接近我們要做的公版**：已有 60 多個機關、100 多個 Bot。機關簽一份 Project Commissioning Memorandum 後就能上架，系統預設用 SearchSG 爬機關官網內容來回答，機關也可以用 FAQ 覆寫生成的答案 ([GovTech VICA](https://www.tech.gov.sg/products-and-services/for-government-agencies/informational-services/vica/))。**愛沙尼亞 Bürokratt** 走聯邦式路線，用 DMR 元件在各機關的 Bot 之間轉送對話，解決民眾「問錯機關」的問題 ([GitHub Buerokratt-onboarding](https://github.com/buerokratt/Buerokratt-onboarding))。依 IDB 的資料，它採 MIT 授權，每個機關在國家雲上每月約 €150 再加上 LLM 費用 ([IDB](https://knowledge.iadb.org/en/code-development/open-source-solutions/buerokratt))；但到 2025-10 也只有 18 個組織加入，代表聯邦式互通的整合成本很高。**英國 GOV.UK Chat** 從 2023 年的實驗走到 2026-05 正式上線，花了約兩年半。公開試點有 10,000 多名使用者參與，準確率從 76% 提升到 90%，508 次越獄嘗試全部被擋下 ([Civil Service World](https://www.civilserviceworld.com/professions/article/govuk-ai-chatbot-achieves-90-accuracy))。即使如此，**上線當天還是被稅務專家抓到托育補助「懸崖」與資本利得稅的錯誤答案** ([ResultSense](https://www.resultsense.com/news/2026-05-15-govuk-chat-launches-tax-advice-criticism/))。**法國 Albert** 在 48 個 France Services 據點試行後，被決定「不以目前形式推廣」，後來轉型成跨部會的推論與 RAG API 底座，反而成了能長期留下的資產 ([Acteurs Publics](https://acteurspublics.fr/articles/de-chatbot-experimental-a-socle-interministeriel-pour-lia-de-letat-le-parcours-dalbert-ia/))。日本源内預計在 2026-05 到 2027-03 期間，對約 18 萬名公務員做大規模實證 ([デジタル庁](https://www.digital.go.jp/en/news/2d69c287-2897-46d8-a28f-ea5a1fc9bce9))。據二手來源，它已用 MIT 授權開源 genai-web 與 genai-ai-api 兩個 repo ([lilting.ch](https://lilting.ch/en/articles/digital-agency-gennai-oss-government-ai))，可以直接拿來當我們的參考實作。

國內方面，有公開成效的案例都是**話務員輔助**，不是讓 AI 全自動回答民眾。台北 1999 在 5 個月實證後，自述 AI 語音轉文字與語意分析的準確度在 90% 以上 ([工商時報](https://www.ctee.com.tw/news/20251229701009-431401))，但這是市府自己的說法，沒有獨立驗證。桃園 1999 導入生成式 AI 知識庫後，平均每通電話約節省 20 秒 ([iThome](https://www.ithome.com.tw/news/160562))。勞動部則與中華電信合作，用 Azure OpenAI 提供 24 小時的線上 AI 客服 ([Newtalk](https://newtalk.tw/news/view/2025-07-02/979424))。另外，TAIDE 下載已超過 18 萬次，報導卻說「尚未看到實際應用案例」([iThome](https://www.ithome.com.tw/news/168121))。這正是我們這個計畫要補上的缺口：有了模型，不代表服務就會落地。

## 給政府做客服：權威內容、確定性規則、強制轉真人

**架構**。綜合 GOV.UK、VICA、Bürokratt 與美國的 MCP 試點，我們建議公版分成九層：(1) 可嵌入網頁的 widget 與 LINE 通路；(2) 負責跨機關路由的對話編排層；(3) 只從官方內容檢索的 RAG 層，**一定要附引用，找不到依據就拒答或給「部分答案」並導向官方頁面**；(4) 用 MCP 或 OpenAPI 封裝機關 API 的工具層；(5) 身分層（TW FidO、MyData）；(6) 轉真人的連接器；(7) 寫入前先遮罩個資的日誌層；(8) 輸入與輸出的 guardrail；(9) 可以換掉底層模型的抽象層。工具層先從唯讀的公開資料做起，這是有證據的。美國 Census Bureau 與 GPO 已經公開了 MCP server。另據二手摘要，美國數位服務團（US Digital Corps）的一項試點用 MCP 後，USASpending 與 CDC 資料查詢的準確率「從接近 0% 提升到 95%」([FedScoop](https://fedscoop.com/federal-goverment-mcp-improve-ai-access-public-data/))，但 FedScoop 原文本次沒有讀到，引用時要保守。

**法規與治理**。《人工智慧基本法》已在 2025-12-23 三讀，主管機關是國科會，風險分類框架由數位部訂定 ([iThome](https://www.ithome.com.tw/article/176840))。有兩件事要特別說明。「2026-01-14 公布施行」這個日期目前只有一個學術來源。「各機關要在 2026-07 前完成風險評估、一年內建立內控規範」的期限，條號也還沒核實。如果這些期限屬實，現在（2026-10）部會應該已經或正在處理這些義務，**公版附上的風險評估範本與內控檢核表，馬上就能變成部會願意導入的理由**。《行政院及所屬機關（構）使用生成式AI參考指引》有兩點最重要。第一，不得向生成式 AI 提供機密或個資，但「確認系統環境安全性後，得依機密等級分級使用」。第二，AI 的產出不得作為行政行為的唯一依據 ([行政院](https://www.ey.gov.tw/Page/448DE008087A1971/40c1a925-121d-4b6b-8f40-7e9e1a5401f2))。第一點是公版採地端或國網中心部署的政策依據；第二點則代表**涉及資格認定的題目，一律只提供資訊、不做判定**。資安法修正後，主管機關改成數位部，並要求受託廠商建立資安管理機制或通過第三方驗證，「危害國家資安產品」的限制也提升到法律位階 ([理慈](https://www.leeandli.com/TW/NewslettersDetail/7505.htm))。所以公版應該列出允許使用的元件清單，並寫明對介接廠商的資格要求。國際框架可以這樣搭配：NIST AI 600-1 當風險目錄，OWASP Agentic Top 10（2025-12 發布）當工具與 agent 層的威脅模型 ([OWASP GenAI](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026))。歐盟的分級邏輯也值得借用：資訊型 Bot 屬「有限風險」，只要揭露是 AI；但涉及公共給付資格判斷的 Bot 屬附件 III 的高風險 ([gurusup](https://gurusup.com/blog/ai-act-chatbot-requirements))。附件 III 義務何時生效，各來源說法互相矛盾，還需要核對原文。

**個資**。台北市研考會的文件指出，如果把 1999 的通話錄音拿去訓練 AI，嚴格解釋下可能構成個資的「特定目的外利用」([台北市府文件](https://www-ws.gov.taipei/001/Upload/375/relfile/17156/124085/2029e9c0-fc41-4bba-8631-eaa11c9779b7.pdf))。因此公版預設要把「服務用日誌」與「訓練用資料」分開存放，日誌寫入前先遮罩個資，並在民眾端明確告知。這和加州 Poppy、紐澤西 AI Assistant 承諾的「不拿資料訓練模型」，以及美國 M-25-22 的規定是同一個方向。個資會組織法到 2026-10 是否已經完成立法，本次查不到。

**轉真人**。轉真人必須是**第一天就有的必要功能**，不能留到之後再補。VA 的 beta 就是反例。轉接觸發條件建議至少包括：檢索信心低、高風險意圖（資格、帳務爭議、法律效果）、使用者要求真人、連續失敗兩次 ([Social Intents](https://www.socialintents.com/blog/ai-chatbot-hallucination-in-customer-service/))。這可以直接借用 SSA「說 agent 就轉人工」的設計。最需要避免的是 MyCity 的作法：**在法律責任高的領域，免責聲明不能取代 guardrail**。GOV.UK 的經驗也顯示，民眾會因為政府品牌而過度信任 AI 的答案 ([PublicTechnology](https://www.publictechnology.net/2024/01/23/uncategorized/were-not-moving-fast-and-breaking-things-chatgpt-powered-gov-uk-chatbot-trials-show-promise-but-uncover-issues-of-accuracy-and-reliability/))。

**評測**。可以直接照抄 GDS 的作法：用嚴格的評分標準（完全正確／部分正確／錯誤／無依據），由專家評分搭配 LLM-as-judge，再加上使用者有用度調查與越獄測試次數 ([Civil Service World](https://www.civilserviceworld.com/professions/article/govuk-ai-chatbot-achieves-90-accuracy))。另外加上 τ-bench 式的 **pass^k**，也就是同一題跑多次都要答對，這比 pass^1 更符合公部門對一致性的要求。上線後的 KPI 要記取 IRS 與 SSA 的教訓：**從第一天就要追蹤「端到端解決率」與「沒有得到服務的比例」**，不能只看 Bot 攔下了多少對話（containment）。這點在 8B 級模型上特別重要。Ericsson 的客服案例顯示，約 80% 的錯誤來自幻覺、檢索漏抓，或 LLM 沒有使用檢索到的內容 ([arXiv 2408.09277](https://arxiv.org/pdf/2408.09277))。我們的作法是：關鍵回覆用 Canned Response，意圖路由可以交給較大的開源模型，TAIDE 負責繁中生成，最後由評測數據決定哪一種組合真的能用。

## 公版要交付規格與測試，而不只是一份程式碼

要讓各部會的承包廠商「拿回去就能接」，最明確的範本是 **GovStack**。它的每個 building block 都有規格、OpenAPI 介面，以及用 BDD 寫成的自動化測試；任何候選產品都要跑這套測試，符合度分成部署、需求、API 三類，並分級認定 ([GovStack 合規說明](https://govstack.global/?p=8977))。既有系統則透過 adapter 對接規格。我們建議公版交付六樣東西。**一、介接規格**：對話 API 與轉接 API 的 OpenAPI、MCP server 樣板、內容匯入 schema。**二、開源參考實作**：只採用 Apache／MIT／BSD 授權的元件。**三、一致性測試**：L1 是 API 相容；L2 是在 golden set 上達到門檻並通過 OWASP 紅隊測試；L3 是 pass^k 一致性達標加上轉真人演練。**四、廠商 SDK 與舊系統 adapter 指引**。**五、上架協議範本**：比照 VICA 的 PCM，寫清楚內容更新由誰負責、日誌保存與個資規則、資料不得拿去訓練。**六、合規包**：AI 基本法風險評估範本、生成式 AI 指引對照表、資安法委外檢核表、AI 使用揭露文字，以及可以直接放進採購規格書的條款。條款可以借用 M-25-22 與 M-26-04 的思路：不得拿資料訓練、使用開放標準避免綁定、績效導向驗收、廠商要揭露模型資訊、提供民眾回報錯誤的管道。

使用方式建議提供兩種。第一種是**中央代管**：在國網中心或政府雲上，每個部會一個 tenant，類似 Bürokratt 的國家雲（每機關約 €150／月）。第二種是**部會廠商自架**：前提是必須通過一致性測試。採購與部署管道最好對齊數位部的 **TryAI**。TryAI 在 2025-03 上線，提供 32 種模型（含 TAIDE）、20 項共通工具，已有 30 多個機關使用，並採「先試用後採購」，經 AI Bots 市集上架後走共同供應契約 ([CIO Taiwan](https://www.cio.com.tw/102279/))。報導預計 2026-03 到 06 月間可以把 AI 產品上架共同供應契約，但**實際有沒有決標、上架了哪些品項，本次查不到**，要到政府電子採購網確認。另外，TryAI 的部署位置、是否開放外部 API 給承包商，也都還不清楚。我們的定位應該是「TryAI 上的 AI 客服參考實作，加上給部會承包商用的規格與測試」，不要做成另一個平行的平台。授權方面有一個風險必須先處理：TAIDE 繼承了上游 Llama／Gemma 3 的客製授權，條款本次無法從 taide.tw 核實。所以模型抽象層一定要保留，必要時可以換成 Apache-2.0 的 Gemma 4 ([Google AI Dev Forum](https://discuss.ai.google.dev/t/gemma-4-launch-announcement/138069))。

## 兩條線同時跑：先接公開資料，同時從話務紀錄挖燈塔需求

「先找部會試點」還是「先把現有政府服務串起來」？證據指向**兩者並行，但承擔的任務不同**。只做廣泛的 demo，會掉進 MIT NANDA 報告說的「學習落差」：約 95% 的企業 GenAI 試點沒有產生可衡量的效益，主因是沒有整合進工作流程，而不是模型品質不夠 ([Fortune](https://fortune.com/2025/08/18/mit-report-95-percent-generative-ai-pilots-at-companies-failing-cfo))。不過這份報告講的是企業，研究方法也受過批評。反過來，只押一個部會，則可能重演法國 Albert France Services 的挫折。Gartner 預測，到 2027 年只有不到 25% 的政府組織會推出對民眾的 GenAI 服務，主要阻力是「害怕公開失敗」，並建議後台應用先行 ([Gartner 2024](https://www.gartner.com/en/newsroom/press-releases/2024-03-06-gartner-predicts-less-than-25-percent-of-government-organizations-will-have-genai-enabled-citizen-facing-services-by-2027))。Gartner 也建議採「目標明確的試點，加上清楚的試點後路線圖」([Gartner 2025](https://www.gartner.com/en/newsroom/press-releases/2025-09-09-gartner-reveals-top-technologies-shaping-government-ai-adoption))。所以我們的建議是：第一條線把**已公開的內容**串起來，包括全國法規資料庫的 XML（每月更新，採政府資料開放授權，[data.gov.tw](https://data.gov.tw/dataset/14081)）、data.gov.tw 上的開放資料、各機關 FAQ、1999 FAQ。用這些做出「公開資訊客服」與 MCP 工具，這條線完全不需要部會提需求，又能讓每個部會看到實際成果，還能沿用 smartOD 已經做好的法規檢索能力。第二條線找 2–3 個燈塔機關，照 GDS 的 Discovery→Alpha→Beta 流程走 ([dxw playbook](https://playbook.dxw.com/guides/agile-delivery-phases))，產出 golden set、轉真人的實際整合，以及一致性測試的實證。這兩條線之間要說清楚一個限制：**目前沒有任何研究直接比較這兩種策略的成效**，雙軌並行是我們根據證據做的推論。

「公部門不太會提需求」這個問題，解法是**不要問他們想要什麼，而是從資料裡把需求挖出來**。具體做法有四個。第一，請機關提供 3–12 個月的話務、1999、email 與民意信箱紀錄（可以先做去識別化），用 LLM 把來電原因分群，再用「量 × 能否從公開內容回答」排序。第二，用 Top Tasks 方法：先從搜尋紀錄與分析資料整理出 50–100 個候選任務，請民眾與第一線人員各選前五名；通常前 10 個任務就佔了大部分需求 ([koji.so](https://www.koji.so/docs/top-tasks-analysis-guide))，加拿大 Canada.ca 就是依 Top Tasks 來組織網站的 ([Canada TBS](https://blog.tbs.alpha.canada.ca/2020/09/24/COVID-top-tasks.html))。第三，分析機關官網的站內搜尋紀錄。第四，派人到第一線跟班半天。這四個方法的產出是一份排好序的意圖清單，加上分流機會的估算：話務量 × 可由官方內容回答的比例 × 預期攔截率 × 每通成本。這個公式是我們推導的，沒有公部門的公開方法論可以引用。國內已知的痛點很適合拿來切入：勞動部電話難以接通、苗栗 1999 每通要處理 10–15 分鐘 ([CNA](https://www.cna.com.tw/postwrite/chi/378574))、台北 1999 資深與資淺話務員效率差距大。**坐席輔助最容易拿出成效數據，也最不會「公開出糗」**，所以燈塔機關應該先做坐席輔助，再開放對民眾的 Bot。

### 試點用例選擇檢核表

| # | 檢核項目 | 通過標準 |
|---|---|---|
| 1 | 量大且重複 | 前 20 大意圖佔該通路話務 ≥50%，或每年話務 ≥數萬通 |
| 2 | 以資訊查詢為主 | 不涉及資格判定、核准或處分（對應生成式 AI 指引「不得作為唯一依據」與歐盟附件 III 的高風險邏輯） |
| 3 | 有權威內容，且有人負責更新 | 每個意圖都能對應到官方頁面、法規或 FAQ，並有指定的更新窗口 |
| 4 | 有現成的真人後援 | 已有話務中心、1999 或客服信箱，可以接住轉接 |
| 5 | 有內容負責的長官 | 至少一位科長級以上人員願意簽核內容與上線 |
| 6 | 可量測的基準線 | 已有話務量、平均處理時間（AHT）、等候時間或放棄率資料 |
| 7 | 個資可控 | 第一階段不需要身分驗證；若需要，能在地端或國網中心部署 |
| 8 | 對抗風險低 | 不是政治敏感或詐騙高發主題，或已有專門的紅隊題庫 |
| 9 | 可以交出紀錄 | 願意提供去識別化的話務或文字紀錄，建立 golden set |
| 10 | 可重用 | 用例在其他部會有同類型需求（例如申辦進度說明、補助常見問答） |

### 12 個月路線圖

| 季 | 第一條線：公版平台與公開資料 | 第二條線：燈塔機關 | 里程碑（可驗收） |
|---|---|---|---|
| Q1（M1–3） | 確定技術堆疊並完成授權法務審查（含 TAIDE 授權）；在國網中心建置 vLLM＋LiteLLM；完成法規 XML、data.gov.tw、機關 FAQ 的 RAG，以及 3–5 個唯讀 MCP server；Parlant＋Chatwoot（網頁、LINE）MVP；草擬 OpenAPI 規格 v0.1 | 招募燈塔機關（目標 2–3 個，簽 MOU 或上架協議）；取得話務紀錄、分群出意圖、做 Top Tasks；與數位部 TryAI 談對接 | 公開資訊客服 demo 上線（內部或邀請制）；每個燈塔機關有一份排序好的意圖清單與基準線 KPI |
| Q2（M4–6） | 繁中評測集 v1（每個燈塔機關 200–500 題，含應拒答題）＋pass^k 評測框架；紅隊題庫（中文越獄、提示注入、個資外洩、政治敏感）；個資遮罩＋OTel／Langfuse 日誌；模型路由實驗（TAIDE 與較大開源模型） | **坐席輔助 Alpha**：話務員端的建議答案與引用，真人核閱後才回覆；轉接 API 介接既有話務系統 | 燈塔機關坐席輔助 Alpha 上線；第一份評測報告（依 GDS 評分標準，公開或對部會公開） |
| Q3（M7–9） | 一致性測試 L1–L3 上線（CI 自動執行）；廠商 SDK 與 adapter 指引；合規包 v1（AI 基本法風險評估範本、內控檢核表、採購條款）；規格 v1.0 | **對民眾 Bot Beta**：限定網頁或 LINE、限定意圖、強制附引用、轉真人；監測端到端解決率與沒有得到服務的比例 | 至少一個機關對民眾的 Beta 達到準確率門檻（建議 ≥90%，比照 GDS）並通過紅隊測試；越獄阻擋率可量測 |
| Q4（M10–12） | 開源發布（GitHub）；在 TryAI 或 AI Bots 市集上架；辦一場「部會廠商 onboarding 工作坊／黑客松」（比照 GSA MCP hackathon）；規劃第二年經費模式（中央代管收費或共同供應契約） | Beta 擴大或轉正式；第一個「非燈塔」部會由自己的廠商依規格自行介接並通過 L2 | 成效報告（含失敗案例）；至少一家部會廠商通過一致性測試；第二年計畫（語音／電話、MyData 個人化查詢、跨機關轉介） |

這份路線圖有三個刻意的取捨。第一，**身分驗證的個人化查詢（MyData、TW FidO）與交易型 agent 留到第二年**。T-Road 介接要求服務集中到資料中心，目前也只有 40 多個 A 級機關導入 ([iThome](https://www.ithome.com.tw/news/164497))，一年內做不完。第二，**語音電話留到第二年**。Pipecat 的 SIP 細節還沒確認，而電話端的失敗（如 SSA）最容易被看見。第三，**每一季都公開評測與 KPI**。這同時回應了 Gartner 說的「害怕公開失敗」，以及 TIGTA 對 IRS「試點期間沒有指標」的批評。

## 尚未證實、需要先查清楚的事

有幾項會直接影響決策的事實，研究筆記明確標示為未經驗證，應該在 Q1 先查清楚。**法規面**：AI 基本法的公布日與各項期限都沒有用全國法規資料庫核實；數位部的 AI 風險分類框架是否已經發布、生成式 AI 指引在 2024–2026 有沒有修正、資安法修正的施行日、個資會是否已經成立，這些都查不到。**平台面**：TryAI 的部署位置、是否開放 API、共同供應契約上的 AI 品項是否已決標，都不清楚；TAIDE 的授權是否允許政府委外廠商商用部署，也還沒核實；國網中心推論服務的收費與 SLA 同樣查不到。**技術面**：Parlant 搭配 8–12B 本地模型是否穩定、是否支援 MCP 與轉真人，都沒有任何資料；中文個資偵測（身分證、地址、電話）的品質需要實測；Presidio、NeMo Guardrails、garak、PyRIT、Ragas、LangGraph、ADK 的授權，都沒有用一手來源驗證。**案例面**：美國 MCP「0%→95%」的數字、USAi 的機關數（15 個或 25 個以上）、SSA 的 2,500 萬通、南韓的得標廠商、日本源内的開源授權，都來自搜尋摘要或二手來源；台北 1999 的 90% 準確度是市府自己的說法。最後，所有國際案例都**沒有公開轉真人的實際數據（轉接率、SLA）或每次對話的成本**，所以第一年的 KPI 門檻要由我們自己的燈塔試點來訂。

## 結論

這個計畫真正的護城河不是模型，也不是聊天介面，而是三樣別人很難複製的東西：**繁中公部門客服評測集、廠商可以自我認證的一致性測試、能讓部會直接拿去完成法定義務的合規包**。TAIDE 下載了 18 萬次卻沒有實際應用，美國 USAi 從免費改成收費，法國 Albert 從前台聊天機器人轉型成 API 底座，這三件事說明同一個道理：能留下來的公共 AI 是「別人可以放心拿去用的基礎設施」，不是單一個展示品。

我們團隊的優勢在於已經有 smartOD 的法規檢索能力，也能使用國網中心的資源，正好可以補上 TryAI 偏向「模型試用」、比較缺少「對民眾客服的規格與驗收」這一塊。風險同樣清楚：如果第一年就讓 Bot 在稅務、社福資格這類題目上直接回答民眾，只要一則錯誤答案上了新聞，就足以讓整個公版失去信任。所以第一年的成功標準應該訂成「**一個部會的廠商不靠我們，自己依規格接上並通過測試**」，而不是「上線了幾個 Bot」。
