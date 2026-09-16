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
