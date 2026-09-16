# Installing Energy Command Centre

Energy Command Centre is currently an early alpha. It is read-only and does not change inverter settings, but you should still have a current Home Assistant backup before installing any custom integration.

## Requirements

- Home Assistant 2025.1 or newer
- HACS installed for the recommended method
- At least one energy, inverter, battery, solar, tariff or EV integration already exposing entities in Home Assistant

GivTCP is the first integration being tested in depth. The discovery engine can also recognise common entity metadata from other manufacturers, but those systems have not all been fully tested yet.

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
3. Select **Download** in the bottom-right corner.
4. Confirm the download.
5. Restart Home Assistant when HACS asks you to do so.

### 3. Add it to Home Assistant

1. Open **Settings → Devices & services**.
2. Select **Add integration**.
3. Search for **Energy Command Centre**.
4. Select it and complete the setup.
5. Refresh the browser once if the new sidebar item does not appear immediately.
6. Open **Energy Hub** from the sidebar.

The first load scans existing Home Assistant entities. No inverter address, password or cloud account is required for the current read-only alpha.

## Manual installation

Use this method only if you do not use HACS.

1. Download the repository ZIP from GitHub and extract it.
2. Find the folder:

   `custom_components/energy_command_centre`

3. Copy the complete `energy_command_centre` folder into Home Assistant's configuration directory so the final path is:

   `/config/custom_components/energy_command_centre`

4. Restart Home Assistant.
5. Open **Settings → Devices & services → Add integration**.
6. Search for **Energy Command Centre** and complete setup.

Do not copy the entire repository into `custom_components`. Copy only the inner `energy_command_centre` directory.

## Updating

### HACS installation

1. Open HACS.
2. Find **Energy Command Centre**.
3. Select **Redownload** or install the available update.
4. Restart Home Assistant.
5. Hard-refresh the browser if the dashboard still shows the previous version.

During early development, HACS may show the latest repository commit rather than a numbered release.

### Manual installation

Download the newest repository ZIP, replace `/config/custom_components/energy_command_centre` with the new copy, and restart Home Assistant.

## Removing the integration

1. Open **Settings → Devices & services**.
2. Open **Energy Command Centre** and remove its configuration entry.
3. Remove it from HACS, or delete `/config/custom_components/energy_command_centre` if it was installed manually.
4. Restart Home Assistant.

Removing Energy Command Centre does not remove or modify the original entities supplied by GivTCP or other energy integrations.

## Troubleshooting

### Energy Command Centre does not appear when adding an integration

- Confirm that `/config/custom_components/energy_command_centre/manifest.json` exists.
- Restart Home Assistant fully; reloading YAML is not sufficient.
- Clear the browser cache or perform a hard refresh.
- Check **Settings → System → Logs** for `energy_command_centre` errors.

### The sidebar item is missing

- Confirm that the integration was added under **Settings → Devices & services**, not only downloaded in HACS.
- Refresh the browser after setup.
- Restart Home Assistant if the panel was not registered during startup.

### The dashboard opens but values are missing

- Confirm that your inverter, battery or energy integration already has working entities in Home Assistant.
- Open the dashboard's **Raw Data** page to see what Energy Command Centre discovered.
- Entity names that do not contain recognisable energy metadata may require manual mapping; this is planned for the next development stage.

### Reporting an alpha problem

Open a GitHub issue at:

`https://github.com/Adya84/ha-energy-command-centre/issues`

Include:

- Home Assistant version
- Installation method
- Inverter and battery manufacturer/model
- Source integration, such as GivTCP
- Relevant Home Assistant log entries
- A screenshot of the Energy Command Centre Raw Data or System Health page, with private information removed
