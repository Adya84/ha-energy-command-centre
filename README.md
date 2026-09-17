# Energy Command Centre

<p align="center">
  <img src="custom_components/energy_command_centre/brand/icon@2x.png" width="240" alt="Energy Command Centre logo">
</p>

An independent, manufacturer-neutral Home Assistant energy command centre. It combines data already available in Home Assistant into a modern sidebar dashboard with automatic entity discovery, battery cell visibility and system-health checks.

> Early alpha: the current build is read-only and intended for development testing.

## Installation

See the complete **[installation guide](INSTALL.md)** for HACS, manual installation, updating and troubleshooting.

## Current alpha features

- Premium responsive Overview built around a modern UK house scene
- Live solar, home, grid, battery, inverter and EV values using automatic discovery
- Animated directional power flows with automatic W/kW formatting
- Day/night scene driven by Home Assistant sun data, with local-time fallback
- Sun/moon progress arc, stars, lit windows, birds, occasional aircraft and reduced-motion support
- Wind display in mph when a compatible weather or wind sensor is available
- Clickable solar array, house, grid, inverter, battery bank and EV with live detail drawers
- Native Home Assistant configuration flow
- Battery Lab with individual cell voltage detection and pack spread
- Inverter, solar and grid data views
- System Doctor checks for unavailable and stale entities
- Searchable raw energy data view
- Five-second local refresh
- Existing Battery Lab, Inverter, System Health, Raw Data and Settings pages retained alongside the premium Overview

The universal discovery layer currently recognises common entity metadata from GivEnergy/GivTCP, Solis, Sunsynk/Deye, FoxESS, SolarEdge, Enphase, Tesla Powerwall, Fronius, GoodWe, Victron, Growatt, Huawei, SMA, Sigenergy and Pylontech systems. GivEnergy is the first hardware family being tuned and tested in depth; other systems will gain dedicated adapters as we obtain real-world entity data.

## Planned

- Guided sensor mapping and dashboard customisation
- Safe inverter controls and schedules
- Multiple battery packs with pack-aware cell grouping
- PredBat plan visualisation and explanations
- Octopus tariff and Intelligent Go support
- Hypervolt/EV charging controls
- Historical battery-cell analysis and anomaly detection
- Notifications, guided fixes and advanced reports

## Development installation

1. Copy `custom_components/energy_command_centre` into the `custom_components` directory in your Home Assistant configuration.
2. Restart Home Assistant.
3. Open **Settings → Devices & services → Add integration**.
4. Search for **Energy Command Centre** and complete setup.
5. Open **Energy Hub** from the sidebar.

The alpha reads existing Home Assistant states only. It does not write inverter settings or send energy information to an external service.

## Independence

This community project is not affiliated with or endorsed by any inverter, battery, charger or energy supplier manufacturer. Product names are used only to describe compatibility.

## Licence

Released under the MIT License. See `LICENSE`.
