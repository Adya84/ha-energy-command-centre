import { formatPower } from './formatters.js';

const PHOTO_URL = '/energy_command_centre_static/assets/ecc-house-premium.webp';

const safe = (value) => String(value ?? '—')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const entities = (snapshot, category) => (snapshot?.entities || []).filter((item) => item.category === category);

const find = (snapshot, category, ...terms) => entities(snapshot, category)
  .map((item) => {
    const text = `${item.entity_id} ${item.name}`.toLowerCase();
    return { item, score: terms.reduce((n, term) => n + (text.includes(term.toLowerCase()) ? 2 : 0), 0) };
  })
  .sort((a, b) => b.score - a.score)[0]?.item;

const findPower = (snapshot, category, ...terms) => entities(snapshot, category)
  .filter((item) => ['w', 'kw'].includes(String(item.unit || '').toLowerCase()))
  .map((item) => {
    const text = `${item.entity_id} ${item.name}`.toLowerCase();
    return { item, score: terms.reduce((n, term) => n + (text.includes(term.toLowerCase()) ? 2 : 0), 0) };
  })
  .sort((a, b) => b.score - a.score)[0]?.item;

const stateLine = (entity, fallback) => entity?.available === false ? 'Unavailable' : fallback;

export function realisticSceneStyles() {
  return `
    .ecc-photo-overview{display:grid;gap:14px}
    .ecc-photo-stage{position:relative;aspect-ratio:1672/941;min-height:520px;overflow:hidden;border-radius:24px;border:1px solid #314950;background:#081116 url("${PHOTO_URL}") center/cover no-repeat;box-shadow:0 28px 80px #0008}
    .ecc-live-card{position:absolute;z-index:3;display:grid;grid-template-columns:auto 1fr;align-items:center;gap:10px;min-width:150px;padding:11px 13px;border:1px solid #ffffff2c;border-radius:15px;background:rgba(5,12,16,.93);box-shadow:0 10px 28px #0008;backdrop-filter:blur(12px);color:#fff;cursor:pointer;transition:transform .18s ease,border-color .18s ease}
    .ecc-live-card:hover,.ecc-live-card:focus{transform:translateY(-2px);border-color:#ffffff66;outline:none}
    .ecc-live-icon{font-size:23px;line-height:1}.ecc-live-card small{display:block;color:#b6c7cc;font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:800}.ecc-live-card strong{display:block;font-size:18px;line-height:1.2;margin-top:2px}.ecc-live-card em{display:block;color:#91a7ad;font-size:10px;font-style:normal;margin-top:2px}
    #ecc-solar-array{left:40.2%;top:13.3%}#ecc-house{left:62.4%;top:37.4%}#ecc-grid{right:2.1%;top:35.8%}#ecc-battery-bank{left:45.7%;top:66.0%}#ecc-ev-car{left:62.7%;top:74.2%}#ecc-inverter{left:46.3%;top:45.0%;min-width:128px}
    .ecc-summary{display:flex;gap:10px;overflow:auto;padding:2px}.ecc-chip{background:#0a1519dd;border:1px solid #29444a;border-radius:16px;padding:13px 15px;min-width:145px}.ecc-chip small{display:block;color:#8fa7a8;text-transform:uppercase;letter-spacing:.09em;font-size:9px;font-weight:800}.ecc-chip strong{display:block;color:#f5fbf8;margin-top:4px;font-size:17px}
    @media(max-width:900px){.ecc-photo-stage{min-height:430px;border-radius:20px}.ecc-live-card{transform:scale(.88);transform-origin:top left}.ecc-live-card:hover,.ecc-live-card:focus{transform:scale(.88) translateY(-2px)}}
    @media(max-width:650px){.ecc-photo-stage{min-height:360px;border-radius:16px;background-position:55% center}.ecc-live-card{min-width:118px;padding:8px 9px;gap:7px;transform:scale(.72);transform-origin:top left}.ecc-live-card strong{font-size:16px}.ecc-live-icon{font-size:19px}.ecc-live-card:hover,.ecc-live-card:focus{transform:scale(.72) translateY(-2px)}}
  `;
}

export function renderRealisticScene(snapshot) {
  const solar = findPower(snapshot, 'solar', 'power', 'pv');
  const load = findPower(snapshot, 'load', 'load', 'power');
  const grid = findPower(snapshot, 'grid', 'power', 'grid');
  const battery = findPower(snapshot, 'battery', 'power', 'battery');
  const ev = findPower(snapshot, 'ev', 'power', 'charge');
  const soc = find(snapshot, 'battery', 'soc');
  const inverter = find(snapshot, 'inverter', 'status', 'power') || find(snapshot, 'solar', 'inverter');

  return `<div class="ecc-photo-overview">
    <section class="ecc-photo-stage" aria-label="Realistic Energy Command Centre home scene">
      <div id="ecc-solar-array" class="ecc-live-card" tabindex="0"><span class="ecc-live-icon">☀</span><span><small>Solar</small><strong>${safe(formatPower(solar))}</strong><em>${safe(stateLine(solar, 'Generating'))}</em></span></div>
      <div id="ecc-house" class="ecc-live-card" tabindex="0"><span class="ecc-live-icon">⌂</span><span><small>Home</small><strong>${safe(formatPower(load))}</strong><em>${safe(stateLine(load, 'Using'))}</em></span></div>
      <div id="ecc-grid" class="ecc-live-card" tabindex="0"><span class="ecc-live-icon">⌁</span><span><small>Grid</small><strong>${safe(formatPower(grid))}</strong><em>${safe(stateLine(grid, 'Live'))}</em></span></div>
      <div id="ecc-battery-bank" class="ecc-live-card" tabindex="0"><span class="ecc-live-icon">▰</span><span><small>Battery</small><strong>${safe(soc ? `${soc.state}%` : formatPower(battery))}</strong><em>${safe(formatPower(battery, 'Idle'))}</em></span></div>
      <div id="ecc-ev-car" class="ecc-live-card" tabindex="0"><span class="ecc-live-icon">▣</span><span><small>EV</small><strong>${safe(formatPower(ev, 'Idle'))}</strong><em>${safe(stateLine(ev, 'Charging'))}</em></span></div>
      <div id="ecc-inverter" class="ecc-live-card" tabindex="0"><span class="ecc-live-icon">⚡</span><span><small>Inverter</small><strong>${safe(inverter?.state || 'Online')}</strong><em>${safe(inverter?.name || 'Energy system')}</em></span></div>
    </section>
    <div class="ecc-summary">
      <div class="ecc-chip"><small>Solar now</small><strong>${safe(formatPower(solar))}</strong></div>
      <div class="ecc-chip"><small>Home load</small><strong>${safe(formatPower(load))}</strong></div>
      <div class="ecc-chip"><small>Grid</small><strong>${safe(formatPower(grid))}</strong></div>
      <div class="ecc-chip"><small>Battery</small><strong>${safe(soc ? `${soc.state}%` : formatPower(battery))}</strong></div>
      <div class="ecc-chip"><small>EV</small><strong>${safe(formatPower(ev, 'Idle'))}</strong></div>
    </div>
  </div>`;
}
