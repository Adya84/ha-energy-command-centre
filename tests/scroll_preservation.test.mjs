import assert from 'node:assert/strict';
import test from 'node:test';

class FakeShadowRoot {
  constructor(owner) {
    this.owner = owner;
    this._html = '';
  }

  set innerHTML(value) {
    this._html = value;
    if (this.owner.parentElement) this.owner.parentElement.scrollTop = 0;
    globalThis.window.scrollY = 0;
  }

  get innerHTML() {
    return this._html;
  }

  querySelectorAll() {
    return [];
  }

  querySelector() {
    return null;
  }
}

globalThis.window = {
  scrollX: 0,
  scrollY: 0,
  scrollTo(x, y) {
    this.scrollX = x;
    this.scrollY = y;
  },
};

globalThis.HTMLElement = class {
  attachShadow() {
    this.shadowRoot = new FakeShadowRoot(this);
    return this.shadowRoot;
  }
};

const registry = new Map();
globalThis.customElements = {
  define: (name, component) => registry.set(name, component),
  get: (name) => registry.get(name),
};

await import('../custom_components/energy_command_centre/frontend/energy-command-centre-panel.js');

test('a live sensor redraw preserves the Home Assistant page and panel scroll positions', () => {
  const Panel = registry.get('energy-command-centre-panel');
  const panel = new Panel();
  const scroller = { scrollTop: 640, scrollLeft: 0, parentElement: null };
  panel.parentElement = scroller;
  globalThis.window.scrollY = 275;

  panel._render();

  assert.equal(scroller.scrollTop, 640);
  assert.equal(globalThis.window.scrollY, 275);
});
