# Energy Command Centre Main Dashboard Design

**Date:** 2026-09-16  
**Status:** Approved design, ready for implementation planning

## Purpose

Replace the current abstract power-flow card with a premium, responsive energy scene centred on a realistic modern UK detached house. The dashboard must communicate the live state of the home at a glance while remaining visually impressive enough for a wall display.

The scene combines high-detail architectural artwork with native SVG and HTML overlays. The artwork provides realism; the overlays provide accurate live data, responsive layout, animation and interaction.

## Scope

This design covers the main Overview dashboard only:

- realistic house scene and environmental effects;
- live solar, house, grid, battery and EV power flow;
- individual battery presentation;
- day/night and solar-day information;
- wind speed and direction;
- equipment detail overlays;
- responsive behaviour and accessibility.

Battery Lab, Inverter, System Health, Raw Data and Settings remain separate pages. Inverter controls, charging schedules and manual entity mapping are not added to the Overview in this phase.

## Visual direction

### Architectural scene

The centrepiece is a realistic modern UK detached house viewed from a three-quarter perspective. It includes:

- brick-and-render exterior;
- pitched tiled roof with a properly integrated solar array;
- detailed glazing, guttering and exterior lighting;
- paved driveway, restrained planting and garden edges;
- wall-mounted inverter;
- separately visible physical battery packs;
- wall-mounted EV charger;
- realistic passenger car on the drive;
- grid connection at the property boundary.

The house must look like a polished architectural visualisation, not clip-art, a wireframe or a generic dashboard mock-up. The scene occupies most of the Overview and is not confined to a small conventional card.

### Asset strategy

Use a hybrid rendering approach:

1. A high-resolution, transparent architectural base asset provides realistic materials, depth and shadows.
2. Matched transparent overlays provide illuminated windows and exterior lights at night without changing the house geometry.
3. SVG supplies cables, solar arc, weather instrument, hit areas, highlights and live labels.
4. CSS supplies colour grading, sky transitions, glows and low-cost ambient motion.

All runtime assets ship inside the integration. The dashboard must not depend on an external image host or internet connection.

## Scene layers

The Overview is composed in this order:

1. **Sky:** daylight gradient, dawn/dusk colour, night sky and stars.
2. **Ambient life:** birds, passenger aircraft and shooting stars.
3. **Architectural artwork:** property, house, equipment and car.
4. **Environment instruments:** solar-day arc and wind instrument.
5. **Energy flow:** cables, moving pulses, arrows and values.
6. **Interaction:** equipment hit areas, focus states and detail panels.
7. **Summary strip:** today's key energy totals below the scene.

Decorative layers never obscure live values or accept pointer events.

## Day, night and solar-day arc

Home Assistant's `sun.sun` entity is the authority for day/night state and local sunrise/sunset times.

### Day mode

- The sun moves along a curved solar-day arc from sunrise to sunset.
- The completed arc shows elapsed daylight.
- The remaining arc shows daylight still available.
- Labels show current solar power, sunset time and daylight remaining.
- When a compatible forecast is available, the arc also shows estimated solar generation remaining today in kWh.
- The uncompleted arc may vary subtly in brightness to communicate forecast strength.

### Night mode

- The moon follows the arc from sunset to the next sunrise.
- The scene shows next sunrise and time remaining until sunrise.
- Today's final solar generation remains available in the summary strip.
- If a moon-phase entity exists, the moon uses the reported phase; otherwise it uses a restrained crescent.
- Stars appear and twinkle subtly.
- Shooting stars occur occasionally at irregular intervals.
- Windows and exterior lights illuminate using a matched overlay.

Transitions through dawn, daylight, dusk and night are gradual. A missing `sun.sun` entity falls back to Home Assistant local time with conservative fixed day/night thresholds and a visible diagnostic flag outside the main scene.

## Ambient life

Ambient movement adds life without competing with data:

- small groups of birds occasionally cross the daytime sky;
- a distant passenger aircraft rarely crosses the scene;
- the aircraft carries subtle red and green navigation lights and a flashing beacon;
- shooting stars are restricted to night mode;
- intervals are randomised within bounded ranges so motion is not repetitive;
- only one major ambient event runs at a time;
- all ambient motion is disabled when `prefers-reduced-motion` is active.

## Wind instrument

A realistic rooftop weather vane/anemometer connects to a compact dial near the house:

- direction follows the best available wind-bearing entity or weather attribute;
- the vane rotates to the reported bearing;
- the anemometer animation scales with wind speed;
- the display unit is always mph;
- km/h, m/s and knots are converted to mph before display;
- the original source value and unit remain unchanged in Home Assistant;
- unavailable or stale values stop the animation and show an unavailable state;
- when no reliable wind data exists, the instrument and dial hide without leaving a gap.

## Energy-flow model

The scene supports these logical paths:

- solar to inverter;
- inverter to house;
- battery to or from inverter;
- grid to or from house;
- house to EV charger and car.

Each path remains faintly visible at zero power. Active paths display moving pulses and an adjacent live value.

### Direction and colour

- Solar flow uses gold.
- Battery flow uses green.
- Grid flow uses cyan.
- EV flow uses blue.
- Direction reverses for grid import/export and battery charge/discharge.
- Animation speed and glow strength scale within capped ranges based on absolute power.
- Direction is shown by motion rather than a negative sign in the primary label.

If entity semantics are ambiguous, the flow stays neutral and reports that mapping needs attention. The UI must never invent a direction from an unknown sign convention.

### Power formatting

All power is normalised internally to watts:

- absolute values below 1,000 W display as whole watts, for example `742 W`;
- values of 1,000 W or more display as kW, normally with two decimal places, for example `3.28 kW`;
- trailing zeroes may be suppressed when this improves readability;
- the displayed unit can change live without moving the label significantly.

## Batteries

Each detected physical battery is visible as a separate pack beside the house.

Every pack shows:

- friendly pack name or a stable fallback such as Battery 1;
- state of charge;
- availability/health indicator;
- a clickable hit area.

The cable between the battery bank and inverter displays combined battery power. The direction shows combined charge or discharge. Tapping an individual pack opens its own detail panel rather than a combined battery panel.

## Equipment interaction

Solar panels, house, inverter, each battery, grid connection, EV charger and car are keyboard- and pointer-accessible.

Activating an item opens a glass-style detail panel over the scene. The panel contains the most useful live readings and a clear link to the full technical page. It must close via its close button, the Escape key or a click outside the panel.

Examples:

- **Solar:** current generation, today's generation and forecast remaining.
- **House:** current consumption and today's consumption.
- **Grid:** import/export state, current power and today's totals.
- **Inverter:** current status, temperature and operating mode when available.
- **Battery:** pack SOC, power, temperature and key BMS health values.
- **EV:** connection state, charge power and session energy when available.

Unavailable readings are labelled unavailable rather than replaced with zero.

## Summary strip

A compact strip below the scene shows, when data is available:

- solar generation today;
- home consumption today;
- grid import today;
- grid export today;
- combined and individual battery SOC;
- EV energy today or current session;
- cost and earnings today;
- solar forecast remaining.

The strip supports horizontal scrolling on the narrowest screens without changing the scene above it.

## Responsive behaviour

The same complete house scene is used on wall displays, desktop, tablet and mobile.

- A shared SVG `viewBox` keeps artwork and overlays aligned.
- The scene scales as one composition rather than rearranging equipment independently.
- At narrow widths, nonessential labels collapse to icon-plus-value chips.
- Detail panels become bottom sheets on phones.
- The summary strip scrolls horizontally on small screens.
- Touch targets remain at least 44 CSS pixels.
- The house remains the dominant visual at every breakpoint.

There is no separate simplified mobile dashboard.

## Data architecture

The backend snapshot expands beyond the existing energy-entity list to expose a normalised Overview model:

- power roles: solar, load, grid, battery and EV;
- direction confidence and source entity IDs;
- individual battery grouping;
- daily energy totals;
- solar forecast remaining when available;
- `sun.sun` state, next rising, next setting, elevation and azimuth;
- moon phase when available;
- wind speed, source unit and bearing;
- freshness and availability metadata.

Automatic discovery remains manufacturer-neutral. GivTCP is the first deeply tested source, but the normalised model must not depend on GivEnergy entity IDs. Device association, device class, state class, unit, integration platform, friendly name and unique ID metadata are scored together.

Discovery returns the chosen entity and a confidence level for each role. Low-confidence or conflicting roles remain visibly unresolved until the later manual-mapping settings work is added.

## Frontend structure

The current monolithic panel is divided into native JavaScript modules with no build step:

- `overview/energy-scene.js` coordinates the scene;
- `overview/sky-layer.js` renders time, sun, moon and ambient events;
- `overview/flow-layer.js` renders cables and flow animation;
- `overview/weather-instrument.js` renders wind information;
- `overview/detail-panel.js` handles equipment overlays;
- `overview/formatters.js` normalises display units and time;
- `energy-command-centre-panel.js` remains the application shell and navigation owner.

Architectural and environmental assets live under `frontend/assets/overview/` and are served by the integration's existing local static route.

## Performance and accessibility

- Prefer transforms and opacity for animation.
- Avoid continuous JavaScript layout work.
- Pause nonessential animation when the page is hidden.
- Respect `prefers-reduced-motion` by replacing animated pulses with directional arrows and disabling ambient motion.
- Provide accessible names for every interactive item.
- Maintain readable contrast across all sky states.
- Load the architectural base before activating overlays to avoid visible misalignment.
- Keep total Overview assets within a practical Home Assistant LAN-loading budget; use WebP or AVIF with PNG fallback only where alpha support requires it.

## Error and fallback behaviour

- Missing power data leaves the cable inactive and labels it unavailable.
- Stale data displays a warning state and stops flow animation.
- Missing forecast data removes only the forecast-remaining value; daylight progress continues.
- Missing wind data removes the wind instrument.
- Missing moon phase uses a crescent.
- Missing EV data keeps the car and charger as scenery but removes the EV cable/value.
- Missing individual battery metadata falls back to stable numbered packs.
- Backend or WebSocket failure preserves the last valid scene with a stale-data banner rather than replacing the whole dashboard.

## Testing strategy

### Unit tests

- W/kW formatting boundaries;
- wind conversion to mph from every supported unit;
- grid and battery direction normalisation;
- sunrise/sunset progress and overnight progress;
- remaining daylight calculations;
- forecast-present and forecast-absent behaviour;
- individual battery grouping and stable fallback names.

### Component tests

- all expected scene layers render;
- flow classes and directions match normalised input;
- unavailable data stops animation;
- equipment opens the correct detail panel;
- keyboard and Escape interactions work;
- reduced-motion mode removes ambient and flow animation;
- day, dusk and night visual states select the correct overlays.

### Responsive and visual checks

- desktop, wall-display, tablet and phone viewport snapshots;
- alignment between architectural artwork, cables and hit areas;
- contrast and label readability in every sky state;
- no clipping of the celestial arc, house, car or summary strip.

## Acceptance criteria

The Overview is ready when:

1. It presents a high-quality modern UK house rather than an abstract node diagram.
2. The same complete scene works on desktop, tablet and mobile.
3. Solar, house, grid, battery and EV flows animate in the correct direction with live W/kW values.
4. Individual batteries are separately visible and interactive.
5. The solar-day arc shows sun position, daylight remaining and forecast energy remaining when available.
6. Day, dusk and night follow Home Assistant local sun data.
7. Night includes stars, occasional shooting stars and realistic house lighting.
8. Daytime includes occasional birds and a rare passenger aircraft with navigation lights.
9. Wind direction and mph speed appear when reliable wind data exists.
10. Missing, stale or ambiguous data is clearly represented without fabricated values.
11. Reduced-motion mode remains fully usable.
12. No runtime asset requires internet access.
