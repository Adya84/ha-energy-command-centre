# Energy Command Centre 0.1.0-alpha.8

House rendering fix.

## What changed

- Renders the approved realistic house/car scene as a real `<img>` element inside the Overview stage.
- Removes the CSS `background-image` rendering path that was silently failing in Home Assistant.
- Keeps the image bundled inside the frontend, so no separate image HTTP request is required.
- Keeps live Solar, Home, Grid, Battery, EV and Inverter overlays and click interactions.
- Adds stronger regression checks that validate the bundled JPEG markers and require the real image element.

## Testing

After updating, restart Home Assistant, hard-refresh the browser, then open **Energy Hub**.
