import assert from 'node:assert/strict';
import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync('custom_components/energy_command_centre/manifest.json', 'utf8'));
const configFlow = fs.readFileSync('custom_components/energy_command_centre/config_flow.py', 'utf8');
const init = fs.readFileSync('custom_components/energy_command_centre/__init__.py', 'utf8');
const websocket = fs.readFileSync('custom_components/energy_command_centre/websocket.py', 'utf8');
const coordinator = fs.readFileSync('custom_components/energy_command_centre/coordinator.py', 'utf8');
const inverter = fs.readFileSync('custom_components/energy_command_centre/inverter.py', 'utf8');

assert.equal(manifest.iot_class, 'local_polling');
assert.ok(manifest.requirements.includes('givenergy-modbus==2.13.0'));
assert.match(configFlow, /CONF_HOST/);
assert.match(configFlow, /DEFAULT_PORT/);
assert.match(configFlow, /client\.detect\(\)/);
assert.match(configFlow, /client\.refresh\(\)/);
assert.match(init, /EnergyCommandCentreCoordinator/);
assert.match(websocket, /coordinator\.data/);
assert.doesNotMatch(websocket, /discover_energy_entities/);
assert.match(coordinator, /dump_plant/);
assert.match(inverter, /source": "direct_inverter"/);
assert.match(inverter, /battery_bank/);
assert.match(inverter, /energy_today/);
assert.match(inverter, /energy_total/);
