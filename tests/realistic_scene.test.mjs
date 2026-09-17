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
  const match = image.match(/data:image\/(?:jpeg|webp);base64,([^']+)/);
  assert.ok(match, 'bundled house image should be a base64 image data URL');
  const decoded = Buffer.from(match[1], 'base64');
  assert.ok(decoded.length > 100000, 'bundled house image should decode to substantial image data');
  assert.equal(decoded[0], 0xff, 'bundled JPEG should begin with JPEG SOI marker');
  assert.equal(decoded[1], 0xd8, 'bundled JPEG should begin with JPEG SOI marker');
  assert.equal(decoded.at(-2), 0xff, 'bundled JPEG should end with JPEG EOI marker');
  assert.equal(decoded.at(-1), 0xd9, 'bundled JPEG should end with JPEG EOI marker');
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
