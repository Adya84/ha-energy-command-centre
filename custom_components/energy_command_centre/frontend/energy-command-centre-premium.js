import './energy-command-centre-panel.js';
import { overviewSceneStyles, renderEnergyScene } from './overview/energy-scene.js';

const Panel = customElements.get('energy-command-centre-panel');

if (!Panel) {
  throw new Error('Energy Command Centre panel failed to register before premium overview wiring');
}

const prototype = Panel.prototype;
const baseStyles = prototype._styles;

if (!prototype.__eccPremiumOverviewInstalled) {
  prototype._styles = function premiumStyles() {
    return `${baseStyles.call(this)}\n${overviewSceneStyles()}`;
  };

  prototype._overview = function premiumOverview() {
    return renderEnergyScene(this._snapshot, this._hass);
  };

  Object.defineProperty(prototype, '__eccPremiumOverviewInstalled', {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false,
  });
}
