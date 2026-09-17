# Installing Energy Command Centre

Energy Command Centre is currently an early alpha. The direct inverter connection is read-only and does not change inverter settings, but you should still have a current Home Assistant backup before installing any custom integration.

## Requirements

- Home Assistant 2025.1 or newer
- HACS installed for the recommended method
- A supported local-network inverter; GivEnergy is the first family being implemented in depth
- Home Assistant must be able to reach the inverter/data-adapter IP on the local network

For GivEnergy, ECC connects directly to the local Modbus interface. The default port is `8899`.

**GivTCP entities are not required for ECC's primary inverter, solar, grid, house or battery data.**

## Recommended: install with HACS

### 1. Add the custom repository

1. Open **HACS** from the Home Assistant sidebar.
2. Select the **three-dot menu** in the top-right corner.
3. Select **Custom repositories**.
4. Paste this repository URL:

   `https://github.com/Adya84/ha-energy-command-centre`

5. For **Type**, select **Integration**.
6. Select **Add**.

### 2. Download the integration

1. Search HACS for **Energy Command Centre**.
2. Open its repository page.
3. Select **Download**.
4. Confirm the download.
5. Restart Home Assistant when HACS asks you to do so.

### 3. Add it to Home Assistant

1. Open **Settings → Devices & services**.
2. Select **Add integration**.
3. Search for **Energy Command Centre**.
4. Enter the **local inverter/data-adapter IP address**.
5. Leave **Modbus port** at `8899` unless your setup uses another port.
6. ECC tests the connection, detects the inverter and reads its serial before completing setup.
7. Refresh the browser once if the sidebar item does not appear immediately.
8. Open **Energy Hub** from the sidebar.

ECC does not require a GivEnergy cloud login for normal local operation.

## Existing alpha installations

Older ECC alpha installs created an empty config entry and tried to discover energy entities already present in Home Assistant. That is no longer the intended data path.

If your existing entry has no inverter IP saved, reconfigure/re-add ECC and enter the inverter IP. ECC must not silently fall back to guessed HA entities when the inverter connection is missing.

## Manual installation

Use this method only if you do not use HACS.

1. Download the repository ZIP from GitHub and extract it.
2. Find the folder:

   `custom_components/energy_command_centre`

3. Copy the complete `energy_command_centre` folder into Home Assistant's configuration directory so the final path is:

   `/config/custom_components/energy_command_centre`

4. Restart Home Assistant.
5. Open **Settings → Devices & services → Add integration**.
6. Search for **Energy Command Centre** and enter the inverter IP and port.

Do not copy the entire repository into `custom_components`. Copy only the inner `energy_command_centre` directory.

## Updating

### HACS installation

1. Open HACS.
2. Find **Energy Command Centre**.
3. Select **Redownload** or install the available update.
4. Restart Home Assistant.
5. Hard-refresh the browser if the dashboard still shows the previous frontend.

### Manual installation

Download the newest repository ZIP, replace `/config/custom_components/energy_command_centre` with the new copy, and restart Home Assistant.

## Dashboard pages

The ECC sidebar uses its own labels while following the same general local-monitoring idea as dedicated inverter apps:

- **Dashboard**
- **Battery Centre**
- **Inverter Details**
- **Diagnostics**
- **Register Data**
- **Settings & Support**

The Dashboard remains the visual house/energy-flow page. The deeper pages expose inverter and battery detail from the same direct local connection.

## Free software and optional support

All ECC features are free. There is no Premium tier, £2.99 unlock or paid feature gate.

Optional support links:

- Ko-fi: `https://ko-fi.com/ady1984`
- Buy me a beer: `https://paypal.me/graffidoodle`

## Removing the integration

1. Open **Settings → Devices & services**.
2. Open **Energy Command Centre** and remove its configuration entry.
3. Remove it from HACS, or delete `/config/custom_components/energy_command_centre` if it was installed manually.
4. Restart Home Assistant.

Removing ECC does not modify the inverter or remove any unrelated Home Assistant integrations.

## Troubleshooting

### ECC cannot connect to the inverter

- Confirm the IP address is correct and reachable from the Home Assistant host.
- Confirm the inverter/data adapter is on the same reachable LAN/VLAN.
- Confirm port `8899` is available unless your setup uses a different Modbus port.
- Avoid entering the Home Assistant or GivTCP add-on IP by mistake; ECC needs the inverter/data-adapter IP itself.
- Check **Settings → System → Logs** for `energy_command_centre` messages.

### The device responds but detection fails

ECC reached the IP but could not identify a supported GivEnergy plant. Include the inverter model, data-adapter type and the diagnostics output when reporting the problem.

### The dashboard opens but values are unavailable

- Open **Diagnostics** and confirm the direct connection state.
- Open **Register Data** to inspect what ECC received from the inverter.
- Unsupported values should show as unavailable rather than being copied from other HA entities.

### Reporting an alpha problem

Open a GitHub issue at:

`https://github.com/Adya84/ha-energy-command-centre/issues`

Include:

- Home Assistant version
- Installation method
- Inverter and battery model
- Data-adapter/dongle model if known
- ECC connection state/error
- Relevant Home Assistant log entries
- A screenshot/export from **Diagnostics** or **Register Data**, with private information removed
