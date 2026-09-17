import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const SCENE_URL = new URL('../custom_components/energy_command_centre/frontend/overview/realistic-scene.js', import.meta.url);
const IMAGE_URL = new URL('../custom_components/energy_command_centre/frontend/overview/house-image.js', import.meta.url);

test('realistic overview bundles the approved house image and renders it as a real img element', async () => {
  const scene = await readFile(SCENE_URL, 'utf8');
  const image = await readFile(IMAGE_URL, 'utf8');

  assert.match(scene, /HOUSE_IMAGE_DATA_URL/);
  assert.doesNotMatch(scene, /energy_command_centre_scene\/house\.webp/);
  assert.doesNotMatch(scene, /background-image\s*:\s*url/);
  assert.match(scene, /<img[^>]+class=["']ecc-house-photo["'][^>]+src=["']\$\{HOUSE_IMAGE_DATA_URL\}["']/);
  assert.match(scene, /\.ecc-house-photo\{[^}]*position:absolute[^}]*object-fit:cover/);
  assert.match(image, /data:image\/(?:jpeg|webp);base64,/);
  assert.ok(image.length > 10000, 'bundled house image should contain substantial image data');
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
