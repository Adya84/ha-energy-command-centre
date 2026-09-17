"""Direct local inverter coordinator for Energy Command Centre."""

from __future__ import annotations

import logging
from copy import deepcopy
from datetime import timedelta
from typing import Any

from givenergy_modbus.client.client import Client
from givenergy_modbus.exceptions import RefreshPartiallySucceeded
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from .const import DEFAULT_SCAN_INTERVAL, DOMAIN
from .diagnostics import dump_plant
from .inverter import normalise_plant

_LOGGER = logging.getLogger(__name__)


class EnergyCommandCentreCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Own one read-only local connection and publish a normalised snapshot."""

    def __init__(self, hass: HomeAssistant, host: str, port: int) -> None:
        super().__init__(
            hass,
            _LOGGER,
            name=f"{DOMAIN}:{host}",
            update_interval=timedelta(seconds=DEFAULT_SCAN_INTERVAL),
        )
        self.host = host
        self.port = port
        self.client = Client(host=host, port=port)
        self._detected = False
        self._last_good: dict[str, Any] | None = None
        self._last_error: str | None = None

    async def _ensure_connected(self) -> None:
        if not self.client.connected:
            await self.client.connect()
            self._detected = False
        if not self._detected:
            await self.client.detect()
            self._detected = True

    async def _async_update_data(self) -> dict[str, Any]:
        try:
            await self._ensure_connected()
            try:
                plant = await self.client.refresh()
            except RefreshPartiallySucceeded as exc:
                plant = exc.plant
                _LOGGER.debug("Partial GivEnergy refresh from %s; using available data", self.host)

            snapshot = normalise_plant(
                plant,
                host=self.host,
                port=self.port,
                connection="online",
            )
            snapshot.setdefault("diagnostics", {})["raw_plant"] = dump_plant(plant)
            self._last_good = snapshot
            self._last_error = None
            return snapshot
        except Exception as exc:  # library exposes several transport/protocol exception types
            self._last_error = exc.__class__.__name__
            _LOGGER.warning(
                "Direct inverter read failed for %s:%s: %s",
                self.host,
                self.port,
                self._last_error,
            )
            await self._reset_connection()
            if self._last_good is not None:
                stale = deepcopy(self._last_good)
                stale["connection"] = {
                    **stale.get("connection", {}),
                    "state": "offline",
                    "stale": True,
                    "last_error": self._last_error,
                }
                stale.setdefault("diagnostics", {})["latest_error"] = self._last_error
                return stale
            return {
                "generated_at": None,
                "source": "direct_inverter",
                "connection": {
                    "state": "offline",
                    "host": self.host,
                    "port": self.port,
                    "last_error": self._last_error,
                    "last_success": None,
                    "stale": True,
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
                "diagnostics": {"latest_error": self._last_error, "raw_plant": {}},
            }

    async def _reset_connection(self) -> None:
        try:
            await self.client.close()
        except Exception:  # best-effort cleanup after a transport failure
            _LOGGER.debug("Ignoring error while closing failed inverter connection", exc_info=True)
        self.client = Client(host=self.host, port=self.port)
        self._detected = False

    async def async_close(self) -> None:
        """Close the local Modbus connection."""
        try:
            await self.client.close()
        finally:
            self._detected = False
