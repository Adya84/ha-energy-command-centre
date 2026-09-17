import { formatPower } from './formatters.js';

const PHOTO_URL = '/energy_command_centre_scene/house.png?v=0.1.0-alpha.11';
const HAS_EV_STORAGE_KEY = 'energy-command-centre:has-ev';

export const readHasEv = (storage = globalThis.localStorage) => {
  try {
    return storage?.getItem(HAS_EV_STORAGE_KEY) !== 'false';
  } catch (_error) {
    return true;
  }
};

export const saveHasEv = (enabled, storage = globalThis.localStorage) => {
  try {
    storage?.setItem(HAS_EV_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch (_error) {
    // Storage may be unavailable in private or restricted browser contexts.
  }
};

export const bindHasEvControl = (root, onChange, storage = globalThis.localStorage) => {
  const input = root?.querySelector('#ecc-has-ev');
  if (!input) return;
  input.addEventListener('change', () => {
    saveHasEv(input.checked, storage);
    onChange?.(input.checked);
  });
};

const safe = (value) => String(value ?? '—')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const entities = (snapshot, category) => (snapshot?.entities || []).filter((item) => item.category === category);

const find = (snapshot, category, ...terms) => entities(snapshot, category)
  .map((item) => {
    const text = `${item.entity_id} ${item.name}`.toLowerCase();
    return { item, score: terms.reduce((n, term) => n + (text.includes(term.toLowerCase()) ? 2 : 0), 0) };
  })
  .filter(({ score }) => score > 0)
  .sort((a, b) => b.score - a.score)[0]?.item;

const findPower = (snapshot, category, ...terms) => entities(snapshot, category)
  .filter((item) => ['w', 'kw'].includes(String(item.unit || '').toLowerCase()))
  .map((item) => {
    const text = `${item.entity_id} ${item.name}`.toLowerCase();
    return { item, score: terms.reduce((n, term) => n + (text.includes(term.toLowerCase()) ? 2 : 0), 0) };
  })
  .sort((a, b) => b.score - a.score)[0]?.item;

const watts = (entity) => {
  if (!entity || entity.available === false) return null;
  const value = Number.parseFloat(entity.state);
  if (!Number.isFinite(value)) return null;
  return String(entity.unit || '').toLowerCase() === 'kw' ? value * 1000 : value;
};

const flow = (role, entity) => {
  const value = watts(entity);
  const text = `${entity?.entity_id || ''} ${entity?.name || ''}`.toLowerCase();
  let direction = 'unavailable';
  let action = 'Unavailable';
  if (value !== null && Math.abs(value) < 1) {
    direction = 'idle';
    action = 'Idle';
  } else if (value !== null && role === 'solar') {
    direction = 'generate';
    action = 'Generating';
  } else if (value !== null && role === 'home') {
    direction = 'consume';
    action = 'Using';
  } else if (value !== null && role === 'ev') {
    direction = 'charge';
    action = 'Charging';
  } else if (value !== null && role === 'grid') {
    const exporting = text.includes('export') || (!text.includes('import') && value < 0);
    direction = exporting ? 'export' : 'import';
    action = exporting ? 'Exporting' : 'Importing';
  } else if (value !== null && role === 'battery') {
    const charging = text.includes('charge') && !text.includes('discharge')
      ? true
      : text.includes('discharge') ? false : value < 0;
    direction = charging ? 'charge' : 'discharge';
    action = charging ? 'Charging' : 'Discharging';
  }
  const active = !['idle', 'unavailable'].includes(direction);
  const speed = value === null ? 2.2 : Math.max(.75, 2.25 - Math.min(Math.abs(value), 8000) / 5300);
  return {
    action,
    active,
    className: `ecc-flow flow-${active ? 'active' : direction} direction-${direction}`,
    display: value === null ? 'Unavailable' : formatPower(value),
    speed: speed.toFixed(2),
  };
};

const flowGroup = (role, state, path, labelX, labelY) => `
  <g data-flow="${role}" class="${state.className}" style="--flow-speed:${state.speed}s">
    <path class="ecc-flow-mask" pathLength="100" d="${path}"/>
    <path class="ecc-flow-track" pathLength="100" d="${path}"/>
    <path class="ecc-flow-pulse" pathLength="100" d="${path}"/>
    <g class="ecc-flow-label" transform="translate(${labelX} ${labelY})">
      <rect x="-88" y="-18" width="176" height="36" rx="18"/>
      <text text-anchor="middle" dominant-baseline="middle">${safe(`${state.display} ${state.action}`)}</text>
    </g>
  </g>`;

export function realisticSceneStyles() {
  return `
    .ecc-photo-overview{display:grid;gap:14px}
    .ecc-photo-stage{position:relative;aspect-ratio:1672/941;min-height:520px;overflow:hidden;border-radius:24px;border:1px solid #314950;background:#081116;box-shadow:0 28px 80px #0008}
    .ecc-house-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;display:block;z-index:0;user-select:none;pointer-events:none}
    .ecc-photo-stage::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(180deg,rgba(4,10,14,.05),rgba(4,10,14,.14))}
    .ecc-flow-layer{position:absolute;inset:0;z-index:2;width:100%;height:100%;pointer-events:none;overflow:visible}.ecc-flow path{fill:none;stroke-linecap:round;stroke-linejoin:round}.ecc-flow-mask{stroke:rgba(3,10,13,.76);stroke-width:15}.ecc-flow-track{stroke:rgba(154,184,191,.48);stroke-width:5}.ecc-flow-pulse{stroke:#5af0ad;stroke-width:7;opacity:0}.ecc-flow-active .ecc-flow-pulse{opacity:1;stroke-dasharray:2 9;filter:url(#ecc-power-glow);animation:ecc-power-flow var(--flow-speed) linear infinite}.ecc-flow.direction-export .ecc-flow-pulse,.ecc-flow.direction-discharge .ecc-flow-pulse{animation-direction:reverse}.ecc-flow.direction-generate .ecc-flow-pulse{stroke:#ffe56e}.ecc-flow.direction-import .ecc-flow-pulse,.ecc-flow.direction-export .ecc-flow-pulse{stroke:#55dcff}.ecc-flow.direction-charge .ecc-flow-pulse{stroke:#68f1ae}.ecc-flow-unavailable .ecc-flow-track{stroke:#8f5b63;stroke-dasharray:4 7}.ecc-flow-label rect{fill:rgba(5,12,16,.92);stroke:rgba(255,255,255,.24);stroke-width:1}.ecc-flow-label text{fill:#fff;font:700 16px Inter,system-ui,sans-serif;letter-spacing:.01em}.ecc-flow-idle .ecc-flow-label text{fill:#b7c6ca}.ecc-flow-unavailable .ecc-flow-label text{fill:#ffabb7}@keyframes ecc-power-flow{to{stroke-dashoffset:-100}}
    .ecc-scene-controls{position:absolute;right:18px;top:18px;z-index:4}.ecc-ev-toggle{display:flex;align-items:center;gap:9px;padding:9px 12px;border:1px solid #ffffff38;border-radius:999px;background:rgba(5,12,16,.9);box-shadow:0 8px 24px #0007;color:#eefbf6;font-size:12px;font-weight:750;cursor:pointer;backdrop-filter:blur(10px)}.ecc-ev-toggle input{width:17px;height:17px;margin:0;accent-color:#58e19d;cursor:pointer}
    .ecc-live-card{position:absolute;z-index:3;display:grid;grid-template-columns:auto 1fr;align-items:center;gap:10px;min-width:150px;padding:11px 13px;border:1px solid #ffffff2c;border-radius:15px;background:rgba(5,12,16,.88);box-shadow:0 10px 28px #0008;backdrop-filter:blur(10px);color:#fff;cursor:pointer;transition:transform .18s ease,border-color .18s ease}
    .ecc-live-card:hover,.ecc-live-card:focus{transform:translateY(-2px);border-color:#ffffff66;outline:none}
    .ecc-live-icon{font-size:23px;line-height:1}.ecc-live-card small{display:block;color:#b6c7cc;font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:800}.ecc-live-card strong{display:block;font-size:18px;line-height:1.2;margin-top:2px}.ecc-live-card em{display:block;color:#91a7ad;font-size:10px;font-style:normal;margin-top:2px}
    #ecc-solar-array{left:40.2%;top:13.3%}#ecc-house{left:62.4%;top:37.4%}#ecc-grid{right:2.1%;top:35.8%}#ecc-battery-bank{left:45.7%;top:66.0%}#ecc-ev-car{left:62.7%;top:74.2%}#ecc-inverter{left:46.3%;top:45.0%;min-width:128px}
    .ecc-summary{display:flex;gap:10px;overflow:auto;padding:2px}.ecc-chip{background:#0a1519dd;border:1px solid #29444a;border-radius:16px;padding:13px 15px;min-width:145px}.ecc-chip small{display:block;color:#8fa7a8;text-transform:uppercase;letter-spacing:.09em;font-size:9px;font-weight:800}.ecc-chip strong{display:block;color:#f5fbf8;margin-top:4px;font-size:17px}
    @media(max-width:900px){.ecc-photo-stage{min-height:430px;border-radius:20px}.ecc-house-photo{object-position:55% center}.ecc-live-card{transform:scale(.88);transform-origin:top left}.ecc-live-card:hover,.ecc-live-card:focus{transform:scale(.88) translateY(-2px)}}
    @media(max-width:650px){.ecc-photo-stage{min-height:360px;border-radius:16px}.ecc-house-photo{object-position:58% center}.ecc-live-card{min-width:118px;padding:8px 9px;gap:7px;transform:scale(.72);transform-origin:top left}.ecc-live-card strong{font-size:16px}.ecc-live-icon{font-size:19px}.ecc-live-card:hover,.ecc-live-card:focus{transform:scale(.72) translateY(-2px)}}
  `;
}

export function renderRealisticScene(snapshot, options = {}) {
  const hasEv = options.hasEv !== false;
  const solar = findPower(snapshot, 'solar', 'power', 'pv');
  const load = findPower(snapshot, 'load', 'load', 'power');
  const grid = findPower(snapshot, 'grid', 'power', 'grid');
  const battery = findPower(snapshot, 'battery', 'power', 'battery');
  const ev = findPower(snapshot, 'ev', 'power', 'charge');
  const soc = find(snapshot, 'battery', 'soc');
  const inverter = find(snapshot, 'inverter', 'status', 'power') || find(snapshot, 'solar', 'inverter');
  const solarFlow = flow('solar', solar);
  const homeFlow = flow('home', load);
  const gridFlow = flow('grid', grid);
  const batteryFlow = flow('battery', battery);
  const evFlow = flow('ev', ev);

  return `<div class="ecc-photo-overview">
    <section class="ecc-photo-stage" aria-label="Realistic Energy Command Centre home scene">
      <img class="ecc-house-photo" src="${PHOTO_URL}" alt="Modern UK smart home with solar panels, battery storage and EV" draggable="false">
      <div class="ecc-scene-controls"><label class="ecc-ev-toggle" for="ecc-has-ev"><input id="ecc-has-ev" type="checkbox"${hasEv ? ' checked' : ''}>I have an EV</label></div>
      <svg class="ecc-flow-layer" viewBox="0 0 1672 941" preserveAspectRatio="xMidYMid slice" aria-label="Live energy cable flows">
        <defs><filter id="ecc-power-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        ${flowGroup('solar', solarFlow, 'M715 220 C720 310 775 375 805 485', 698, 300)}
        ${flowGroup('home', homeFlow, 'M825 490 C930 478 1018 445 1110 430', 1016, 457)}
        ${flowGroup('grid', gridFlow, 'M1505 490 C1265 490 1050 500 840 500', 1360, 468)}
        ${flowGroup('battery', batteryFlow, 'M825 515 C806 590 775 650 750 720', 780, 635)}
        ${hasEv ? flowGroup('ev', evFlow, 'M842 515 C965 590 1080 670 1202 750', 1084, 672) : ''}
      </svg>
      <div id="ecc-solar-array" class="ecc-live-card" tabindex="0"><span class="ecc-live-icon">☀</span><span><small>Solar</small><strong>${safe(solarFlow.display)}</strong><em>${safe(solarFlow.action)}</em></span></div>
      <div id="ecc-house" class="ecc-live-card" tabindex="0"><span class="ecc-live-icon">⌂</span><span><small>Home</small><strong>${safe(homeFlow.display)}</strong><em>${safe(homeFlow.action)}</em></span></div>
      <div id="ecc-grid" class="ecc-live-card" tabindex="0"><span class="ecc-live-icon">⌁</span><span><small>Grid</small><strong>${safe(gridFlow.display)}</strong><em>${safe(gridFlow.action)}</em></span></div>
      <div id="ecc-battery-bank" class="ecc-live-card" tabindex="0"><span class="ecc-live-icon">▰</span><span><small>Battery</small><strong>${safe(soc ? `${soc.state}%` : batteryFlow.display)}</strong><em>${safe(`${batteryFlow.display} ${batteryFlow.action}`)}</em></span></div>
      ${hasEv ? `<div id="ecc-ev-car" class="ecc-live-card" tabindex="0"><span class="ecc-live-icon">▣</span><span><small>EV</small><strong>${safe(evFlow.display)}</strong><em>${safe(evFlow.action)}</em></span></div>` : ''}
      <div id="ecc-inverter" class="ecc-live-card" tabindex="0"><span class="ecc-live-icon">⚡</span><span><small>Inverter</small><strong>${safe(inverter?.state || 'Online')}</strong><em>${safe(inverter?.name || 'Energy system')}</em></span></div>
    </section>
    <div class="ecc-summary">
      <div class="ecc-chip"><small>Solar now</small><strong>${safe(solarFlow.display)}</strong></div>
      <div class="ecc-chip"><small>Home load</small><strong>${safe(homeFlow.display)}</strong></div>
      <div class="ecc-chip"><small>Grid</small><strong>${safe(gridFlow.display)}</strong></div>
      <div class="ecc-chip"><small>Battery</small><strong>${safe(soc ? `${soc.state}%` : batteryFlow.display)}</strong></div>
      ${hasEv ? `<div class="ecc-chip"><small>EV</small><strong>${safe(evFlow.display)}</strong></div>` : ''}
    </div>
  </div>`;
}
