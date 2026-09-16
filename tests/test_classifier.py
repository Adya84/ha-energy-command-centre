"""Tests for manufacturer-neutral entity classification."""

from custom_components.energy_command_centre.classifier import (
    category_for,
    cell_number_for,
    manufacturer_for,
)


def test_givtcp_cell_is_recognised() -> None:
    text = "sensor.givtcp_ed2253g064_battery_1_cell_7_voltage v"
    assert manufacturer_for(text) == "GivEnergy"
    assert category_for(text) == "battery"
    assert cell_number_for(text) == 7


def test_other_manufacturer_inverter_is_recognised() -> None:
    text = "sensor.solis_inverter_dc_power solar inverter w"
    assert manufacturer_for(text) == "Solis"
    assert category_for(text) == "inverter"


def test_energy_capabilities_are_not_brand_dependent() -> None:
    assert category_for("sensor.my_house_grid_export_power w") == "grid"
    assert category_for("sensor.roof_pv_generation kw") == "solar"
    assert category_for("sensor.hypervolt_ev_charger_power kw") == "ev"
