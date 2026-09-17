import assert from "node:assert/strict";
import test from "node:test";

class FakeShadowRoot {
  constructor() {
    this.innerHTML = "";
  }

  querySelectorAll() {
    return [];
  }

  querySelector() {
    return null;
  }
}

globalThis.HTMLElement = class {
  attachShadow() {
    this.shadowRoot = new FakeShadowRoot();
    return this.shadowRoot;
  }
};

const registry = new Map();
globalThis.customElements = {
  define(name, component) {
    registry.set(name, component);
  },
  get(name) {
    return registry.get(name);
  },
};

await import("../custom_components/energy_command_centre/frontend/energy-command-centre-panel.js");

test("the rendered dashboard header displays the packaged ECC logo", () => {
  const Panel = registry.get("energy-command-centre-panel");
  const panel = new Panel();

  assert.match(
    panel.shadowRoot.innerHTML,
    /<img class="brand-logo" src="\/energy_command_centre_brand\/icon\.png\?v=[^"]+" alt="">/,
  );
});

test("the Overview renders the live modern house scene and equipment detail", () => {
  const Panel = registry.get("energy-command-centre-panel");
  const panel = new Panel();
  panel._loading = false;
  panel._snapshot = {
    generated_at: "2026-09-17T04:00:00Z",
    entities: [
      { entity_id: "sensor.pv_power", name: "PV power", category: "solar", state: "3200", unit: "W", available: true },
      { entity_id: "sensor.house_load", name: "House load", category: "load", state: "820", unit: "W", available: true },
      { entity_id: "sensor.b1_soc", name: "Battery 1 SOC", category: "battery", state: "72", unit: "%", available: true, device_id: "b1", device_name: "Battery 1" },
      { entity_id: "sensor.b1_power", name: "Battery 1 charge power", category: "battery", state: "1100", unit: "W", available: true, device_id: "b1", device_name: "Battery 1" },
    ],
    environment: { sun: { state: "above_horizon" }, wind: { value: 5, unit: "mph", available: true } },
    summary: { total: 4, available: 4, unavailable: 0, stale: 0 },
  };
  panel._selectedEquipment = "battery-b1";
  panel._render();
  assert.match(panel.shadowRoot.innerHTML, /class="energy-scene scene-day"/);
  assert.match(panel.shadowRoot.innerHTML, /Modern UK home with solar panels/);
  assert.match(panel.shadowRoot.innerHTML, /<h2>Battery 1<\/h2>/);
  assert.match(panel.shadowRoot.innerHTML, /data-page="battery"/);
});
