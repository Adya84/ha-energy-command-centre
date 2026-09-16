import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const DETAILS_URL = new URL('../custom_components/energy_command_centre/frontend/overview/details.js', import.meta.url);
const PREMIUM_URL = new URL('../custom_components/energy_command_centre/frontend/energy-command-centre-premium.js', import.meta.url);

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

test('premium entrypoint maps all visible equipment to interactive energy roles', async () => {
  const source = await readFile(PREMIUM_URL, 'utf8');
  for (const [id, role] of [
    ['ecc-solar-array', 'solar'],
    ['ecc-grid', 'grid'],
    ['ecc-house', 'home'],
    ['ecc-inverter', 'inverter'],
    ['ecc-battery-bank', 'battery'],
    ['ecc-ev-car', 'ev'],
  ]) {
    assert.match(source, new RegExp(`${id}['\"]\\s*:\\s*['\"]${role}`));
  }
});

test('premium entrypoint binds equipment clicks and drawer close action', async () => {
  const source = await readFile(PREMIUM_URL, 'utf8');
  assert.match(source, /dataset\.eccRole/);
  assert.match(source, /data-ecc-close-detail/);
  assert.match(source, /_eccDetailRole/);
  assert.match(source, /keydown/);
});
