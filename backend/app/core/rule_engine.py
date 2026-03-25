from app.models.schemas import Direction, ActionType
from app.core.organ_registry import get_organ


# ===== 對外行文用語表 (不同機關之間) =====
PHRASE_TABLE: dict[str, dict] = {
    "上行文": {
        "稱謂": "鈞{organ_short}",
        "自稱": "本{self_short}",
        "引敘語": "奉",
        "期望語": ["請鑒核", "請核示", "請鑒察", "請核備"],
        "附送語": ["檢陳", "附陳"],
        "經辦語": ["遵經", "遵即"],
    },
    "平行文": {
        "稱謂": "貴{organ_short}",
        "自稱": "本{self_short}",
        "引敘語": "准",
        "期望語": ["請查照", "請察照", "請查照辦理", "請辦理惠復"],
        "附送語": ["檢送", "附送"],
        "經辦語": ["業經", "經已"],
    },
    "下行文": {
        "稱謂": "貴{organ_short}",
        "自稱": "本{self_short}",
        "引敘語": "據",
        "期望語": ["請照辦", "希照辦", "請辦理見復", "希辦理見復"],
        "附送語": ["檢發", "附發"],
        "經辦語": ["業經", "經已"],
    },
}

# ===== 內部行文用語表 (同機關內部) =====
# 內部用簽/便簽，用語與對外行文不同
INTERNAL_PHRASE_TABLE: dict[str, dict] = {
    "上行文": {
        # 對長官：不用「鈞部」，用「鈞長」或直接寫單位
        "稱謂": "",
        "自稱": "本{self_short}",
        "引敘語": "奉",
        "期望語": ["請核示", "請鑒核", "陳請核示", "敬請核示", "請鑒察"],
        "附送語": ["檢陳", "附陳"],
        "經辦語": ["遵經", "遵即"],
    },
    "平行文": {
        # 同機關平級單位
        "稱謂": "{organ_short}",
        "自稱": "本{self_short}",
        "引敘語": "",
        "期望語": ["請查照", "請配合辦理", "請惠予協助"],
        "附送語": ["檢送", "檢附"],
        "經辦語": ["業經", "經已"],
    },
    "下行文": {
        "稱謂": "{organ_short}",
        "自稱": "本{self_short}",
        "引敘語": "",
        "期望語": ["請照辦", "請依限辦理", "請辦理見復"],
        "附送語": ["檢送", "檢附"],
        "經辦語": ["業經", "經已"],
    },
}


OPENING_PHRASES: dict[str, str] = {
    "新案": "有關",
    "復函": "復",
    "轉函": "函轉",
    "檢送文件": "檢送",
    "報告": "謹報",
    "會議通知": "茲訂於",
    "公布法令": "茲",
    "人事命令": "茲派",
}

# Action types that imply needing a reply
_NEED_REPLY_ACTIONS = {
    ActionType.REPLY,
    ActionType.NEW_CASE,
}


def select_opening(action_type: ActionType) -> str:
    """Select the opening phrase based on action type."""
    return OPENING_PHRASES.get(action_type.value, "有關")


def select_expectation(
    direction: Direction,
    action_type: ActionType,
    is_internal: bool = False,
) -> str:
    """Pick the most appropriate expectation phrase."""
    table = INTERNAL_PHRASE_TABLE if is_internal else PHRASE_TABLE
    options = table[direction.value]["期望語"]

    if direction == Direction.UPWARD:
        if action_type == ActionType.SEND_DOCS:
            return "請鑒核" if not is_internal else "請核示"
        elif action_type == ActionType.REPORT:
            return "請鑒察"
        else:
            return options[0]  # 請核示

    elif direction == Direction.PARALLEL:
        if action_type == ActionType.SEND_DOCS:
            return "請查照"
        elif action_type in _NEED_REPLY_ACTIONS:
            return "請辦理惠復" if not is_internal else "請配合辦理"
        else:
            return options[0]  # 請查照

    else:  # DOWNWARD
        if action_type in _NEED_REPLY_ACTIONS:
            return "請辦理見復"
        else:
            return options[0]  # 請照辦


def select_phrases(
    direction: Direction,
    sender: str,
    receiver: str,
    action_type: ActionType,
    receiver_type: str = "政府機關",
    is_internal: bool = False,
) -> dict:
    """Return all selected phrases with organ names filled in."""
    table = INTERNAL_PHRASE_TABLE if is_internal else PHRASE_TABLE
    dir_table = table[direction.value]

    sender_organ = get_organ(sender)
    self_short = sender_organ.short_name if sender_organ else "機關"

    # Determine 稱謂
    if receiver_type == "人民":
        honorific = "台端"
    elif receiver_type == "企業/公司":
        honorific = "貴公司"
    elif receiver_type == "團體/協會":
        honorific = "貴會"
    elif receiver_type == "學校":
        honorific = "貴校"
    elif receiver_type == "公眾":
        honorific = ""
    elif is_internal:
        # Internal: no 鈞/貴 prefix, just the unit name or empty
        receiver_organ = get_organ(receiver)
        organ_short = receiver_organ.short_name if receiver_organ else ""
        tpl = dir_table["稱謂"]
        honorific = tpl.format(organ_short=organ_short) if "{organ_short}" in tpl else tpl
    else:
        # External government organ
        receiver_organ = get_organ(receiver)
        organ_short = receiver_organ.short_name if receiver_organ else "機關"
        honorific = dir_table["稱謂"].format(organ_short=organ_short)

    result = {
        "稱謂": honorific,
        "自稱": dir_table["自稱"].format(self_short=self_short),
        "引敘語": dir_table["引敘語"],
        "期望語": select_expectation(direction, action_type, is_internal),
        "附送語": dir_table["附送語"][0],
        "經辦語": dir_table["經辦語"][0],
        "開頭語": select_opening(action_type),
        "行文性質": "內部行文" if is_internal else "對外行文",
    }

    return result
