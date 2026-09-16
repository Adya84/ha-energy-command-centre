import { formatPower } from './formatters.js';

const safe = (value) => String(value ?? '—')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const ROLE_META = {
  solar: { title: 'Solar', category: 'solar', icon: '☀' },
  grid: { title: 'Grid', category: 'grid', icon: '⌁' },
  home: { title: 'Home load', category: 'load', icon: '⌂' },
  inverter: { title: 'Inverter', category: 'inverter', icon: 'ϟ' },
  battery: { title: 'Battery bank', category: 'battery', icon: '▰' },
  ev: { title: 'EV charging', category: 'ev', icon: '⚡' },
};

const entityValue = (entity) => {
  const unit = String(entity?.unit || '').toLowerCase();
  if (unit === 'w' || unit === 'kw') return formatPower(entity);
  if (entity?.state === undefined || entity?.state === null || entity?.state === '') return '—';
  return `${entity.state}${entity.unit ? ` ${entity.unit}` : ''}`;
};

export function detailDrawerStyles() {
  return `
    .ecc-detail-backdrop{position:fixed;inset:72px 0 0 220px;background:#02080ba8;z-index:20;display:flex;justify-content:flex-end;backdrop-filter:blur(2px)}
    .ecc-detail-drawer{width:min(430px,94vw);height:100%;overflow:auto;background:linear-gradient(180deg,#0d1b20,#081215);border-left:1px solid #29434a;box-shadow:-18px 0 50px #0008;padding:22px;animation:eccDrawerIn .18s ease-out}
    .ecc-detail-head{display:flex;gap:12px;align-items:center;margin-bottom:18px}.ecc-detail-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:13px;background:#14302d;color:#64eba7;font-size:21px}.ecc-detail-head h2{margin:0;font-size:21px}.ecc-detail-head small{display:block;color:#859d9e;margin-top:3px}.ecc-detail-close{margin-left:auto;width:38px;height:38px;border-radius:11px;border:1px solid #29434a;background:#102126;color:#e8f1ee;cursor:pointer;font-size:20px}
    .ecc-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ecc-detail-item{padding:13px;border:1px solid #20383e;border-radius:14px;background:#0a171b}.ecc-detail-item small{display:block;color:#7f999b;font-size:9px;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ecc-detail-item strong{display:block;margin-top:5px;font-size:16px;color:#f3faf7}.ecc-detail-item code{display:block;margin-top:6px;color:#6e8588;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ecc-detail-empty{padding:28px 8px;text-align:center;color:#7f9698}.ecc-detail-tip{margin-top:14px;padding:11px 12px;border-radius:12px;background:#0b181c;color:#82999a;font-size:11px;border:1px solid #1e3439}
    @keyframes eccDrawerIn{from{transform:translateX(26px);opacity:.3}to{transform:translateX(0);opacity:1}}
    @media(max-width:1000px){.ecc-detail-backdrop{left:78px}}
    @media(max-width:680px){.ecc-detail-backdrop{inset:62px 0 62px 0}.ecc-detail-drawer{width:100%;padding:18px}.ecc-detail-grid{grid-template-columns:1fr 1fr}}
    @media(max-width:420px){.ecc-detail-grid{grid-template-columns:1fr}}
  `;
}

export function renderDetailDrawer(snapshot, role) {
  const meta = ROLE_META[role];
  if (!meta) return '';
  const items = (snapshot?.entities || [])
    .filter((entity) => entity.category === meta.category)
    .sort((a, b) => String(a.name || a.entity_id).localeCompare(String(b.name || b.entity_id)))
    .slice(0, 12);

  return `<div class="ecc-detail-backdrop" data-ecc-detail-backdrop>
    <aside class="ecc-detail-drawer" role="dialog" aria-modal="true" aria-label="${safe(meta.title)} details">
      <div class="ecc-detail-head">
        <span class="ecc-detail-icon">${meta.icon}</span>
        <span><h2>${safe(meta.title)}</h2><small>Live Home Assistant data</small></span>
        <button class="ecc-detail-close" type="button" aria-label="Close details" data-ecc-close-detail>×</button>
      </div>
      ${items.length ? `<div class="ecc-detail-grid">${items.map((entity) => `<div class="ecc-detail-item">
        <small>${safe(entity.name || entity.entity_id)}</small>
        <strong>${safe(entity.available === false ? 'Unavailable' : entityValue(entity))}</strong>
        <code>${safe(entity.entity_id)}</code>
      </div>`).join('')}</div>` : '<div class="ecc-detail-empty">No matching live entities found yet.</div>'}
      <div class="ecc-detail-tip">Tap another item on the house scene to switch straight to its live details.</div>
    </aside>
  </div>`;
}
