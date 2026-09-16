# Energy Command Centre 0.1.0-alpha.7

Realistic house runtime fix.

## What changed

- Bundles the approved realistic house/car image directly into the frontend JavaScript as an inline data asset.
- Removes the runtime dependency on Home Assistant serving the house as a separate image URL.
- If the ECC frontend loads, the realistic house image now loads with it.
- Keeps live Solar, Home, Grid, Battery, EV and Inverter overlays and clickable equipment.
- Keeps Battery Lab, Inverter, System Health, Raw Data and Settings.
- Removes the now-unnecessary dedicated house static route.

## Testing

After updating, restart Home Assistant, then hard-refresh the browser/app and open **Energy Hub**.
