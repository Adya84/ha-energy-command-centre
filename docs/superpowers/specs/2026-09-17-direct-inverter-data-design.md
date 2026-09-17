# Direct Inverter Data Source Design

## Purpose

Energy Command Centre (ECC) must use the inverter itself as the source of truth for energy-system data. The user supplies the inverter's local IP address during setup, ECC connects directly to that inverter over the local network, identifies the inverter and attached batteries, reads the available registers, normalises the values, and feeds the dashboard from that direct data.

ECC must not depend on pre-existing Home Assistant entities, GivTCP-created entities, MQTT entities, guessed entity names, or discovery/classification as the primary data source for inverter, battery, solar, grid, or household energy values.

## Scope

This design covers direct read access to a GivEnergy inverter first, while creating a clean driver boundary so other inverter manufacturers can be added later without changing the dashboard architecture.

The initial direct driver is read-only. Existing or future control/write features are deliberately out of scope for this change and must be added behind an explicit write-enabled control layer later.

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
- per-cell battery voltages where exposed
- charge/discharge limits and configured targets where readable
- daily generation, consumption, import, export, charge and discharge totals
- lifetime/all-time energy totals
- grid voltage, current and frequency where exposed
- PV voltage/current per available string where exposed
- other diagnostic values exposed by the inverter register map

Home Assistant entity discovery must not silently replace any of these values if direct inverter communication is unavailable. If the inverter cannot be reached, ECC should report the inverter as unavailable rather than present potentially inconsistent values from unrelated HA entities.

Information the inverter cannot know may remain separate optional enrichment. Examples include weather, solar forecasts, tariff information, PredBat plans and EV-charger-specific data. These sources must never override inverter-derived energy values.

## Connection model

For GivEnergy, ECC will connect directly to the local inverter/data-adapter IP using the supported local Modbus-TCP interface. The default Modbus port is 8899, with the port retained as an advanced configurable option.

Setup flow:

1. User enters the inverter IP address.
2. ECC attempts a read-only connection.
3. ECC validates that a compatible GivEnergy device responds.
4. ECC reads identity/model information.
5. ECC discovers supported capabilities and attached batteries from the inverter data.
6. ECC stores the connection configuration only after successful validation.
7. ECC starts the shared data coordinator and dashboard.

The IP address is the required setup field. Battery count, inverter model and supported measurements should be detected rather than manually entered wherever the protocol exposes enough information to do so.

## Architecture

### 1. Inverter client

A focused low-level client owns the TCP/Modbus connection and register reads. It has no Home Assistant UI logic and no dashboard-specific formatting.

Responsibilities:

- open/close connections
- perform read-only Modbus requests
- apply timeouts and retry policy
- expose raw decoded values
- identify communication/protocol errors

### 2. Manufacturer driver

A `GivEnergy` driver maps model-specific register data into ECC's manufacturer-neutral plant model.

Responsibilities:

- detect inverter family/model
- choose the correct register/capability map
- detect battery count/capabilities
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

### 4. Data coordinator

One Home Assistant coordinator owns polling so the frontend, websocket endpoint and diagnostics do not independently connect to the inverter.

Default live polling target: 5 seconds.

The coordinator should:

- prevent overlapping polls
- keep the last successful snapshot and its timestamp
- mark data stale after a defined threshold
- expose connection state separately from data values
- reconnect automatically after transient failures
- avoid aggressive reconnect loops

The polling interval may become configurable later, but a single safe default should be used initially.

### 5. Websocket/frontend boundary

The existing ECC websocket overview endpoint should return the normalised direct-inverter snapshot, not a scan of Home Assistant's state machine.

The current dashboard can then retain its visual components while changing the data feeding them.

The frontend must not know Modbus register addresses or manufacturer-specific details.

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
- coordinator tests for success, timeout, reconnect and stale-data behaviour
- config-flow tests for valid connection and each major failure class
- websocket snapshot tests ensuring dashboard data comes from the coordinator
- regression tests proving HA entity discovery is not used as an energy-data fallback

At least one fixture should represent the target GivEnergy Hybrid Gen2 + two-battery layout, while keeping serial numbers and other identifiable values anonymised.

## Migration

Existing ECC installs created under the old empty config entry will not have an inverter IP stored.

On update, ECC should present a repair/reconfigure requirement rather than silently continuing with entity discovery. The user enters the inverter IP, connection is validated, and the same config entry is updated or migrated to the new schema.

The frontend should clearly indicate `Inverter connection required` until migration is complete.

## Files/components expected to change

Implementation is expected to touch or add focused modules around:

- `config_flow.py` for IP/port setup and validation
- a new direct inverter client module
- a new GivEnergy driver/normaliser module
- a coordinator module for polling and state
- `__init__.py` for setup/lifecycle
- `websocket.py` to expose coordinator data
- the existing discovery path so it no longer supplies primary energy data
- tests and fixtures
- manifest requirements if an external protocol library is used

Frontend changes should be limited to consuming the revised snapshot and showing direct connection/stale/error state where necessary.

## Implementation choice

Three approaches were considered:

1. Keep using HA/GivTCP entities and improve matching. Rejected because it preserves the exact dependency the user does not want and cannot guarantee a single consistent source of truth.
2. Call a separate GivTCP REST service. Rejected as the primary design because it still requires another add-on/service and is not truly direct from the inverter IP.
3. Connect directly to the inverter's local Modbus-TCP interface and normalise the result inside ECC. Chosen because it satisfies the requirement that the inverter IP itself drives the system, removes entity-name guessing, works locally, and provides a clean manufacturer-driver architecture for future expansion.

## Acceptance criteria

The change is complete when:

- a fresh ECC setup requires an inverter IP
- ECC validates the inverter directly before completing setup
- the dashboard works even if no GivTCP/energy sensor entities exist in Home Assistant
- all available solar, load, grid, battery and inverter details displayed by ECC originate from the direct inverter connection
- GivEnergy model and attached batteries are detected automatically where exposed
- loss of direct inverter communication is shown as offline/stale rather than silently replaced with HA entity values
- no direct write/control operations are introduced in this phase
- the existing visual dashboard continues to operate using the new normalised snapshot
