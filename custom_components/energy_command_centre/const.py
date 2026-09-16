"""Constants for Energy Command Centre."""

from pathlib import Path

DOMAIN = "energy_command_centre"
NAME = "Energy Command Centre"
VERSION = "0.1.0-alpha.1"

PANEL_URL = "energy-command-centre"
PANEL_ELEMENT = "energy-command-centre-panel"
STATIC_URL = "/energy_command_centre_static"
FRONTEND_PATH = Path(__file__).parent / "frontend"

WS_OVERVIEW = "energy_command_centre/overview"

# These are deliberately broad. Discovery ranks candidates using entity metadata,
# device association, units and names rather than depending on exact entity IDs.
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
