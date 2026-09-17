import test from "node:test";
import assert from "node:assert/strict";

import { renderEnergyScene } from "../custom_components/energy_command_centre/frontend/overview/scene.js";

const flow = (display, direction = "in", available = true) => ({ display, direction, available, watts: available ? 1200 : null });
const model = {
  solar: flow("3.28 kW"), load: flow("742 W"), grid: flow("250 W"),
  battery: flow("1.2 kW", "charge"), ev: flow("7.20 kW", "to_ev"),
  batteries: [
    { id: "b1", name: "Battery 1", soc: 72, power: flow("600 W", "charge") },
    { id: "b2", name: "Battery 2", soc: 68, power: flow("600 W", "charge") },
  ],
  environment: {
    sun: { state: "above_horizon", previous_rising: "2026-09-16T06:00:00Z", next_setting: "2026-09-16T18:00:00Z" },
    wind: { value: 16.0934, unit: "km/h", bearing: 225, available: true },
    solar_forecast_remaining_kwh: 6.4,
  },
  summary: { total: 84 }, warnings: [],
};

test("scene includes every architectural and live-information layer", () => {
  const html = renderEnergyScene(model, { now: new Date("2026-09-16T12:00:00Z") });
  for (const marker of ["house-day.svg", "sky-layer", "celestial-arc", "energy-flow-layer", "wind-instrument", "summary-strip"]) {
    assert.match(html, new RegExp(marker));
  }
  assert.match(html, /data-equipment="battery-b1"/);
  assert.match(html, /data-equipment="battery-b2"/);
  assert.match(html, /data-equipment="ev"/);
});

test("equipment controls are accessible and unavailable flows do not animate", () => {
  const unavailable = { ...model, ev: flow("Unavailable", "unknown", false) };
  const html = renderEnergyScene(unavailable, { now: new Date("2026-09-16T12:00:00Z") });
  assert.match(html, /role="button"[^>]*aria-label="Open Battery 1 details"/);
  assert.match(html, /class="equipment-hit ev-hit"[^>]*aria-label="Open EV charger details"/);
  assert.doesNotMatch(html, /flow-ev[^>]*flow-active/);
  assert.match(html, /class="vehicle-shell"/);
  assert.doesNotMatch(html, /EV · Unavailable/);
});

test("night scene exposes stars, moon and ambient motion hooks", () => {
  const night = structuredClone(model);
  night.environment.sun = { state: "below_horizon", previous_setting: "2026-09-16T18:00:00Z", next_rising: "2026-09-17T06:00:00Z" };
  const html = renderEnergyScene(night, { now: new Date("2026-09-17T00:00:00Z") });
  assert.match(html, /scene-night/);
  assert.match(html, /star-field/);
  assert.match(html, /shooting-star/);
  assert.match(html, /aircraft/);
});
