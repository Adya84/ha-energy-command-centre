# Energy Command Centre 0.1.0-alpha.9

Main dashboard recovery release.

## What changed

- Restores the approved realistic modern UK house and real-car Overview from alpha.8.
- Removes the accidental stale alpha.3 dashboard replacement.
- Publishes the entire release atomically so GitHub Actions cannot test a half-uploaded set of files.
- Keeps the bundled house image, live Solar, Home, Grid, Battery, EV and Inverter overlays, and click interactions.
- Preserves Battery Lab, Inverter, System Health, Raw Data and Settings.

## Testing

After updating, restart Home Assistant, hard-refresh the browser, then open **Energy Hub**.
