# Direct Inverter Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Energy Command Centre read its inverter, solar, grid, load and battery data directly from the configured GivEnergy inverter IP, while keeping the application fully free and adding optional Ko-fi / Buy me a beer support links.

**Architecture:** Use `givenergy-modbus` as the local protocol layer. A Home Assistant coordinator owns a long-lived local connection and publishes one manufacturer-neutral snapshot. The WebSocket API serves that snapshot to the existing ECC frontend; the frontend gains dashboard-first navigation, inverter/battery/diagnostic pages, and a free-project support panel.

**Tech Stack:** Home Assistant config entries, Python 3.12, `givenergy-modbus==2.13.0`, DataUpdateCoordinator, Home Assistant WebSocket API, vanilla Web Components/JavaScript.

**Spec:** `docs/superpowers/specs/2026-09-17-direct-inverter-data-design.md`

## Global Constraints

- Inverter-derived energy values must never fall back to guessed Home Assistant entities.
- Local inverter connection is read-only in this phase.
- Default host port is `8899`.
- Fast live data target is 5 seconds; slower/static data may be retained from the same plant refresh rather than re-read by the frontend.
- Missing/unsupported values are shown as unavailable, never estimated from unrelated HA sensors.
- The whole ECC feature set is free; there is no premium tier, £2.99 payment, or feature gating.
- Optional support links are Ko-fi `https://ko-fi.com/ady1984` and Buy me a beer `https://paypal.me/graffidoodle`.
- User-facing navigation is ECC-branded rather than copying INVLocal labels verbatim.

---

### Task 1: Connection configuration and protocol dependency

**Files:**
- Modify: `custom_components/energy_command_centre/const.py`
- Modify: `custom_components/energy_command_centre/manifest.json`
- Modify: `custom_components/energy_command_centre/config_flow.py`
- Modify: `custom_components/energy_command_centre/strings.json`
- Modify: `custom_components/energy_command_centre/translations/en.json`
- Create: `tests/test_config_flow.py`

**Interfaces:**
- Produces constants `CONF_HOST`, `CONF_PORT`, `DEFAULT_PORT`.
- Produces validated config entries containing `host` and `port`.

- [ ] Write config-flow tests for successful inverter validation, cannot-connect and detection-failed cases using a mocked direct client.
- [ ] Add `givenergy-modbus==2.13.0` to manifest requirements and change IoT class to local polling.
- [ ] Replace the empty setup form with host + port, defaulting to 8899.
- [ ] Validate by connecting, detecting topology and reading the inverter serial before creating the config entry.
- [ ] Add reconfigure support for changing host/port while preventing accidental switch to another inverter serial.
- [ ] Run Python tests and ruff.

### Task 2: Direct inverter coordinator and normalised snapshot

**Files:**
- Create: `custom_components/energy_command_centre/inverter.py`
- Create: `custom_components/energy_command_centre/coordinator.py`
- Create: `tests/test_inverter.py`
- Create: `tests/test_coordinator.py`

**Interfaces:**
- `normalise_plant(plant, *, host, port, connection, last_error=None) -> dict[str, Any]`
- `EnergyCommandCentreCoordinator(hass, host, port)` exposes `.data` as the normalised snapshot.

- [ ] Add fixture-backed tests for a Hybrid Gen2-style plant with two batteries.
- [ ] Implement safe field access and normalisation for inverter identity/status, solar, load, grid, battery bank, per-battery data, energy totals and diagnostics.
- [ ] Preserve detailed raw readable model fields in a diagnostics section without exposing write controls.
- [ ] Implement a coordinator around one `givenergy_modbus.client.client.Client`, calling `connect()`, `detect()` and `refresh()`.
- [ ] Handle partial refreshes by using the partial plant snapshot where available.
- [ ] On hard communication failure keep the last snapshot but mark connection offline/stale and record the error category.
- [ ] Run tests and ruff.

### Task 3: Integration lifecycle and WebSocket data source

**Files:**
- Modify: `custom_components/energy_command_centre/__init__.py`
- Modify: `custom_components/energy_command_centre/websocket.py`
- Create: `tests/test_websocket_direct.py`

**Interfaces:**
- `hass.data[DOMAIN][entry.entry_id]["coordinator"]` is the sole primary dashboard data source.
- `energy_command_centre/overview` returns coordinator data for the configured entry.

- [ ] Write regression test proving the overview endpoint does not call `discover_energy_entities()`.
- [ ] Create/start the coordinator during `async_setup_entry()` and store it under the config entry.
- [ ] Refresh before registering the panel so the dashboard has direct inverter data immediately.
- [ ] Close the Modbus client and remove coordinator state on unload.
- [ ] Change WebSocket overview to return the configured coordinator snapshot and explicit connection-required state if an old entry lacks host configuration.
- [ ] Run tests and ruff.

### Task 4: Dashboard-first ECC navigation, diagnostics and free support UI

**Files:**
- Modify: `custom_components/energy_command_centre/frontend/energy-command-centre-panel.js`
- Modify: `custom_components/energy_command_centre/frontend/energy-command-centre-premium.js`
- Modify: `custom_components/energy_command_centre/frontend/overview/realistic-scene.js`
- Modify: `tests/overview_entrypoint.test.mjs`
- Modify/Create: `tests/direct_snapshot_frontend.test.mjs`

**Interfaces:**
- Frontend consumes direct snapshot keys: `solar`, `home`, `grid`, `battery_bank`, `batteries`, `inverter`, `energy_today`, `energy_total`, `diagnostics`, `connection`.

- [ ] Rename user-facing sidebar entries to `Dashboard`, `Energy Live`, `Battery Centre`, `Inverter Details`, `Diagnostics`, `Register Data`, `Settings & Support` where applicable; keep ECC-specific naming rather than INVLocal labels.
- [ ] Keep the large visual house dashboard as the first/default page.
- [ ] Adapt headline power/SOC display helpers to the direct snapshot while retaining temporary compatibility with old entity-shaped snapshots only for test/dev rendering, not as a backend data fallback.
- [ ] Replace any Premium/payment presentation with a compact free-project support block linking to Ko-fi and `Buy me a beer` PayPal.
- [ ] Do not gate any page or feature behind support/donation state.
- [ ] Rename internal `premium` CSS/user-visible wording where safe; internal compatibility filename may remain until a later cleanup if renaming would break entrypoint loading.
- [ ] Run Node frontend tests.

### Task 5: Documentation, migration messaging and verification

**Files:**
- Modify: `README.md`
- Modify: `INSTALL.md`
- Modify: `docs/superpowers/specs/2026-09-17-direct-inverter-data-design.md`
- Modify: `custom_components/energy_command_centre/strings.json`
- Modify: `custom_components/energy_command_centre/translations/en.json`

**Interfaces:**
- Existing entries without `host` show `Inverter connection required` and must be reconfigured rather than silently using entity discovery.

- [ ] Document direct-local setup using inverter IP and default port 8899.
- [ ] State clearly that ECC is free and all functionality is available without payment.
- [ ] Add Ko-fi and Buy me a beer support links matching Football Hub.
- [ ] Document that HA/GivTCP entities are not required for inverter energy data.
- [ ] Run complete Python and frontend test suites, then HACS/Hassfest validation through the normal branch/PR workflow.
- [ ] Only merge after validation is green; do not create a release until the merged branch is verified.
