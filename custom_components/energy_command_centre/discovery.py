"""Capability-based discovery for energy entities."""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from typing import Any

from homeassistant.core import HomeAssistant, State
from homeassistant.helpers import device_registry as dr, entity_registry as er

from .classifier import CELL_RE, category_for, cell_number_for, manufacturer_for
from .const import ENERGY_TERMS


def _text_for(state: State, registry_entry: er.RegistryEntry | None) -> str:
    values = [
        state.entity_id,
        str(state.attributes.get("friendly_name", "")),
        str(state.attributes.get("device_class", "")),
        str(state.attributes.get("unit_of_measurement", "")),
    ]
    if registry_entry:
        values.extend(
            [
                str(registry_entry.original_name or ""),
                str(registry_entry.platform or ""),
                str(registry_entry.unique_id or ""),
            ]
        )
    return " ".join(values).lower()


def _serialise_state(
    state: State,
    registry_entry: er.RegistryEntry | None,
    device: dr.DeviceEntry | None,
) -> dict[str, Any]:
    text = _text_for(state, registry_entry)
    updated = state.last_updated
    stale_seconds = max(
        0, int((datetime.now(timezone.utc) - updated).total_seconds())
    )
    return {
        "entity_id": state.entity_id,
        "name": state.attributes.get("friendly_name") or state.name,
        "state": state.state,
        "unit": state.attributes.get("unit_of_measurement"),
        "device_class": state.attributes.get("device_class"),
        "category": category_for(text),
        "manufacturer": manufacturer_for(text),
        "available": state.state not in ("unknown", "unavailable"),
        "stale_seconds": stale_seconds,
        "last_updated": updated.isoformat(),
        "platform": registry_entry.platform if registry_entry else None,
        "device_id": registry_entry.device_id if registry_entry else None,
        "device_name": device.name_by_user or device.name if device else None,
        "cell_number": cell_number_for(text),
    }


def discover_energy_entities(hass: HomeAssistant) -> dict[str, Any]:
    """Return a safe, serialisable snapshot of matching HA entities."""
    entity_registry = er.async_get(hass)
    device_registry = dr.async_get(hass)
    entities: list[dict[str, Any]] = []

    for state in hass.states.async_all():
        registry_entry = entity_registry.async_get(state.entity_id)
        text = _text_for(state, registry_entry)
        if not any(term in text for term in ENERGY_TERMS) and not CELL_RE.search(text):
            continue
        device = None
        if registry_entry and registry_entry.device_id:
            device = device_registry.async_get(registry_entry.device_id)
        entities.append(_serialise_state(state, registry_entry, device))

    entities.sort(key=lambda item: (item["category"], item["name"].lower()))
    categories = Counter(item["category"] for item in entities)
    manufacturers = Counter(
        item["manufacturer"] for item in entities if item["manufacturer"]
    )
    unavailable = sum(not item["available"] for item in entities)
    stale = sum(item["stale_seconds"] > 900 for item in entities)

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "entities": entities,
        "summary": {
            "total": len(entities),
            "available": len(entities) - unavailable,
            "unavailable": unavailable,
            "stale": stale,
            "categories": dict(categories),
            "manufacturers": dict(manufacturers),
        },
    }
