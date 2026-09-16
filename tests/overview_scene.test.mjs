import test from 'node:test';
import assert from 'node:assert/strict';
import { overviewSceneStyles, renderEnergyScene } from '../custom_components/energy_command_centre/frontend/overview/energy-scene.js';

const snapshot = { entities: [], summary: { total: 0, unavailable: 0 }, generated_at: new Date().toISOString() };
const hass = { states: {} };

test('renders the approved premium scene landmarks', () => {
  const html = renderEnergyScene(snapshot, hass);
  for (const token of ['ecc-energy-scene','ecc-house','ecc-solar-array','ecc-inverter','ecc-battery-bank','ecc-ev-car','ecc-grid','ecc-solar-arc','ecc-wind']) {
    assert.match(html, new RegExp(token));
  }
});

test('scene CSS includes reduced-motion handling', () => {
  assert.match(overviewSceneStyles(), /prefers-reduced-motion/);
});
