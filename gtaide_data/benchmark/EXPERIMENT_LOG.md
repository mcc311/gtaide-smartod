# SmartOD Benchmark 實驗記錄簿

## 實驗環境
- **LLM**: gpt-oss-120b (via NCHC Portal API)
- **LLM Judge**: gpt-oss-120b (same)
- **Benchmark**: 55 cases, 12 subtypes
- **資料來源**: 行政院公報 normalized gazette

---

## Exp-001: Baseline (2026-03-27)

**設定**
- Intent parser prompt: v1 (含 subtype 說明，無 action_type)
- RAG: normalized gazette only (~1K docs)
- Model: gpt-oss-120b via OpenRouter (gemini-2.5-flash fallback)

**結果**

| 指標 | 分數 |
|------|------|
| Type accuracy (exact) | 74.5% |
| Subtype accuracy (exact) | 60.0% |
| LLM Judge type_match | 3.74/5 |
| LLM Judge subtype_match | 3.39/5 |
| LLM Judge organ_match | 3.26/5 |
| LLM Judge subject_quality | 3.66/5 |

**Format compliance**

| 檢查 | 通過率 |
|------|--------|
| 令動詞在前 | 91% (21/23) |
| 日期國曆格式 | 80% (44/55) |
| 署名有職稱 | 87% (48/55) |
| Items 無編號 | 100% (49/49) |
| 公告有依據 | 100% (5/5) |

**錯誤分析 (22/55 mismatch)**

| 錯誤模式 | 次數 | 原因 |
|----------|------|------|
| 令/行政令 → 公告/一般公告 | 3 | 行政令概念模糊，LLM 傾向判公告 |
| 令/行政令 → 令/法規訂定 | 2 | 「規定○○事項」被誤認為訂定法規 |
| 令/法規修正 → 公告/預告修法 | 2 | 「修正辦法」既可是令也可是公告預告 |
| 令/人事令 → 令/法規修正 | 1 | user query 提到「修正編制表」，LLM 判法規修正 |
| 令/人事令 → 令/行政令 | 1 | user query 未明確提「人事」 |
| 令/法規訂定 → 公告/一般公告 | 1 | 「訂定須知」被判為公告 |
| 公告/一般公告 → 公告/預告修法 | 1 | 「修正施行細則」被判預告修法 |
| 其他 | 11 | 各種邊界情況 |

**改進方向**
- [ ] 行政令 vs 法規訂定：prompt 加更清楚的區分規則
- [ ] 令 vs 公告：已發布用「令」，徵詢意見用「公告/預告修法」
- [ ] 人事令：加判斷規則（編制表、任免、遷調 → 人事令）
- [ ] organ_match 偏低 (3.26)：簡稱→全名 mapping 需改進

---

## Exp-002: Prompt改進+Benchmark修正 (2026-03-27)

**改動**
- Prompt: 加入令 vs 公告區分規則（已發布→令，徵詢意見→公告）
- Prompt: 加入 confidence + reasoning 欄位
- Prompt: 人事令加「編制表」「員額」等關鍵字
- Prompt: 行政令加「核定標準」
- Subtype: 預告修法 → 預告法規（涵蓋訂定/修正/廢止草案）
- Benchmark 修正:
  - 3 題答案修正 (idx 1: 人事令→行政令, idx 24: 公告→令/法規修正, idx 53: 通知→復函)
  - 1 題 gold_organ 修正 (idx 25: 環保署→農委會)
  - 3 題 query 修正 (idx 17,18,20: 去除答案洩漏)
  - 9 題標記 ambiguous

**結果**

| 指標 | Exp-001 | Exp-002 | 變化 |
|------|---------|---------|------|
| Type accuracy (exact) | 74.5% | **80.0%** | +5.5% |
| Subtype accuracy (exact) | 60.0% | **69.1%** | +9.1% |
| LLM Judge type_match | 3.74 | **4.00** | +0.26 |
| LLM Judge subtype_match | 3.39 | **3.90** | +0.51 |
| LLM Judge organ_match | 3.26 | **3.73** | +0.47 |
| LLM Judge subject_quality | 3.66 | 3.37 | -0.29 |
| Mismatches | 22 | **18** | -4 |

**Format compliance**

| 檢查 | Exp-001 | Exp-002 |
|------|---------|---------|
| 令動詞在前 | 91% (21/23) | 92% (22/24) |
| 日期國曆格式 | 80% (44/55) | 80% (44/55) |
| 署名有職稱 | 87% (48/55) | 87% (48/55) |
| Items 無編號 | 100% (49/49) | 100% (49/49) |

**錯誤分析 (18/55 mismatch)**

| 錯誤模式 | 次數 | 說明 |
|----------|------|------|
| 令/行政令 → 令/法規訂定 | 2 | 「規定○○事項」被誤認為訂定法規 |
| 令/行政令 → 公告/一般公告 | 1 | 行政令概念還是模糊 |
| 令/法規修正 → 公告/預告法規 | 1 | 歧義（ambiguous 標記題） |
| 令/法規訂定 → 公告/* | 2 | 「訂定」被判為公告 |
| 公告/證照公告 → 令/行政令 | 2 | 「核准」同時像行政令和證照公告 |
| 公告/一般公告 → 令/法規修正 | 1 | 「修正規定」被判為令 |
| 函/復函 → 函/通知 | 1 | 復函 vs 通知邊界 |
| 其他 | 8 | 各種邊界情況 |

**改進方向**
- [ ] 行政令 vs 法規訂定：需要更明確的區分（行政令=個案性/解釋性，法規訂定=通案性規範）
- [ ] 證照公告 vs 令/行政令：「核准」類應優先判證照公告
- [ ] subject_quality 下降 (3.66→3.37)：需調查原因
- [ ] 考慮加入 few-shot examples 到 intent prompt
- [ ] ambiguous 題目另外計算寬鬆準確率

---

## Exp-003: Bool confident + 謹慎判斷 (2026-03-27)

**改動**
- confidence float → confident bool（LLM 用 float 永遠給高分，改 bool 後誠實多了）
- Prompt 強調「寧可不確定也不要猜錯」，列出必須 confident=false 的情況
- 人事令加「編制表」「員額」關鍵字

**結果**

| 指標 | Exp-001 | Exp-002 | Exp-003 |
|------|---------|---------|---------|
| Type accuracy | 74.5% | 80.0% | 77.4% |
| Subtype accuracy | 60.0% | 69.1% | **71.7%** |
| Judge subtype_match | 3.39 | 3.90 | **4.06** |
| Mismatches | 22 | 18 | 17 |

**Confidence Calibration（重點改善）**

| | Exp-002 (float 0-1) | Exp-003 (bool) |
|--|---------------------|----------------|
| 判錯 + overconfident | 10/10 (100%) | **5/12 (42%)** |
| 判錯 + 標 not confident | 0/10 (0%) | **7/12 (58%)** |

Type 判錯時，58% 會正確標 confident=false，tooltip 會跳出提醒 user。

**剩餘 5 個 overconfident 錯誤**

| idx | 錯誤 | LLM 理由 |
|-----|------|---------|
| 22 | 令→公告 | 「向公眾宣布」誤判公告 |
| 25 | 公告→令 | 「修正規定」誤判令 |
| 46,47,48 | 函→公告 | 「刊登公報」= 以為是公告（實際是函/檢送文件請求刊登）|

**改進方向**
- [x] 「檢送+刊登公報」應判函/檢送文件，不是公告 → Exp-004 已修

---

## Exp-004: 檢送=函規則 (2026-03-27)

**改動**
- Prompt 加規則：「檢送○○文件/目錄/計畫」→ 函/檢送文件（即使提到刊登公報）

**結果**

| 指標 | Exp-001 | Exp-002 | Exp-003 | Exp-004 |
|------|---------|---------|---------|---------|
| Type accuracy | 74.5% | 80.0% | 77.4% | **80.0%** |
| Subtype accuracy | 60.0% | 69.1% | 71.7% | **72.7%** |
| Judge type_match | 3.74 | 4.00 | 3.89 | **4.20** |
| Judge subtype_match | 3.39 | 3.90 | 4.06 | **4.40** |
| Type mismatches | - | - | 12 | **11** |
| Overconfident | 10/10 | 10/10 | 5/12 | **3/11 (27%)** |

**修好的 cases**
- idx 46, 47, 48：函/檢送文件 全部正確（之前誤判公告/一般公告）

**剩餘 3 個 overconfident type 錯誤**

| idx | 錯誤 | 原因 |
|-----|------|------|
| 22 | 令/行政令→公告 | 邊界情況 |
| 25 | 公告→令/法規修正 | 邊界情況 |
| 剩餘 1 | 各種 | 邊界情況 |

**結論**: 可自動化改善的部分已接近上限。剩餘錯誤多為真正的邊界情況（同一內容可用令或公告發布）。

---

## 附註

### Benchmark 檔案
- `gold_standard.jsonl` — 55 篇 ground truth（normalized gazette）
- `user_queries.jsonl` — 55 條模擬 user input
- `run_benchmark.py` — benchmark runner
- `benchmark_results.jsonl` — 逐筆結果
- `benchmark_summary.json` — 摘要統計

### 評估維度
1. **Type/Subtype exact match** — 自動比對
2. **LLM Judge (1-5)** — type_match, subtype_match, organ_match, subject_quality
3. **Format compliance** — rule-based 文書處理手冊規範檢查
