"""Constants for Energy Command Centre."""

from pathlib import Path

DOMAIN = "energy_command_centre"
NAME = "Energy Command Centre"
VERSION = "0.1.0-alpha.14"

CONF_HOST = "host"
CONF_PORT = "port"
DEFAULT_PORT = 8899
DEFAULT_SCAN_INTERVAL = 5

PANEL_URL = "energy-command-centre"
PANEL_ELEMENT = "energy-command-centre-panel"
STATIC_URL = "/energy_command_centre_static"
FRONTEND_PATH = Path(__file__).parent / "frontend"
BRAND_STATIC_URL = "/energy_command_centre_brand"
BRAND_PATH = Path(__file__).parent / "brand"
HOUSE_STATIC_URL = "/energy_command_centre_scene/house.png"
HOUSE_PATH = FRONTEND_PATH / "assets" / "ecc-house-clean-v2.png"
EV_STATIC_URL = "/energy_command_centre_scene/ev.png"
EV_PATH = FRONTEND_PATH / "assets" / "ecc-ev-overlay.png"

WS_OVERVIEW = "energy_command_centre/overview"

KOFI_URL = "https://ko-fi.com/ady1984"
BUY_ME_A_BEER_URL = "https://paypal.me/graffidoodle"


def static_assets() -> dict[str, Path]:
    """Return individually exposed static assets."""
    return {
        f"{BRAND_STATIC_URL}/icon.png": BRAND_PATH / "icon.png",
        HOUSE_STATIC_URL: HOUSE_PATH,
        EV_STATIC_URL: EV_PATH,
    }


# Retained only for explicitly separate optional enrichment/discovery helpers.
# Primary inverter, solar, grid, house and battery data must not use this list.
ENERGY_TERMS = (
    "givenergy",
    "givtcp",
    "solis",
    "sunsynk",
    "deye",
    "foxess",
    "fox ess",
    "solaredge",
    "solar edge",
    "enphase",
    "powerwall",
    "tesla energy",
    "fronius",
    "goodwe",
    "victron",
    "growatt",
    "huawei solar",
    "pylontech",
    "sma solar",
    "sigenergy",
    "inverter",
    "battery",
    "bms",
    "solar",
    "pv",
    "grid",
    "export",
    "import",
    "predbat",
    "octopus",
    "hypervolt",
    "charger",
    "ev ",
)

MANUFACTURERS: dict[str, tuple[str, ...]] = {
    "GivEnergy": ("givenergy", "givtcp"),
    "Solis": ("solis",),
    "Sunsynk / Deye": ("sunsynk", "deye"),
    "FoxESS": ("foxess", "fox ess"),
    "SolarEdge": ("solaredge", "solar edge"),
    "Enphase": ("enphase",),
    "Tesla": ("powerwall", "tesla energy"),
    "Fronius": ("fronius",),
    "GoodWe": ("goodwe",),
    "Victron": ("victron",),
    "Growatt": ("growatt",),
    "Huawei": ("huawei solar",),
    "SMA": ("sma solar",),
    "Sigenergy": ("sigenergy",),
    "Pylontech": ("pylontech",),
}
