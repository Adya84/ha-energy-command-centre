# Energy Command Centre 0.1.0-alpha.11

This release adds live, direction-aware energy cable flows to the premium house overview.

## What changed

- Shows the live power value and purpose on every cable: generating, importing, exporting, charging, discharging or using.
- Automatically formats smaller readings in watts and larger readings in kilowatts.
- Animates solar, grid, battery, home and EV flows in the real direction reported by Home Assistant.
- Stops animation for idle or unavailable sensors and visually distinguishes unavailable flows.
- Varies pulse speed with the amount of power moving through the cable.
- Adds an **I have an EV** control that hides the EV cable, flow label, card and summary when disabled.
- Remembers the EV choice on the current browser or device.
- Corrects live-card power formatting so sensor objects are never displayed as invalid values.

## Updating

Update through HACS, restart Home Assistant, then hard-refresh the Energy Command Centre page.
