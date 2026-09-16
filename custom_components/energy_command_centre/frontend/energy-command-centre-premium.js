import './energy-command-centre-panel.js';
import { overviewSceneStyles, renderEnergyScene } from './overview/energy-scene.js';
import { detailDrawerStyles, renderDetailDrawer } from './overview/details.js';

const Panel = customElements.get('energy-command-centre-panel');

if (!Panel) {
  throw new Error('Energy Command Centre panel failed to register before premium overview wiring');
}

const EQUIPMENT_ROLES = {
  'ecc-solar-array': 'solar',
  'ecc-grid': 'grid',
  'ecc-house': 'home',
  'ecc-inverter': 'inverter',
  'ecc-battery-bank': 'battery',
  'ecc-ev-car': 'ev',
};

const prototype = Panel.prototype;
const baseStyles = prototype._styles;
const baseRender = prototype._render;

if (!prototype.__eccPremiumOverviewInstalled) {
  prototype._styles = function premiumStyles() {
    return `${baseStyles.call(this)}\n${overviewSceneStyles()}\n${detailDrawerStyles()}`;
  };

  prototype._overview = function premiumOverview() {
    const scene = renderEnergyScene(this._snapshot, this._hass);
    const drawer = this._eccDetailRole ? renderDetailDrawer(this._snapshot, this._eccDetailRole) : '';
    return `${scene}${drawer}`;
  };

  prototype._bindPremiumOverview = function bindPremiumOverview() {
    if (this._active !== 'overview' || !this.shadowRoot) return;

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

  prototype._render = function premiumRender() {
    baseRender.call(this);
    queueMicrotask(() => this._bindPremiumOverview());
  };

  Object.defineProperty(prototype, '__eccPremiumOverviewInstalled', {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false,
  });
}
