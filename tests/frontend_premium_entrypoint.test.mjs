import assert from 'node:assert/strict';
import fs from 'node:fs';

const wrapperPath = new URL('../custom_components/energy_command_centre/frontend/energy-command-centre-premium.js', import.meta.url);
const initPath = new URL('../custom_components/energy_command_centre/__init__.py', import.meta.url);

assert.equal(fs.existsSync(wrapperPath), true, 'premium frontend wrapper should exist');
const wrapper = fs.readFileSync(wrapperPath, 'utf8');
const init = fs.readFileSync(initPath, 'utf8');

assert.match(wrapper, /energy-command-centre-panel\.js/);
assert.match(wrapper, /overview\/realistic-scene\.js/);
assert.match(wrapper, /renderRealisticScene/);
assert.match(wrapper, /realisticSceneStyles/);
assert.match(init, /energy-command-centre-premium\.js\?v=\{VERSION\}/);
