"""WebSocket API for the sidebar application."""

from __future__ import annotations

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

from .const import DOMAIN, WS_OVERVIEW
from .coordinator import EnergyCommandCentreCoordinator


@websocket_api.websocket_command({vol.Required("type"): WS_OVERVIEW})
@websocket_api.async_response
async def websocket_overview(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Supply the latest direct-inverter snapshot."""
    domain_data = hass.data.get(DOMAIN, {})
    coordinator: EnergyCommandCentreCoordinator | None = None
    connection_required = False

    for key, runtime in domain_data.items():
        if key == "resources_registered" or not isinstance(runtime, dict):
            continue
        if runtime.get("connection_required"):
            connection_required = True
        candidate = runtime.get("coordinator")
        if isinstance(candidate, EnergyCommandCentreCoordinator):
            coordinator = candidate
            break

    if coordinator is None:
        connection.send_result(
            msg["id"],
            {
                "source": "direct_inverter",
                "connection": {
                    "state": "configuration_required" if connection_required else "offline",
                    "stale": True,
                    "last_error": "inverter_connection_required" if connection_required else "not_loaded",
                },
                "inverter": {},
                "solar": {},
                "home": {},
                "grid": {},
                "battery_bank": {},
                "batteries": [],
                "energy_today": {},
                "energy_total": {},
                "capabilities": {},
                "diagnostics": {},
            },
        )
        return

    connection.send_result(msg["id"], coordinator.data or {})


def async_register_websocket_api(hass: HomeAssistant) -> None:
    """Register commands once for this Home Assistant process."""
    websocket_api.async_register_command(hass, websocket_overview)
