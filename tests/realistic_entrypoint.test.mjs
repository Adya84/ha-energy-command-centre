import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const PREMIUM_URL = new URL('../custom_components/energy_command_centre/frontend/energy-command-centre-premium.js', import.meta.url);

test('premium wrapper uses realistic photo renderer', async () => {
  const source = await readFile(PREMIUM_URL, 'utf8');
  assert.match(source, /realistic-scene\.js/);
  assert.match(source, /renderRealisticScene/);
  assert.match(source, /realisticSceneStyles/);
  assert.doesNotMatch(source, /renderEnergyScene/);
});
