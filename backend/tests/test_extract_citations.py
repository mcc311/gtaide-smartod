"""Tests for the citation extraction script in gtaide_data/extract_citations.py.

The script is responsible for finding "XX法第N條" patterns in document text and
validating them against the law database. We test the regex layer separately
from verification so the test doesn't need the law DB loaded.
"""
import sys
from pathlib import Path

# extract_citations.py lives outside the backend package
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "gtaide_data"))

from extract_citations import CITATION_RE  # noqa: E402


def test_regex_extracts_law_name_and_article():
    text = "依政府採購法第22條第1項第9款規定辦理"
    matches = list(CITATION_RE.finditer(text))
    assert len(matches) == 1
    law_part = matches[0].group(1)
    article_part = matches[0].group(2)
    assert "政府採購法" in law_part
    assert article_part.startswith("第22條")


def test_regex_skips_bare_law_name_without_article():
    """Citations missing 第N條 are intentionally skipped — they're too vague to recommend."""
    text = "依採購相關法規辦理。本案依政府採購法辦理招標事宜。"
    matches = list(CITATION_RE.finditer(text))
    assert matches == []
