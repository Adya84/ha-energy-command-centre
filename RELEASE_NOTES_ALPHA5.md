# Energy Command Centre 0.1.0-alpha.5

Realistic Overview test build.

## What changed

- Replaces the drawn/cartoon-style house scene with the approved premium realistic modern UK house render.
- Uses a realistic car, roof solar, wall-mounted inverter, battery packs and EV charger as the main dashboard visual.
- Live Home Assistant cards cover the example values in the render and show current Solar, Home, Grid, Battery, EV and Inverter data.
- Equipment remains clickable/tappable and opens the live detail drawer.
- Existing Battery Lab, Inverter, System Health, Raw Data and Settings pages are preserved.
- Responsive scaling keeps the scene usable on desktop, tablet and mobile.
- Frontend contract tests now validate the realistic renderer rather than the retired SVG scene.

## Testing

After updating, restart Home Assistant, hard-refresh the browser/app frontend and open **Energy Hub** from the sidebar.

Release creation is gated by frontend tests, HACS validation and Hassfest on the exact release commit.

This remains an early read-only alpha. It does not write inverter settings or alter energy devices.
