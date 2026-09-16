import './energy-command-centre-panel.js';
import { overviewSceneStyles, renderEnergyScene } from './overview/energy-scene.js';

const Panel = customElements.get('energy-command-centre-panel');

if (Panel && !Panel.prototype.__eccPremiumOverview) {
  const originalStyles = Panel.prototype._styles;

  Panel.prototype._overview = function premiumOverview() {
    return renderEnergyScene(this._snapshot, this._hass);
  };

  Panel.prototype._styles = function premiumStyles() {
    return `${originalStyles.call(this)}\n${overviewSceneStyles()}`;
  };

  Object.defineProperty(Panel.prototype, '__eccPremiumOverview', {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false,
  });
}
