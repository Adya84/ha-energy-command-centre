"""Tests for locally served Energy Command Centre brand assets."""

import importlib.util
from pathlib import Path

_CONST_PATH = Path(__file__).parents[1] / "custom_components" / "energy_command_centre" / "const.py"
_SPEC = importlib.util.spec_from_file_location("energy_command_centre_const", _CONST_PATH)
assert _SPEC is not None and _SPEC.loader is not None
const = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(const)


def test_static_assets_expose_existing_brand_icon() -> None:
    """The dashboard must have a stable URL mapped to the packaged ECC icon."""
    static_assets = getattr(const, "static_assets", lambda: {})()

    icon_path = static_assets.get("/energy_command_centre_brand/icon.png")

    assert icon_path is not None
    assert icon_path.is_file()
    assert icon_path.read_bytes().startswith(b"\x89PNG\r\n\x1a\n")
