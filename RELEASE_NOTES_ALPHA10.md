# Energy Command Centre 0.1.0-alpha.10

This release repairs the premium overview artwork.

## What changed

- Replaces the corrupted, incomplete house image with the full approved 1672 × 941 PNG.
- Serves the artwork through a dedicated Home Assistant static route.
- Removes the broken embedded fallback and incomplete WebP asset.
- Adds a regression test that verifies the PNG signature and guards against a truncated image being released again.

## Updating

Update through HACS, restart Home Assistant, then hard-refresh the Energy Command Centre page.
