import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const SCENE_URL = new URL('../custom_components/energy_command_centre/frontend/overview/realistic-scene.js', import.meta.url);
const IMAGE_URL = new URL('../custom_components/energy_command_centre/frontend/assets/ecc-house-premium.png', import.meta.url);
const CONST_URL = new URL('../custom_components/energy_command_centre/const.py', import.meta.url);

test('realistic overview serves the complete approved PNG through an explicit static route', async () => {
  const scene = await readFile(SCENE_URL, 'utf8');
  const image = await readFile(IMAGE_URL);
  const constants = await readFile(CONST_URL, 'utf8');
  const imageStats = await stat(IMAGE_URL);

  assert.match(scene, /energy_command_centre_scene\/house\.png\?v=0\.1\.0-alpha\.10/);
  assert.match(constants, /HOUSE_STATIC_URL = "\/energy_command_centre_scene\/house\.png"/);
  assert.match(constants, /HOUSE_PATH = FRONTEND_PATH \/ "assets" \/ "ecc-house-premium\.png"/);
  assert.doesNotMatch(scene, /background-image\s*:\s*url/);
  assert.match(scene, /<img[^>]+class=["']ecc-house-photo["'][^>]+src=["']\$\{PHOTO_URL\}["']/);
  assert.match(scene, /\.ecc-house-photo\{[^}]*position:absolute[^}]*object-fit:cover/);
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(imageStats.size > 1_000_000, 'approved house image must not be a truncated placeholder');
});

test('realistic overview keeps live equipment cards', async () => {
  const source = await readFile(SCENE_URL, 'utf8');
  assert.match(source, /ecc-photo-stage/);
  for (const id of ['ecc-solar-array','ecc-grid','ecc-house','ecc-inverter','ecc-battery-bank','ecc-ev-car']) {
    assert.match(source, new RegExp(`id=["']${id}["']`));
  }
  assert.match(source, /formatPower\(solar/);
  assert.match(source, /formatPower\(load/);
  assert.match(source, /formatPower\(grid/);
  assert.match(source, /formatPower\(ev/);
});
