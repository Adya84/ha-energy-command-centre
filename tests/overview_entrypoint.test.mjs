import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('custom_components/energy_command_centre/frontend/energy-command-centre-app.js', 'utf8');

test('wrapper preserves the existing panel and replaces only overview presentation hooks', () => {
  assert.match(source, /energy-command-centre-panel\.js/);
  assert.match(source, /overview\/energy-scene\.js/);
  assert.match(source, /prototype\._overview/);
  assert.match(source, /prototype\._styles/);
  assert.doesNotMatch(source, /prototype\._battery\s*=/);
  assert.doesNotMatch(source, /prototype\._inverter\s*=/);
});
