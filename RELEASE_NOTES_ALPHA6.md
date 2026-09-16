# Energy Command Centre 0.1.0-alpha.6

House image delivery fix.

## What changed

- Registers the realistic premium house image as an explicit Home Assistant static asset instead of relying on the nested frontend asset route.
- Uses a new cache-busted house image URL so browsers/apps cannot reuse the broken alpha.5 path.
- Keeps the realistic house, car, solar, inverter, batteries and EV charger scene with live Home Assistant overlays and clickable equipment.
- Keeps the existing Battery Lab, Inverter, System Health, Raw Data and Settings pages.
- CI is now scoped so development branch pushes do not create noisy main-branch failures, and stale runs are cancelled.

## Testing

After updating, restart Home Assistant, then fully reload or hard-refresh the browser/app and open **Energy Hub**.
