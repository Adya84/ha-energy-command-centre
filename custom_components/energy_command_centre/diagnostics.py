"""Read-only diagnostics helpers for direct inverter data."""

from __future__ import annotations

from datetime import date, datetime, time
from enum import Enum
from typing import Any


def _json_value(value: Any, depth: int = 0) -> Any:
    if depth > 4:
        return str(value)
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, Enum):
        return value.name
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    if isinstance(value, dict):
        return {str(key): _json_value(item, depth + 1) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_value(item, depth + 1) for item in value]

    model_dump = getattr(value, "model_dump", None)
    if callable(model_dump):
        try:
            return _json_value(model_dump(), depth + 1)
        except (TypeError, ValueError):
            pass

    fields = getattr(value, "model_fields", None)
    if isinstance(fields, dict):
        return {
            name: _json_value(getattr(value, name, None), depth + 1)
            for name in fields
            if not str(name).startswith("_")
        }

    raw = getattr(value, "__dict__", None)
    if isinstance(raw, dict):
        cleaned = {
            str(key): _json_value(item, depth + 1)
            for key, item in raw.items()
            if not str(key).startswith("_")
            and not callable(item)
            and key not in {"register_caches", "register_cache"}
        }
        if cleaned:
            return cleaned

    name = getattr(value, "name", None)
    if isinstance(name, str):
        return name
    return str(value)


def dump_plant(plant: Any) -> dict[str, Any]:
    """Return a broad, JSON-safe, read-only plant snapshot for diagnostics."""
    return {
        "inverter_serial_number": getattr(plant, "inverter_serial_number", None),
        "data_adapter_serial_number": getattr(plant, "data_adapter_serial_number", None),
        "number_batteries": getattr(plant, "number_batteries", None),
        "capabilities": _json_value(getattr(plant, "capabilities", None)),
        "inverter": _json_value(getattr(plant, "inverter", None)),
        "gateway": _json_value(getattr(plant, "gateway", None)),
        "ems": _json_value(getattr(plant, "ems", None)),
        "batteries": _json_value(getattr(plant, "batteries", [])),
        "aio_battery_modules": _json_value(getattr(plant, "aio_battery_modules", [])),
        "hv_stacks": _json_value(getattr(plant, "hv_stacks", [])),
        "last_updated_at": _json_value(getattr(plant, "last_updated_at", None)),
    }
