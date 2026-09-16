import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const DETAILS_URL = new URL('../custom_components/energy_command_centre/frontend/overview/details.js', import.meta.url);
const PREMIUM_URL = new URL('../custom_components/energy_command_centre/frontend/energy-command-centre-premium.js', import.meta.url);
const SCENE_URL = new URL('../custom_components/energy_command_centre/frontend/overview/energy-scene.js', import.meta.url);

test('overview detail drawer renders live equipment information', async () => {
  const { renderDetailDrawer } = await import(DETAILS_URL.href);
  const snapshot = {
    entities: [
      { category: 'battery', name: 'Battery SOC', entity_id: 'sensor.battery_soc', state: '73', unit: '%', available: true },
      { category: 'battery', name: 'Battery Power', entity_id: 'sensor.battery_power', state: '-1250', unit: 'W', available: true },
    ],
  };

  const html = renderDetailDrawer(snapshot, 'battery');
  assert.match(html, /Battery/i);
  assert.match(html, /73/);
  assert.match(html, /1\.25 kW|1,250 W/);
  assert.match(html, /data-ecc-close-detail/);
});

test('scene exposes equipment hit targets for all main energy roles', async () => {
  const source = await readFile(SCENE_URL, 'utf8');
  for (const role of ['solar', 'grid', 'home', 'inverter', 'battery', 'ev']) {
    assert.match(source, new RegExp(`data-ecc-role=["']${role}["']`));
  }
});

test('premium entrypoint binds overview equipment clicks and close action', async () => {
  const source = await readFile(PREMIUM_URL, 'utf8');
  assert.match(source, /data-ecc-role/);
  assert.match(source, /data-ecc-close-detail/);
  assert.match(source, /_eccDetailRole/);
});
