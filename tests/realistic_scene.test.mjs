import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const SCENE_URL = new URL('../custom_components/energy_command_centre/frontend/overview/realistic-scene.js', import.meta.url);
const CONST_URL = new URL('../custom_components/energy_command_centre/const.py', import.meta.url);

test('realistic overview uses explicitly registered premium house asset and live equipment cards', async () => {
  const source = await readFile(SCENE_URL, 'utf8');
  const constants = await readFile(CONST_URL, 'utf8');
  assert.match(source, /\/energy_command_centre_scene\/house\.webp\?v=0\.1\.0-alpha\.6/);
  assert.match(constants, /energy_command_centre_scene\/house\.webp/);
  assert.match(source, /ecc-photo-stage/);
  for (const id of ['ecc-solar-array','ecc-grid','ecc-house','ecc-inverter','ecc-battery-bank','ecc-ev-car']) {
    assert.match(source, new RegExp(`id=["']${id}["']`));
  }
  assert.match(source, /formatPower\(solar/);
  assert.match(source, /formatPower\(load/);
  assert.match(source, /formatPower\(grid/);
  assert.match(source, /formatPower\(ev/);
});
