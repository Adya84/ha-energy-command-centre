"""Environment discovery contract tests without a Home Assistant install."""

from __future__ import annotations

import importlib
import pathlib
import sys
import types

ROOT = pathlib.Path(__file__).parents[1] / "custom_components" / "energy_command_centre"


def _load_discovery():
    package = types.ModuleType("custom_components.energy_command_centre")
    package.__path__ = [str(ROOT)]
    sys.modules[package.__name__] = package
    core = types.ModuleType("homeassistant.core")
    core.HomeAssistant = object
    core.State = object
    helpers = types.ModuleType("homeassistant.helpers")
    helpers.device_registry = types.SimpleNamespace(DeviceEntry=object)
    helpers.entity_registry = types.SimpleNamespace(RegistryEntry=object)
    homeassistant = types.ModuleType("homeassistant")
    sys.modules.update({
        "homeassistant": homeassistant,
        "homeassistant.core": core,
        "homeassistant.helpers": helpers,
    })
    sys.modules.pop("custom_components.energy_command_centre.discovery", None)
    return importlib.import_module("custom_components.energy_command_centre.discovery")


class FakeState:
    def __init__(self, entity_id, state, attributes=None):
        self.entity_id = entity_id
        self.state = state
        self.attributes = attributes or {}
        self.name = self.attributes.get("friendly_name", entity_id)


class FakeStates:
    def __init__(self, states):
        self._states = {state.entity_id: state for state in states}

    def get(self, entity_id):
        return self._states.get(entity_id)

    def async_all(self):
        return list(self._states.values())


def test_sun_fields_are_serialised_without_timezone_conversion():
    discovery = _load_discovery()
    sun = FakeState("sun.sun", "above_horizon", {
        "next_rising": "2026-09-17T05:42:11+00:00",
        "next_setting": "2026-09-16T18:11:03+00:00",
        "previous_rising": "2026-09-16T05:40:23+00:00",
        "previous_setting": "2026-09-15T18:13:20+00:00",
        "elevation": 32.4,
        "azimuth": 181.7,
    })
    result = discovery.discover_environment(types.SimpleNamespace(states=FakeStates([sun])))
    assert result["sun"] == {
        "state": "above_horizon",
        "next_rising": "2026-09-17T05:42:11+00:00",
        "next_setting": "2026-09-16T18:11:03+00:00",
        "previous_rising": "2026-09-16T05:40:23+00:00",
        "previous_setting": "2026-09-15T18:13:20+00:00",
        "elevation": 32.4,
        "azimuth": 181.7,
    }


def test_dedicated_wind_sensor_beats_weather_attributes_and_forecast_is_optional():
    discovery = _load_discovery()
    states = [
        FakeState(
            "weather.home",
            "cloudy",
            {"wind_speed": 12, "wind_speed_unit": "km/h", "wind_bearing": 90},
        ),
        FakeState(
            "sensor.garden_wind_speed",
            "7.5",
            {"friendly_name": "Garden wind speed", "unit_of_measurement": "mph"},
        ),
        FakeState(
            "sensor.garden_wind_bearing",
            "225",
            {"friendly_name": "Garden wind bearing", "unit_of_measurement": "°"},
        ),
    ]
    result = discovery.discover_environment(types.SimpleNamespace(states=FakeStates(states)))
    assert result["wind"] == {
        "value": 7.5,
        "unit": "mph",
        "bearing": 225.0,
        "source_entity": "sensor.garden_wind_speed",
        "available": True,
    }
    assert result["solar_forecast_remaining_kwh"] is None
