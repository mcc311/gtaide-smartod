"""Tests for rule_engine.select_phrases_pure — the organ-name-free phrase selector."""
from app.core.rule_engine import select_phrases_pure
from app.models.schemas import Direction, ActionType


def test_downward_to_public_has_no_honorific():
    """For 公眾 receiver (e.g. 公示送達), 稱謂 is intentionally empty."""
    result = select_phrases_pure(
        direction=Direction.DOWNWARD,
        action_type=ActionType.NEW_CASE,
        receiver_type="公眾",
        is_internal=False,
        subtype="",
        sender_short="勞保局",
        receiver_short="",
    )
    assert result["稱謂"] == ""
    # Self-reference should fill in
    assert "勞保局" in result["自稱"]


def test_individual_receiver_uses_台端():
    """個人 receiver gets 台端 regardless of direction."""
    result = select_phrases_pure(
        direction=Direction.PARALLEL,
        action_type=ActionType.NEW_CASE,
        receiver_type="人民",
        is_internal=False,
        subtype="",
        sender_short="本局",
        receiver_short="",
    )
    assert result["稱謂"] == "台端"


def test_company_receiver_uses_貴公司():
    result = select_phrases_pure(
        direction=Direction.PARALLEL,
        action_type=ActionType.NEW_CASE,
        receiver_type="企業/公司",
        is_internal=False,
        subtype="",
        sender_short="本局",
        receiver_short="",
    )
    assert result["稱謂"] == "貴公司"


def test_internal_vs_external_table_differ():
    """internal phrase table is distinct from external — verifies the branch is wired."""
    external = select_phrases_pure(
        direction=Direction.PARALLEL,
        action_type=ActionType.NEW_CASE,
        receiver_type="政府機關",
        is_internal=False,
        subtype="",
        sender_short="本局",
        receiver_short="X司",
    )
    internal = select_phrases_pure(
        direction=Direction.PARALLEL,
        action_type=ActionType.NEW_CASE,
        receiver_type="政府機關",
        is_internal=True,
        subtype="",
        sender_short="本局",
        receiver_short="X司",
    )
    # The 行文性質 marker should differentiate
    assert external["行文性質"] == "對外行文"
    assert internal["行文性質"] == "內部行文"
