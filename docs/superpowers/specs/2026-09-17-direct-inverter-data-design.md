# Direct Inverter Data Source Design

## Purpose

Energy Command Centre (ECC) must use the inverter itself as the source of truth for energy-system data. The user supplies the inverter's local IP address during setup, ECC connects directly to that inverter over the local network, identifies the inverter and attached batteries, reads the available registers, normalises the values, and feeds the dashboard from that direct data.

ECC must not depend on pre-existing Home Assistant entities, GivTCP-created entities, MQTT entities, guessed entity names, or discovery/classification as the primary data source for inverter, battery, solar, grid, or household energy values.

The intended behaviour is similar to INVLocal's local-data model: direct local connection, automatic hardware detection, fast live telemetry, slower detailed telemetry, local diagnostics, and no cloud dependency for normal operation. ECC will implement its own Home Assistant-native architecture and UI rather than copying INVLocal's interface.

## Scope

This design covers direct read access to GivEnergy hardware first, while creating a clean driver boundary so other inverter manufacturers can be added later without changing the dashboard architecture.

The initial direct driver is read-only. Existing or future control/write features are deliberately out of scope for this change and must be added behind an explicit write-enabled control layer later.

Initial GivEnergy support should be capability-driven rather than hard-coded to one model and should be structured to support, where register compatibility permits:

- Hybrid Gen 1
- Hybrid Gen 2
- Hybrid Gen 3
- AC-coupled systems
- All-in-One / AIO systems
- high-voltage battery systems
- gateways / EMS-style devices

The first acceptance fixture must represent a Hybrid Gen 2 system with two batteries.

## Source-of-truth rule

All values that the inverter can provide must come from the direct inverter connection.

This includes, where exposed by the connected model:

- inverter identity, model, serial number, firmware and status
- inverter temperatures and operating state
- PV/solar power and available PV strings
- house/load power
- grid import/export power and direction
- battery charge/discharge power and direction
- battery state of charge
- battery count and battery identity
- battery voltage, current, temperature and health/status data
- battery capacity where exposed
- per-cell battery voltages where exposed
- charge/discharge limits and configured targets where readable
- daily generation, consumption, import, export, charge and discharge totals
- lifetime/all-time energy totals
- grid voltage, current and frequency where exposed
- PV voltage/current per available string where exposed
- fault/status codes and diagnostic flags where exposed
- raw diagnostic/register data required to troubleshoot compatibility
- other diagnostic values exposed by the inverter register map

Home Assistant entity discovery must not silently replace any of these values if direct inverter communication is unavailable. If the inverter cannot be reached, ECC should report the inverter as unavailable rather than present potentially inconsistent values from unrelated HA entities.

Information the inverter cannot know may remain separate optional enrichment. Examples include weather, solar forecasts, tariff information, PredBat plans and EV-charger-specific data. These sources must never override inverter-derived energy values.

## Connection and discovery model

For GivEnergy, ECC will connect directly to the local inverter/data-adapter IP using the supported local Modbus-TCP interface. The default Modbus port is `8899`, with the port retained as an advanced configurable option.

ECC should support two setup paths:

1. **Automatic local discovery** where practical and safe, allowing compatible GivEnergy devices on the local network to be offered to the user.
2. **Manual IP entry** as the reliable fallback and always-available setup path.

Manual setup flow:

1. User enters the inverter IP address.
2. ECC attempts a read-only connection on port `8899` unless overridden.
3. ECC validates that a compatible GivEnergy device responds.
4. ECC reads identity/model information.
5. ECC discovers supported capabilities and attached batteries from the inverter data.
6. ECC stores the connection configuration only after successful validation.
7. ECC starts the shared data coordinator and dashboard.

The IP address is the required persistent connection field. Battery count, inverter model, hardware family and supported measurements should be detected rather than manually entered wherever the protocol exposes enough information to do so.

ECC should reconnect automatically to the last working configured device after Home Assistant restarts or the inverter temporarily disappears.

## Architecture

### 1. Inverter client

A focused low-level client owns the TCP/Modbus connection and register reads. It has no Home Assistant UI logic and no dashboard-specific formatting.

Responsibilities:

- open/close connections
- perform read-only Modbus requests
- apply timeouts and retry policy
- expose raw decoded values
- expose raw register blocks for diagnostics where safe
- identify communication/protocol errors
- avoid overlapping requests to the same device

### 2. Manufacturer driver

A `GivEnergy` driver maps model-specific register data into ECC's manufacturer-neutral plant model.

Responsibilities:

- detect inverter family/model
- choose the correct register/capability map
- detect battery count/capabilities
- detect PV string count/capabilities
- convert raw register values and units
- handle model-specific unavailable fields
- expose one normalised snapshot

Other manufacturer drivers can later implement the same interface.

### 3. Normalised plant snapshot

The rest of ECC consumes one stable structure instead of individual HA entities or raw registers.

The snapshot should group data by purpose, for example:

- `inverter`
- `solar`
- `home`
- `grid`
- `battery_bank`
- `batteries[]`
- `energy_today`
- `energy_total`
- `diagnostics`
- `capabilities`
- `connection`

Each field should carry a value, unit where relevant, availability and source timestamp. Missing hardware capabilities should be represented as unavailable rather than guessed.

### 4. Dual-rate data coordinator

ECC should not read every possible register at the same frequency. The coordinator should split polling into fast live telemetry and slower detailed telemetry, similar to the behaviour expected from a dedicated local monitoring app.

**Fast live poll — target every 5 seconds**

- PV power
- house/load power
- grid import/export power and direction
- battery charge/discharge power and direction
- battery SOC
- core inverter operating state
- connection health

**Detailed telemetry poll — target every 30 seconds initially**

- inverter temperatures
- battery voltage/current/temperature
- battery identities and capacities
- cell voltages where available
- firmware/model details
- daily and lifetime energy totals
- PV voltages/currents
- grid voltage/current/frequency
- limits/targets that are readable
- detailed fault/status diagnostics

Static identity/capability data should be refreshed on initial connection and after reconnect/model change rather than unnecessarily polled continuously.

The coordinator should:

- prevent overlapping polls
- keep the last successful snapshot and its timestamp
- mark data stale after a defined threshold
- expose connection state separately from data values
- reconnect automatically after transient failures
- avoid aggressive reconnect loops
- re-run capability detection after a meaningful reconnect

Polling intervals may become configurable later, but the first implementation should use one safe built-in set of defaults.

### 5. WebSocket/frontend boundary

The existing ECC WebSocket overview endpoint should return the normalised direct-inverter snapshot, not a scan of Home Assistant's state machine.

The current dashboard can retain its visual components while changing the data feeding them.

The frontend must not know Modbus register addresses or manufacturer-specific details.

## Dashboard information requirements

ECC should expose the full useful local information set available from the inverter, not just the five headline flow values.

The UI should be able to present:

- live solar generation
- current house consumption
- current grid import/export
- current battery charge/discharge
- battery SOC
- inverter status
- inverter model and firmware
- battery count and per-battery information
- battery temperatures, voltages, currents and available health data
- PV string voltages/currents and power where exposed
- grid voltage/frequency and related electrical data where exposed
- inverter temperatures
- today's solar generation
- today's house consumption where exposed
- today's import/export
- today's battery charge/discharge totals
- lifetime generation/import/export totals where exposed
- faults, warnings and diagnostic state
- stale/offline state and last successful update time

If a model does not expose a field, ECC must show it as unavailable rather than estimate it from unrelated Home Assistant sensors.

## Local diagnostics

ECC should provide a diagnostics capability suitable for troubleshooting direct local communication and hardware compatibility.

Diagnostics should include:

- configured host and port, with secrets/sensitive details redacted as appropriate
- detected inverter family/model
- firmware/identity summary
- detected battery count and capability summary
- connection status
- last successful fast poll
- last successful detail poll
- latest error category
- stale-data age
- supported/unsupported capability list
- raw register dump/export for troubleshooting
- normalised plant snapshot dump/export

Diagnostics are read-only. Raw dumps should be available on demand rather than logged continuously.

## Configuration flow

The current empty setup form must be replaced.

Required field:

- Inverter IP address

Advanced field:

- Modbus port, default `8899`

Setup should provide clear validation errors for:

- invalid IP/hostname format
- connection timeout
- connection refused
- device responds but is not recognised as a supported GivEnergy inverter
- protocol response invalid/incomplete

If automatic discovery finds one or more compatible devices, the user should be able to select one and continue through the same validation path.

The config entry should store the host and port. It must not store values discovered from the inverter as if they were user configuration; discovered model/capability information belongs in runtime/device information.

## Device and entity relationship

ECC remains a Home Assistant integration, but HA entities are outputs/representations of the direct inverter data rather than inputs required to make ECC work.

A later implementation may expose selected normalised values as native HA sensor entities. That is useful for automations but is not required for the first direct-data cut if it would delay replacing the current discovery path.

## Removal of current discovery dependency

The current `discover_energy_entities()` path searches the entire Home Assistant state machine and classifies matching entities by names/terms. That mechanism must no longer feed the main ECC energy dashboard once direct inverter mode is implemented.

It may be retained temporarily only for explicitly separate enrichment sources that cannot be obtained from the inverter, or removed if no longer needed.

There must be no automatic fallback from direct inverter data to guessed HA energy entities.

## Failure behaviour

ECC must fail visibly and safely.

If communication fails:

- connection state becomes `offline` or `error`
- last successful data may remain visible only if clearly marked stale
- no stale value should be presented as current without its stale state
- ECC retries on the coordinator schedule with bounded backoff/reconnect behaviour
- diagnostics expose the latest error category and last successful poll time

If only some registers are unsupported:

- supported measurements continue updating
- unsupported measurements are marked unavailable
- the whole inverter is not treated as offline for one unsupported field

If the inverter is replaced or changes model at the same IP:

- capability/identity detection should be refreshed after reconnect and the snapshot rebuilt accordingly

## Security

The connection is local-network only and uses the inverter's local protocol. ECC must not require the GivEnergy cloud for normal operation.

The initial implementation is read-only. No Modbus write requests should be available through the new direct client in this phase.

Connection details must not be logged unnecessarily. Serial numbers can be shown in diagnostics/device information but should not be emitted repeatedly in normal logs.

## Testing

Tests should cover the direct data path without requiring physical inverter hardware.

Required test layers:

- protocol/client tests using captured or synthetic responses
- driver tests for register-to-normalised-value mapping
- capability tests for differing inverter/battery layouts
- dual-rate coordinator tests for fast/detail polling, timeout, reconnect and stale-data behaviour
- config-flow tests for manual connection, discovery flow, valid connection and each major failure class
- WebSocket snapshot tests ensuring dashboard data comes from the coordinator
- diagnostics tests for raw/normalised dump generation and redaction
- regression tests proving HA entity discovery is not used as an energy-data fallback

At least one fixture should represent the target GivEnergy Hybrid Gen 2 + two-battery layout, while keeping serial numbers and other identifiable values anonymised.

## Migration

Existing ECC installs created under the old empty config entry will not have an inverter IP stored.

On update, ECC should present a repair/reconfigure requirement rather than silently continuing with entity discovery. The user enters the inverter IP, connection is validated, and the same config entry is updated or migrated to the new schema.

The frontend should clearly indicate `Inverter connection required` until migration is complete.

## Files/components expected to change

Implementation is expected to touch or add focused modules around:

- `config_flow.py` for discovery/IP/port setup and validation
- a new direct inverter client module
- a new GivEnergy driver/normaliser module
- a coordinator module for dual-rate polling and state
- a diagnostics module/export path
- `__init__.py` for setup/lifecycle
- `websocket.py` to expose coordinator data
- the existing discovery path so it no longer supplies primary energy data
- tests and fixtures
- manifest requirements if an external protocol library is used

Frontend changes should be limited to consuming the revised snapshot and showing direct connection/stale/error/diagnostic state where necessary.

## Implementation choice

Three approaches were considered:

1. Keep using HA/GivTCP entities and improve matching. Rejected because it preserves the exact dependency the user does not want and cannot guarantee a single consistent source of truth.
2. Call a separate GivTCP REST service. Rejected as the primary design because it still requires another add-on/service and is not truly direct from the inverter IP.
3. Connect directly to the inverter's local Modbus-TCP interface and normalise the result inside ECC. Chosen because it satisfies the requirement that the inverter IP itself drives the system, removes entity-name guessing, works locally, and provides a clean manufacturer-driver architecture for future expansion.

The INVLocal-style split between fast live telemetry and slower full telemetry is adopted because it provides responsive power-flow data without unnecessarily hammering every register block on every refresh.

## Acceptance criteria

The change is complete when:

- a fresh ECC setup requires or discovers an inverter IP
- ECC validates the inverter directly before completing setup
- ECC automatically detects model/family and attached batteries where exposed
- the dashboard works even if no GivTCP/energy sensor entities exist in Home Assistant
- all available solar, load, grid, battery and inverter details displayed by ECC originate from the direct inverter connection
- the dashboard exposes both headline live values and detailed inverter/battery/PV/grid telemetry where available
- live values update on the fast polling schedule and deeper telemetry on the slower schedule
- local diagnostics can report connection state, capability detection, raw register data and the normalised plant snapshot
- loss of direct inverter communication is shown as offline/stale rather than silently replaced with HA entity values
- reconnect uses the configured last-working device automatically
- no direct write/control operations are introduced in this phase
- the existing visual dashboard continues to operate using the new normalised snapshot
