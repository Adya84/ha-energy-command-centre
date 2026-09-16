"""Energy Command Centre integration."""

from __future__ import annotations

import logging

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv

from .const import (
    DOMAIN,
    FRONTEND_PATH,
    PANEL_ELEMENT,
    PANEL_URL,
    STATIC_URL,
    VERSION,
    static_assets,
)
from .websocket import async_register_websocket_api

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up shared frontend resources and WebSocket API."""
    hass.data.setdefault(DOMAIN, {})
    if not hass.data[DOMAIN].get("resources_registered"):
        paths = [StaticPathConfig(STATIC_URL, str(FRONTEND_PATH), False)]
        paths.extend(
            StaticPathConfig(url, str(path), False) for url, path in static_assets().items()
        )
        await hass.http.async_register_static_paths(paths)
        async_register_websocket_api(hass)
        hass.data[DOMAIN]["resources_registered"] = True
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up a configured hub and add its sidebar panel."""
    await panel_custom.async_register_panel(
        hass,
        webcomponent_name=PANEL_ELEMENT,
        frontend_url_path=PANEL_URL,
        module_url=f"{STATIC_URL}/energy-command-centre-panel.js?v={VERSION}",
        sidebar_title="Energy Hub",
        sidebar_icon="mdi:lightning-bolt-circle",
        require_admin=False,
        config={"entry_id": entry.entry_id, "version": VERSION},
    )
    hass.data[DOMAIN][entry.entry_id] = {"loaded": True}
    _LOGGER.info("Energy Command Centre %s loaded", VERSION)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload the configured hub."""
    frontend.async_remove_panel(hass, PANEL_URL)
    hass.data[DOMAIN].pop(entry.entry_id, None)
    return True
