import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import * as realisticScene from '../custom_components/energy_command_centre/frontend/overview/realistic-scene.js';

const { renderRealisticScene } = realisticScene;

const SCENE_URL = new URL('../custom_components/energy_command_centre/frontend/overview/realistic-scene.js', import.meta.url);
const IMAGE_URL = new URL('../custom_components/energy_command_centre/frontend/assets/ecc-house-premium.png', import.meta.url);
const CONST_URL = new URL('../custom_components/energy_command_centre/const.py', import.meta.url);

test('realistic overview serves the complete approved PNG through an explicit static route', async () => {
  const scene = await readFile(SCENE_URL, 'utf8');
  const image = await readFile(IMAGE_URL);
  const constants = await readFile(CONST_URL, 'utf8');
  const imageStats = await stat(IMAGE_URL);

  assert.match(scene, /energy_command_centre_scene\/house\.png\?v=0\.1\.0-alpha\.11/);
  assert.match(constants, /HOUSE_STATIC_URL = "\/energy_command_centre_scene\/house\.png"/);
  assert.match(constants, /HOUSE_PATH = FRONTEND_PATH \/ "assets" \/ "ecc-house-premium\.png"/);
  assert.doesNotMatch(scene, /background-image\s*:\s*url/);
  assert.match(scene, /<img[^>]+class=["']ecc-house-photo["'][^>]+src=["']\$\{PHOTO_URL\}["']/);
  assert.match(scene, /\.ecc-house-photo\{[^}]*position:absolute[^}]*object-fit:cover/);
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(imageStats.size > 1_000_000, 'approved house image must not be a truncated placeholder');
});

test('realistic overview keeps live equipment cards', () => {
  const html = renderRealisticScene({ entities: [] });
  assert.match(html, /ecc-photo-stage/);
  for (const id of ['ecc-solar-array','ecc-grid','ecc-house','ecc-inverter','ecc-battery-bank','ecc-ev-car']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /Solar now/);
  assert.match(html, /Home load/);
  assert.match(html, /Grid/);
  assert.match(html, /EV/);
});

const entity = (entity_id, name, category, state, unit = 'W', available = true) => ({
  entity_id, name, category, state: String(state), unit, available,
});

test('live cable labels show the amount and purpose of every active flow', () => {
  const html = renderRealisticScene({ entities: [
    entity('sensor.pv_power', 'PV power', 'solar', 2450),
    entity('sensor.house_load', 'House load power', 'load', 900),
    entity('sensor.grid_import_power', 'Grid import power', 'grid', 350),
    entity('sensor.battery_charge_power', 'Battery charge power', 'battery', -1200),
    entity('sensor.ev_charge_power', 'EV charge power', 'ev', 7200),
  ] });

  assert.match(html, /data-flow="solar"[^>]*class="[^"]*flow-active[^"]*direction-generate/);
  assert.match(html, /data-flow="grid"[^>]*class="[^"]*flow-active[^"]*direction-import/);
  assert.match(html, /data-flow="battery"[^>]*class="[^"]*flow-active[^"]*direction-charge/);
  assert.match(html, /data-flow="home"[^>]*class="[^"]*flow-active[^"]*direction-consume/);
  assert.match(html, /data-flow="ev"[^>]*class="[^"]*flow-active[^"]*direction-charge/);
  for (const label of ['2.45 kW Generating', '350 W Importing', '1.2 kW Charging', '900 W Using', '7.2 kW Charging']) {
    assert.match(html, new RegExp(label.replace('.', '\\.')));
  }
});

test('export and discharge reverse their cable animation while idle and unavailable flows stop', () => {
  const html = renderRealisticScene({ entities: [
    entity('sensor.pv_power', 'PV power', 'solar', 0),
    entity('sensor.house_load', 'House load power', 'load', 480),
    entity('sensor.grid_export_power', 'Grid export power', 'grid', 940),
    entity('sensor.battery_discharge_power', 'Battery discharge power', 'battery', 1600),
    entity('sensor.ev_charge_power', 'EV charge power', 'ev', 'unavailable', 'W', false),
  ] });

  assert.match(html, /data-flow="grid"[^>]*class="[^"]*flow-active[^"]*direction-export/);
  assert.match(html, /data-flow="battery"[^>]*class="[^"]*flow-active[^"]*direction-discharge/);
  assert.match(html, /940 W Exporting/);
  assert.match(html, /1.6 kW Discharging/);
  assert.match(html, /data-flow="solar"[^>]*class="[^"]*flow-idle/);
  assert.match(html, /data-flow="ev"[^>]*class="[^"]*flow-unavailable/);
  assert.doesNotMatch(html, /data-flow="solar"[^>]*class="[^"]*flow-active/);
  assert.doesNotMatch(html, /data-flow="ev"[^>]*class="[^"]*flow-active/);
});

test('I have an EV control removes every EV overlay and remembers the choice', () => {
  assert.equal(typeof realisticScene.readHasEv, 'function');
  assert.equal(typeof realisticScene.saveHasEv, 'function');
  const { readHasEv, saveHasEv } = realisticScene;
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };

  assert.equal(readHasEv(storage), true);
  saveHasEv(false, storage);
  assert.equal(readHasEv(storage), false);

  const hidden = renderRealisticScene({ entities: [] }, { hasEv: readHasEv(storage) });
  assert.match(hidden, /<input[^>]+id="ecc-has-ev"[^>]*>/);
  assert.doesNotMatch(hidden, /id="ecc-ev-car"/);
  assert.doesNotMatch(hidden, /data-flow="ev"/);
  assert.doesNotMatch(hidden, /<small>EV<\/small>/);

  saveHasEv(true, storage);
  const visible = renderRealisticScene({ entities: [] }, { hasEv: readHasEv(storage) });
  assert.match(visible, /<input[^>]+id="ecc-has-ev"[^>]+checked/);
  assert.match(visible, /id="ecc-ev-car"/);
  assert.match(visible, /data-flow="ev"/);
});

test('changing I have an EV saves the preference and immediately requests a rerender', () => {
  assert.equal(typeof realisticScene.bindHasEvControl, 'function');
  let changeHandler;
  const input = {
    checked: false,
    addEventListener: (name, handler) => {
      if (name === 'change') changeHandler = handler;
    },
  };
  const root = { querySelector: (selector) => selector === '#ecc-has-ev' ? input : null };
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
  const changes = [];

  realisticScene.bindHasEvControl(root, (enabled) => changes.push(enabled), storage);
  changeHandler();

  assert.equal(realisticScene.readHasEv(storage), false);
  assert.deepEqual(changes, [false]);
});
