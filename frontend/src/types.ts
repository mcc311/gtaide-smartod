export type Direction = "上行文" | "平行文" | "下行文"

export type ReceiverType = "政府機關" | "人民" | "企業/公司" | "團體/協會" | "學校" | "公眾" | "自訂"

export interface OrganNode {
  name: string
  short_name?: string
  level?: number
  receiver_type?: string
  is_custom?: boolean      // true for "其他" entries
  parent_context?: string  // the parent organ name for context
  children: OrganNode[]
}

export type DocType = "函" | "書函" | "簽" | "便簽" | "公告" | "令" | "開會通知單"

export const SUBTYPE_OPTIONS: Record<string, string[]> = {
  "令": ["法規修正", "法規訂定", "法規廢止", "行政令", "人事令", "派任令"],
  "公告": ["預告法規", "證照公告", "疫區公告", "公示送達", "徵案補助", "命令解散", "一般公告"],
  "函": ["檢送文件", "復函", "轉函", "新案", "通知", "委辦", "密等變更", "陳情回函"],
  "書函": ["聯繫", "徵詢", "通報", "催辦"],
  "簽": ["政策建議", "人事簽", "經費簽", "法規研修", "出國簽", "一般簽"],
  "便簽": ["存查", "會辦", "副知", "一般便簽"],
  "開會通知單": ["委員會議", "工作會議", "審查會議", "一般會議"],
}

export type ActionType = "新案" | "復函" | "轉函" | "檢送文件" | "會議通知" | "公布法令" | "人事命令" | "報告"

export interface IntentResult {
  sender: string
  receiver: string
  receiver_type: ReceiverType
  is_internal: boolean
  action_type: ActionType
  purpose: string
  subject_brief: string
  reference_doc?: string
  attachments: string[]
  formality: string
  sender_level: number
  receiver_level: number
  sender_parent: string
  receiver_parent: string
  receiver_display_name: string  // actual name for non-gov receivers
  subtype: string
  confident?: boolean
  reasoning?: string
}

export interface PhraseResult {
  direction: Direction
  phrases: {
    稱謂: string
    自稱: string
    引敘語: string
    期望語: string
    附送語: string
    經辦語: string
  }
  subtype: string
  opening: string
  expectation: string
}

export interface GenerateRequest {
  intent: IntentResult
  subject_detail: string
  explanation_items: string[]
  action_items: string[]
  recipients_main: string[]
  recipients_cc: string[]
  doc_date: string
  doc_number: string
  speed: string
  attachments_text: string
  meeting_time?: string
  meeting_place?: string
  meeting_chair?: string
  meeting_contact?: string
  meeting_contact_phone?: string
  meeting_attendees?: string[]
  meeting_observers?: string[]
  meeting_notes?: string
}

export interface GenerateResponse {
  doc_type: DocType
  direction: Direction
  rendered: string
  phrases_used: Record<string, string>
  validation_warnings: string[]
}

export interface ParsedIntentResponse {
  sender: string
  receiver: string
  receiver_type: string
  action_type: ActionType
  doc_type: DocType
  purpose: string
  subject_brief: string
  reference_doc: string
  attachments: string[]
  formality: string
  receiver_display_name: string
  is_internal: boolean
  subtype: string
}

export interface GeneratedContentResponse {
  subject_detail: string
  explanation_items: string[]
  action_items: string[]
}
