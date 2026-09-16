# Energy Command Centre 0.1.0-alpha.7

Runtime house-image fix.

## What changed

- Bundles the approved realistic house/car scene directly into the ECC frontend as an inline image asset.
- Removes the runtime dependency on Home Assistant serving the house through a separate image URL.
- If the ECC panel JavaScript loads, the house image is delivered with it.
- Keeps live Solar, Home, Grid, Battery, EV and Inverter overlays and clickable equipment.
- Keeps Battery Lab, Inverter, System Health, Raw Data and Settings.

## Testing

After updating, restart Home Assistant, then hard-refresh the browser/app and open **Energy Hub**.
