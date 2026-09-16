"""Pure entity classification helpers used by universal discovery."""

from __future__ import annotations

import re

from .const import MANUFACTURERS

CELL_RE = re.compile(r"(?:cell|vcell)[ _-]?(\d{1,2})(?:[ _-]?voltage)?", re.I)

CATEGORY_RULES: dict[str, tuple[str, ...]] = {
    "battery": ("battery", "bms", "soc", "state of charge", "cell"),
    "inverter": ("inverter", "ac1", "eps", "heatsink", "grid frequency"),
    "solar": ("solar", "pv", "generation", "yield"),
    "grid": ("grid", "import", "export", "meter"),
    "load": ("house load", "home load", "load power", "consumption"),
    "ev": ("hypervolt", "ev charger", "vehicle", "car charge"),
    "tariff": ("octopus", "tariff", "rate", "intelligent slot"),
    "predbat": ("predbat", "best charge", "best export", "plan"),
}


def category_for(text: str) -> str:
    """Classify entity metadata into an energy capability."""
    scores = {
        name: sum(2 if term in text else 0 for term in terms)
        for name, terms in CATEGORY_RULES.items()
    }
    if CELL_RE.search(text):
        return "battery"
    winner, score = max(scores.items(), key=lambda item: item[1])
    return winner if score else "other"


def manufacturer_for(text: str) -> str | None:
    """Recognise a manufacturer without requiring a dedicated adapter."""
    for name, terms in MANUFACTURERS.items():
        if any(term in text for term in terms):
            return name
    return None


def cell_number_for(text: str) -> int | None:
    """Extract a BMS cell number from common naming patterns."""
    match = CELL_RE.search(text)
    return int(match.group(1)) if match else None
