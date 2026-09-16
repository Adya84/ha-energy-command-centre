"""WebSocket API for the sidebar application."""

from __future__ import annotations

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant

from .const import WS_OVERVIEW
from .discovery import discover_energy_entities


@websocket_api.websocket_command({vol.Required("type"): WS_OVERVIEW})
@websocket_api.async_response
async def websocket_overview(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Supply the latest discovered energy snapshot."""
    connection.send_result(msg["id"], discover_energy_entities(hass))


def async_register_websocket_api(hass: HomeAssistant) -> None:
    """Register commands once for this Home Assistant process."""
    websocket_api.async_register_command(hass, websocket_overview)
