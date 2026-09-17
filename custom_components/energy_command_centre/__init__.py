"""Energy Command Centre integration."""

from __future__ import annotations

import logging

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv

from .const import (
    CONF_HOST,
    CONF_PORT,
    DEFAULT_PORT,
    DOMAIN,
    FRONTEND_PATH,
    PANEL_ELEMENT,
    PANEL_URL,
    STATIC_URL,
    VERSION,
    static_assets,
)
from .coordinator import EnergyCommandCentreCoordinator
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


async def async_migrate_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Migrate pre-direct-inverter ECC entries to the current schema."""
    if entry.version == 1:
        # Version 1 stored no inverter connection details. Keep the entry and
        # advance its schema version so ECC can load the sidebar normally; the
        # user can then use Reconfigure to supply the inverter IP and port.
        hass.config_entries.async_update_entry(entry, version=2)
        _LOGGER.info("Migrated Energy Command Centre config entry from version 1 to 2")
        return True

    if entry.version == 2:
        return True

    _LOGGER.error(
        "Unsupported Energy Command Centre config entry version %s",
        entry.version,
    )
    return False


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up a configured hub and its direct inverter connection."""
    host = entry.data.get(CONF_HOST)
    port = int(entry.data.get(CONF_PORT, DEFAULT_PORT))

    runtime: dict[str, object] = {"loaded": True, "connection_required": not bool(host)}
    hass.data[DOMAIN][entry.entry_id] = runtime

    if host:
        coordinator = EnergyCommandCentreCoordinator(hass, str(host), port)
        await coordinator.async_config_entry_first_refresh()
        runtime["coordinator"] = coordinator

    await panel_custom.async_register_panel(
        hass,
        webcomponent_name=PANEL_ELEMENT,
        frontend_url_path=PANEL_URL,
        module_url=f"{STATIC_URL}/energy-command-centre-premium.js?v={VERSION}",
        sidebar_title="Energy Hub",
        sidebar_icon="mdi:lightning-bolt-circle",
        require_admin=False,
        config={"entry_id": entry.entry_id, "version": VERSION},
    )
    _LOGGER.info("Energy Command Centre %s loaded", VERSION)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload the configured hub."""
    frontend.async_remove_panel(hass, PANEL_URL)
    runtime = hass.data[DOMAIN].pop(entry.entry_id, {})
    coordinator = runtime.get("coordinator") if isinstance(runtime, dict) else None
    if isinstance(coordinator, EnergyCommandCentreCoordinator):
        await coordinator.async_close()
    return True
