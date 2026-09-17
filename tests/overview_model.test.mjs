import test from "node:test";
import assert from "node:assert/strict";

import { buildOverviewModel } from "../custom_components/energy_command_centre/frontend/overview/model.js";

const entity = (entity_id, name, category, state, unit = "W", extra = {}) => ({
  entity_id, name, category, state: String(state), unit, available: true, ...extra,
});

test("energy roles select live power entities and expose safe directions", () => {
  const model = buildOverviewModel({ entities: [
    entity("sensor.pv_power", "PV power", "solar", 3280),
    entity("sensor.house_load", "House load power", "load", 742),
    entity("sensor.grid_import_power", "Grid import power", "grid", 250),
    entity("sensor.battery_power", "Battery charge power", "battery", -1200),
    entity("sensor.ev_charge_power", "EV charge power", "ev", 0),
  ] });
  assert.equal(model.solar.display, "3.28 kW");
  assert.equal(model.solar.direction, "in");
  assert.equal(model.grid.direction, "in");
  assert.equal(model.battery.direction, "charge");
  assert.equal(model.ev.direction, "idle");
});

test("grid export and battery discharge directions follow named semantics", () => {
  const model = buildOverviewModel({ entities: [
    entity("sensor.grid_export_power", "Grid export power", "grid", 940),
    entity("sensor.battery_discharge_power", "Battery discharge power", "battery", 1600),
  ] });
  assert.equal(model.grid.direction, "out");
  assert.equal(model.battery.direction, "discharge");
});

test("unavailable readings are never presented as zero", () => {
  const model = buildOverviewModel({ entities: [
    { ...entity("sensor.ev_power", "EV power", "ev", "unavailable"), available: false },
  ] });
  assert.equal(model.ev.available, false);
  assert.equal(model.ev.display, "Unavailable");
  assert.equal(model.ev.direction, "unknown");
});

test("battery packs remain separate while their power is combined", () => {
  const model = buildOverviewModel({ entities: [
    entity("sensor.b1_soc", "Battery 1 SOC", "battery", 72, "%", { device_id: "b1", device_name: "Battery 1" }),
    entity("sensor.b1_power", "Battery 1 discharge power", "battery", 600, "W", { device_id: "b1", device_name: "Battery 1" }),
    entity("sensor.b2_soc", "Battery 2 SOC", "battery", 68, "%", { device_id: "b2", device_name: "Battery 2" }),
    entity("sensor.b2_power", "Battery 2 discharge power", "battery", 400, "W", { device_id: "b2", device_name: "Battery 2" }),
  ] });
  assert.deepEqual(model.batteries.map(({ name, soc }) => ({ name, soc })), [
    { name: "Battery 1", soc: 72 },
    { name: "Battery 2", soc: 68 },
  ]);
  assert.equal(model.battery.watts, 1000);
  assert.equal(model.battery.display, "1 kW");
});
