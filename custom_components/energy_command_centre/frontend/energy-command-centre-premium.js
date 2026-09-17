import './energy-command-centre-panel.js';
import {
  bindHasEvControl,
  readHasEv,
  realisticSceneStyles,
  renderRealisticScene,
} from './overview/realistic-scene.js';
import { detailDrawerStyles, renderDetailDrawer } from './overview/details.js';

const Panel = customElements.get('energy-command-centre-panel');

if (!Panel) {
  throw new Error('Energy Command Centre panel failed to register before dashboard wiring');
}

const EQUIPMENT_ROLES = {
  'ecc-solar-array': 'solar',
  'ecc-grid': 'grid',
  'ecc-house': 'home',
  'ecc-inverter': 'inverter',
  'ecc-battery-bank': 'battery',
  'ecc-ev-car': 'ev',
};

const NAV_LABELS = {
  overview: 'Dashboard',
  battery: 'Battery Centre',
  inverter: 'Inverter Details',
  health: 'Diagnostics',
  raw: 'Register Data',
  settings: 'Settings & Support',
};

const metricEntity = (entity_id, name, category, metric) => {
  if (!metric || metric.available === false || metric.value == null) return null;
  return {
    entity_id,
    name,
    category,
    state: String(metric.value),
    unit: metric.unit || null,
    available: true,
    stale_seconds: 0,
    manufacturer: 'GivEnergy',
    platform: 'energy_command_centre',
  };
};

const directEntities = (snapshot) => {
  if (!snapshot || snapshot.source !== 'direct_inverter') return snapshot?.entities || [];
  const items = [
    metricEntity('sensor.ecc_solar_power', 'Solar Power', 'solar', snapshot.solar?.power),
    metricEntity('sensor.ecc_house_power', 'House Load Power', 'home', snapshot.home?.power),
    metricEntity('sensor.ecc_grid_power', 'Grid Power', 'grid', snapshot.grid?.power),
    metricEntity('sensor.ecc_battery_power', 'Battery Power', 'battery', snapshot.battery_bank?.power),
    metricEntity('sensor.ecc_battery_soc', 'Battery State of Charge', 'battery', snapshot.battery_bank?.soc),
    metricEntity('sensor.ecc_grid_voltage', 'Grid Voltage', 'grid', snapshot.grid?.voltage),
    metricEntity('sensor.ecc_grid_frequency', 'Grid Frequency', 'grid', snapshot.grid?.frequency),
    metricEntity('sensor.ecc_battery_voltage', 'Battery Voltage', 'battery', snapshot.battery_bank?.voltage),
    metricEntity('sensor.ecc_battery_temperature', 'Battery Temperature', 'battery', snapshot.battery_bank?.temperature),
    metricEntity('sensor.ecc_inverter_temperature', 'Inverter Temperature', 'inverter', snapshot.inverter?.temperature_heatsink),
    metricEntity('sensor.ecc_solar_today', 'Solar Generation Today', 'solar', snapshot.energy_today?.solar_generation),
    metricEntity('sensor.ecc_import_today', 'Grid Import Today', 'grid', snapshot.energy_today?.grid_import),
    metricEntity('sensor.ecc_export_today', 'Grid Export Today', 'grid', snapshot.energy_today?.grid_export),
    metricEntity('sensor.ecc_consumption_today', 'House Consumption Today', 'home', snapshot.energy_today?.consumption),
  ].filter(Boolean);

  for (const battery of snapshot.batteries || []) {
    items.push(
      metricEntity(`sensor.ecc_battery_${battery.index}_soc`, `Battery ${battery.index} SOC`, 'battery', battery.soc),
      metricEntity(`sensor.ecc_battery_${battery.index}_voltage`, `Battery ${battery.index} Voltage`, 'battery', battery.voltage),
      metricEntity(`sensor.ecc_battery_${battery.index}_temperature_max`, `Battery ${battery.index} Max Temperature`, 'battery', battery.temperature_max),
    );
    for (const cell of battery.cells || []) {
      items.push(metricEntity(
        `sensor.ecc_battery_${battery.index}_cell_${cell.cell}`,
        `Battery ${battery.index} Cell ${cell.cell}`,
        'battery',
        { value: cell.voltage, unit: 'V', available: true },
      ));
    }
  }
  return items.filter(Boolean);
};

const adaptSnapshot = (snapshot) => {
  if (!snapshot || snapshot.source !== 'direct_inverter') return snapshot;
  const entities = directEntities(snapshot);
  const unavailable = entities.filter((item) => item.available === false).length;
  const stale = snapshot.connection?.stale ? entities.length : 0;
  return {
    ...snapshot,
    entities,
    summary: {
      total: entities.length,
      available: entities.length - unavailable,
      unavailable,
      stale,
      categories: entities.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {}),
      manufacturers: { GivEnergy: entities.length },
    },
  };
};

const prototype = Panel.prototype;
const baseStyles = prototype._styles;
const baseRender = prototype._render;

if (!prototype.__eccDashboardOverviewInstalled) {
  prototype._styles = function dashboardStyles() {
    return `${baseStyles.call(this)}\n${realisticSceneStyles()}\n${detailDrawerStyles()}\n
      .ecc-support{margin:26px 8px 0;padding:15px;border:1px solid #2d5b4d;border-radius:14px;background:linear-gradient(145deg,#10271f,#0b1a19);font-size:12px;color:#a9c7bc}
      .ecc-support strong{display:block;color:#58e19d;font-size:13px;margin-bottom:5px}
      .ecc-support p{margin:0 0 10px;line-height:1.45}
      .ecc-support-links{display:flex;flex-wrap:wrap;gap:7px}
      .ecc-support a{display:inline-flex;align-items:center;gap:5px;padding:7px 9px;border:1px solid #355f52;border-radius:9px;background:#0b1816;color:#eafff6;text-decoration:none;font-weight:800}
      .ecc-support a:hover{border-color:#58e19d}
      @media(max-width:1000px){.ecc-support{display:none}}
    `;
  };

  prototype._overview = function dashboardOverview() {
    const scene = renderRealisticScene(this._snapshot, { hasEv: readHasEv() });
    const drawer = this._eccDetailRole ? renderDetailDrawer(this._snapshot, this._eccDetailRole) : '';
    return `${scene}${drawer}`;
  };

  prototype._bindDashboardOverview = function bindDashboardOverview() {
    if (!this.shadowRoot) return;

    for (const [key, label] of Object.entries(NAV_LABELS)) {
      const text = this.shadowRoot.querySelector(`[data-page="${key}"] span`);
      if (text) text.textContent = label;
    }
    const navLabel = this.shadowRoot.querySelector('.nav-label');
    if (navLabel) navLabel.textContent = 'Energy Command Centre';

    const oldPremium = this.shadowRoot.querySelector('.premium');
    if (oldPremium) {
      oldPremium.className = 'ecc-support';
      oldPremium.innerHTML = `
        <strong>ECC is completely free</strong>
        <p>If Energy Command Centre helps you, optional donations support future development.</p>
        <div class="ecc-support-links">
          <a href="https://ko-fi.com/ady1984" target="_blank" rel="noopener noreferrer">☕ Ko-fi</a>
          <a href="https://paypal.me/graffidoodle" target="_blank" rel="noopener noreferrer">🍺 Buy me a beer</a>
        </div>`;
    }

    if (this._active !== 'overview') return;

    bindHasEvControl(this.shadowRoot, () => {
      this._eccDetailRole = null;
      this._render();
    });

    const openRole = (role) => {
      this._eccDetailRole = role;
      this._render();
    };

    for (const [id, role] of Object.entries(EQUIPMENT_ROLES)) {
      const node = this.shadowRoot.querySelector(`#${id}`);
      if (!node) continue;
      node.dataset.eccRole = role;
      node.setAttribute('role', 'button');
      node.setAttribute('tabindex', '0');
      node.setAttribute('aria-label', `Open ${role} details`);
      node.style.cursor = 'pointer';
      node.addEventListener('click', () => openRole(role));
      node.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openRole(role);
        }
      });
    }

    const close = this.shadowRoot.querySelector('[data-ecc-close-detail]');
    if (close) close.addEventListener('click', () => {
      this._eccDetailRole = null;
      this._render();
    });

    const backdrop = this.shadowRoot.querySelector('[data-ecc-detail-backdrop]');
    if (backdrop) backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) {
        this._eccDetailRole = null;
        this._render();
      }
    });
  };

  prototype._render = function dashboardRender() {
    this._snapshot = adaptSnapshot(this._snapshot);
    baseRender.call(this);
    queueMicrotask(() => this._bindDashboardOverview());
  };

  Object.defineProperty(prototype, '__eccDashboardOverviewInstalled', {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false,
  });
}
