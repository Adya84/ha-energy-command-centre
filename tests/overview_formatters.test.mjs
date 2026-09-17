import test from 'node:test';
import assert from 'node:assert/strict';
import { direction, formatPower, watts, windMph } from '../custom_components/energy_command_centre/frontend/overview/formatters.js';

test('formats watts below 1kW and kW from 1kW', () => {
  assert.equal(formatPower({ state: '742', unit: 'W', available: true }), '742 W');
  assert.equal(formatPower({ state: '1000', unit: 'W', available: true }), '1 kW');
  assert.equal(formatPower({ state: '3280', unit: 'W', available: true }), '3.28 kW');
});

test('normalises kW entities to watts', () => {
  assert.equal(watts({ state: '3.2', unit: 'kW', available: true }), 3200);
});

test('converts supported wind units to mph', () => {
  assert.equal(windMph(10, 'mph'), 10);
  assert.equal(Math.round(windMph(16.0934, 'km/h')), 10);
  assert.equal(Math.round(windMph(4.4704, 'm/s')), 10);
  assert.equal(Math.round(windMph(8.68976, 'kn')), 10);
});

test('maps signed power to named direction', () => {
  assert.equal(direction(1200, 'import', 'export'), 'import');
  assert.equal(direction(-900, 'import', 'export'), 'export');
  assert.equal(direction(0, 'import', 'export'), 'idle');
});
