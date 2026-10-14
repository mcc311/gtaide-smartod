# 台灣公部門 AI／數位服務生態地圖（建置「公版」公部門 AI 客服／代理平台用）

> 研究日期：2026-10-14。方法說明：本輪使用 WebSearch（約 16 次呼叫）。WebFetch 對 technews.tw、cw.com.tw、ctee.com.tw、moda.gov.tw 皆出現 DNS 解析失敗（getaddrinfo ENOTFOUND），所以多數內容只依據搜尋引擎摘要，沒有讀過全文。標註「（摘要）」的條目尚未以原文核對，撰寫報告時請保守引用。

## 1. 政策與法規：AI 基本法、生成式 AI 指引、資安法、個資法、AI 評測中心

### Takeaway
《人工智慧基本法》已於 2025-12-23 三讀，據報導在 2026-01-14 公布施行。主管機關是國科會，風險分類框架由數位部訂定，各機關須完成公務 AI 風險評估並建立內控規範。《資通安全管理法》修正已於 2025-09 公布，主管機關改為數位部，委外資安要求也提高。個資會組織法的完成狀態仍未確認。「行政院及所屬機關（構）使用生成式AI參考指引」仍是公務使用 AI 的基本規範：機密文書禁用，產出須由承辦人判斷。

### Cited Findings
**人工智慧基本法**
- 立法院於 2025-12-23 三讀通過人工智慧基本法 — [聯合報](https://udn.com/news/story/7238/9220471)；[聯合報 2](https://udn.com/news/story/7238/9223381)；[TechNews](https://technews.tw/2025/12/23/artificial-intelligence-basic-law/)；[iThome](https://www.ithome.com.tw/article/176840)
- 115 年（2026）1 月 14 日經總統公布施行，全文 20 條。這個日期目前只有一個學術來源（《當代法律》文章）支持，尚待以總統府公報或全國法規資料庫核對 — [copyrightnote.org](https://www.copyrightnote.org/paper/pa00173.doc)（摘要）
- 中央主管機關為國科會，地方主管機關為直轄市及縣市政府 — [聯合報](https://udn.com/news/story/7238/9220471)（摘要）
- 列出七項原則，包括人類自主、隱私保護與資料治理、資安與安全、透明與可解釋、公平與不歧視、問責等 — [數位時代](https://www.bnext.com.tw/article/85606/ai-basic-law-taiwan)（摘要）
- 授權數位發展部訂定 AI 風險分類框架，各目的事業主管機關據以訂定以風險為基礎的管理規範；行政院須成立「國家人工智慧戰略特別委員會」 — [iThome](https://www.ithome.com.tw/article/176840)；[TechNews](https://technews.tw/2025/12/23/artificial-intelligence-basic-law/)（摘要）
- 據報導，各級政府機關須於（2026 年）7 月前完成公務使用 AI 的風險評估，並於 1 年內建立 AI 內部控制與管理規範 — [iThome](https://www.ithome.com.tw/article/176840)（摘要，期限的條號未核實）
- 立法過程中也觸及「侵害生命、財產、破壞社會秩序之造假應依法限制或禁止」等條文方向 — [聯合報](https://udn.com/news/story/7238/9220471)

**行政院生成式 AI 參考指引**
- 2023-08-31 行政院通過「行政院及所屬機關（構）使用生成式AI參考指引」，共 10 點，國科會表示將滾動修正 — [行政院](https://www.ey.gov.tw/Page/448DE008087A1971/40c1a925-121d-4b6b-8f40-7e9e1a5401f2)；[iThome](https://www.ithome.com.tw/news/158533)；[1111新聞](https://www.1111.com.tw/news/jobns/152993)
- 主要規範有四點。一、機密文書應由承辦人親自撰寫，禁止使用生成式 AI。二、不得向生成式 AI 提供應保密的公務資訊，也不得詢問涉及機密或個資的問題；但「於確認系統環境安全性後，得依文書或資訊機密等級分級使用」。三、不得以未經確認的產出直接作成行政行為或公務決策的唯一依據。四、公營事業、公立學校、行政法人及政府捐助財團法人得準用（第 9 點） — [ycvs 轉載 PDF（檔名 1130103）](https://www.ycvs.tn.edu.tw/df_ufiles/sub1/1130103行政院及所屬機關（構）使用生成式%20AI%20參考指引.pdf)；[iThome](https://www.ithome.com.tw/news/164354)
- 有一份流傳 PDF 的檔名含「1130103」，可能是 113-01-03 的版本；修正差異無法確認 — 同上
- 2023-07 國科會曾公布九點草案 — [TechNews](https://technews.tw/2023/07/19/nstc-releases-draft-reference-guidelines-for-generative-ai/)

**資通安全管理法修正**
- 立法院於 2025-08-29 三讀資安法修正，總統於 2025-09-24 公布，施行日期由行政院另定；主管機關由行政院改為數位發展部 — [Newtalk](https://newtalk.tw/news/view/2025-08-29/990704)；[理慈 Lee and Li](https://www.leeandli.com/TW/NewslettersDetail/7505.htm)；[優分析](https://uanalyze.com.tw/articles/8088433846)
- 修正要點如下。資安署可稽核公務機關的資安維護計畫（含五院及地方政府等無上級監督機關）。資安專職人員須經適任性查核。「危害國家資通安全產品」限制提升到法律位階，由數位部訂定審查程序。受託者須建立資安管理機制或通過第三方驗證。特定非公務機關未通報資安事件，罰鍰上限提高到新台幣 1,000 萬元 — [鉅亨網](https://m.cnyes.com/news/id/6166189)；[公視](https://news.pts.org.tw/article/703377)
- 修正條文摘要中沒有看到專門規範 AI 的條款 — 同上

**個資法／個資會**
- 2023-05-16 立法院三讀個資法部分條文，明定「個人資料保護委員會」為主管機關（獨立機關） — [iThome](https://www.ithome.com.tw/news/156904)；[公視](https://news.pts.org.tw/article/632016)
- 依憲法法庭 111 年憲判字第 13 號，應建立獨立監督機制（期限 2025-08） — [籌備處簡報轉載](https://www.mlses.mlc.edu.tw/wp-content/uploads/sites/55/2026/03/簡報2.pdf)（摘要）
- 個資法修正於 114 年（2025）11 月 11 日總統公布，配合個資會職權的部分已修正；但當時個資會組織法仍在立法院審議 — 同上（摘要）
- 台北市研考會文件指出，若把 1999 通話錄音提供給 AI 模型應用與訓練，嚴格解釋下可能構成「特定目的外利用」，需援引個資法例外規定 — [台北市府文件](https://www-ws.gov.taipei/001/Upload/375/relfile/17156/124085/2029e9c0-fc41-4bba-8631-eaa11c9779b7.pdf)（摘要）

**數位部 AI 產品與系統評測中心（AI Evaluation Center）**
- 2023-12 啟動，規劃十項評測項目：安全性、可解釋性、彈性、公平性、準確性、透明性、當責性、可靠性、隱私、資安，以語言模型為首要評測對象 — [TechNews](https://technews.tw/2023/12/07/ai-product-and-system-evaluation-center-launch/)；[iThome](https://www.ithome.com.tw/article/162165)
- 架構參考 ISO/IEC TR 24028；2024 年起由認證的 AI 測試實驗室檢測並出具報告，再交由驗證機構審核 — [iThome](https://www.ithome.com.tw/article/162165)
- 試營運期間約 8 家廠商、80 多款模型送測；2025-10 首度公布語言模型基準評測結果，題目包含學測國文、社會等台灣脈絡題 — [iThome 鐵人賽個人筆記](https://ithelp.ithome.com.tw/articles/10407177)（非官方，可信度低）

### Inferences
- 公版平台應把「AI 基本法 → 數位部風險分類框架 → 機關 AI 風險評估與內控」的鏈條內建進交付物，例如風險評估範本、內控檢核表、AI 使用揭露文字。這樣各部會導入時能直接用來完成法定義務。
- 生成式 AI 指引「確認系統環境安全性後得分級使用」這一點，是公版平台採地端／政府雲部署（如國網中心、TAIDE）能處理個資問題的政策依據。
- 資安法修正提高了對受託者（承包廠商）的要求，並把「危害國家資安產品」限制法制化。公版參考架構應明列允許使用的元件，排除大陸廠牌，並要求介接廠商具備第三方驗證。
- 客服對話紀錄若用於模型訓練，可能有「目的外利用」問題（見台北 1999 案）。公版預設應把「服務使用」與「訓練使用」分開，並在民眾端做告知。

### Gaps
- AI 基本法全文條號、公布日 2026-01-14、「7 月前完成風險評估」等期限，都未以全國法規資料庫原文核實。
- 數位部 AI 風險分類框架在 2026 年是否已正式發布，目前查無資料。
- 生成式 AI 參考指引 2024–2026 是否有正式修正版，查無官方修正公告。
- 資安法修正的施行日期；資安責任等級（A/B/C/D）分級辦法是否隨之修正。
- 個資會組織法是否已三讀、個資會是否已正式成立（截至 2026-10）。
- AI 評測中心 2025–2026 的官方評測結果、是否已有 TAIDE 或政府用模型通過評測，以及評測是否成為採購門檻，都未取得官方資料（moda.gov.tw 無法直接抓取）。

## 2. 基礎設施：主權 AI／TAIDE、國網中心（NCHC）、TryAI、T-Road、MyData、TW FidO

### Takeaway
TAIDE 最新公開版本是 2025-08 的 Gemma-3-TAIDE-12B-Chat（前一版是 2025-02 的 Llama 3.1-TAIDE-LX-8B-Chat），但團隊表示受算力與授權資料限制，會放慢更新速度。數位部的「政府 AI 應用平台 TryAI」已於 2025-03-31 上線，提供 32 種模型（含 TAIDE）、20 項共通工具，有 30 多個機關使用，並以「AI Bots 市集＋先試用後採購（共同供應契約）」為導入路徑。這是公版平台最直接的對接或競合對象。T-Road 已有 40 多個 A 級機關導入，MyData 支援 TW FidO 驗證，可作為「需身分驗證的個人化客服」的資料管道。

### Cited Findings
**TAIDE／主權 AI**
- 2025-08，TAIDE 團隊發布 Gemma-3-TAIDE-12B-Chat 並上傳 Hugging Face。它以 Gemma-3-12b-pt 為基礎，做繁中持續預訓練與指令微調，主打摘要、寫信、中英互譯等辦公任務 — [TechNews](https://technews.tw/2025/08/27/gemma-3-taide-series-launched/)
- 2025-02 曾釋出 Llama 3.1-TAIDE-LX-8B-Chat — 同上
- 2024 年的 TAIDE-LX-7B 以 Llama 2 為基礎，使用取得授權的文本。國科會以約 2 億元推動 TAIDE，團隊結合國網中心、中研院與學界；早期使用台灣杉二號，後來採購 9 台 DGX H100 — [iThome](https://www.ithome.com.tw/news/168124)；[iThome](https://www.ithome.com.tw/article/168125)（摘要）
- 2025 年報導指出，因可用算力減少、繁中授權資料不易取得，未來將放慢模型更新、著重推廣應用；TAIDE 下載已超過 18 萬次，但「尚未看到實際應用案例」 — [iThome](https://www.ithome.com.tw/news/168121)；[CIO Taiwan](https://www.cio.com.tw/118521)（摘要）
- 國網中心未來 5 年負責擴建 AI 超級電腦，支援在地語言模型發展 — [TechNews](https://technews.tw/2025/02/07/nstc-20250206/)；[TechNews](https://technews.tw/?p=1340468)（摘要）
- Gemma 4 於 2026-03-31 推出，改用 Apache 2.0 授權（Gemma 3 是客製化授權）；目前沒有找到以 Gemma 4 為基礎的 TAIDE 版本 — [Google AI Dev Forum](https://discuss.ai.google.dev/t/gemma-4-launch-announcement/138069)；[Gemma releases](https://ai.google.dev/gemma/docs/releases?hl=zh-tw)
- Gemma 與 Llama 的非標準授權曾受批評，部分開發者認為商用有風險 — [TechNews](https://technews.tw/2025/05/13/google-gemma-passed-150-million-downloads/)

**數位部 TryAI 政府 AI 應用平台**
- 數位部建置 TryAI，針對機關導入 AI 的「不敢用、成本高、應用少」三大痛點。它首創「先試用後採購」，提供符合政府資安規範的專屬環境，供機關做 AI 測試、模型評估與應用開發 — [CIO Taiwan](https://www.cio.com.tw/102279/)；[moda（英）](https://moda.gov.tw/en/major-policies/ai/gov/19270)（摘要）
- 2025-03-31 上線，提供包含 TAIDE、Gemini、ChatGPT 等 32 種語言模型及 20 項共通性 AI 工具，有超過 30 個機關導入 — [CIO Taiwan](https://www.cio.com.tw/102279/)
- 「政府出題、產業解題」的 AI Bots 市集彙整公文助理、新聞稿生成等共通需求，請業者開發上架；機關可免費試用，確認符合需求後以共同供應契約採購 — [CIO Taiwan](https://www.cio.com.tw/102279/)；[moda press release](https://moda.gov.tw/en/press/press-releases/17952)（摘要）
- 衛福部利用平台自製「公版神隊友」，會議紀錄整理由 30–40 小時縮短到 6 小時 — [CIO Taiwan](https://www.cio.com.tw/102279/)
- 2025-07-22，人事總處與數位部成立「AI 公務人才發展辦公室」，分三級培訓：基層 AI 素養、資訊職系開發能力、中高階主管策略 — [旺得富／中時](https://wantrich.chinatimes.com/news/20250722900636-420501)；[iThome](https://www.ithome.com.tw/news/164423)

**T-Road／MyData／TW FidO**
- T-Road 是數位部以政府骨幹網路為基礎建置的跨機關資料傳輸通道。機關須先把服務集中到資料中心或建立專屬傳輸網段，並通過審核才能介接；傳輸以 GCA 憑證加密，加上數位簽章與時戳；管理平台只保存傳輸紀錄（以區塊鏈儲存），不保存內容 — [moda 文件](https://www-api.moda.gov.tw/File/Get/moda/zh-tw/zsWz3CaRmMjdIXb)；[iThome](https://www.ithome.com.tw/news/164497)（摘要）
- 已有財政部、勞動部、衛福部等超過 40 個資安 A 級機關導入 T-Road，提供超過 150 項資料介接；較早的數字是截至 111 年底 21 個機關 — [iThome](https://www.ithome.com.tw/news/164497)；[moda 文件](https://www-api.moda.gov.tw/File/Get/moda/zh-tw/e2hkR8NmPVtlfYz)（摘要）
- T-Road 管理規範資料集於 2025-10-29 上架 data.gov.tw — [data.gov.tw](https://data.gov.tw/dataset/175279)
- MyData 運作方式：民眾授權後，A 機關可取得 B 機關持有的資料，前提是 B 機關已把資料上架 MyData。身分驗證方式包括自然人憑證、臺灣行動身分識別、TW FidO、工商憑證 — [iThome](https://www.ithome.com.tw/news/140507)；[iThome](https://www.ithome.com.tw/news/127951)（摘要）

### Inferences
- 一年期程中，公版平台若直接與 TryAI 對齊（以 AI Bot 形式上架、走共同供應契約），較能進入機關採購流程；另起爐灶則可能與數位部政策重疊。建議定位為「TryAI 上的 AI 客服 Bot 參考實作＋給部會承包商的整合 SDK／規格」。
- TAIDE 的授權繼承上游（Llama／Gemma 的客製授權）。若公版要「讓廠商帶走商用」，需確認 TAIDE 模型授權條款，並保留可換模型的抽象層（例如換到 Apache 2.0 的 Gemma 4 系列或其他模型）。
- 涉及個人案件查詢的客服（例如「我的案件進度」），技術上可透過 MyData 加上 TW FidO 驗證取得資料。但 T-Road 介接門檻高（資料中心集中、A 級機關），第一年較適合先做非個人化 FAQ 及法規客服。

### Gaps
- TAIDE 官方授權（TAIDE L 類模型社群授權協議）的現行條款、是否允許政府委外廠商商用部署，未能從 taide.tw 或 Hugging Face 直接核實。
- 國網中心 TWCC／AI 推論 API（例如 NCHC 的 LLM 服務入口）對外部機關的收費與 SLA，以及 2026 年新超級電腦的上線進度，都查無資料。
- TryAI 的底層部署位置（政府雲、國網中心或公有雲）、資安等級、是否開放外部 API 給承包商，查無資料。
- 2026 年 TryAI 的最新機關數與模型數。
- MyData 及 TW FidO 2025–2026 的介接機關數、API 申請條件。
- 我的E政府／gov.tw 整合服務、數位身分（數位憑證皮夾）的 2026 年現況，本輪未查到。

## 3. 可介接的既有服務與資料

### Takeaway
可直接用來做 RAG 知識來源的公開資料包括：全國法規資料庫的法規 XML 下載（法務部，每月更新，政府資料開放授權第 1 版）、data.gov.tw 各機關 FAQ 與開放資料，以及各縣市 1999 FAQ。全國法規資料庫本輪只確認有「資料檔下載」，沒有確認有即時 API。

### Cited Findings
- data.gov.tw 上的「中文法規_法律資料檔下載」由法務部資訊處提供，格式為 ZIP 與 XML，每月更新，採政府資料開放授權條款第 1 版 — [data.gov.tw/dataset/14081](https://data.gov.tw/dataset/14081)；相關資料集 [14075](https://data.gov.tw/dataset/14075)
- 法務部的加值利用規範以非專屬授權方式，允許重製、改作、編輯等加值應用（文件為 102 年訂定、104 年修正，可能非最新版） — [東華大學轉載](https://announce.ndhu.edu.tw/message_1/1438656277/1040102915_Attach3.pdf)
- 地方政府也有以 OAS（OpenAPI）標準提供 API 文件的開放資料集，例如桃園 — [data.gov.tw/en/datasets/149414](https://data.gov.tw/en/datasets/149414)

### Inferences
- 一個可行的公版知識層組合是：法規 XML（全國法規資料庫）、機關 FAQ（data.gov.tw 或各機關網站）、1999 FAQ。這可複用 smartOD 公文生成已有的法規檢索能力。

### Gaps
- 全國法規資料庫是否提供正式 REST API；data.gov.tw 2025–2026 的資料集總數；台北、新北、台中 1999 FAQ 的開放資料集 ID；國發會首長信箱或民意信箱資料是否開放；1922 防疫專線現況；健保快易通、eTax、監理服務 API 是否開放介接。以上本輪都未查到。
- 機關使用 LINE 官方帳號的規模與規範（例如數位部是否有 LINE 官方帳號使用指引），未查。

## 4. 既有台灣政府聊天機器人／AI 客服案例與成效

### Takeaway
已有公開成效數據的案例以「話務員輔助」型為主，並非完全取代人工，包括台北 1999、桃園 1999 與勞動部。勞動部與中華電信合作，以 Azure OpenAI 做 24 小時線上 AI 客服。財政部、健保署、移民署的生成式 AI 客服本輪查無報導。

### Cited Findings
- **台北市 1999**：2025-12-29，市長蔣萬安在 1999 二十週年時表示，經 5 個月實證，AI 語音轉文字與語意分析準確度達 90% 以上，下一步推動「FAQ 結合 AI」即時輔助系統；資深話務員與資淺者的處理效率差異大，資淺者每通平均多約 20 秒 — [旺得富](https://wantrich.chinatimes.com/news/20251230900110-420501)；[工商時報](https://www.ctee.com.tw/news/20251229701009-431401)；[聯合報](https://udn.com/news/story/7324/9438527)（摘要；準確度為市府自述，未見獨立驗證）
- 2026-07 報導指出，台北 1999 導入 AI 語音轉文字與智慧輔助後，由「邊聽邊記」轉型為「AI 協作」，獲工商時報服務業大評鑑金獎 — [旺得富](https://wantrich.chinatimes.com/news/20260717900306-420101)
- **桃園市 1999**：2023 年下半年，研考會在話務人員問答知識庫導入 OpenAI 生成式 AI，平均通話時間約節省 20 秒 — [iThome](https://www.ithome.com.tw/news/160562)（摘要）
- **苗栗縣**：與群聯電子簽 MOU，第一波優化「1999」及「縣長信箱」，預計 3–6 個月上線，目標讓語音轉文字支援客語與閩南語；苗栗 1999 一年約 6 萬通，平均處理 10–15 分鐘；報導坦言初期「可能會卡卡」 — [CNA 中央社](https://www.cna.com.tw/postwrite/chi/378574)；[工商時報](https://ctee.com.tw/news/industry/896204.html)（摘要）
- **勞動部**：因民眾頻繁反映客服電話難以接通，與中華電信合作導入 AI 智慧客服，提供 24 小時線上提問；中華電信採用 Microsoft Azure OpenAI，自動產出常見問答與相似問句，縮短訓練流程 — [Newtalk 2025-07-02](https://newtalk.tw/news/view/2025-07-02/979424)；[CNA](https://www.cna.com.tw/postwrite/chi/375115)（摘要）
- **衛福部**：利用 TryAI 自製「公版神隊友」（會議紀錄，屬內部工具，不是對外客服） — [CIO Taiwan](https://www.cio.com.tw/102279/)
- 國立中興大學有 1999 相關 AI 研究合作新聞 — [中興大學](https://research.nchu.edu.tw/news-detail/id/3447)（內容未核）

### Inferences
- 台北與桃園的成效顯示，第一階段最有說服力的指標是「縮短平均處理時間、縮小資深與資淺話務員差距」的話務員輔助，而不是「對民眾全自動回答」。公版可提供兩種模式：坐席輔助（agent assist）及對外 Bot。
- 勞動部以公有雲 Azure OpenAI 實作，代表部會已接受在合規前提下使用國外雲端模型；公版宜支援多模型（TAIDE 地端、雲端模型）切換。

### Gaps
- 財政部 eTax、健保署、移民署、交通部監理服務、新北、台中的 AI 客服現況及成效數據，查無資料。
- 勞動部 AI 客服的具體量化成效（解決率、話務量降幅）未能讀到原文。
- 數位部自身的對外 AI 客服計畫，查無資料。

## 5. 採購：共同供應契約與部會委外模式

### Takeaway
共同供應契約由臺灣銀行採購部代辦，數位部（數位產業署）主導資訊類共約。數位部規劃讓民間 AI 產品經 TryAI 試用後上架共同供應契約，時程據 2025-11 報導為 2026 年 3–6 月。2026 年實際上架情形本輪未能確認。

### Cited Findings
- 臺灣銀行採購部依數位部函代理適用機關辦理資訊類共同供應契約（例：「115年度政府非同步軌道衛星通訊及維運服務案」，依數位部 114-11-07 函） — [moda 文件](https://www-api.moda.gov.tw/File/Get/moda/zh-tw/wiynlX0BHGiUlRq)（摘要）
- 預計 2026 年 3–6 月間，民間廠商可將 AI 產品上架共同供應契約 — [CIO Taiwan（2025-11）](https://www.cio.com.tw/102279/)
- 中華軟體公會表示配合數位部優化「政府資訊產品契約範本」，期待透過共同供應契約擴大引進國產 AI 解決方案 — [工商時報 2026-06](https://www.ctee.com.tw/news/20260612700797-431202)（摘要，全文無法讀取）
- 監察院調查指出，共同供應契約自民國 88 年施行以來，部分品項有高額利潤或高於市場行情的問題 — [監察院](https://cybsbox.cy.gov.tw/CYBSBoxSSL/edoc/download/1833)（摘要）
- 數位產業署曾快速發布 ZTA（零信任）導入的共同供應契約標案，是資安類先例 — [iThome 共同供應契約標籤](https://www.ithome.com.tw/tags/%E5%85%B1%E5%90%8C%E4%BE%9B%E6%87%89%E5%A5%91%E7%B4%84)（摘要）

### Inferences
- 公版要被「部會的承包廠商」拿去整合，最順的路徑是：公版提供開源參考實作、介面規格、評測集與資安檢核表；承包廠商以共同供應契約上的 AI 品項或部會自辦標案承接客製化；公版則成為採購規格書可引用的「參考架構」。
- 公版若附帶 AI 評測中心可用的評測題庫與報告格式，可降低部會的採購驗收風險。

### Gaps
- 2026 年「生成式 AI／AI Bots」共同供應契約是否已決標、品項與廠商名單，需查政府電子採購網（web.pcc.gov.tw）。
- 政府雲（含「政府雲端服務」共約，例如公有雲共約）2026 年現況未查。

## 6. 政府客服的已知痛點

### Takeaway
公開報導中最明確的痛點有四項：電話難以接通（勞動部導入 AI 的直接原因）、話務員經驗差異大、處理時間長（苗栗每通 10–15 分鐘）、通話錄音用於 AI 訓練的個資疑慮。至於「AI 客服答非所問」的系統性投訴資料，本輪未找到。

### Cited Findings
- 民眾頻繁反映勞動部客服電話難以接通 — [Newtalk](https://newtalk.tw/news/view/2025-07-02/979424)（摘要）
- 苗栗 1999 一年約 6 萬通，平均處理 10–15 分鐘 — [CNA](https://www.cna.com.tw/postwrite/chi/378574)（摘要）
- 台北 1999 資淺與資深話務員處理效率差距大 — [工商時報](https://www.ctee.com.tw/news/20251229701009-431401)（摘要）
- 1999 錄音用於 AI 訓練可能構成個資「特定目的外利用」 — [台北市府文件](https://www-ws.gov.taipei/001/Upload/375/relfile/17156/124085/2029e9c0-fc41-4bba-8631-eaa11c9779b7.pdf)（摘要）
- 機關導入 AI 的痛點是「不敢用、成本高、應用少」（數位部說法） — [CIO Taiwan](https://www.cio.com.tw/102279/)
- TAIDE 下載超過 18 萬次但尚未看到實際應用案例，顯示「模型可得」不等於「服務落地」 — [iThome](https://www.ithome.com.tw/news/168121)（摘要）

### Inferences
- 公版的價值主張可以直接對應這些痛點：「不敢用」對應合規包（指引、AI 基本法風險評估、資安法委外要求）；「成本高」對應共用模型與共用元件；「應用少」對應客服這種高頻、可量化的場景，以及坐席輔助模式。

### Gaps
- 立法院質詢、審計部報告、消費者團體對政府客服接通率或 AI 客服品質的調查，本輪未找到。
- 1999 濫用、騷擾來電比例的數據，未找到。
