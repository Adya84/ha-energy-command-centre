# Energy Command Centre 0.1.0-alpha.4

Premium Overview test build.

## What changed

- Replaces the abstract Overview with the premium modern UK house energy scene.
- Live solar, home load, grid, battery, inverter and EV presentation from Home Assistant discovery data.
- Animated directional energy-flow cables with W/kW formatting.
- Day/night presentation using `sun.sun` where available, with local-time fallback.
- Sun/moon progress arc, stars, lit windows, shooting-star effect, birds and occasional aircraft.
- Wind display in mph when a compatible source is available.
- Click/tap the solar array, house, grid, inverter, batteries or EV to open a live equipment detail drawer.
- Keyboard-accessible equipment targets and reduced-motion support.
- Existing Battery Lab, Inverter, System Health, Raw Data and Settings pages remain available.
- Adds automated frontend contract tests alongside HACS and Hassfest validation.

## Testing

After updating, restart Home Assistant, hard-refresh the browser/app frontend and open **Energy Hub** from the sidebar.

Release creation is gated by frontend tests, HACS validation and Hassfest on the exact release commit.

This remains an early read-only alpha. It does not write inverter settings or alter energy devices.
