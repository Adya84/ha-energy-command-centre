import { direction, entityValue, formatPower, watts, windMph } from './formatters.js';

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

const formatClock = (iso) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const timeRemaining = (iso) => {
  const end = new Date(iso).getTime();
  if (!Number.isFinite(end)) return '—';
  const minutes = Math.max(0, Math.round((end - Date.now()) / 60000));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours ? `${hours}h ${mins}m` : `${mins}m`;
};

const dayModel = (hass) => {
  const sun = hass?.states?.['sun.sun'];
  const hour = new Date().getHours();
  const isDay = sun ? sun.state === 'above_horizon' : hour >= 7 && hour < 19;
  const target = isDay ? sun?.attributes?.next_setting : sun?.attributes?.next_rising;
  const elevation = Number(sun?.attributes?.elevation);
  let progress = isDay ? Math.max(0.08, Math.min(0.92, (hour - 6) / 14)) : Math.max(0.08, Math.min(0.92, hour >= 18 ? (hour - 18) / 12 : (hour + 6) / 12));
  if (Number.isFinite(elevation) && isDay) progress = Math.max(0.08, Math.min(0.92, (180 - Number(sun?.attributes?.azimuth || 90)) / 180));
  return { isDay, target, progress, fallback: !sun };
};

const windModel = (hass, snapshot) => {
  const stateValues = Object.values(hass?.states || {});
  const weather = stateValues.find((state) => state.entity_id?.startsWith('weather.') && Number.isFinite(Number(state.attributes?.wind_speed)));
  if (weather) {
    const unit = weather.attributes?.wind_speed_unit || 'km/h';
    return { speed: windMph(weather.attributes.wind_speed, unit), bearing: Number(weather.attributes.wind_bearing) || 0 };
  }
  const sensor = (snapshot?.entities || []).find((item) => /wind.*speed|speed.*wind/i.test(`${item.entity_id} ${item.name}`));
  const bearing = (snapshot?.entities || []).find((item) => /wind.*bearing|wind.*direction/i.test(`${item.entity_id} ${item.name}`));
  return { speed: sensor ? windMph(entityValue(sensor), sensor.unit) : null, bearing: Number(entityValue(bearing)) || 0 };
};

const flowClass = (entity, role) => {
  const value = watts(entity);
  if (value === null || Math.abs(value) < 1) return 'idle';
  if (role === 'grid') return direction(value, 'forward', 'reverse');
  if (role === 'battery') return direction(value, 'reverse', 'forward');
  return 'forward';
};

export function overviewSceneStyles() {
  return `
    .ecc-overview{display:grid;gap:16px}.ecc-scene-shell{position:relative;overflow:hidden;border:1px solid #29434a;border-radius:24px;background:#071217;box-shadow:0 24px 65px #0007;min-height:560px}.ecc-energy-scene{display:block;width:100%;height:auto;min-height:560px}.ecc-scene-shell.day{background:linear-gradient(#4b9ec8 0%,#a9d7e8 48%,#bcd6c3 48%,#66855f 100%)}.ecc-scene-shell.night{background:linear-gradient(#07111f 0%,#13223b 47%,#182b28 47%,#102019 100%)}
    .ecc-sky-stars{opacity:0}.night .ecc-sky-stars{opacity:1}.ecc-night-lights{opacity:0}.night .ecc-night-lights{opacity:1}.day .ecc-moon{opacity:0}.night .ecc-sun{opacity:0}.ecc-ambient{pointer-events:none}.ecc-birds{animation:eccBirds 24s linear infinite}.ecc-plane{animation:eccPlane 46s linear infinite}.ecc-shooting{opacity:0}.night .ecc-shooting{animation:eccShoot 11s ease-in-out infinite}.ecc-flow{fill:none;stroke-width:8;stroke-linecap:round;opacity:.28}.ecc-flow.active{opacity:.95;stroke-dasharray:7 18;animation:eccFlow 1.15s linear infinite}.ecc-flow.reverse{animation-direction:reverse}.ecc-flow.solar{stroke:#ffd45f}.ecc-flow.grid{stroke:#58d9eb}.ecc-flow.battery{stroke:#5bea9a}.ecc-flow.ev{stroke:#5aa8ff}.ecc-flow.load{stroke:#f4f6f6}.ecc-flow-label{font:700 20px Inter,system-ui,sans-serif;paint-order:stroke;stroke:#061014;stroke-width:7px;stroke-linejoin:round;fill:white}.ecc-mini{font:600 15px Inter,system-ui,sans-serif;fill:#d8ebeb}.ecc-title{font:800 27px Inter,system-ui,sans-serif;fill:white}.ecc-chip{background:#0a1519dd;border:1px solid #29444a;border-radius:16px;padding:13px 15px;min-width:150px}.ecc-summary{display:flex;gap:10px;overflow:auto;padding:2px}.ecc-chip small{display:block;color:#8fa7a8;text-transform:uppercase;letter-spacing:.09em;font-size:9px;font-weight:800}.ecc-chip strong{display:block;color:#f5fbf8;margin-top:4px;font-size:17px}.ecc-fallback{position:absolute;right:16px;top:16px;background:#5d4416dd;border:1px solid #b78c33;color:#ffe7a0;padding:7px 10px;border-radius:999px;font-size:10px;font-weight:800}.ecc-wind-card{position:absolute;right:18px;bottom:18px;background:#071318d9;border:1px solid #34515a;border-radius:18px;padding:11px 14px;color:white;backdrop-filter:blur(12px);display:flex;align-items:center;gap:10px}.ecc-wind-card b{font-size:18px}.ecc-wind-card small{display:block;color:#89a2a5;font-size:9px;text-transform:uppercase;letter-spacing:.08em}.ecc-vane{display:inline-block;font-size:25px;transform:rotate(var(--bearing));transition:transform .7s ease}.ecc-scene-caption{position:absolute;left:18px;top:18px;padding:11px 14px;border-radius:16px;background:#071318b8;border:1px solid #34515a;color:white;backdrop-filter:blur(10px)}.ecc-scene-caption b{display:block;font-size:17px}.ecc-scene-caption small{color:#a9c0c0}.ecc-house-hit{cursor:pointer;outline:none}.ecc-house-hit:focus .hit-ring,.ecc-house-hit:hover .hit-ring{opacity:1}.hit-ring{opacity:0;fill:none;stroke:#fff;stroke-width:3;stroke-dasharray:7 7}.ecc-arc-rest{fill:none;stroke:#ffffff35;stroke-width:4;stroke-dasharray:4 10}.ecc-arc-done{fill:none;stroke:#ffd45f;stroke-width:5;stroke-linecap:round}.night .ecc-arc-done{stroke:#9fc3ff}.ecc-sun{filter:drop-shadow(0 0 18px #ffd45f)}.ecc-moon{filter:drop-shadow(0 0 15px #cde2ff)}
    @keyframes eccFlow{to{stroke-dashoffset:-50}}@keyframes eccBirds{0%,12%{transform:translateX(-350px);opacity:0}18%{opacity:.7}50%{transform:translateX(1250px);opacity:.55}51%,100%{opacity:0}}@keyframes eccPlane{0%,58%{transform:translateX(-420px);opacity:0}61%{opacity:.65}88%{transform:translateX(1550px);opacity:.45}89%,100%{opacity:0}}@keyframes eccShoot{0%,77%{opacity:0;transform:translate(0,0)}80%{opacity:.85}86%{opacity:0;transform:translate(180px,105px)}100%{opacity:0}}
    @media(max-width:850px){.ecc-scene-shell,.ecc-energy-scene{min-height:430px}.ecc-title{font-size:22px}.ecc-flow-label{font-size:18px}.ecc-wind-card{right:10px;bottom:10px}.ecc-scene-caption{left:10px;top:10px}.ecc-chip{min-width:132px}}
    @media(max-width:600px){.ecc-scene-shell,.ecc-energy-scene{min-height:360px;border-radius:18px}.ecc-scene-caption small{display:none}.ecc-wind-card{padding:8px 10px}.ecc-flow-label{font-size:16px}.ecc-mini{font-size:13px}}
    @media(prefers-reduced-motion:reduce){.ecc-flow.active,.ecc-birds,.ecc-plane,.ecc-shooting{animation:none!important}.ecc-birds,.ecc-plane,.ecc-shooting{display:none}.ecc-flow.active{stroke-dasharray:none}}
  `;
}

export function renderEnergyScene(snapshot, hass) {
  const solar = findPower(snapshot, 'solar', 'power', 'pv');
  const load = findPower(snapshot, 'load', 'load', 'power');
  const grid = findPower(snapshot, 'grid', 'power', 'grid');
  const battery = findPower(snapshot, 'battery', 'power', 'battery');
  const ev = findPower(snapshot, 'ev', 'power', 'charge');
  const soc = find(snapshot, 'battery', 'soc');
  const day = dayModel(hass);
  const wind = windModel(hass, snapshot);
  const solarClass = flowClass(solar, 'solar');
  const gridClass = flowClass(grid, 'grid');
  const batteryClass = flowClass(battery, 'battery');
  const evClass = flowClass(ev, 'ev');
  const loadClass = flowClass(load, 'load');
  const arcX = 220 + day.progress * 1160;
  const arcY = 205 - Math.sin(day.progress * Math.PI) * 155;
  const batteries = Math.max(2, new Set(entities(snapshot, 'battery').map((item) => item.device_id).filter(Boolean)).size || 0);
  const targetLabel = day.isDay ? 'Sunset' : 'Sunrise';
  const targetClock = formatClock(day.target);
  const targetRemaining = timeRemaining(day.target);
  const windText = wind.speed === null ? null : `${wind.speed.toFixed(wind.speed < 10 ? 1 : 0)} mph`;

  return `<div class="ecc-overview">
    <section class="ecc-scene-shell ${day.isDay ? 'day' : 'night'}">
      ${day.fallback ? '<div class="ecc-fallback">SUN DATA FALLBACK</div>' : ''}
      <div class="ecc-scene-caption"><b>Live home energy</b><small>${targetLabel} ${safe(targetClock)} · ${safe(targetRemaining)} remaining</small></div>
      ${windText ? `<div id="ecc-wind" class="ecc-wind-card"><span class="ecc-vane" style="--bearing:${safe(wind.bearing)}deg">➤</span><span><small>Wind</small><b>${safe(windText)}</b></span></div>` : ''}
      <svg id="ecc-energy-scene" class="ecc-energy-scene" viewBox="0 0 1600 900" role="img" aria-label="Live Energy Command Centre house scene">
        <defs>
          <linearGradient id="brick" x1="0" x2="1"><stop stop-color="#8c5a49"/><stop offset=".48" stop-color="#a8755e"/><stop offset="1" stop-color="#70483d"/></linearGradient>
          <linearGradient id="render" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#f4f0e8"/><stop offset="1" stop-color="#cfc9bd"/></linearGradient>
          <linearGradient id="glass" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#9cc8d6"/><stop offset="1" stop-color="#284b59"/></linearGradient>
          <linearGradient id="drive" x1="0" x2="1"><stop stop-color="#8f9794"/><stop offset="1" stop-color="#686f6e"/></linearGradient>
          <filter id="shadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="18" stdDeviation="16" flood-opacity=".4"/></filter>
          <filter id="glow"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <g class="ecc-sky-stars" fill="#dbeaff">
          <circle cx="90" cy="82" r="2"/><circle cx="170" cy="142" r="1.4"/><circle cx="310" cy="76" r="1.8"/><circle cx="470" cy="112" r="1.2"/><circle cx="630" cy="52" r="1.7"/><circle cx="780" cy="129" r="1.1"/><circle cx="950" cy="70" r="1.9"/><circle cx="1130" cy="128" r="1.2"/><circle cx="1285" cy="54" r="1.5"/><circle cx="1450" cy="118" r="1.8"/>
        </g>
        <path id="ecc-solar-arc" class="ecc-arc-rest" d="M220 205 Q800 -100 1380 205"/>
        <path class="ecc-arc-done" d="M220 205 Q800 -100 1380 205" pathLength="100" stroke-dasharray="${Math.round(day.progress * 100)} 100"/>
        <g class="ecc-sun" transform="translate(${arcX} ${arcY})"><circle r="23" fill="#ffda58"/><circle r="34" fill="none" stroke="#ffda5866" stroke-width="5"/></g>
        <g class="ecc-moon" transform="translate(${arcX} ${arcY})"><circle r="24" fill="#dce9f7"/><circle cx="10" cy="-6" r="25" fill="#102039"/></g>
        <g class="ecc-ambient ecc-birds" transform="translate(0 135)" fill="none" stroke="#152329" stroke-width="4" stroke-linecap="round"><path d="M0 20 q12 -13 24 0 q12 -13 24 0M62 8 q10 -11 20 0 q10 -11 20 0M117 28 q8 -9 16 0 q8 -9 16 0"/></g>
        <g class="ecc-ambient ecc-plane" transform="translate(0 95)"><path d="M0 18 l55 -6 34 -24 13 3 -18 24 48 5 9 7 -58 1 -28 31 -12 -2 12 -29 -55 -3z" fill="#dae0e3" opacity=".8"/><circle cx="113" cy="19" r="4" fill="#ff4b55"><animate attributeName="opacity" values=".2;1;.2" dur="1s" repeatCount="indefinite"/></circle><circle cx="83" cy="29" r="3" fill="#5cff80"/></g>
        <g class="ecc-ambient ecc-shooting"><path d="M1220 80 l-115 62" stroke="#dbeaff" stroke-width="3"/><path d="M1218 82 l-55 31" stroke="#fff" stroke-width="6" opacity=".25"/></g>
        <path d="M0 590 C240 535 390 555 560 575 C810 610 1050 520 1600 545 L1600 900 L0 900z" fill="#48674d"/>
        <path d="M610 600 C830 575 1070 605 1370 900 L480 900z" fill="url(#drive)"/>
        <g id="ecc-house" filter="url(#shadow)">
          <polygon points="430,590 430,385 765,255 1100,385 1100,640 430,640" fill="url(#brick)"/>
          <rect x="760" y="365" width="340" height="275" fill="url(#render)"/>
          <polygon points="385,385 765,205 1145,385 1090,410 765,270 438,410" fill="#3f4144"/>
          <polygon points="430,385 765,255 1100,385 1072,397 764,287 458,397" fill="#5a5c5e"/>
          <g id="ecc-solar-array" transform="skewY(-20)">
            <rect x="610" y="463" width="96" height="61" rx="2" fill="#18384b" stroke="#93c8de" stroke-width="2"/>
            <rect x="711" y="463" width="96" height="61" rx="2" fill="#17364a" stroke="#93c8de" stroke-width="2"/>
            <rect x="812" y="463" width="96" height="61" rx="2" fill="#18384b" stroke="#93c8de" stroke-width="2"/>
            <rect x="913" y="463" width="96" height="61" rx="2" fill="#17364a" stroke="#93c8de" stroke-width="2"/>
            <path d="M658 463v61M759 463v61M860 463v61M961 463v61M610 493h399" stroke="#8ab4c5" stroke-width="1" opacity=".8"/>
          </g>
          <g stroke="#d9ddd9" stroke-width="9" fill="url(#glass)"><rect x="505" y="455" width="115" height="115"/><rect x="675" y="455" width="95" height="115"/><rect x="845" y="445" width="155" height="95"/><rect x="850" y="565" width="150" height="75"/></g>
          <rect x="650" y="535" width="88" height="105" fill="#28353a"/><rect x="665" y="553" width="56" height="69" fill="url(#glass)"/>
          <g class="ecc-night-lights" fill="#ffd889" filter="url(#glow)" opacity=".75"><rect x="510" y="460" width="105" height="105"/><rect x="680" y="460" width="85" height="105"/><rect x="850" y="450" width="145" height="85"/><rect x="855" y="570" width="140" height="65"/></g>
          <path d="M430 640h670" stroke="#242827" stroke-width="10"/>
        </g>
        <g id="ecc-inverter" transform="translate(1115 505)"><rect width="72" height="112" rx="10" fill="#eef2ef" stroke="#82908c" stroke-width="3"/><rect x="14" y="16" width="44" height="9" rx="4" fill="#c5d1cb"/><circle cx="36" cy="48" r="6" fill="#62d996"/><text x="36" y="78" text-anchor="middle" font-size="14" fill="#475654" font-weight="800">ECC</text></g>
        <g id="ecc-battery-bank" transform="translate(1200 545)">
          ${Array.from({length:batteries}).slice(0,3).map((_,index)=>`<g transform="translate(${index*78} 0)"><rect width="64" height="102" rx="9" fill="#e5e9e7" stroke="#788681" stroke-width="3"/><rect x="10" y="18" width="44" height="7" rx="3" fill="#b5c0bc"/><rect x="13" y="77" width="38" height="7" rx="3" fill="#5bea9a" opacity=".8"/></g>`).join('')}
        </g>
        <g id="ecc-ev-car" transform="translate(780 690)" filter="url(#shadow)"><path d="M20 82 Q35 40 75 35 L210 35 Q246 42 266 82 L295 90 Q315 94 320 119 L315 145 L10 145 L6 112 Q6 91 20 82z" fill="#c8d0d4" stroke="#5a686d" stroke-width="4"/><path d="M78 38 L112 9 H194 L235 39z" fill="#274653" stroke="#819ba6" stroke-width="3"/><path d="M120 13h70l35 25H88z" fill="#376374"/><circle cx="70" cy="145" r="31" fill="#1d2528"/><circle cx="70" cy="145" r="15" fill="#8a969b"/><circle cx="258" cy="145" r="31" fill="#1d2528"/><circle cx="258" cy="145" r="15" fill="#8a969b"/><rect x="18" y="93" width="23" height="10" rx="5" fill="#f6f1c6"/></g>
        <g transform="translate(1095 680)"><rect width="42" height="68" rx="8" fill="#f1f5f2" stroke="#6a7b78" stroke-width="3"/><circle cx="21" cy="24" r="9" fill="#55a8ff"/><path d="M18 68v34" stroke="#25383d" stroke-width="8"/></g>
        <g id="ecc-grid" transform="translate(285 520)" stroke="#4b5b5d" stroke-width="8" fill="none"><path d="M0 140 L55 0 L110 140 M22 85h66M12 115h86M55 0v175"/><path d="M-25 40h160" stroke="#7b8c8e" stroke-width="4"/></g>
        <g id="ecc-wind" transform="translate(1018 300)" stroke="#d6e4e5" fill="none"><path d="M0 75V15" stroke-width="5"/><circle cy="12" r="8" fill="#d6e4e5"/><path d="M0 12l45 -15 -11 20z" fill="#d6e4e5" transform="rotate(${safe(wind.bearing || 0)} 0 12)"/><g stroke-width="4"><path d="M0 30l23 0M0 30l-18 -12M0 30l-18 15"/></g></g>
        <path class="ecc-flow solar ${solarClass !== 'idle' ? `active ${solarClass}` : ''}" d="M800 335 C900 390 1015 445 1147 510"/>
        <path class="ecc-flow load ${loadClass !== 'idle' ? `active ${loadClass}` : ''}" d="M1145 540 C1030 575 945 590 860 600"/>
        <path class="ecc-flow battery ${batteryClass !== 'idle' ? `active ${batteryClass}` : ''}" d="M1182 570 C1208 570 1225 585 1240 600"/>
        <path class="ecc-flow grid ${gridClass !== 'idle' ? `active ${gridClass}` : ''}" d="M360 620 C510 625 650 617 815 610"/>
        <path class="ecc-flow ev ${evClass !== 'idle' ? `active ${evClass}` : ''}" d="M970 625 C1030 660 1060 690 1110 716"/>
        <text class="ecc-flow-label" x="865" y="392">☀ ${safe(formatPower(solar))}</text>
        <text class="ecc-flow-label" x="760" y="650">⌂ ${safe(formatPower(load))}</text>
        <text class="ecc-flow-label" x="1210" y="690">▰ ${safe(formatPower(battery))}${soc ? ` · ${safe(soc.state)}%` : ''}</text>
        <text class="ecc-flow-label" x="385" y="655">Grid ${safe(formatPower(grid))}</text>
        <text class="ecc-flow-label" x="1010" y="775">EV ${safe(formatPower(ev, 'Idle'))}</text>
        <g class="ecc-house-hit" tabindex="0" role="button" aria-label="Open house energy details"><rect class="hit-ring" x="420" y="250" width="700" height="405" rx="20"/></g>
      </svg>
    </section>
    <div class="ecc-summary">
      <div class="ecc-chip"><small>Solar now</small><strong>${safe(formatPower(solar))}</strong></div>
      <div class="ecc-chip"><small>Home load</small><strong>${safe(formatPower(load))}</strong></div>
      <div class="ecc-chip"><small>Grid</small><strong>${safe(formatPower(grid))}</strong></div>
      <div class="ecc-chip"><small>Battery</small><strong>${safe(soc ? `${soc.state}%` : formatPower(battery))}</strong></div>
      <div class="ecc-chip"><small>EV</small><strong>${safe(formatPower(ev, 'Idle'))}</strong></div>
      <div class="ecc-chip"><small>${targetLabel}</small><strong>${safe(targetClock)}</strong></div>
      ${windText ? `<div class="ecc-chip"><small>Wind</small><strong>${safe(windText)}</strong></div>` : ''}
    </div>
  </div>`;
}
