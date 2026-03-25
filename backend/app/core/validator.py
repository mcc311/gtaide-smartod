from app.models.schemas import Direction, DocType


def validate_document(
    doc_type: DocType,
    direction: Direction,
    phrases: dict,
    rendered: str,
    subject_detail: str = "",
) -> list[str]:
    """Validate a generated document and return a list of warning strings."""
    warnings: list[str] = []

    # 1. Check 主旨 length (recommend <= 60 chars)
    if subject_detail and len(subject_detail) > 60:
        warnings.append(
            f"主旨過長（{len(subject_detail)}字），建議不超過60字，"
            "過長內容宜移至說明段。"
        )

    # 2. Check 期望語 matches direction
    expectation = phrases.get("期望語", "")
    if direction == Direction.UPWARD:
        valid_expectations = {"請鑒核", "請核示", "請鑒察", "請核備"}
        if expectation and expectation not in valid_expectations:
            warnings.append(
                f"上行文期望語「{expectation}」不符慣例，"
                f"上行文應使用：{', '.join(valid_expectations)}。"
            )
    elif direction == Direction.PARALLEL:
        valid_expectations = {"請查照", "請察照", "請查照辦理", "請辦理惠復"}
        if expectation and expectation not in valid_expectations:
            warnings.append(
                f"平行文期望語「{expectation}」不符慣例，"
                f"平行文應使用：{', '.join(valid_expectations)}。"
            )
    elif direction == Direction.DOWNWARD:
        valid_expectations = {"請照辦", "希照辦", "請辦理見復", "希辦理見復"}
        if expectation and expectation not in valid_expectations:
            warnings.append(
                f"下行文期望語「{expectation}」不符慣例，"
                f"下行文應使用：{', '.join(valid_expectations)}。"
            )

    # 3. Check 稱謂語 matches direction
    address = phrases.get("稱謂", "")
    if direction == Direction.UPWARD and address and not address.startswith("鈞"):
        warnings.append(
            f"上行文稱謂語應以「鈞」開頭（目前為「{address}」）。"
        )
    if direction in (Direction.PARALLEL, Direction.DOWNWARD) and address and address.startswith("鈞"):
        warnings.append(
            f"非上行文不應使用「鈞」作為稱謂語（目前為「{address}」）。"
        )

    # 4. Check numbering format (basic check for 一、 pattern)
    lines = rendered.split("\n")
    in_numbered_section = False
    expected_idx = 0
    cn_nums = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"]

    for line in lines:
        stripped = line.strip()
        if stripped in ("說明：", "辦法：", "擬辦：", "公告事項："):
            in_numbered_section = True
            expected_idx = 0
            continue
        if in_numbered_section and stripped:
            # Check if this line starts with a number prefix
            if expected_idx < len(cn_nums):
                expected_prefix = f"{cn_nums[expected_idx]}、"
                if stripped.startswith(expected_prefix):
                    expected_idx += 1
                elif any(stripped.startswith(f"{n}、") for n in cn_nums):
                    # Has a number but wrong sequence
                    warnings.append(
                        f"編號順序可能有誤：預期「{expected_prefix}」"
                        f"但發現「{stripped[:3]}」。"
                    )
                    expected_idx += 1
                elif stripped.startswith("主旨") or stripped.startswith("正本") or stripped.startswith("副本"):
                    in_numbered_section = False
                    expected_idx = 0

    # 5. 公告 should not have 受文者 or 正副本
    if doc_type == DocType.ANNOUNCEMENT:
        if "受文者：" in rendered:
            warnings.append("公告不應包含「受文者」欄位。")
        if "正本：" in rendered:
            warnings.append("公告不應包含「正本」欄位。")
        if "副本：" in rendered:
            warnings.append("公告不應包含「副本」欄位。")

    return warnings
