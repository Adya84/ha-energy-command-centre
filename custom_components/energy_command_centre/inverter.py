"""Normalise direct GivEnergy plant data for Energy Command Centre."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any


def _value(obj: Any, *names: str, default: Any = None) -> Any:
    """Return the first usable attribute from an object.

    GivEnergy model families do not all expose exactly the same field names. ECC
    treats a missing field as unavailable instead of deriving it from Home
    Assistant entities.
    """
    if obj is None:
        return default
    for name in names:
        try:
            value = getattr(obj, name)
        except (AttributeError, TypeError, ValueError):
            continue
        if callable(value):
            try:
                value = value()
            except TypeError:
                continue
        if value is not None:
            return value
    return default


def _serialise(value: Any) -> Any:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, Enum):
        return value.name
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, (list, tuple)):
        return [_serialise(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _serialise(item) for key, item in value.items()}
    name = getattr(value, "name", None)
    if isinstance(name, str):
        return name
    return str(value)


def _metric(value: Any, unit: str | None = None) -> dict[str, Any]:
    return {
        "value": _serialise(value),
        "unit": unit,
        "available": value is not None,
    }


def _model_name(value: Any) -> str | None:
    if value is None:
        return None
    name = getattr(value, "name", None)
    return str(name if name is not None else value)


def _raw_fields(obj: Any, names: tuple[str, ...]) -> dict[str, Any]:
    data: dict[str, Any] = {}
    for name in names:
        value = _value(obj, name)
        if value is not None:
            data[name] = _serialise(value)
    return data


def _battery_snapshot(battery: Any, index: int) -> dict[str, Any]:
    cells = []
    for cell in range(1, 25):
        value = _value(battery, f"v_cell_{cell:02d}")
        if value not in (None, 0):
            cells.append({"cell": cell, "voltage": value})

    return {
        "index": index,
        "serial": _value(battery, "serial_number"),
        "soc": _metric(_value(battery, "soc"), "%"),
        "voltage": _metric(_value(battery, "v_out", "v_battery"), "V"),
        "current": _metric(_value(battery, "i_out", "i_battery"), "A"),
        "temperature_min": _metric(_value(battery, "t_min"), "°C"),
        "temperature_max": _metric(_value(battery, "t_max"), "°C"),
        "temperature_bms": _metric(_value(battery, "t_bms_mosfet"), "°C"),
        "capacity_remaining": _metric(_value(battery, "cap_remaining"), "Ah"),
        "capacity_design": _metric(_value(battery, "cap_design", "cap_design2"), "Ah"),
        "capacity_calibrated": _metric(_value(battery, "cap_calibrated"), "Ah"),
        "cycles": _metric(_value(battery, "num_cycles")),
        "bms_firmware": _value(battery, "bms_firmware_version"),
        "cell_count": _value(battery, "num_cells"),
        "cell_voltage_sum": _metric(_value(battery, "v_cells_sum"), "V"),
        "cells": cells,
        "warnings": _raw_fields(battery, ("warning_1", "warning_2")),
        "status": _raw_fields(
            battery,
            ("status_1", "status_2", "status_3", "status_4", "status_5", "status_6", "status_7"),
        ),
    }


def normalise_plant(
    plant: Any,
    *,
    host: str,
    port: int,
    connection: str = "online",
    last_error: str | None = None,
) -> dict[str, Any]:
    """Return a manufacturer-neutral snapshot sourced directly from a plant."""
    now = datetime.now(timezone.utc).isoformat()
    inverter = _value(plant, "inverter")
    gateway = _value(plant, "gateway")
    primary = gateway or inverter

    batteries = list(_value(plant, "batteries", default=[]) or [])
    aio_modules = list(_value(plant, "aio_battery_modules", default=[]) or [])
    if not batteries and aio_modules:
        batteries = aio_modules

    solar_power = _value(primary, "p_pv")
    if solar_power is None:
        pv_parts = [_value(primary, "p_pv1"), _value(primary, "p_pv2"), _value(primary, "p_pv3")]
        valid_parts = [float(item) for item in pv_parts if isinstance(item, (int, float))]
        solar_power = sum(valid_parts) if valid_parts else None

    grid_power = _value(primary, "grid_power", "p_grid_out", "p_grid")
    load_power = _value(primary, "p_load_demand", "p_load", "load_power")
    battery_power = _value(primary, "p_battery", "battery_power")
    battery_soc = _value(primary, "battery_soc", "soc")

    capabilities = _value(plant, "capabilities")
    capability_data = {}
    if capabilities is not None:
        to_dict = getattr(capabilities, "to_dict", None)
        if callable(to_dict):
            try:
                capability_data = _serialise(to_dict())
            except (TypeError, ValueError):
                capability_data = {"device_type": _model_name(_value(capabilities, "device_type"))}
        else:
            capability_data = {"device_type": _model_name(_value(capabilities, "device_type"))}

    inverter_status = _model_name(_value(primary, "status", "charge_status_label"))
    inverter_model = _model_name(_value(primary, "model")) or _model_name(
        _value(capabilities, "device_type")
    )

    snapshot = {
        "generated_at": now,
        "source": "direct_inverter",
        "connection": {
            "state": connection,
            "host": host,
            "port": port,
            "last_error": last_error,
            "last_success": now if connection == "online" else None,
            "stale": connection != "online",
        },
        "inverter": {
            "serial": _value(plant, "inverter_serial_number"),
            "data_adapter_serial": _value(plant, "data_adapter_serial_number"),
            "model": inverter_model,
            "status": inverter_status,
            "firmware": _value(primary, "firmware_version"),
            "arm_firmware": _value(primary, "arm_firmware_version"),
            "dsp_firmware": _value(primary, "dsp_firmware_version"),
            "modbus_version": _value(primary, "modbus_version"),
            "device_type_code": _value(primary, "device_type_code"),
            "phases": _value(primary, "num_phases"),
            "mppt_count": _value(primary, "num_mppt"),
            "temperature_heatsink": _metric(_value(primary, "t_inverter_heatsink"), "°C"),
            "temperature_charger": _metric(_value(primary, "t_charger"), "°C"),
            "fault_code": _value(primary, "inverter_fault_code"),
            "warning_code": _value(primary, "inverter_warning_code"),
            "errors": _value(primary, "inverter_errors"),
            "charger_warning_code": _value(primary, "charger_warning_code"),
            "work_time_hours": _metric(_value(primary, "work_time_total_hours"), "h"),
        },
        "solar": {
            "power": _metric(solar_power, "W"),
            "strings": [
                {
                    "index": index,
                    "power": _metric(_value(primary, f"p_pv{index}"), "W"),
                    "voltage": _metric(_value(primary, f"v_pv{index}"), "V"),
                    "current": _metric(_value(primary, f"i_pv{index}"), "A"),
                }
                for index in range(1, 5)
                if any(
                    _value(primary, field) is not None
                    for field in (f"p_pv{index}", f"v_pv{index}", f"i_pv{index}")
                )
            ],
        },
        "home": {"power": _metric(load_power, "W")},
        "grid": {
            "power": _metric(grid_power, "W"),
            "voltage": _metric(_value(primary, "v_ac1", "v_grid"), "V"),
            "current": _metric(_value(primary, "i_ac1", "i_grid"), "A"),
            "frequency": _metric(_value(primary, "f_ac1", "f_grid"), "Hz"),
        },
        "battery_bank": {
            "power": _metric(battery_power, "W"),
            "soc": _metric(battery_soc, "%"),
            "voltage": _metric(_value(primary, "v_battery"), "V"),
            "current": _metric(_value(primary, "i_battery"), "A"),
            "temperature": _metric(_value(primary, "t_battery"), "°C"),
            "count": len(batteries),
            "capacity_kwh": _metric(_value(primary, "battery_capacity_kwh"), "kWh"),
            "capacity_ah": _metric(_value(primary, "battery_capacity_ah"), "Ah"),
            "charge_limit": _metric(_value(primary, "battery_charge_limit"), "%"),
            "discharge_limit": _metric(_value(primary, "battery_discharge_limit"), "%"),
            "reserve": _metric(_value(primary, "battery_soc_reserve"), "%"),
            "charge_target_soc": _metric(_value(primary, "charge_target_soc"), "%"),
            "charge_enabled": _value(primary, "enable_charge"),
            "discharge_enabled": _value(primary, "enable_discharge"),
        },
        "batteries": [_battery_snapshot(battery, index) for index, battery in enumerate(batteries, 1)],
        "energy_today": {
            "solar_generation": _metric(
                _value(primary, "e_pv_generation_today", "e_pv_day"), "kWh"
            ),
            "consumption": _metric(_value(primary, "e_consumption_today", "e_load_today"), "kWh"),
            "grid_import": _metric(_value(primary, "e_grid_in_day"), "kWh"),
            "grid_export": _metric(_value(primary, "e_grid_out_day"), "kWh"),
            "battery_charge": _metric(_value(primary, "e_battery_charge_today"), "kWh"),
            "battery_discharge": _metric(_value(primary, "e_battery_discharge_today"), "kWh"),
        },
        "energy_total": {
            "solar_generation": _metric(
                _value(primary, "e_pv_generation_total", "e_pv_total"), "kWh"
            ),
            "consumption": _metric(_value(primary, "e_consumption_total", "e_load_total"), "kWh"),
            "grid_import": _metric(_value(primary, "e_grid_in_total"), "kWh"),
            "grid_export": _metric(_value(primary, "e_grid_out_total"), "kWh"),
            "battery_charge": _metric(_value(primary, "e_battery_charge_total"), "kWh"),
            "battery_discharge": _metric(_value(primary, "e_battery_discharge_total"), "kWh"),
            "battery_throughput": _metric(_value(primary, "e_battery_throughput"), "kWh"),
        },
        "capabilities": capability_data,
        "diagnostics": {
            "raw_inverter": _raw_fields(
                primary,
                (
                    "status",
                    "model",
                    "firmware_version",
                    "system_mode",
                    "battery_power_mode",
                    "battery_pause_mode",
                    "p_backup",
                    "p_combined_generation",
                    "p_grid_apparent",
                    "pf_inverter_output_now",
                    "v_ac1_output",
                    "f_ac1_output",
                    "meter_type",
                    "battery_type",
                    "system_time",
                ),
            ),
            "capabilities": capability_data,
        },
    }
    return snapshot
