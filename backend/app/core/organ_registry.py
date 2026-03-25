from dataclasses import dataclass, field
from app.models.schemas import Direction


@dataclass
class OrganInfo:
    name: str
    short_name: str
    level: int
    parent: str = ""
    chain: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "short_name": self.short_name,
            "level": self.level,
            "parent": self.parent,
            "chain": self.chain,
        }


def _build_registry() -> dict[str, OrganInfo]:
    """Build the full organ registry."""
    registry: dict[str, OrganInfo] = {}

    def add(name: str, short: str, level: int, parent: str = ""):
        chain = []
        if parent and parent in registry:
            chain = registry[parent].chain + [parent]
        registry[name] = OrganInfo(
            name=name, short_name=short, level=level, parent=parent, chain=chain
        )

    # ===== Level 1: 五院 + 總統府 =====
    add("總統府", "府", 1)
    add("行政院", "院", 1)
    add("立法院", "院", 1)
    add("司法院", "院", 1)
    add("考試院", "院", 1)
    add("監察院", "院", 1)

    # ===== Level 2: 行政院所屬部會 =====
    l2_under_ey = [
        ("經濟部", "部"),
        ("教育部", "部"),
        ("勞動部", "部"),
        ("衛生福利部", "部"),
        ("內政部", "部"),
        ("外交部", "部"),
        ("國防部", "部"),
        ("財政部", "部"),
        ("法務部", "部"),
        ("交通部", "部"),
        ("文化部", "部"),
        ("農業部", "部"),
        ("環境部", "部"),
        ("數位發展部", "部"),
        ("國家科學及技術委員會", "會"),
        ("人事行政總處", "總處"),
        ("主計總處", "總處"),
        ("國家發展委員會", "會"),
        ("金融監督管理委員會", "會"),
        ("公平交易委員會", "會"),
        ("中央選舉委員會", "會"),
        ("海洋委員會", "會"),
        ("原子能委員會", "會"),
        ("客家委員會", "會"),
        ("原住民族委員會", "會"),
        ("僑務委員會", "會"),
        ("國軍退除役官兵輔導委員會", "會"),
        ("國家通訊傳播委員會", "會"),
        ("大陸委員會", "會"),
        ("國家運輸安全調查委員會", "會"),
        ("促進轉型正義委員會", "會"),
        ("不當黨產處理委員會", "會"),
        ("故宮博物院", "院"),
        ("中央研究院", "院"),
        ("中央銀行", "行"),
    ]
    for name, short in l2_under_ey:
        add(name, short, 2, "行政院")

    # Common short-name aliases
    _aliases = {
        "國科會": "國家科學及技術委員會",
        "衛福部": "衛生福利部",
        "數發部": "數位發展部",
        "國發會": "國家發展委員會",
        "金管會": "金融監督管理委員會",
        "公平會": "公平交易委員會",
        "中選會": "中央選舉委員會",
        "海委會": "海洋委員會",
        "原能會": "原子能委員會",
        "客委會": "客家委員會",
        "原民會": "原住民族委員會",
        "僑委會": "僑務委員會",
        "退輔會": "國軍退除役官兵輔導委員會",
        "NCC": "國家通訊傳播委員會",
        "陸委會": "大陸委員會",
        "運安會": "國家運輸安全調查委員會",
        "故宮": "故宮博物院",
        "央行": "中央銀行",
        "中研院": "中央研究院",
    }

    # ===== Level 2: 立法院、司法院、考試院、監察院 所屬 =====
    add("司法院秘書長", "秘書長", 2, "司法院")
    add("考選部", "部", 2, "考試院")
    add("銓敘部", "部", 2, "考試院")
    add("審計部", "部", 2, "監察院")

    # ===== Level 3: 各署/局 under 部會 =====
    l3_organs = [
        # 經濟部
        ("智慧財產局", "局", "經濟部"),
        ("標準檢驗局", "局", "經濟部"),
        ("工業局", "局", "經濟部"),
        ("商業發展署", "署", "經濟部"),
        ("國際貿易署", "署", "經濟部"),
        ("中小及新創企業署", "署", "經濟部"),
        ("能源署", "署", "經濟部"),
        ("水利署", "署", "經濟部"),
        ("地質調查及礦業管理中心", "中心", "經濟部"),
        # 財政部
        ("國稅局", "局", "財政部"),
        ("關務署", "署", "財政部"),
        ("財政資訊中心", "中心", "財政部"),
        ("國有財產署", "署", "財政部"),
        ("賦稅署", "署", "財政部"),
        # 交通部
        ("公路局", "局", "交通部"),
        ("鐵道局", "局", "交通部"),
        ("航港局", "局", "交通部"),
        ("民用航空局", "局", "交通部"),
        ("中央氣象署", "署", "交通部"),
        ("觀光署", "署", "交通部"),
        ("運輸研究所", "所", "交通部"),
        # 內政部
        ("營建署", "署", "內政部"),
        ("移民署", "署", "內政部"),
        ("消防署", "署", "內政部"),
        ("警政署", "署", "內政部"),
        ("國土管理署", "署", "內政部"),
        ("戶政司", "司", "內政部"),
        # 教育部
        ("體育署", "署", "教育部"),
        ("國民及學前教育署", "署", "教育部"),
        ("青年發展署", "署", "教育部"),
        # 衛生福利部
        ("疾病管制署", "署", "衛生福利部"),
        ("食品藥物管理署", "署", "衛生福利部"),
        ("中央健康保險署", "署", "衛生福利部"),
        ("國民健康署", "署", "衛生福利部"),
        ("社會及家庭署", "署", "衛生福利部"),
        # 法務部
        ("調查局", "局", "法務部"),
        ("矯正署", "署", "法務部"),
        ("行政執行署", "署", "法務部"),
        # 勞動部
        ("勞動力發展署", "署", "勞動部"),
        ("職業安全衛生署", "署", "勞動部"),
        ("勞工保險局", "局", "勞動部"),
        # 農業部
        ("農糧署", "署", "農業部"),
        ("漁業署", "署", "農業部"),
        ("動植物防疫檢疫署", "署", "農業部"),
        ("林業及自然保育署", "署", "農業部"),
        ("農田水利署", "署", "農業部"),
        # 環境部
        ("環境管理署", "署", "環境部"),
        ("化學物質管理署", "署", "環境部"),
        ("氣候變遷署", "署", "環境部"),
        ("資源循環署", "署", "環境部"),
        # 國防部
        ("國防部軍備局", "局", "國防部"),
        ("國防部軍醫局", "局", "國防部"),
        # 海洋委員會
        ("海巡署", "署", "海洋委員會"),
        ("海洋保育署", "署", "海洋委員會"),
    ]
    for name, short, parent in l3_organs:
        add(name, short, 3, parent)

    # ===== Level 2: 直轄市政府 =====
    cities = [
        ("臺北市政府", "府", "臺北市"),
        ("新北市政府", "府", "新北市"),
        ("桃園市政府", "府", "桃園市"),
        ("臺中市政府", "府", "臺中市"),
        ("臺南市政府", "府", "臺南市"),
        ("高雄市政府", "府", "高雄市"),
    ]
    for name, short, _ in cities:
        add(name, short, 2, "行政院")

    # City aliases
    _aliases.update(
        {
            "台北市政府": "臺北市政府",
            "台中市政府": "臺中市政府",
            "台南市政府": "臺南市政府",
        }
    )

    # ===== Level 3: 直轄市局處 =====
    city_bureaus = [
        "教育局",
        "衛生局",
        "環保局",
        "都市發展局",
        "社會局",
        "民政局",
        "財政局",
        "交通局",
        "工務局",
        "地政局",
        "勞動局",
        "法制局",
        "消防局",
        "警察局",
        "文化局",
        "觀光傳播局",
        "產業發展局",
        "資訊局",
        "秘書處",
        "人事處",
        "主計處",
        "政風處",
        "研考會",
    ]
    for city_name, _, city_prefix in cities:
        for bureau in city_bureaus:
            full = f"{city_prefix}{bureau}"
            short = bureau.replace("局", "局").replace("處", "處")  # keep as-is
            add(full, short, 3, city_name)

    # ===== Level 4: Sample sub-units (科/中心/所) =====
    l4_samples = [
        ("臺北市教育局國小教育科", "科", "臺北市教育局"),
        ("臺北市衛生局疾病管制科", "科", "臺北市衛生局"),
    ]
    for name, short, parent in l4_samples:
        add(name, short, 4, parent)

    return registry, _aliases


_REGISTRY, _ALIASES = _build_registry()


def _resolve_alias(name: str) -> str:
    """Resolve common aliases/abbreviations to full name."""
    if name in _REGISTRY:
        return name
    if name in _ALIASES:
        return _ALIASES[name]
    return name


def get_organ(name: str) -> OrganInfo | None:
    """Look up an organ by name, with fuzzy matching."""
    resolved = _resolve_alias(name)

    # Exact match
    if resolved in _REGISTRY:
        return _REGISTRY[resolved]

    # Substring match
    # Priority 1: registry key is contained in query (e.g., query="經濟部商業發展署" matches "商業發展署")
    # Pick the longest match = most specific
    contained_in_query = []
    for key, organ in _REGISTRY.items():
        if key in name:
            contained_in_query.append(organ)

    if contained_in_query:
        contained_in_query.sort(key=lambda o: len(o.name), reverse=True)
        return contained_in_query[0]

    # Priority 2: query is contained in a registry key (e.g., query="商業" matches "商業發展署")
    query_in_key = []
    for key, organ in _REGISTRY.items():
        if name in key:
            query_in_key.append(organ)

    if query_in_key:
        query_in_key.sort(key=lambda o: len(o.name))
        return query_in_key[0]

    return None


def get_all_organ_names() -> list[str]:
    """Return all organ names for autocomplete."""
    names = list(_REGISTRY.keys())
    names.sort()
    return names


def is_same_chain(sender_name: str, receiver_name: str) -> bool:
    """Check if two organs are in the same hierarchy chain."""
    sender = get_organ(sender_name)
    receiver = get_organ(receiver_name)
    if not sender or not receiver:
        return False

    # One is ancestor of the other
    if sender.name in receiver.chain:
        return True
    if receiver.name in sender.chain:
        return True
    # Same organ
    if sender.name == receiver.name:
        return True

    return False


def is_internal(sender_name: str, receiver_name: str,
                 sender_parent: str = "", receiver_parent: str = "") -> bool:
    """Check if sender and receiver belong to the same top-level organ.

    '內部' means they share the same ministry/department/city government.
    e.g., 經濟部 ↔ 智慧財產局 = internal (both under 經濟部)
         經濟部 ↔ 教育部 = NOT internal (different ministries)
         臺北市教育局 ↔ 臺北市衛生局 = internal (both under 臺北市政府)

    For custom organs, sender_parent/receiver_parent can supply the parent context.
    """
    sender = get_organ(sender_name)
    receiver = get_organ(receiver_name)

    def _top_organ(organ: OrganInfo | None, parent_hint: str = "") -> str:
        """Find the level-2 ancestor (部/會/市府), or itself if level <= 2."""
        if organ is None:
            # For custom organs, use the parent hint
            if parent_hint:
                parent_organ = get_organ(parent_hint)
                if parent_organ:
                    return _top_organ(parent_organ)
            return ""
        if organ.level <= 2:
            return organ.name
        # Walk the chain to find the level-2 ancestor
        for ancestor_name in organ.chain:
            ancestor = _REGISTRY.get(ancestor_name)
            if ancestor and ancestor.level == 2:
                return ancestor.name
        # Fallback: direct parent
        return organ.parent or organ.name

    sender_top = _top_organ(sender, sender_parent)
    receiver_top = _top_organ(receiver, receiver_parent)

    if not sender_top or not receiver_top:
        return False

    return sender_top == receiver_top


def get_direction(sender_name: str, receiver_name: str, receiver_type: str = "政府機關",
                   sender_level: int = 0, receiver_level: int = 0) -> Direction:
    """Determine document direction based on organ hierarchy.

    Rules:
    - Non-government receivers (人民, 企業/公司, 團體/協會, 學校, 公眾) are always DOWNWARD
    - Within same chain: direct superior/subordinate relationship matters
    - Different chains: ALWAYS parallel regardless of level

    sender_level/receiver_level can be passed when the organ isn't in the registry
    (custom organs). 0 means auto-detect from registry.
    """
    # If receiver is not a government organ, it's always downward
    if receiver_type in ("人民", "企業/公司", "團體/協會", "學校", "公眾"):
        return Direction.DOWNWARD

    sender = get_organ(sender_name)
    receiver = get_organ(receiver_name)

    # Build temporary OrganInfo for custom organs if level is provided
    s_level = sender.level if sender else sender_level
    r_level = receiver.level if receiver else receiver_level

    if not sender and not receiver:
        # Both unknown: use provided levels if available
        if s_level and r_level:
            if s_level < r_level:
                return Direction.DOWNWARD
            elif s_level > r_level:
                return Direction.UPWARD
        return Direction.PARALLEL

    if not sender or not receiver:
        # One unknown: use provided level for comparison if in same chain
        if s_level and r_level and s_level != r_level:
            # Can only compare levels if they share a chain; default to parallel
            pass
        return Direction.PARALLEL

    same_chain = is_same_chain(sender_name, receiver_name)

    if same_chain:
        # Direct hierarchy relationship
        if sender.level < receiver.level:
            return Direction.DOWNWARD
        elif sender.level > receiver.level:
            return Direction.UPWARD
        else:
            return Direction.PARALLEL
    else:
        # Different chains: ALWAYS parallel regardless of level
        # e.g., 經濟部 (L2) → 臺北市衛生局 (L3) = 平行文, not 下行文
        return Direction.PARALLEL


def get_organ_tree() -> list[dict]:
    """Return organs as a hierarchical tree for the frontend cascading selector.

    Adds "其他" (custom) entries at the end of each children list so users
    can type in organs not in the registry.
    """
    tree = []

    # Names of city governments to exclude from central
    city_gov_names = {"臺北市政府", "新北市政府", "桃園市政府", "臺中市政府", "臺南市政府", "高雄市政府"}

    # Central government
    central: dict = {"name": "中央機關", "short_name": "", "level": 0, "children": []}
    for organ in _REGISTRY.values():
        if organ.level == 1:
            node: dict = {"name": organ.name, "short_name": organ.short_name, "level": 1, "children": []}
            # Add level 2 children (excluding city governments)
            for child in _REGISTRY.values():
                if child.parent == organ.name and child.level == 2 and child.name not in city_gov_names:
                    child_node: dict = {"name": child.name, "short_name": child.short_name, "level": 2, "children": []}
                    # Add level 3 children
                    for grandchild in _REGISTRY.values():
                        if grandchild.parent == child.name and grandchild.level == 3:
                            child_node["children"].append({
                                "name": grandchild.name, "short_name": grandchild.short_name, "level": 3, "children": []
                            })
                    child_node["children"].sort(key=lambda x: x["name"])
                    # Add 其他 entry at end of level-3 children
                    child_node["children"].append({
                        "name": f"其他（{child.name}所屬）", "short_name": "機關",
                        "level": 3, "is_custom": True, "parent_context": child.name, "children": []
                    })
                    node["children"].append(child_node)
            node["children"].sort(key=lambda x: x["name"])
            # Add 其他 entry at end of level-2 children (under each 院)
            node["children"].append({
                "name": f"其他（{organ.name}所屬）", "short_name": "機關",
                "level": 2, "is_custom": True, "parent_context": organ.name, "children": []
            })
            central["children"].append(node)
    tree.append(central)

    # Local government
    local: dict = {"name": "地方政府", "short_name": "", "level": 0, "children": []}
    city_names = ["臺北市政府", "新北市政府", "桃園市政府", "臺中市政府", "臺南市政府", "高雄市政府"]
    for city_name in city_names:
        city_organ = _REGISTRY.get(city_name)
        if city_organ:
            city_node: dict = {"name": city_organ.name, "short_name": city_organ.short_name, "level": 2, "children": []}
            for child in _REGISTRY.values():
                if child.parent == city_organ.name:
                    city_node["children"].append({
                        "name": child.name, "short_name": child.short_name, "level": child.level, "children": []
                    })
            city_node["children"].sort(key=lambda x: x["name"])
            # Add 其他 entry at end of city's children
            city_node["children"].append({
                "name": f"其他（{city_organ.name.replace('政府', '')}所屬）", "short_name": "機關",
                "level": 3, "is_custom": True, "parent_context": city_organ.name, "children": []
            })
            local["children"].append(city_node)
    # Add 其他地方政府 at end of local government
    local["children"].append({
        "name": "其他地方政府", "short_name": "府",
        "level": 2, "is_custom": True, "parent_context": "", "children": []
    })
    tree.append(local)

    # Other receiver types
    others: dict = {
        "name": "其他對象", "short_name": "", "level": 0,
        "children": [
            {"name": "人民（個人）", "short_name": "台端", "level": -1, "receiver_type": "人民", "children": []},
            {"name": "企業/公司", "short_name": "貴公司", "level": -1, "receiver_type": "企業/公司", "children": []},
            {"name": "團體/協會", "short_name": "貴會", "level": -1, "receiver_type": "團體/協會", "children": []},
            {"name": "學校", "short_name": "貴校", "level": -1, "receiver_type": "學校", "children": []},
            {"name": "公眾", "short_name": "", "level": -1, "receiver_type": "公眾", "children": []},
            {"name": "自訂", "short_name": "", "level": 0, "is_custom": True, "receiver_type": "自訂", "children": []},
        ]
    }
    tree.append(others)

    return tree
