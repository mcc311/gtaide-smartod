# SmartOD E2E V3 Evaluation Design

## 目標

評估 SmartOD 系統端到端的公文生成品質，包含：
- 格式判斷能力（type/subtype/organ）
- 追問能力（clarify 有沒有問到重點）
- 生成能力（最終公文是否涵蓋所有內容重點）

## 測試資料結構

每個 test case 包含：

```json
{
  "bench_idx": 0,
  "initial_query": "勞保局要公告一批已歇業的投保單位退保，但通知函送不到",
  "expected_type": "公告",
  "expected_subtype": "公示送達",
  "expected_organ": "勞動部勞工保險局",
  "key_points": [
    "提到逕行退保投保單位之通知函無法送達",
    "引用行政程序法第78條、第80條及第81條",
    "退保原因為歇業、解散或無營業事實",
    "公示送達刊登公報後經20日生效",
    "通知函正本由文書科保管"
  ],
  "difficulty": "easy"
}
```

- `initial_query`: 只包含 2-3 個 key points 的模糊 user 輸入
- `expected_*`: 格式指標 ground truth
- `key_points`: 只有內容面重點（公文裡必須寫到的事），不含格式/metadata

## Eval 流程

```
Step 1: initial_query → POST /parse-intent
        → 評量 A：格式指標（type/subtype/organ exact match）

Step 2: → POST /clarify → 取得選擇題
        → 評量 B：選擇題覆蓋率
           對每個 key point 判斷：
           - 有被某題的問題+選項涵蓋？ → 標記 "asked"
           - 沒有 → 標記 "not_asked"

Step 3: 模擬 user 回答（LLM 看到所有 key points）
        三種回答管道：
        P1: 選擇題有問到 + 選項有答案 → 選最接近的選項
        P2: 選擇題有問到 + 選項沒答案 → 用自由填寫欄補充
        P3: 選擇題沒問到 → 在額外補充欄寫入

Step 4: → POST /generate-with-answers
        → 評量 C：最終公文 key point 覆蓋率
           對每個 key point 判斷是否被最終公文涵蓋
```

## 評量指標

### A. 格式正確率
| 指標 | 計算方式 |
|------|---------|
| type_match | expected_type == sys_type |
| subtype_match | expected_subtype == sys_subtype |
| organ_match | expected_organ 在 sys_sender 中 |

### B. 選擇題覆蓋率
| 指標 | 意義 |
|------|------|
| question_coverage | key points 被問題+選項涵蓋的比例 |

### C. 內容覆蓋率（分路徑統計）
| 路徑 | 意義 |
|------|------|
| P1 | 系統問到 + 選項有答案 → 最終有涵蓋（最佳情況）|
| P2 | 系統問到 + 選項沒答案 → user 自由填寫 → 最終有涵蓋 |
| P3 | 系統沒問到 → user 額外補充 → 最終有涵蓋 |
| P_miss | 三種都試了還是沒涵蓋（生成能力不足）|

### 解讀
- **B 高** = 系統問對問題、選項設計好
- **P1 高** = 端到端最佳路徑暢通
- **P2 高** = 問題對了但選項要改進
- **P3 高** = clarify 需要問更多問題
- **P_miss 高** = LLM 生成能力不足

### 按難度分層
每個指標都按 easy/medium/hard 分開統計。

## 模擬 User 的 LLM Prompt

```
你是公文系統的使用者。你知道以下公文需要涵蓋的重點：
{key_points}

系統問了以下問題：
{questions with options}

請回答：
1. 對每個問題，如果選項中有答案就選；如果選項沒有就用自由填寫
2. 如果有重點完全沒被任何問題問到，請在「其他補充」欄位寫出來
3. 盡量把所有重點都傳達給系統
```
