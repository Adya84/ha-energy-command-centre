import assert from 'node:assert/strict';
import fs from 'node:fs';

const wrapperPath = new URL('../custom_components/energy_command_centre/frontend/energy-command-centre-premium.js', import.meta.url);
const wrapper = fs.readFileSync(wrapperPath, 'utf8');

assert.match(wrapper, /Dashboard/);
assert.match(wrapper, /Battery Centre/);
assert.match(wrapper, /Inverter Details/);
assert.match(wrapper, /Diagnostics/);
assert.match(wrapper, /Register Data/);
assert.match(wrapper, /Settings & Support/);
assert.match(wrapper, /ECC is completely free/);
assert.match(wrapper, /https:\/\/ko-fi\.com\/ady1984/);
assert.match(wrapper, /https:\/\/paypal\.me\/graffidoodle/);
assert.doesNotMatch(wrapper, /£2\.99/);
assert.doesNotMatch(wrapper, /lifetime payment/i);
