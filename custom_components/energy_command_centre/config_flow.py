"""Configuration flow for Energy Command Centre."""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol
from givenergy_modbus.client.client import Client
from givenergy_modbus.exceptions import RefreshPartiallySucceeded
from homeassistant import config_entries
from homeassistant.data_entry_flow import FlowResult

from .const import CONF_HOST, CONF_PORT, DEFAULT_PORT, DOMAIN, NAME

_LOGGER = logging.getLogger(__name__)


class EnergyCommandCentreConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Configure Energy Command Centre from the inverter IP."""

    VERSION = 2

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Create the local inverter-backed hub entry."""
        errors: dict[str, str] = {}

        if user_input is not None:
            host = str(user_input[CONF_HOST]).strip()
            port = int(user_input[CONF_PORT])
            serial, error = await self._test_connection(host, port)
            if error:
                errors["base"] = error
            else:
                await self.async_set_unique_id(serial)
                self._abort_if_unique_id_configured()
                return self.async_create_entry(
                    title=f"{NAME} · {serial}",
                    data={CONF_HOST: host, CONF_PORT: port},
                )

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_HOST): str,
                    vol.Required(CONF_PORT, default=DEFAULT_PORT): vol.All(
                        vol.Coerce(int), vol.Range(min=1, max=65535)
                    ),
                }
            ),
            errors=errors,
            description_placeholders={
                "description": (
                    "Enter the local IP address of your GivEnergy inverter or data adapter. "
                    "Energy Command Centre reads the inverter directly; GivTCP entities are not required."
                )
            },
        )

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Allow an existing installation to add or change inverter connection details."""
        entry = self._get_reconfigure_entry()
        errors: dict[str, str] = {}

        if user_input is not None:
            host = str(user_input[CONF_HOST]).strip()
            port = int(user_input[CONF_PORT])
            serial, error = await self._test_connection(host, port)
            if error:
                errors["base"] = error
            elif entry.unique_id and entry.unique_id not in (DOMAIN, serial):
                errors["base"] = "wrong_inverter"
            else:
                if not entry.unique_id or entry.unique_id == DOMAIN:
                    hass = self.hass
                    hass.config_entries.async_update_entry(entry, unique_id=serial)
                return self.async_update_reload_and_abort(
                    entry,
                    data_updates={CONF_HOST: host, CONF_PORT: port},
                )

        current_host = entry.data.get(CONF_HOST, "")
        current_port = entry.data.get(CONF_PORT, DEFAULT_PORT)
        return self.async_show_form(
            step_id="reconfigure",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_HOST, default=current_host): str,
                    vol.Required(CONF_PORT, default=current_port): vol.All(
                        vol.Coerce(int), vol.Range(min=1, max=65535)
                    ),
                }
            ),
            errors=errors,
        )

    async def _test_connection(self, host: str, port: int) -> tuple[str, str | None]:
        """Validate local connectivity and return the detected inverter serial."""
        client = Client(host=host, port=port)
        connected = False
        try:
            await client.connect()
            connected = True
            await client.detect()
            try:
                plant = await client.refresh()
            except RefreshPartiallySucceeded as exc:
                plant = exc.plant
            serial = str(getattr(plant, "inverter_serial_number", "") or "").strip()
            if not serial:
                return "", "detection_failed"
            return serial, None
        except Exception:
            _LOGGER.debug("ECC connection test failed for %s:%s", host, port, exc_info=True)
            return "", "detection_failed" if connected else "cannot_connect"
        finally:
            try:
                await client.close()
            except Exception:
                _LOGGER.debug("ECC connection-test cleanup failed", exc_info=True)
