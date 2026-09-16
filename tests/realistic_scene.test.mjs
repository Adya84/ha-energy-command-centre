import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const SCENE_URL = new URL('../custom_components/energy_command_centre/frontend/overview/realistic-scene.js', import.meta.url);

test('realistic overview uses approved premium house render and live equipment cards', async () => {
  const source = await readFile(SCENE_URL, 'utf8');
  assert.match(source, /ecc-house-premium\.webp/);
  assert.match(source, /ecc-photo-stage/);
  for (const id of ['ecc-solar-array','ecc-grid','ecc-house','ecc-inverter','ecc-battery-bank','ecc-ev-car']) {
    assert.match(source, new RegExp(`id=["']${id}["']`));
  }
  assert.match(source, /formatPower\(solar/);
  assert.match(source, /formatPower\(load/);
  assert.match(source, /formatPower\(grid/);
  assert.match(source, /formatPower\(ev/);
});
