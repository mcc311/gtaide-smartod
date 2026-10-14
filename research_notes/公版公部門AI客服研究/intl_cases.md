# 國際政府 AI 助理／客服／共用 AI 平台案例（非美國，2024–2026）

研究日期：2026-10-14。方法：WebSearch（約 20 次），多數官方網域（digital.go.jp、insidegovuk.blog.gov.uk、apolitical.co、publictechnology.net）在本環境 WebFetch 無法解析（DNS 失敗），因此許多事實取自搜尋摘要，引用處以原始 URL 標示；需要精確數字時建議回原文核對。GitHub API 對外部 repo 於本 session 未開放，授權條款多數無法直接查證（列入 Gaps）。

---

## Q1. 英國：GOV.UK Chat、i.AI（Humphrey 套件）、AI Playbook、ATRS

### Takeaway
GOV.UK Chat 走「長期實驗 → 封閉/公開試點 → 先上 App 再上網站」路線：2023–24 首次試點發現幻覺與使用者過度信任，2026 年公開試點後準確率由 76% 提升至 90%，2026-05-15 於 GOV.UK App 正式上線，網站版預計 2026 稍後；上線當天即被稅務專家揭露錯誤答案，凸顯「只做資訊引導、不提供建議」與持續評測的必要。i.AI 的 Humphrey 是面向公務員的內部工具組合（Consult、Minute 等），以節省人工分析時間為主要 KPI。

### Cited Findings
- 首次（2023–24）試點：發現若干幻覺，多發生於使用者提出「模糊或不當問題」時；GDS 也觀察到使用者因 GOV.UK 品牌公信力而對可能出錯的系統產生「錯置的信心」— [PublicTechnology 2024-01-23](https://www.publictechnology.net/2024/01/23/uncategorized/were-not-moving-fast-and-breaking-things-chatgpt-powered-gov-uk-chatbot-trials-show-promise-but-uncover-issues-of-accuracy-and-reliability/); [Government Transformation](https://www.government-transformation.com/data/government-chatbot-trial-reveals-accuracy-issues)
- 首次試點使用 ChatGPT（OpenAI）技術（標題 "ChatGPT-powered GOV.UK chatbot trials"）— [PublicTechnology 2024](https://www.publictechnology.net/2024/01/23/uncategorized/were-not-moving-fast-and-breaking-things-chatgpt-powered-gov-uk-chatbot-trials-show-promise-but-uncover-issues-of-accuracy-and-reliability/)
- 公開試點完成：超過 10,000 名參與者、提出超過 26,000 個問題；準確率（專家評估＋自動化工具）由 76% 提升至 90%；73% GOV.UK App 使用者認為有用；不準確時多為「部分錯誤」而非完全錯誤 — [UKAuthority](https://www.ukauthority.com/articles/gov-uk-ai-chat-completes-public-pilot); [ResultSense 2026-03-25](https://www.resultsense.com/news/2026-03-25-gov-uk-ai-chat-completes-public-pilot)
- 時程：2026-03 軟上線；2026-05-15 於 GOV.UK App 正式上線；網站整合預計 2026 稍後 — [PublicTechnology 2026-05-15](https://www.publictechnology.net/2026/05/15/society-and-welfare/government-ai-chatbot-goes-live-across-gov-uk-app/); [ResultSense 2026-05-19](https://www.resultsense.com/news/2026-05-19-govuk-chat-launches-citizens/)
- 架構／評測（GDS 部落格 2026-05-15）：評測框架三支柱，其一為以預定義指標與 ground-truth 資料集進行自動化評測，另有對對話紀錄的人工專家審查；生成方式確保 LLM 引用其使用的 GOV.UK 內容並避免「幻覺超連結」；GOV.UK 上沒有完整答案時給「部分答案」引導至最相關指引 — [Inside GOV.UK blog: Developing GOV.UK Chat](https://insidegovuk.blog.gov.uk/2026/05/15/developing-gov-uk-chat-our-data-science-and-ai-engineering-journey/)（僅取得搜尋摘要，未能全文抓取）
- 定位：政府稱提供「資訊而非建議」，設計上只引導至 GOV.UK 指引頁；LITRG 2026-05 測試結論為可作引導工具，但效果與準確度可能仍有限，且理論上會把錯誤答案當事實呈現 — [LITRG](https://www.litrg.org.uk/news/new-govuk-chatbot-can-you-rely-it-tax-information); [Tax Adviser Magazine](https://www.taxadvisermagazine.com/article/new-govuk-chatbot-useful-tool-or-potential-risk)
- 上線當天失誤：稅務專家 Dan Neidle 向 The Times 提供證據，指 Chat 在 £100,000 免稅托育「懸崖」與個人出售 MacBook 是否課資本利得稅上給出誤導答案；數位政府部長 Ian Murray 稱系統已「tested to essentially destruction」— [ResultSense 2026-05-15](https://www.resultsense.com/news/2026-05-15-govuk-chat-launches-tax-advice-criticism/)
- i.AI Humphrey：一組加速公務員工作、減少行政時間與外包支出的 AI 工具 — [LBC](https://www.lbc.co.uk/article/c52e10209a004be09356a75fd66507eb-5HjcyMj_2/)
- Consult：首次於蘇格蘭政府一項真實公眾諮詢使用，結果經專家覆核與人工結果「幾乎相同」；政府估計每年可省 75,000 人日人工分析、約 £20m 人事成本（政府自估）— [GOV.UK 新聞稿](https://www.gov.uk/government/news/government-built-humphrey-ai-tool-reviews-responses-to-consultation-for-first-time-in-bid-to-save-millions); [Global Government Forum](https://www.globalgovernmentforum.com/uk-governments-ai-system-humphrey-set-to-review-thousands-of-public-consultations-to-improve-civil-service-efficiency/)
- Minute（會議紀錄）：中央政府早期測試每 1 小時會議省 1 小時行政；25 個地方議會參與早期試行 — [ITPro](https://www.itpro.com/business/public-sector/governments-humphrey-ai-tool-helps-local-authorities-cut-costs)
- 對照：另一項 Microsoft Copilot 試驗涵蓋 20,000 名公務員，自報每天省 19–24 分鐘（非 Humphrey）— [TechRadar](https://www.techradar.com/pro/using-ai-tools-such-as-microsoft-copilot-could-save-uk-civil-servants-weeks-every-year)

### Inferences
- GOV.UK Chat 的關鍵設計對台灣公版很有參考價值：(1) 知識範圍嚴格限縮在官方內容（單一權威內容庫 GOV.UK）、(2) 強制引用來源與防止虛構連結、(3) 「部分答案＋引導」而非硬答、(4) 明確「資訊非建議」定位、(5) 先上可控通路（App）再擴至網站。
- 即使內部評測 90%，高風險領域（稅務、福利資格）的邊緣問題仍會在上線首日被外部專家打穿；台灣宜在稅務、社福等領域設「高風險主題」額外守門或強制轉真人。
- 從 2023 首次實驗到 2026 正式上線約 2.5 年，顯示 GDS 採「慢且謹慎」策略（"not moving fast and breaking things"）。

### Gaps
- 未能取得 GDS 官方部落格全文，模型供應商（2026 版）、檢索架構細節、拒答率、jailbreak 處理數據未查證。
- AI Playbook for UK Government（2025-02 發布）與 Algorithmic Transparency Recording Standard（ATRS，2024 起對中央部會強制）內容本次未能搜尋查證，需另行補充原文。
- Redbox 狀態（是否併入 Humphrey 或停止）、i.AI 各工具使用人數未找到 2026 數據。
- i.AI 與 alphagov GitHub repo 授權：GitHub API 在本環境被拒，無法確認（記憶中 i.AI repo 多為 MIT，未查證）。

---

## Q2. 新加坡：VICA、Ask Jamie、Pair、AIBots、SEA-LION

### Takeaway
新加坡是「平台優先」最成熟的案例：VICA 是 GovTech 提供的共用對話式 AI 平台，60+ 機關、100+ 聊天機器人，前身為 Ask Jamie；機關透過簽約＋線上 onboarding 自建 bot，預設即可用 SearchSG 爬蟲抓取機關公開網頁回答，並可用 FAQ 覆寫生成內容。內部則有 Pair（通用聊天）與 AIBots（自建 bot，20,000+ 個）。

### Cited Findings
- VICA：60+ 政府機關、100+ 聊天機器人；多數面向民眾，約五分之一服務內部公務使用者 — [GovTech VICA](https://www.tech.gov.sg/products-and-services/for-government-agencies/informational-services/vica/); [Developer portal](https://www.developer.tech.gov.sg/products/categories/platform/virtual-intelligent-chat-assistant/overview)
- 技術：結合規則式 NLP 與生成式 AI；機關可用其公開資訊來源、系統指令、偏好 FAQ 來 ground、steer、override 生成輸出 — [GovTech VICA](https://www.tech.gov.sg/products-and-services/for-government-agencies/informational-services/vica/)
- Onboarding：先與 VICA 團隊簽 Project Commissioning Memorandum、填 onboarding 表單；預設 bot 可透過 SearchSG 爬蟲回答機關公開網頁內容；自動產生問答變體，機關只需驗證 — [VICA getting started](https://v2.developer.tech.gov.sg/products/categories/platform/vica/getting-started)
- 案例：OneService Kaki Chatbot、Gov.sg on WhatsApp；VICA 最初為 COVID-19 期間提供正確資訊而建，取代較早的 Ask Jamie 機器人 — [GovTech AI and Data](https://www.tech.gov.sg/about-us/what-we-do/govtech-role-in-digital-transformation-for-the-public-sector/ai-and-data-in-singapore-government/); [OpenGov Asia 2023-03](https://archive.opengovasia.com/2023/03/24/exclusive-chatbot-development-for-public-service/); [STACK 2020 簡報](https://www.developer.gov.sg/assets/files/STACK%202020%20-%20Bertrand%20Lee.pdf)
- Pair：2025-11 國會答詢，約 80% 的 150,000 名公務員用過 Pair Chat；AIBots 已建立 20,000+ 個客製 bot（HR 問答、預算與採購指引等）— [MDDI PQ response](https://www.mddi.gov.sg/newsroom/mddi-s-response-to-pq-on-progress-of-adopting-ai-tools-within-public-service/)
- 2024 年底數字為 55,000 名公務員用過 Pair，約一半為常態使用 — [CompleteAITraining 轉述](https://completeaitraining.com/news/singapore-public-officers-double-usage-of-ai-chatbot-to/)（二手來源）
- Pair 底層模型說法衝突：GovInsider 稱 Pair Chat 建於 Claude Sonnet 4；GovTech 官方頁稱使用與 ChatGPT 相同的 LLM — [GovInsider](https://govinsider.asia/intl-en/article/an-infrastructure-first-approach-as-key-to-scaling-public-sector-ai); [GovTech Pair](https://www.tech.gov.sg/products-and-services/for-government-agencies/productivity-and-marketing/pair/)（可能反映不同時期模型更換）
- GovTech 正建立 AI agent 登記簿（registry），AI Assistant Desk 套件預計 2026 稍後擴大 — [Startup Fortune](https://startupfortune.com/singapore-is-putting-ai-agents-on-a-government-register/)；OGP 公開 Pair 成效報告卡 — [reports.open.gov.sg/pair](https://reports.open.gov.sg/pair)

### Inferences
- VICA 是最接近台灣「公版 AI 客服」的範本：中央建平台、機關自助上架、預設以機關官網內容 RAG、機關可用 FAQ 覆寫（人工可控）、同時支援對內與對外 bot、多通路（網站、WhatsApp）。
- 「從 Ask Jamie（規則式、各機關各自內容）到 VICA（規則＋生成混合）」的演進表示：不必一次拋棄既有 FAQ 機制，可把 FAQ 當 override 層。
- 模型可替換（Pair 在不同時期使用不同供應商）顯示平台應做 model-agnostic。

### Gaps
- VICA 計費模式、每月對話量、生成式 AI 導入日期、真人轉接（live chat handoff）機制未查到。
- SEA-LION（AI Singapore 主導的東南亞語言 LLM）與 VICA/Pair 的實際整合情形未查到；授權條款未查證。
- Ask Jamie 停用確切年份未查證。

---

## Q3. 愛沙尼亞：Bürokratt

### Takeaway
Bürokratt 是由 RIA（資訊系統局）開發營運的「互通虛擬助理網路」，各機關網站的聊天機器人連成一個網路，使用者在任一入口提問可被轉介至正確機關；原始碼開源於 GitHub（buerokratt org，2023 年中已有 23 個專案）。截至 2025-10 有 18 個組織加入，規模仍有限。

### Cited Findings
- 定義：公共機關網站上互連的聊天機器人網路，由 RIA 開發管理，屬國家 AI 策略 KrattAI 核心元件 — [RIA Bürokratt](https://www.ria.ee/en/state-information-system/artificial-intelligence/burokratt)
- 參與機關例：稅務與海關局、健康保險基金、統計局；另有司法與數位事務部的法律資訊 bot — [RIA](https://www.ria.ee/en/state-information-system/artificial-intelligence/burokratt)
- 2025-10 政府首席資料官稱共 18 個組織加入，更多將加入 — [Apolitical case study](https://apolitical.co/en/navigator/case-studies/burokratt-estonia-s-single-network-of-ai-assistants-replacing-dozens-of-separate-agency-chatbots)（搜尋摘要，標題稱「單一 AI 助理網路取代數十個獨立機關聊天機器人」）
- 治理：經濟事務與通訊部發起，技術由 RIA 機器學習與語言技術部門實作 — [GitHub Buerokratt-onboarding](https://github.com/buerokratt/Buerokratt-onboarding)
- 架構：DMR（Distributed Message Rooms）元件擔任多個 client 間對話的中介，讓各機關 instance 互通 — [GitHub Buerokratt-onboarding](https://github.com/buerokratt/Buerokratt-onboarding)
- 開源：2022 年底 GitHub 上 20+ 專案，2023-07 增至 23 個；EU 報告確認原始碼於 GitHub 公開 — [EU OSS Country Intelligence Report Estonia 2025](https://interoperable-europe.ec.europa.eu/sites/default/files/inline-files/OSS%20Country%20Intelligence%20Report%20Estonia%202025.pdf)
- 願景（早期）：改寫民眾與公共服務互動方式，以單一對話入口取代逐一找機關 — [e-Estonia](https://e-estonia.com/estonias-new-virtual-assistant-aims-to-rewrite-the-way-people-interact-with-public-services/)

### Inferences
- Bürokratt 的「聯邦式（federated）架構」——各機關保有自己的 bot 與知識，中央提供訊息路由（DMR）與共用元件——是解決台灣跨部會「問錯機關」問題的參考：民眾在 A 機關入口問 B 機關業務時可轉介。
- 但 18 個組織、多年發展的速度顯示，聯邦式互通的治理與整合成本高；台灣可考慮「平台集中＋知識分權」的混合。

### Gaps
- 使用量、準確率、是否已導入 LLM 生成（早期以意圖分類為主）未查證。
- GitHub repo 授權條款無法以 API 確認（本環境受限），需人工查看 github.com/buerokratt。
- 非官方 gist「service hub blueprint」為個人分析，未採用。

---

## Q4. 其他國家：日本、南韓、澳洲、法國、德國、荷蘭、歐盟、印度、阿聯

### Takeaway
2025–2026 主流已從「各機關各做聊天機器人」轉向「中央共用 GenAI 平台」：日本「源内（GENNAI）」對 18 萬公務員大規模實證並以 MIT 開源；澳洲 GovAI Chat 分 alpha/beta 試行、2026 年底全面推出；法國由 Albert（France Services 失敗）轉向 Albert API（跨部會推論平台）＋ Assistant IA；德國以邦為單位（F13 開源、LLMoin 被 4 邦採用）。對民眾端的生成式客服，英國 GOV.UK Chat 與阿布達比 TAMM 是少數已大規模上線者；南韓則推出全民免費 AI 計畫。

### Cited Findings
**日本（デジタル庁「源内 GENNAI」）**
- 大規模實證 2026-05 至 2027-03，對象約 180,000 名全府省廳職員 — [Digital Agency 新聞](https://www.digital.go.jp/en/news/2d69c287-2897-46d8-a28f-ea5a1fc9bce9); [Digital Agency GENAI 政策頁](https://www.digital.go.jp/en/policies/genai)
- 2026-05 初約 100,000 名官員取得使用權，其餘年內陸續開放（報導間不完全一致）— [WTL Governance](https://wtlgovernance.com/insights/updates/japan-gennai-government-ai-platform-rollout/); [CDO Magazine](https://www.cdomagazine.tech/aiml/japan-to-roll-out-government-built-ai-tool-to-ease-bureaucrats-workload)
- 2026-04-24 於 GitHub 開源 genai-web、genai-ai-api 兩個 repo，MIT 授權；含 RAG、自架 LLM、法務 AI 範本 — [lilting.ch](https://lilting.ch/en/articles/digital-agency-gennai-oss-government-ai)（二手來源）
- 路線圖（二手解說）：2026 夏國產 LLM 試用、2026-12 進階應用測試、2027-04 付費採購高品質 LLM；約 2026-10 加入讓官員自建 AI agent 的環境 — [note.com 解說](https://note.com/hirokimiyano/n/ne5eb28d0103b?hl=en-US)（非官方，需核對）
- 評論：成功指標應為業務轉型而非使用率 — [Eveil Advisory](https://eveiladvisory.com/insights/gennai-adoption-vs-transformation/)

**南韓**
- 科技部 2026-07-13 招標「AI for Everyone」全民免費聊天機器人與公共服務 agent；至少一半須用國產基礎模型；2026-09 beta、年底全國上線 — [UPI 2026-07-13](https://www.upi.com/Top_News/World-News/2026/07/13/ai-for-everyone-public-services/9121783997023/); [The Register 2026-07-15](https://www.theregister.com/public-sector/2026/07/15/south-korea-to-launch-universal-basic-ai-chatbot/5271566)
- 2026-08 報導 SK Telecom、Kakao、KT 獲選 — [shashi.co](https://www.shashi.co/2026/08/south-korea-assigns-sk-telecom-kakao.html)（低可信度來源）；GPU 數量報導互相矛盾（256 vs 512 張 B200）
- 地方：首爾 2024 AI 行政計畫含「120 Smart AI 諮詢中心」改善民怨處理 — [regulations.ai](https://regulations.ai/regulations/RAI-KR-SE-SAAPXXX-2024)；釜山 2025-12 推出 22 項功能的生成式 AI 行政服務，2026 初推至全部門 — [Busan](https://www.busan.go.kr/eng/ai-translated-press-releases/1712089)

**澳洲（GovAI / DTA）**
- GovAI Chat alpha 試行 2026-04 開放、06-30 結束；beta 2026-07-27 啟動，新增機關 SSO、新模型、網頁搜尋、大型文件處理；僅限公開及 OFFICIAL 等級資訊，須使用政府管理裝置且機關選擇加入 — [GovAI Chat trials](https://www.govai.gov.au/govai-chat/trials); [Finance 2026 新聞](https://www.finance.gov.au/about-us/news/2026/govai-chat-alpha-trial-now-open-sign-now)
- 預計 2026 年底全面推出；將 ChatGPT、Claude 等商用模型帶入單一可信政府環境；屬 APS AI Plan — [AAP](https://aapnews.aap.com.au/news/purpose-built-public-servant-chatbot-in-federal-ai-push); [Introducing the APS AI Plan](https://www.finance.gov.au/about-us/news/2025/introducing-aps-ai-plan); [GovAI blog AIDE and GovAI](https://www.govai.gov.au/blog/aide-and-govai-moving-experimentation-impact-across-aps)

**法國（DINUM / Albert / ALLiaNCE）**
- Albert France Services：與 ANCT 共同開發、60 名 France Services 人員參與改善，於 48 個 France Services 據點測試後，DINUM 表示「不會以目前形式推廣」；原計畫涵蓋 2,600 據點 — [Weka](https://www.weka.fr/actualite/administration/article/albert-l-outil-d-ia-generative-experimente-a-france-services-ne-sera-pas-generalise-209194/); [Next.ink](https://next.ink/brief-article/albert-lia-souveraine-de-la-dinum-ne-sera-pas-generalisee-dans-sa-forme-actuelle/); [Siècle Digital 2024-04](https://siecledigital.fr/2024/04/24/la-france-innove-avec-son-ia-albert-pour-transformer-ladministration-publique/)
- 轉型：Albert 從實驗聊天機器人變成跨部會 AI 底座（Albert API：多模型推論、RAG、OCR、分類），DINUM 各產品皆經 Albert API 存取 — [Acteurs Publics](https://acteurspublics.fr/articles/de-chatbot-experimental-a-socle-interministeriel-pour-lia-de-letat-le-parcours-dalbert-ia/); [Delta Sierra](https://www.delta-sierra.com/france/mesure-9-03-plateforme-inference-publique.html)
- Assistant IA：建於 Albert API、整合 Mistral 模型、SecNumCloud（Outscale）託管，約 10,000 名部會公務員試用至 2026-06，2026 夏評估普及成本 — [ALLiaNCE Assistant IA](https://alliance.numerique.gouv.fr/produit/produits-ia-interministeriels/assistant-ia/); [Solutions Numériques](https://www.solutions-numeriques.com/la-dinum-veut-faire-de-lia-et-du-cloud-souverain-les-piliers-du-numerique-public/)
- ALLiaNCE：DINUM 內的國家 AI 孵化器 — [numerique.gouv.fr](https://www.numerique.gouv.fr/offre-accompagnement/expertise-alliance-ia-etat/)
- 地方政府可申請 Albert API，但有大量排隊，優先給中央機關 — [Banque des Territoires](https://www.banquedesterritoires.fr/albert-mode-demploi-lacces-des-collectivites-lia-de-letat-precise)
- 基於開源模型（Llama 3.1、Mistral）以追求主權 — [Liora](https://liora.io/albert-lia-au-service-de-ladministration-francaise)

**德國**
- F13（巴登-符騰堡 InnoLab_bw）：德國首個行政 AI 助理，2024 起全邦推行，後以開源釋出供聯邦、各邦、地方重用；模型無關架構，經 Open CoDE 提供；由 BITBW 營運 — [BW 新聞稿：F13 wird zur Open-Source-Software](https://www.baden-wuerttemberg.de/de/service/presse/pressemitteilung/pid/ki-assistenz-f13-wird-zur-open-source-software); [oeffentlicher-dienst-news](https://oeffentlicher-dienst-news.de/so-nutzt-der-oeffentliche-dienst-kuenstliche-intelligenz-bund-laender/); [Tagesspiegel Background](https://background.tagesspiegel.de/smart-city-und-stadtentwicklung/briefing/kuenstliche-intelligenz-was-verwaltungen-von-der-plattformoekonomie-lernen-koennen)（早期版本與 Aleph Alpha 合作，來源說法不一）
- LLMoin（漢堡＋Dataport）：一年試點後 2024-12 進入常態營運，2025-12 約 40,000 名員工可用；Niedersachsen、Bremen、Sachsen-Anhalt、Rheinland-Pfalz 決定採用；漢堡資料保護官認為證明合規 AI 可行 — [Dataport](https://www.dataport.de/nachricht/kuenstliche-intelligenz-hamburg-startet-mit-ki-assistent-llmoin-in-den-regelbetrieb/); [Treffpunkt Kommune](https://www.treffpunkt-kommune.de/hamburger-ki-assistent-etabliert-sich-in-oeffentlicher-verwaltung/); [HmbBfDI 2025](https://datenschutz-hamburg.de/news/hmbbfdi-stellt-taetigkeitsbericht-datenschutz-2025-vor)

**印度（Jugalbandi / Bhashini）**
- Jugalbandi：WhatsApp 語音/文字 → AI4Bharat 語音辨識 → Bhashini 翻譯 → Azure OpenAI 檢索福利方案 → 翻回並 TTS；首版涵蓋 171 個方案、22 種官方語言中的 10 種；Microsoft Research、AI4Bharat、OpenNyAI 合作，開源 — [Madhyamam](https://english.madhyamam.com/technology/microsoft-launches-multilingual-ai-chatbot-to-reach-rural-population-of-india-1164504); [Thoughtworks](https://www.thoughtworks.com/clients/jugalbandi)

**阿聯（阿布達比 TAMM）**
- TAMM 3.0（GITEX 2024）以 AI 助理為核心，阿/英語音與文字、約 800 項服務；TAMM 4.0（GITEX 2025）可代使用者完成服務，AutoGov 主動在到期前更新證件 — [Economy Middle East](https://economymiddleeast.com/news/gitex-global-2024-dge-abu-dhabi-launches-tamm-3-0-ai-unified-app-offering-800-seamless-services); [Gulf News 2025](https://gulfnews.com/uae/government/abu-dhabi-unveils-worlds-first-ai-powered-public-servant-at-gitex-global-2025-1.500306408); [Counterpoint](https://counterpointresearch.com/jp/insights/counterpoint-conversations-abu-dhabi-ai-native-governance-tamm-autogov-world-first-ai-public-servant)
- 使用量說法分歧：360 萬使用者／每月 1 億互動／70% 即時完成 vs. 280 萬活躍用戶（LangChain 廠商案例）— [Counterpoint](https://counterpointresearch.com/jp/insights/counterpoint-conversations-abu-dhabi-ai-native-governance-tamm-autogov-world-first-ai-public-servant); [LangChain](https://www.langchain.com/blog/customers-abu-dhabi-government)

### Inferences
- 對內（公務員）GenAI 平台普遍採「中央共用、多模型、資料分級限制」；對外（民眾）客服則更保守，要求嚴格 grounding。
- 法國 Albert 的教訓：先推「特定前台聊天機器人」受挫後，轉為「共用 API/推論平台」反而成為持久資產——支持台灣公版採「平台層（推論＋RAG＋治理）先行，應用層（各機關客服）在其上」。
- 德國 LLMoin/F13 顯示「一個單位做、開源、他單位重用」可在聯邦制下擴散，類似台灣中央→地方模式。

### Gaps
- 荷蘭（如 GPT-NL、各部會 chatbot）、歐盟（如 EC GPT@EC）本次未能搜尋，無資料。
- 南韓中央政府對公務員的共用 GenAI 平台（如行政安全部計畫）未查到可靠來源。
- 日本源内正式使用統計、阿聯 TAMM 準確率未查到。
- 印度 Jugalbandi 現況與使用量、維護狀態未查到。

---

## Q5. 開源與授權

### Takeaway
明確開源者：日本源内（MIT，2026-04）、德國 F13（Open CoDE 開源）、愛沙尼亞 Bürokratt（GitHub）、印度 Jugalbandi（開源）、英國 i.AI 與 GOV.UK（GitHub 公開）、法國 Albert API（GitHub）。但除日本外，本次無法直接查證各 repo 授權條款。

### Cited Findings
- 日本 genai-web、genai-ai-api：MIT — [lilting.ch](https://lilting.ch/en/articles/digital-agency-gennai-oss-government-ai)
- F13 開源供重用、經 Open CoDE — [BW 新聞稿](https://www.baden-wuerttemberg.de/de/service/presse/pressemitteilung/pid/ki-assistenz-f13-wird-zur-open-source-software); [oeffentlicher-dienst-news](https://oeffentlicher-dienst-news.de/so-nutzt-der-oeffentliche-dienst-kuenstliche-intelligenz-bund-laender/)
- Bürokratt 原始碼於 GitHub（23 專案，2023-07）— [EU OSS Report Estonia 2025](https://interoperable-europe.ec.europa.eu/sites/default/files/inline-files/OSS%20Country%20Intelligence%20Report%20Estonia%202025.pdf); [github.com/buerokratt](https://github.com/buerokratt/Buerokratt-onboarding)
- Jugalbandi 為開源平台 — [Thoughtworks](https://www.thoughtworks.com/clients/jugalbandi)
- LLMoin 可在全國重用（是否開源原始碼未明）— [Treffpunkt Kommune](https://www.treffpunkt-kommune.de/hamburger-ki-assistent-etabliert-sich-in-oeffentlicher-verwaltung/)

### Inferences
- 台灣可直接評估日本源内（MIT，含 RAG 與自架 LLM 範本）與 F13 作為參考實作或起點，授權最寬鬆者為 MIT。

### Gaps
- Bürokratt、i.AI（consult/minute/redbox）、alphagov/govuk-chat、etalab-ia albert-api、Jugalbandi、SEA-LION 的 SPDX 授權：本環境 GitHub API 回傳 403，未查證。VICA 與 Pair 未見開源證據。

---

## Q6. 共通教訓（narrow vs. broad、grounding、真人轉接、跨機關互通）

### Takeaway
成功案例都以「單一權威內容庫＋強制引用」做 grounding、從窄範圍或可控通路起步、持續自動＋人工評測；失敗或挫折多來自前台過早擴張（法國 Albert France Services）或高風險領域邊緣題（GOV.UK Chat 稅務）。平台優先（VICA、GENNAI、Albert API、GovAI）在 2025–26 成為主流，但對民眾端仍以試點逐步擴張。

### Cited Findings
- 窄起步/漸進：GOV.UK Chat 歷經 2023–24 試點、2026 公開試點、先 App 後網站 — [UKAuthority](https://www.ukauthority.com/articles/gov-uk-ai-chat-completes-public-pilot); [PublicTechnology 2026](https://www.publictechnology.net/2026/05/15/society-and-welfare/government-ai-chatbot-goes-live-across-gov-uk-app/)
- 過早擴張的挫折：Albert France Services 48 據點測試後不推廣，轉為 API 底座 — [Weka](https://www.weka.fr/actualite/administration/article/albert-l-outil-d-ia-generative-experimente-a-france-services-ne-sera-pas-generalise-209194/); [Acteurs Publics](https://acteurspublics.fr/articles/de-chatbot-experimental-a-socle-interministeriel-pour-lia-de-letat-le-parcours-dalbert-ia/)
- Grounding＋人工覆寫：VICA 允許以 FAQ override 生成輸出 — [GovTech VICA](https://www.tech.gov.sg/products-and-services/for-government-agencies/informational-services/vica/)；GOV.UK Chat 強制引用、避免虛構連結、部分答案 — [Inside GOV.UK](https://insidegovuk.blog.gov.uk/2026/05/15/developing-gov-uk-chat-our-data-science-and-ai-engineering-journey/)
- 過度信任風險：使用者因政府品牌而過度信任 — [PublicTechnology 2024](https://www.publictechnology.net/2024/01/23/uncategorized/were-not-moving-fast-and-breaking-things-chatgpt-powered-gov-uk-chatbot-trials-show-promise-but-uncover-issues-of-accuracy-and-reliability/)
- 跨機關互通：Bürokratt DMR 路由 — [GitHub](https://github.com/buerokratt/Buerokratt-onboarding)
- 資料分級：GovAI Chat 僅限 OFFICIAL 及以下 — [GovAI trials](https://www.govai.gov.au/govai-chat/trials)
- 主權/在地模型：法國 SecNumCloud＋Mistral、南韓要求 ≥50% 國產模型、日本規劃國產 LLM 試用 — [Solutions Numériques](https://www.solutions-numeriques.com/la-dinum-veut-faire-de-lia-et-du-cloud-souverain-les-piliers-du-numerique-public/); [The Register](https://www.theregister.com/public-sector/2026/07/15/south-korea-to-launch-universal-basic-ai-chatbot/5271566); [note.com](https://note.com/hirokimiyano/n/ne5eb28d0103b?hl=en-US)

### Inferences（給台灣公版 AI 客服的建議）
1. 平台層集中（模型閘道、RAG、評測、日誌、資安分級），應用層分權（各機關自管知識與 FAQ override）— VICA + Albert API 模式。
2. 預設以機關官網／法規等權威內容 grounding，強制引用、無把握時給部分答案並導向官方頁或轉真人。
3. 高風險領域（稅、社福資格、法律）設額外守門與真人轉接；明示「資訊非建議」。
4. 先挑 2–3 個高流量、低風險機關試點，建立 ground-truth 測試集與準確率門檻（GOV.UK 由 76%→90% 才上線）。
5. 考慮 Bürokratt 式跨機關轉介，解決「問錯機關」問題。
6. 模型可替換（Pair 換模型、GovAI 多模型），並保留國產/在地模型選項（台灣 TAIDE）。

### Gaps
- 真人轉接（human handoff）的具體實作數據（轉接率、SLA）在所有案例中均未找到公開資料。
- 各平台的成本（每對話或每機關費用）未找到。
