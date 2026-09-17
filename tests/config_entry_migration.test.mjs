import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('custom_components/energy_command_centre/__init__.py', 'utf8');

test('version 1 ECC entries have an explicit migration path to version 2', () => {
  assert.match(source, /async def async_migrate_entry\(/);
  assert.match(source, /if entry\.version == 1:/);
  assert.match(source, /async_update_entry\(entry, version=2\)/);
  assert.match(source, /return True/);
});
