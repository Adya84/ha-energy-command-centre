# Premium Main Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the abstract Overview power-flow card with the approved premium UK-house energy scene while preserving all existing ECC pages.

**Architecture:** Keep the existing panel as the application shell. Load a thin wrapper module that imports the current panel and patches only its Overview renderer/styles with focused native-JavaScript overview modules. The first preview uses a detailed self-contained SVG/CSS architectural scene so it works offline and can be released immediately; live values are derived from the existing discovery snapshot and remain manufacturer-neutral.

**Tech Stack:** Home Assistant custom panel, native JavaScript ES modules, SVG, CSS, Python integration metadata.

**Spec:** `docs/superpowers/specs/2026-09-16-main-dashboard-design.md`

## Global Constraints

- No runtime internet dependency.
- Preserve the existing Battery Lab, Inverter, System Health, Raw Data and Settings pages.
- Power display switches from W to kW at 1,000 W.
- Active flow direction is represented visually; ambiguous or unavailable values must not fabricate a direction.
- Day/night should use Home Assistant `sun.sun` when available, with local-time fallback.
- Wind is displayed in mph when a compatible source is found.
- Respect `prefers-reduced-motion`.

---

### Task 1: Overview formatters and state helpers

**Files:**
- Create: `custom_components/energy_command_centre/frontend/overview/formatters.js`
- Test: `tests/overview_formatters.test.mjs`

**Interfaces:**
- Produces `watts(entity)`, `formatPower(entity)`, `windMph(value, unit)`, `direction(value, positiveName, negativeName)`, `entityValue(entity)`.

- [ ] Write formatter tests first for W/kW boundary, kW conversion, wind units and sign direction.
- [ ] Run with `node --test tests/overview_formatters.test.mjs` and confirm failure because the module does not exist.
- [ ] Implement the helpers with no dependencies.
- [ ] Run the test and confirm it passes.

### Task 2: Premium SVG energy scene

**Files:**
- Create: `custom_components/energy_command_centre/frontend/overview/energy-scene.js`
- Test: `tests/overview_scene.test.mjs`

**Interfaces:**
- Consumes existing snapshot shape `{entities, summary, generated_at}` and optional `hass.states`.
- Produces `renderEnergyScene(snapshot, hass)` and `overviewSceneStyles()`.

- [ ] Write scene contract tests first for the house, solar, battery, inverter, EV, grid, celestial arc, wind instrument, summary strip and reduced-motion rules.
- [ ] Run the test and confirm failure because the scene module does not exist.
- [ ] Implement a responsive 1600×900 SVG/CSS scene with a detailed modern UK detached house, paved drive, car, roof array, inverter, two battery packs, charger and grid boundary.
- [ ] Add live flow paths/labels for solar, house, battery, grid and EV, switching W/kW and reversing grid/battery animation from sign.
- [ ] Add sun/moon arc, stars, shooting star, birds, aircraft, lit windows and day/night CSS states.
- [ ] Add wind dial/anemometer and summary chips using discoverable data.
- [ ] Add accessible buttons/hit areas and reduced-motion fallbacks.
- [ ] Run scene tests and confirm pass.

### Task 3: Integrate without breaking existing pages

**Files:**
- Create: `custom_components/energy_command_centre/frontend/energy-command-centre-app.js`
- Modify: `custom_components/energy_command_centre/__init__.py`
- Test: `tests/overview_entrypoint.test.mjs`

**Interfaces:**
- Wrapper imports the existing `energy-command-centre-panel.js`, then replaces only `_overview` and extends `_styles` on the registered panel class.

- [ ] Write entrypoint test first, asserting the wrapper imports both modules and patches only Overview/style hooks.
- [ ] Confirm failure while the wrapper is absent.
- [ ] Implement wrapper and point Home Assistant panel registration at it.
- [ ] Run tests and confirm pass.

### Task 4: Preview release metadata

**Files:**
- Modify: `custom_components/energy_command_centre/manifest.json`
- Modify: `README.md`

- [ ] Bump integration version to `0.1.0-alpha.3`.
- [ ] Document the premium Overview preview and retained existing pages.
- [ ] Re-run all Node tests and existing Python tests where available.
- [ ] Verify HACS/hassfest compatibility through GitHub checks after push.
