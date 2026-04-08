# GTAIDE SmartOD — 智慧公文生成系統

## 系統概覽

SmartOD 是一套 AI 驅動的台灣政府公文生成系統，結合規則引擎、RAG 檢索、法規 Skill、LLM 生成與模板渲染，協助公務人員快速撰寫符合《文書處理手冊》規範的公文。

**支援 7 種公文類型**：函、令、公告、簽、便簽、書函、開會通知單，涵蓋 40+ 種子類型。

---

## 系統架構

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  React + TypeScript + shadcn + Tailwind                      │
│  Desktop sidebar layout, 6-step wizard                       │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API
┌──────────────────────┴──────────────────────────────────────┐
│                        Backend                               │
│  FastAPI + Jinja2 Templates                                  │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │ Intent   │ │ RAG      │ │ Law      │ │ Rule Engine    │ │
│  │ Parser   │ │ Search   │ │ Skill    │ │ (phrases/      │ │
│  │ (LLM)    │ │ (BM25 +  │ │ (11,752  │ │  direction)    │ │
│  │          │ │ Embedding)│ │  laws)   │ │                │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ Clarifier│ │ Content  │ │ Template │                    │
│  │ (LLM +   │ │ Generator│ │ Renderer │                    │
│  │  Q&A)    │ │ (LLM +   │ │ (Jinja2) │                    │
│  │          │ │ tools)   │ │          │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### 技術棧

| 層級 | 技術 |
|------|------|
| Frontend | React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS |
| Backend | FastAPI, Python 3.13, Jinja2, jieba |
| LLM | gpt-oss-120b (NCHC Portal API), Gemini 2.5 Flash (OpenRouter) |
| RAG | BM25 (rank_bm25) + Embedding (qwen3-embedding-8b, ft-embeddinggemma-300m) + RRF fusion |
| 法規 | 全國法規資料庫 (law.moj.gov.tw), 11,752 部法規 |
| 資料 | 行政院公報 119K + NCHC 內部公文 76K = 231K 篇 |
| 部署 | TWCC VPS (203.145.215.19), nginx + uvicorn |

> **注意：** `torch` 需另行安裝，請依 CUDA 版本參考 https://pytorch.org 選擇對應版本。

---

## 6 步驟流程

```
Step 1: AI 分析
  使用者輸入自然語言描述 → LLM 解析意圖
  產出：sender, receiver, doc_type, subtype, subject_brief
  特色：confidence 判斷，不確定時 tooltip 提示

Step 2: 確認意圖
  使用者確認/修改：發文機關、受文機關、公文類型
  特色：階層式機關選擇器 (245+ 機關)
        階層式公文類型選擇器 (7 類 × 40+ 子類型)
        自動選用公文用語（稱謂、引敘語、期望語等）
        行文方向自動判斷（上行/下行/平行）

Step 3: 法規引用
  AI 預選相關法規 → 使用者搜尋/瀏覽法規分類
  特色：三層法規分類瀏覽器（憲法/行政/司法/... → 部會 → 目別）
        搜尋結果自動導航到分類位置
        條文層級勾選（dialog 展開全部條文）
        選取的法規條號傳遞到後續生成步驟

Step 4: 補充資訊
  LLM 根據意圖 + 法規 + RAG 範例生成追問
  使用者回答選擇題或自由補充
  特色：最多 4 題選擇題，每題 2-4 選項
        自由補充欄位

Step 5: 編輯內容
  LLM 生成主旨、說明、辦法 → 使用者編輯
  特色：Law tool calling（自動查法規、引用條文、驗證引用）
        法規引用顯示（AI 引用了哪些法條）
        主旨字數提示

Step 6: 預覽輸出
  Jinja2 模板渲染完整公文
  特色：7 種模板 × 子類型變體
        文書處理手冊規範（三段式、分項標號、法律統一用字）
        複製到剪貼簿
```

---

## 資料蒐集與處理

### 資料來源

| 來源 | 原始筆數 | 結構化筆數 | 內容 |
|------|---------|-----------|------|
| 行政院公報 (gazette.nat.gov.tw) | 123,765 | 115,190 (96.4%) | 令、公告為主 |
| NCHC 內部公文 | 76,093 | 75,062 (98.6%) | 函、簽、便簽為主 |
| **合計** | **199,858** | **231,688** | **7 種公文類型** |

### 結構化 Normalize 流程

```
原始公報文本 → gpt-oss-120b (NCHC Portal API) → 結構化 JSON
```

- 使用 3 組 API key 並行處理，concurrency=10
- Streaming write + resume 支援中斷續跑
- 成功率 ~95%，empty response 自動重試 (MAX_RETRIES=5)
- Subtype 批次修正（預告修法→預告法規、去前綴等）

### 統一 Schema

```json
{
  "id": "", "source": "gazette|nchc",
  "doc_type": "", "subtype": "",
  "organ": "", "receiver": "",
  "date": "", "doc_number": "",
  "subject": "",
  "basis": "",
  "items": "[]",
  "action_items": "[]",
  "signer": "",
  "direction": "",
  "attachment_type": "",
  "source_category": ""
}
```

資料集已上傳 HuggingFace：https://huggingface.co/datasets/mcc311/smartod-data

### 法規資料

- 來源：全國法規資料庫 (law.moj.gov.tw)
- 法律 1,343 部 + 命令 10,409 部 = **11,752 部法規**
- In-memory 載入，支援分類瀏覽 + 關鍵字搜尋 + 條文查詢
- Law Skill：category-aware search，中文數字條號支援

---

## Benchmark & Evaluation

### 評估項目總覽

| 項目 | 規模 | 結果 |
|------|------|------|
| Intent 分類 | 55 cases, 4 輪實驗 | Type **80%**, Subtype **72.7%** |
| Confidence 校準 | 55 cases | 判錯時 **73%** 正確標 not confident |
| 法規搜尋 | 100 真實引用 | search **98%**, verify **99%** |
| RAG 搜尋 | 182 queries | Type P@1 **100%**, Subtype P@1 **94%** |
| 模板還原 | 700 docs | **96.7%** |
| E2E key points | 100 cases | 已標註，待執行 |

### Intent Parser 實驗歷程

| 實驗 | 改動 | Type | Subtype | Overconfident |
|------|------|------|---------|---------------|
| Exp-001 | Baseline | 74.5% | 60.0% | 100% |
| Exp-002 | 令vs公告規則 + benchmark修正 | 80.0% | 69.1% | 100% |
| Exp-003 | Bool confident + 謹慎判斷 | 77.4% | 71.7% | 42% |
| Exp-004 | 檢送=函規則 | **80.0%** | **72.7%** | **27%** |

### Law Search 評估

從真實公文引用中提取 100 個法規引用測試：

| Tool | 通過率 |
|------|--------|
| search_law P@5 | 98% |
| get_article | 89% |
| verify_citation | 99% |

關鍵改進：中文數字條號支援（第五十一條→51）、完全匹配優先、category prefix 搜尋

### RAG 搜尋評估

182 個 queries（stratified by subtype），用 normalized subject 當 query：

| 搜尋模式 | 指標 |
|----------|------|
| Type filter | P@1 **100%** |
| Subtype filter | P@1 **94%**, P@3 **97%** |

### 模板還原評估

700 docs（100 per doc_type），從 normalized data 餵入 template 渲染：

| doc_type | OK率 |
|----------|------|
| 函 | 100% |
| 公告 | 100% |
| 簽 | 100% |
| 書函 | 100% |
| 開會通知單 | 100% |
| 便簽 | 98% |
| 令 | 79% |
| **平均** | **96.7%** |

### E2E V3 Benchmark 設計

100 個 test cases，每個包含：
- **格式指標**：expected type/subtype/organ（自動比對）
- **內容 key points**：4-6 個公文內文必須涵蓋的重點（LLM judge）
- **Initial query**：模糊的使用者輸入（只含 2-3 個 key points）
- **Difficulty**：easy (38) / medium (38) / hard (24)

評量路徑：
- **P1**：系統問到 + 選項有答案 → 最終有涵蓋
- **P2**：系統問到 + 選項沒答案 → user 自由填寫 → 最終有涵蓋
- **P3**：系統沒問到 → user 額外補充 → 最終有涵蓋

---

## 關鍵技術特色

### 1. Confidence 機制
Intent parser 回傳 `confident: bool`，不確定時前端顯示 tooltip 提示使用者確認。從 Exp-001 的 100% overconfident 改善到 Exp-004 的 27%。

### 2. Law Skill (Progressive Disclosure)
參考 Anthropic Agent Skills 設計：
- SKILL.md：搜尋流程 + 常用部會法規大綱
- CATEGORIES.txt：完整分類樹（按需載入）
- 3 個 tools：search_law (category-aware)、get_article、verify_citation
- LLM 在生成公文時自動 tool calling 查法規、引用條文

### 3. 結構化 RAG
- 從 raw text 改為結構化搜尋（subject boost + items + basis）
- Type/subtype filter with graceful degradation
- 231K 篇結構化公文作為 RAG 語料庫

### 4. Rule-based 法規引用 + LLM 引述
- Step 3 使用者選法規條號 → rule-based 組成依據段
- LLM 如需引述條文內容 → 自動 tool calling get_article
- 只傳法規名+條號（~100 tokens），不塞完整條文

---

## 部署

| 環境 | 說明 |
|------|------|
| 開發 | macOS, localhost:8000 (backend) + localhost:5173 (frontend) |
| VPS | TWCC 203.145.215.19, nginx + uvicorn, basic auth |
| HPC | NCHC Nano5 (H100), NYCU DGX (H100/H200) — 用於 normalize |
| 資料 | HuggingFace: mcc311/smartod-data |
| 程式碼 | GitHub: mcc311/gtaide-smartod |
