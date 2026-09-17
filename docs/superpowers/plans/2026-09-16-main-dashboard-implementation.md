# Premium Main Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release a testable premium Overview centred on a realistic modern UK house with live energy flow, solar-day, weather and ambient scene behaviour.

**Architecture:** Extend the Home Assistant WebSocket snapshot with a normalised environment payload, then replace the monolithic Overview markup with focused native JavaScript modules. A local architectural WebP supplies visual realism while responsive SVG/HTML layers supply live cables, the solar arc, instruments, interaction and accessibility.

**Tech Stack:** Home Assistant custom integration, Python 3.12, native JavaScript ES modules, Web Components, SVG, CSS animation, Node test runner, pytest, Ruff.

**Spec:** `docs/superpowers/specs/2026-09-16-main-dashboard-design.md`

## Global Constraints

- The same complete scene must work on wall displays, desktop, tablet and mobile.
- Runtime assets must be local; the dashboard must work without internet access.
- Power is normalised to watts and displayed as W below 1,000 W and kW from 1,000 W.
- Wind is always displayed in mph, converting from km/h, m/s or knots when required.
- Home Assistant `sun.sun` is the primary authority for day/night and sunrise/sunset.
- Missing, stale or ambiguous values must never be presented as measured zero.
- Motion must respect `prefers-reduced-motion`.
- Existing Battery Lab, Inverter, System Health, Raw Data and Settings pages must remain functional.

---

## File structure

- Modify `custom_components/energy_command_centre/discovery.py`: add environment, weather and optional solar-forecast discovery to the snapshot.
- Modify `custom_components/energy_command_centre/const.py`: bump the alpha version.
- Modify `custom_components/energy_command_centre/manifest.json`: keep its version in sync.
- Modify `custom_components/energy_command_centre/frontend/energy-command-centre-panel.js`: import the Overview modules, own selection state and render the new scene.
- Create `custom_components/energy_command_centre/frontend/overview/formatters.js`: unit conversion and time/progress calculations.
- Create `custom_components/energy_command_centre/frontend/overview/model.js`: convert the raw snapshot to a stable Overview model.
- Create `custom_components/energy_command_centre/frontend/overview/scene.js`: render the architectural, sky, flow, weather and interaction layers.
- Create `custom_components/energy_command_centre/frontend/overview/styles.js`: isolate responsive scene styling.
- Create `custom_components/energy_command_centre/frontend/assets/overview/house-day.webp`: high-detail transparent architectural artwork.
- Create `tests/test_environment.py`: backend discovery tests using lightweight state fixtures.
- Create `tests/overview_formatters.test.mjs`: formatter and solar-progress tests.
- Create `tests/overview_model.test.mjs`: direction, battery and unavailable-data tests.
- Create `tests/overview_scene.test.mjs`: rendered layer, accessibility and interaction-hook tests.

---

### Task 1: Overview formatting and time calculations

**Files:**
- Create: `custom_components/energy_command_centre/frontend/overview/formatters.js`
- Create: `tests/overview_formatters.test.mjs`

**Interfaces:**
- Produces: `formatPower(watts: number | null): string`
- Produces: `windToMph(value: number | null, unit: string | null): number | null`
- Produces: `formatWindMph(value: number | null, unit: string | null): string`
- Produces: `solarProgress(environment: object, now: Date): {mode: string, progress: number, remainingMs: number | null}`

- [ ] **Step 1: Write failing formatter tests**

```js
assert.equal(formatPower(742), "742 W");
assert.equal(formatPower(3280), "3.28 kW");
assert.equal(formatPower(null), "Unavailable");
assert.equal(formatWindMph(16.0934, "km/h"), "10.0 mph");
assert.equal(formatWindMph(10, "m/s"), "22.4 mph");
```

- [ ] **Step 2: Write failing solar-progress tests**

```js
const environment = {
  sun: {
    state: "above_horizon",
    previous_rising: "2026-09-16T06:00:00+00:00",
    next_setting: "2026-09-16T18:00:00+00:00",
  },
};
assert.deepEqual(solarProgress(environment, new Date("2026-09-16T12:00:00Z")), {
  mode: "day",
  progress: 0.5,
  remainingMs: 21600000,
});
```

- [ ] **Step 3: Run tests and confirm RED**

Run: `node --test tests/overview_formatters.test.mjs`  
Expected: FAIL because `overview/formatters.js` does not exist.

- [ ] **Step 4: Implement the pure formatter functions**

Use exact conversion factors: km/h × 0.621371, m/s × 2.23694, knots × 1.15078. Clamp progress to `[0, 1]`. Return unavailable for non-finite values.

- [ ] **Step 5: Run tests and confirm GREEN**

Run: `node --test tests/overview_formatters.test.mjs`  
Expected: all formatter and progress tests PASS.

- [ ] **Step 6: Commit**

```bash
git add custom_components/energy_command_centre/frontend/overview/formatters.js tests/overview_formatters.test.mjs
git commit -m "Add overview energy and weather formatters"
```

---

### Task 2: Normalised Overview model

**Files:**
- Create: `custom_components/energy_command_centre/frontend/overview/model.js`
- Create: `tests/overview_model.test.mjs`

**Interfaces:**
- Consumes: `formatPower()` from Task 1.
- Produces: `buildOverviewModel(snapshot: object): OverviewModel`.
- `OverviewModel` contains `solar`, `load`, `grid`, `battery`, `batteries`, `ev`, `environment`, `summary`, and `warnings`.
- Every flow contains `{watts, display, direction, available, entityId}`.

- [ ] **Step 1: Write failing role and direction tests**

Use literal snapshot fixtures covering solar generation, grid import, grid export, battery charge, battery discharge, EV charge and unavailable data. Assert exact directions: `in`, `out`, `charge`, `discharge`, `to_ev`, `idle`, or `unknown`.

- [ ] **Step 2: Write failing individual-battery tests**

Provide entities associated with two distinct device IDs and assert two stable packs with individual SOC values plus combined battery watts.

- [ ] **Step 3: Run tests and confirm RED**

Run: `node --test tests/overview_model.test.mjs`  
Expected: FAIL because the model module does not exist.

- [ ] **Step 4: Implement score-based role selection and safe directions**

Select candidates by category, unit and role terms. Preserve source entity IDs. Treat unknown sign semantics as `unknown`; do not animate these paths.

- [ ] **Step 5: Implement battery grouping**

Group by device ID first and device name second. Fall back to stable numbered groups only when no device association exists.

- [ ] **Step 6: Run tests and confirm GREEN**

Run: `node --test tests/overview_model.test.mjs`  
Expected: all model tests PASS.

- [ ] **Step 7: Commit**

```bash
git add custom_components/energy_command_centre/frontend/overview/model.js tests/overview_model.test.mjs
git commit -m "Add normalised overview energy model"
```

---

### Task 3: Environment data in the Home Assistant snapshot

**Files:**
- Modify: `custom_components/energy_command_centre/discovery.py`
- Create: `tests/test_environment.py`

**Interfaces:**
- Produces: `discover_environment(hass: HomeAssistant) -> dict[str, Any]`.
- Adds `environment` to `discover_energy_entities()` output.
- `environment.sun` includes state, next/previous rising and setting, elevation and azimuth.
- `environment.wind` includes value, unit, bearing, source entity and availability.
- `environment.moon_phase` and `environment.solar_forecast_remaining_kwh` are nullable.

- [ ] **Step 1: Write failing sun discovery tests**

Use a fake `sun.sun` state with literal attributes and assert that every required field is serialised without timezone conversion.

- [ ] **Step 2: Write failing wind priority and forecast tests**

Assert that a dedicated wind-speed sensor wins over a generic weather attribute, bearing is retained, and missing forecast returns `None`.

- [ ] **Step 3: Run tests and confirm RED**

Run: `uvx pytest -q tests/test_environment.py`  
Expected: FAIL because `discover_environment` is absent.

- [ ] **Step 4: Implement environment discovery**

Read `sun.sun` directly. Score sensor names containing `wind speed`, `wind bearing`, `solar forecast remaining`, `remaining today`, and `moon phase`. Fall back to the first available weather entity for wind attributes.

- [ ] **Step 5: Attach environment to the existing snapshot**

Add `"environment": discover_environment(hass)` alongside `entities` and `summary`.

- [ ] **Step 6: Run tests and confirm GREEN**

Run: `uvx pytest -q tests/test_environment.py tests/test_classifier.py`  
Expected: all backend tests PASS in the configured Home Assistant test environment; when Home Assistant is absent, run the existing lightweight package-loader harness for classifier tests.

- [ ] **Step 7: Commit**

```bash
git add custom_components/energy_command_centre/discovery.py tests/test_environment.py
git commit -m "Expose sun wind and solar forecast data"
```

---

### Task 4: Architectural asset and scene renderer

**Files:**
- Create: `custom_components/energy_command_centre/frontend/assets/overview/house-day.webp`
- Create: `custom_components/energy_command_centre/frontend/overview/scene.js`
- Create: `custom_components/energy_command_centre/frontend/overview/styles.js`
- Create: `tests/overview_scene.test.mjs`

**Interfaces:**
- Consumes: `OverviewModel` from Task 2 and `solarProgress()` from Task 1.
- Produces: `renderEnergyScene(model: OverviewModel, options: {selected: string | null, now: Date}): string`.
- Produces: `overviewStyles: string`.

- [ ] **Step 1: Create the architectural asset**

Generate a realistic transparent three-quarter architectural visualisation of a modern UK detached house with pitched tiled roof, roof solar panels, wall inverter, two distinct battery units, paved drive, wall charger and passenger car. Keep equipment positions unobstructed for overlay alignment. Export as a local WebP.

- [ ] **Step 2: Write failing layer tests**

Assert rendered HTML contains the architectural image, `sky-layer`, `celestial-arc`, `energy-flow-layer`, `wind-instrument`, individual battery hit areas, EV hit area and summary strip.

- [ ] **Step 3: Write failing accessibility and fallback tests**

Assert every equipment hit area has a button role and accessible label, unavailable flows have no active animation class, and an absent EV flow leaves the car visible without an EV value.

- [ ] **Step 4: Run tests and confirm RED**

Run: `node --test tests/overview_scene.test.mjs`  
Expected: FAIL because scene modules do not exist.

- [ ] **Step 5: Implement the scene and responsive styles**

Render a shared responsive coordinate system, architectural asset, SVG arc/cables, W/kW labels, individual batteries, wind dial in mph, summary strip and detail overlay hooks. Add dawn/day/dusk/night classes.

- [ ] **Step 6: Add restrained ambient elements**

Add CSS/SVG birds, rare aircraft with navigation lights, stars and shooting stars. Use bounded animation delays, one major event at a time and reduced-motion overrides.

- [ ] **Step 7: Run tests and confirm GREEN**

Run: `node --test tests/overview_scene.test.mjs`  
Expected: all scene tests PASS.

- [ ] **Step 8: Commit**

```bash
git add custom_components/energy_command_centre/frontend/assets/overview custom_components/energy_command_centre/frontend/overview tests/overview_scene.test.mjs
git commit -m "Build premium responsive energy house scene"
```

---

### Task 5: Panel integration and detail interactions

**Files:**
- Modify: `custom_components/energy_command_centre/frontend/energy-command-centre-panel.js`
- Modify: `tests/frontend_logo.test.mjs`

**Interfaces:**
- Consumes: `buildOverviewModel()`, `renderEnergyScene()`, and `overviewStyles`.
- Panel state adds `_selectedEquipment: string | null`.
- Equipment buttons expose `data-equipment`.
- Detail close controls expose `data-close-equipment`.

- [ ] **Step 1: Extend the frontend harness with interaction tests**

Assert Overview rendering includes the house scene, clicking a battery sets selection and renders its panel, Escape closes it, and existing navigation remains available.

- [ ] **Step 2: Run tests and confirm RED**

Run: `node --test tests/frontend_logo.test.mjs`  
Expected: new interaction assertions FAIL against the old Overview.

- [ ] **Step 3: Import and render the new modules**

Replace only `_overview()` and its obsolete flow CSS. Preserve Battery Lab, Inverter, System Health, Raw Data, Settings, header and navigation.

- [ ] **Step 4: Add event delegation and Escape handling**

Use one click handler on the shadow root for equipment open/close actions. Register and remove one keydown listener with the panel lifecycle.

- [ ] **Step 5: Run the complete frontend suite**

Run: `node --test tests/*.test.mjs`  
Expected: all frontend tests PASS.

- [ ] **Step 6: Commit**

```bash
git add custom_components/energy_command_centre/frontend/energy-command-centre-panel.js tests/frontend_logo.test.mjs
git commit -m "Integrate premium scene with equipment details"
```

---

### Task 6: Alpha release and verification

**Files:**
- Modify: `custom_components/energy_command_centre/const.py`
- Modify: `custom_components/energy_command_centre/manifest.json`
- Modify: `README.md`

**Interfaces:**
- Version becomes `0.1.0-alpha.3` in Python, manifest and frontend cache-busting references.

- [ ] **Step 1: Update version and README**

Set every runtime version reference to `0.1.0-alpha.3`. Add the premium house Overview, solar-day arc, live cables and environmental display to the alpha feature list.

- [ ] **Step 2: Run version consistency and static checks**

Run JSON validation, Python compilation, Node syntax checks, `git diff --check`, and a script asserting version equality across manifest, Python and frontend references.

- [ ] **Step 3: Run all tests**

Run: `node --test tests/*.test.mjs`  
Run: `uvx pytest -q tests/test_brand_assets.py tests/test_environment.py`  
Run the classifier package-loader harness.  
Expected: zero failures.

- [ ] **Step 4: Verify the packaged asset paths**

Confirm the HACS-installed tree includes every `frontend/overview/` module and `frontend/assets/overview/house-day.webp`, and every local URL resolves under the registered static directory.

- [ ] **Step 5: Commit and publish**

```bash
git add custom_components README.md tests
git commit -m "Release premium overview alpha 3"
```

Publish the commit to `Adya84/ha-energy-command-centre` `main`, then verify the remote manifest reports `0.1.0-alpha.3` and the scene asset is present.

- [ ] **Step 6: Provide HACS update instructions**

Tell the tester to use HACS **Redownload**, restart Home Assistant and hard-refresh the browser. State that this is an alpha visual/data review release and request screenshots of alignment or entity-mapping issues.
