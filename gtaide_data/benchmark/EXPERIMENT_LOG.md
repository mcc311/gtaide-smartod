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

## Exp-002: (待執行)

**計畫改進**
- 改進 intent prompt 中的 subtype 區分規則
- 增強 organ 簡稱對應
- 增加 RAG 資料量（normalize 持續進行中）

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
