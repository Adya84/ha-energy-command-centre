# Energy Command Centre

An independent, manufacturer-neutral Home Assistant energy command centre. It combines data already available in Home Assistant into a modern sidebar dashboard with automatic entity discovery, battery cell visibility and system-health checks.

> Early alpha: the current build is read-only and intended for development testing.

## Current alpha features

- Native Home Assistant configuration flow
- Responsive sidebar application
- Automatic capability-based discovery without fixed entity IDs
- Live solar, home, grid, battery and EV overview
- Animated power-flow dashboard
- Battery Lab with individual cell voltage detection and pack spread
- Inverter, solar and grid data views
- System Doctor checks for unavailable and stale entities
- Searchable raw energy data view
- Five-second local refresh

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

Copyright © 2026 Adrian Apel. All rights reserved during the early development phase. A public project licence will be chosen before general release.
