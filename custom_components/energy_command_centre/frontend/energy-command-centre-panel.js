const WS_TYPE = "energy_command_centre/overview";
const BRAND_ICON = "/energy_command_centre_brand/icon.png?v=0.1.0-alpha.9";

const ICONS = {
  overview: "⌁",
  battery: "▰",
  inverter: "ϟ",
  health: "♡",
  raw: "⌕",
  settings: "⚙",
};

const safe = (value) => String(value ?? "—")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const number = (entity) => {
  const parsed = Number.parseFloat(entity?.state);
  return Number.isFinite(parsed) ? parsed : null;
};

const display = (entity, fallback = "Waiting") => {
  if (!entity || !entity.available) return fallback;
  const parsed = number(entity);
  const state = parsed === null ? entity.state : parsed.toLocaleString(undefined, {
    maximumFractionDigits: Math.abs(parsed) < 10 ? 2 : 1,
  });
  return `${state}${entity.unit ? ` ${entity.unit}` : ""}`;
};

class EnergyCommandCentrePanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._snapshot = null;
    this._active = "overview";
    this._loading = true;
    this._error = null;
    this._search = "";
    this._timer = null;
    this._render();
  }

  set hass(value) {
    const first = !this._hass;
    this._hass = value;
    if (first) this._start();
  }

  set narrow(_value) {}
  set route(_value) {}
  set panel(_value) {}

  disconnectedCallback() {
    if (this._timer) window.clearInterval(this._timer);
  }

  async _start() {
    await this._refresh();
    this._timer = window.setInterval(() => this._refresh(false), 5000);
  }

  async _refresh(showLoader = true) {
    if (!this._hass?.connection) return;
    if (showLoader && !this._snapshot) this._loading = true;
    try {
      this._snapshot = await this._hass.connection.sendMessagePromise({ type: WS_TYPE });
      this._error = null;
    } catch (error) {
      this._error = error?.message || "Unable to read Home Assistant data";
    } finally {
      this._loading = false;
      this._render();
    }
  }

  _entities(category) {
    return (this._snapshot?.entities || []).filter((entity) => entity.category === category);
  }

  _find(category, ...needles) {
    const items = this._entities(category);
    const terms = needles.map((item) => item.toLowerCase());
    return items
      .map((item) => {
        const haystack = `${item.entity_id} ${item.name}`.toLowerCase();
        return { item, score: terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0) };
      })
      .sort((a, b) => b.score - a.score)[0]?.item;
  }

  _power(category, ...needles) {
    const entities = this._entities(category).filter((item) => {
      const unit = (item.unit || "").toLowerCase();
      return unit === "w" || unit === "kw";
    });
    const terms = needles.map((item) => item.toLowerCase());
    return entities
      .map((item) => {
        const text = `${item.entity_id} ${item.name}`.toLowerCase();
        return { item, score: terms.reduce((sum, term) => sum + (text.includes(term) ? 2 : 0), 0) };
      })
      .sort((a, b) => b.score - a.score)[0]?.item;
  }

  _styles() {
    return `
      :host { --bg:#071013; --panel:#0d1a1e; --panel2:#102329; --line:#20353b; --text:#f2f8f5; --muted:#8da2a2; --green:#58e19d; --cyan:#53d6df; --yellow:#ffd166; --red:#ff667a; display:block; min-height:100%; color:var(--text); font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
      * { box-sizing:border-box; }
      button,input { font:inherit; }
      .app { min-height:100vh; background:radial-gradient(circle at 72% -15%,#16424b 0,transparent 36%),linear-gradient(160deg,#071013 0%,#091418 55%,#061013 100%); }
      .topbar { height:72px; display:flex; align-items:center; gap:18px; padding:0 28px; border-bottom:1px solid #1c3035; background:#071114db; backdrop-filter:blur(18px); position:sticky; top:0; z-index:5; }
      .brand-mark { width:48px; height:48px; display:grid; place-items:center; flex:0 0 48px; }
      .brand-logo { width:48px; height:48px; display:block; object-fit:contain; filter:drop-shadow(0 0 10px #58e19d3d); }
      .brand { line-height:1.1; min-width:180px; }.brand strong{display:block;font-size:16px;letter-spacing:.02em}.brand span{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.13em}
      .top-status { margin-left:auto; display:flex; align-items:center; gap:18px; color:var(--muted); font-size:13px; }
      .online { display:flex;align-items:center;gap:8px;color:#b8c9c7}.online::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 12px var(--green)}
      .refresh { border:1px solid var(--line);background:#102026;color:#ddecE8;padding:9px 13px;border-radius:10px;cursor:pointer}.refresh:hover{border-color:#3b5c62}
      .layout { display:grid; grid-template-columns:220px minmax(0,1fr); min-height:calc(100vh - 72px); }
      nav { padding:24px 14px; border-right:1px solid #1b2c31; background:#07111488; }
      .nav-label { padding:0 13px 9px;color:#63797a;font-size:10px;font-weight:800;letter-spacing:.15em;text-transform:uppercase; }
      .nav-btn { width:100%;border:0;background:transparent;color:#91a7a7;border-radius:11px;padding:11px 13px;margin:2px 0;display:flex;align-items:center;gap:12px;text-align:left;cursor:pointer;font-weight:650; }
      .nav-btn i { font-style:normal;width:23px;text-align:center;font-size:18px }.nav-btn:hover{background:#102126;color:white}.nav-btn.active{background:linear-gradient(90deg,#17392f,#102c30);color:var(--green);box-shadow:inset 3px 0 0 var(--green)}
      .premium { margin:26px 8px 0;padding:15px;border:1px solid #79652b;border-radius:14px;background:linear-gradient(145deg,#29240f,#151b19);font-size:12px;color:#ccbF91}.premium strong{display:block;color:var(--yellow);font-size:13px;margin-bottom:4px}.premium em{font-style:normal;font-weight:800;color:#fff}
      main { padding:28px 30px 46px; max-width:1540px; width:100%; margin:0 auto; }
      .heading { display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:24px}.heading h1{font-size:28px;line-height:1;margin:0 0 7px;letter-spacing:-.03em}.heading p{margin:0;color:var(--muted);font-size:13px}.eyebrow{color:var(--green);text-transform:uppercase;letter-spacing:.15em;font-size:10px;font-weight:850;margin-bottom:7px}
      .grid { display:grid; grid-template-columns:repeat(12,minmax(0,1fr)); gap:16px; }.card { border:1px solid var(--line);background:linear-gradient(145deg,#0e1d21e8,#0b171ae8);border-radius:18px;padding:20px;box-shadow:0 15px 40px #0003; }.span-3{grid-column:span 3}.span-4{grid-column:span 4}.span-5{grid-column:span 5}.span-7{grid-column:span 7}.span-8{grid-column:span 8}.span-12{grid-column:span 12}
      .metric-label { color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.1em;font-weight:750}.metric-value{font-size:29px;font-weight:780;letter-spacing:-.04em;margin-top:9px}.metric-note{font-size:11px;color:#708686;margin-top:5px}.accent{color:var(--green)}.cyan{color:var(--cyan)}.yellow{color:var(--yellow)}
      .flow { min-height:350px;position:relative;overflow:hidden;background:radial-gradient(circle at center,#142e32 0,transparent 54%),linear-gradient(145deg,#0e1c20,#091518)}
      .flow::after{content:"";position:absolute;inset:0;background-image:linear-gradient(#ffffff06 1px,transparent 1px),linear-gradient(90deg,#ffffff06 1px,transparent 1px);background-size:34px 34px;mask-image:radial-gradient(circle,#000,transparent 75%);pointer-events:none}
      .flow-title{position:relative;z-index:2}.flow-map{height:280px;position:relative;z-index:2}.node{position:absolute;width:112px;min-height:74px;border:1px solid #29454b;background:#0a171bcc;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 10px 26px #0004}.node b{font-size:19px}.node small{color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.09em;margin-top:4px}.solar{left:calc(50% - 56px);top:0}.home{left:calc(50% - 56px);top:103px;border-color:#397568;box-shadow:0 0 30px #58e19d15}.grid-node{left:5%;top:103px}.battery-node{right:5%;top:103px}.ev-node{left:calc(50% - 56px);bottom:0}
      .link{position:absolute;background:#294248;overflow:hidden}.link::after{content:"";position:absolute;background:linear-gradient(90deg,transparent,var(--green),transparent);animation:pulse 1.8s linear infinite}.vlink{width:2px;height:29px;left:50%}.vlink::after{width:2px;height:14px;animation-name:pulse-v}.solar-link{top:74px}.ev-link{top:177px;height:29px}.hlink{height:2px;top:139px}.hlink::after{height:2px;width:34px}.grid-link{left:calc(5% + 112px);width:calc(45% - 168px)}.battery-link{left:calc(50% + 56px);width:calc(45% - 168px)}
      @keyframes pulse{from{left:-40px}to{left:100%}}@keyframes pulse-v{from{top:-15px}to{top:100%}}
      .status-list{display:grid;gap:10px;margin-top:15px}.status-row{display:flex;gap:11px;align-items:center;padding:10px 11px;background:#0b171a;border-radius:11px;border:1px solid #192d31}.dot{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 9px #58e19d88}.dot.warn{background:var(--yellow);box-shadow:0 0 9px #ffd16666}.dot.bad{background:var(--red);box-shadow:0 0 9px #ff667a66}.status-row span{font-size:12px}.status-row small{margin-left:auto;color:var(--muted)}
      .section-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:15px}.section-title h2{margin:0;font-size:15px}.pill{font-size:10px;border-radius:999px;padding:5px 9px;background:#16362c;color:var(--green);font-weight:800;text-transform:uppercase;letter-spacing:.08em}
      .cells{display:grid;grid-template-columns:repeat(auto-fill,minmax(105px,1fr));gap:10px}.cell{padding:12px;background:#0a1619;border:1px solid #1b3035;border-radius:12px}.cell-top{display:flex;justify-content:space-between;color:var(--muted);font-size:10px}.cell strong{display:block;font-size:17px;margin-top:5px;color:#c9f7e2}.bar{height:4px;border-radius:4px;background:#1c3034;margin-top:9px;overflow:hidden}.bar i{display:block;height:100%;background:linear-gradient(90deg,#35b785,var(--green));border-radius:4px}
      .table-wrap{overflow:auto;border:1px solid var(--line);border-radius:15px}.data-table{width:100%;border-collapse:collapse;font-size:12px}.data-table th{text-align:left;color:#758b8c;text-transform:uppercase;letter-spacing:.08em;font-size:9px;padding:12px;background:#0d1d21;position:sticky;top:0}.data-table td{padding:11px 12px;border-top:1px solid #182a2e;white-space:nowrap}.data-table tr:hover td{background:#102125}.entity{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#9cb4b3}.search{width:min(340px,100%);border:1px solid var(--line);border-radius:11px;background:#0b181b;color:white;padding:10px 13px;outline:0}.search:focus{border-color:#3c756b}.empty,.loading,.error{padding:50px;text-align:center;color:var(--muted)}.spinner{width:38px;height:38px;border:3px solid #244047;border-top-color:var(--green);border-radius:50%;margin:0 auto 14px;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
      .notice{padding:14px 16px;border-radius:13px;background:#251b1d;border:1px solid #5b2c35;color:#ffabb7;margin-bottom:18px;font-size:12px}.good-box{padding:22px;border:1px solid #2d5b4d;border-radius:16px;background:linear-gradient(145deg,#10271f,#0b1a19)}.good-box strong{font-size:18px;color:var(--green)}.good-box p{color:#a5b8b4;margin:8px 0 0;font-size:13px;line-height:1.55}
      @media(max-width:1000px){.span-3,.span-4{grid-column:span 6}.span-5,.span-7,.span-8{grid-column:span 12}.layout{grid-template-columns:78px minmax(0,1fr)}nav{padding:20px 8px}.nav-label,.nav-btn span,.premium{display:none}.nav-btn{justify-content:center;padding:13px}.nav-btn i{font-size:20px}.brand{display:none}}
      @media(max-width:680px){.topbar{padding:0 14px;height:62px}.layout{display:block;min-height:calc(100vh - 62px)}nav{position:fixed;bottom:0;left:0;right:0;z-index:10;border:0;border-top:1px solid var(--line);display:flex;justify-content:space-around;background:#081417f5;padding:7px 5px}.nav-btn{width:auto;margin:0;padding:9px 13px}.nav-btn:nth-of-type(6){display:none}main{padding:20px 13px 90px}.top-status>span:first-child{display:none}.grid{gap:11px}.card{padding:16px;border-radius:15px}.span-3,.span-4{grid-column:span 6}.metric-value{font-size:22px}.flow{min-height:330px}.heading h1{font-size:24px}.node{width:88px;min-height:66px}.solar,.home,.ev-node{left:calc(50% - 44px)}.grid-node{left:0}.battery-node{right:0}.grid-link{left:88px;width:calc(50% - 132px)}.battery-link{left:calc(50% + 44px);width:calc(50% - 132px)}.node b{font-size:15px}}
    `;
  }

  _nav() {
    const items = [
      ["overview", "Overview"], ["battery", "Battery Lab"],
      ["inverter", "Inverter"], ["health", "System Health"],
      ["raw", "Raw Data"], ["settings", "Settings"],
    ];
    return `<nav><div class="nav-label">Energy Console</div>${items.map(([key, label]) => `
      <button class="nav-btn ${this._active === key ? "active" : ""}" data-page="${key}"><i>${ICONS[key]}</i><span>${label}</span></button>
    `).join("")}<div class="premium"><strong>Premium preview</strong>Advanced analysis will be available for <em>£2.99 lifetime</em>.</div></nav>`;
  }

  _metric(label, value, note, colour = "") {
    return `<div class="card span-3"><div class="metric-label">${safe(label)}</div><div class="metric-value ${colour}">${safe(value)}</div><div class="metric-note">${safe(note)}</div></div>`;
  }

  _overview() {
    const solar = this._power("solar", "power", "pv");
    const load = this._power("load", "load", "power");
    const grid = this._power("grid", "power", "grid");
    const batteryPower = this._power("battery", "power", "battery");
    const soc = this._find("battery", "soc");
    const ev = this._power("ev", "power", "charge");
    const total = this._snapshot?.summary?.total || 0;
    const unavailable = this._snapshot?.summary?.unavailable || 0;
    return `
      <div class="heading"><div><div class="eyebrow">Live energy system</div><h1>Good ${this._greeting()}</h1><p>${total} energy entities discovered automatically</p></div></div>
      <div class="grid">
        ${this._metric("Solar generation", display(solar), "Live PV output", "yellow")}
        ${this._metric("Home consumption", display(load), "Current house load")}
        ${this._metric("Battery", display(soc), display(batteryPower, "No power entity"), "accent")}
        ${this._metric("Grid", display(grid), "Live import or export", "cyan")}
        <section class="card span-8 flow">
          <div class="section-title flow-title"><h2>Live power flow</h2><span class="pill">Live</span></div>
          <div class="flow-map">
            <div class="node solar"><b class="yellow">${safe(display(solar))}</b><small>Solar</small></div><div class="link vlink solar-link"></div>
            <div class="node grid-node"><b class="cyan">${safe(display(grid))}</b><small>Grid</small></div><div class="link hlink grid-link"></div>
            <div class="node home"><b>${safe(display(load))}</b><small>Home</small></div>
            <div class="node battery-node"><b class="accent">${safe(display(batteryPower))}</b><small>Battery ${soc ? safe(soc.state) + "%" : ""}</small></div><div class="link hlink battery-link"></div>
            <div class="link vlink ev-link"></div><div class="node ev-node"><b>${safe(display(ev, "0 W"))}</b><small>EV charger</small></div>
          </div>
        </section>
        <section class="card span-4"><div class="section-title"><h2>System status</h2><span class="pill">${unavailable ? "Attention" : "Healthy"}</span></div><div class="status-list">
          ${this._statusRow("Entity discovery", `${total} found`, total > 0 ? "good" : "warn")}
          ${this._statusRow("Available sensors", `${total - unavailable}/${total}`, unavailable ? "warn" : "good")}
          ${this._statusRow("Battery data", `${this._entities("battery").length} entities`, this._entities("battery").length ? "good" : "warn")}
          ${this._statusRow("PredBat", `${this._entities("predbat").length} entities`, this._entities("predbat").length ? "good" : "warn")}
          ${this._statusRow("EV charging", `${this._entities("ev").length} entities`, this._entities("ev").length ? "good" : "warn")}
        </div></section>
      </div>`;
  }

  _statusRow(label, value, status) {
    return `<div class="status-row"><i class="dot ${status === "warn" ? "warn" : status === "bad" ? "bad" : ""}"></i><span>${safe(label)}</span><small>${safe(value)}</small></div>`;
  }

  _battery() {
    const all = this._entities("battery");
    const cells = all.filter((item) => item.cell_number !== null).sort((a, b) => a.cell_number - b.cell_number);
    const values = cells.map(number).filter((item) => item !== null);
    const min = values.length ? Math.min(...values) : null;
    const max = values.length ? Math.max(...values) : null;
    const spread = min !== null && max !== null ? (max - min) * 1000 : null;
    const average = values.length ? values.reduce((sum, item) => sum + item, 0) / values.length : null;
    return `<div class="heading"><div><div class="eyebrow">Deep battery visibility</div><h1>Battery Lab</h1><p>Pack, BMS and individual cell information</p></div></div>
      <div class="grid">
        ${this._metric("Battery entities", all.length, "Automatically grouped")}
        ${this._metric("Cells discovered", cells.length, "Across available battery packs", "accent")}
        ${this._metric("Cell spread", spread === null ? "Waiting" : `${spread.toFixed(1)} mV`, spread !== null && spread > 50 ? "Review recommended" : "Live pack balance", spread !== null && spread > 50 ? "yellow" : "accent")}
        ${this._metric("Average cell", average === null ? "Waiting" : `${average.toFixed(3)} V`, "Current mean voltage")}
        <section class="card span-12"><div class="section-title"><h2>Individual cell voltages</h2><span class="pill">${cells.length} cells</span></div>
          ${cells.length ? `<div class="cells">${cells.map((cell) => {
            const val = number(cell); const ratio = min === max ? 70 : 25 + ((val - min) / (max - min)) * 70;
            return `<div class="cell"><div class="cell-top"><span>Cell ${safe(cell.cell_number)}</span><span>${cell.available ? "Live" : "Offline"}</span></div><strong>${val === null ? safe(cell.state) : val.toFixed(3)} ${safe(cell.unit || "V")}</strong><div class="bar"><i style="width:${ratio}%"></i></div></div>`;
          }).join("")}</div>` : `<div class="empty">No individual cell entities have been matched yet. They will appear here automatically when your GivTCP cell sensors are available.</div>`}
        </section>
        ${this._entityTable(all, "Battery and BMS entities")}
      </div>`;
  }

  _inverter() {
    const inverter = this._entities("inverter");
    const solar = this._entities("solar");
    const grid = this._entities("grid");
    return `<div class="heading"><div><div class="eyebrow">Electrical detail</div><h1>Inverter</h1><p>Live operating values, grid conditions and controls</p></div></div><div class="grid">
      ${this._metric("Inverter data", inverter.length, "Matched entities")}${this._metric("Solar data", solar.length, "PV and generation entities", "yellow")}${this._metric("Grid data", grid.length, "Import, export and meter entities", "cyan")}${this._metric("Operating state", display(this._find("inverter", "status")), "Reported by Home Assistant", "accent")}
      ${this._entityTable([...inverter, ...solar, ...grid], "Inverter, solar and grid data")}
    </div>`;
  }

  _health() {
    const summary = this._snapshot.summary;
    const issues = this._snapshot.entities.filter((item) => !item.available || item.stale_seconds > 900);
    return `<div class="heading"><div><div class="eyebrow">System Doctor</div><h1>System Health</h1><p>Connectivity, stale sensors and data-quality checks</p></div></div><div class="grid">
      <section class="span-12 good-box"><strong>${issues.length ? `${issues.length} item${issues.length === 1 ? "" : "s"} need attention` : "Your discovered system looks healthy"}</strong><p>${issues.length ? "The hub has found unavailable or stale energy entities. Review the checks below; guided fixes will be added during development." : "All discovered energy entities are available and updating normally. Advanced anomaly detection will compare values over time in a later build."}</p></section>
      ${this._metric("Available", summary.available, "Entities reporting normally", "accent")}${this._metric("Unavailable", summary.unavailable, "Unknown or unavailable")}${this._metric("Stale", summary.stale, "Not updated for 15 minutes", summary.stale ? "yellow" : "accent")}${this._metric("Total monitored", summary.total, "Matched energy entities")}
      <section class="card span-12"><div class="section-title"><h2>Checks</h2><span class="pill">Live</span></div><div class="status-list">
      ${this._snapshot.entities.slice(0, 80).map((item) => this._statusRow(item.name, item.available ? (item.stale_seconds > 900 ? "Stale" : "Online") : "Unavailable", !item.available ? "bad" : item.stale_seconds > 900 ? "warn" : "good")).join("") || `<div class="empty">No compatible entities found yet.</div>`}
      </div></section>
    </div>`;
  }

  _entityTable(items, title = "All discovered data") {
    return `<section class="card span-12"><div class="section-title"><h2>${safe(title)}</h2><span class="pill">${items.length} entities</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>State</th><th>Category</th><th>Integration</th><th>Entity ID</th></tr></thead><tbody>${items.map((item) => `<tr><td>${safe(item.name)}</td><td>${safe(display(item, item.state))}</td><td>${safe(item.category)}</td><td>${safe(item.platform)}</td><td class="entity">${safe(item.entity_id)}</td></tr>`).join("")}</tbody></table></div></section>`;
  }

  _raw() {
    const query = this._search.toLowerCase();
    const items = this._snapshot.entities.filter((item) => !query || `${item.name} ${item.entity_id} ${item.category} ${item.platform}`.toLowerCase().includes(query));
    return `<div class="heading"><div><div class="eyebrow">Nothing hidden</div><h1>Raw Data</h1><p>Every energy-related entity discovered by the hub</p></div><input class="search" type="search" value="${safe(this._search)}" placeholder="Search sensors, devices or values…"></div><div class="grid">${this._entityTable(items)}</div>`;
  }

  _settings() {
    return `<div class="heading"><div><div class="eyebrow">App configuration</div><h1>Settings</h1><p>Display, source mapping and future Premium options</p></div></div><div class="grid"><section class="card span-12"><div class="section-title"><h2>Development build</h2><span class="pill">v0.1 Alpha</span></div><div class="status-list">${this._statusRow("Automatic entity discovery", "Enabled", "good")}${this._statusRow("Read-only safety mode", "Enabled", "good")}${this._statusRow("Refresh interval", "5 seconds", "good")}${this._statusRow("Direct inverter connection", "Planned", "warn")}${this._statusRow("Premium licence", "Not required during development", "good")}</div></section><section class="card span-12"><div class="section-title"><h2>Coming next</h2></div><p style="color:var(--muted);line-height:1.7;font-size:13px;margin:0">This page will allow manual sensor mapping, battery naming, unit preferences, dashboard card arrangement, theme selection, control permissions and notification thresholds. Development builds keep every feature unlocked while we design and test the complete system.</p></section></div>`;
  }

  _greeting() {
    const hour = new Date().getHours();
    return hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  }

  _content() {
    if (this._loading) return `<div class="loading"><div class="spinner"></div>Discovering your energy system…</div>`;
    if (!this._snapshot) return `<div class="error">No system snapshot is available yet.</div>`;
    return ({ overview: () => this._overview(), battery: () => this._battery(), inverter: () => this._inverter(), health: () => this._health(), raw: () => this._raw(), settings: () => this._settings() }[this._active] || (() => this._overview()))();
  }

  _captureScroll() {
    const ancestors = [];
    let node = this.parentElement;
    while (node) {
      ancestors.push({ node, top: node.scrollTop || 0, left: node.scrollLeft || 0 });
      node = node.parentElement || node.getRootNode?.().host || null;
    }
    return {
      ancestors,
      windowX: globalThis.window?.scrollX || 0,
      windowY: globalThis.window?.scrollY || 0,
    };
  }

  _restoreScroll(state) {
    for (const item of state.ancestors) {
      item.node.scrollTop = item.top;
      item.node.scrollLeft = item.left;
    }
    globalThis.window?.scrollTo?.(state.windowX, state.windowY);
  }

  _render() {
    const scroll = this._captureScroll();
    this.shadowRoot.innerHTML = `<style>${this._styles()}</style><div class="app"><header class="topbar"><div class="brand-mark"><img class="brand-logo" src="${BRAND_ICON}" alt=""></div><div class="brand"><strong>Energy Command Centre</strong><span>Universal energy console</span></div><div class="top-status"><span>${this._snapshot ? `Updated ${new Date(this._snapshot.generated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Starting…"}</span><span class="online">Local connection</span><button class="refresh">Refresh</button></div></header><div class="layout">${this._nav()}<main>${this._error ? `<div class="notice">${safe(this._error)}</div>` : ""}${this._content()}</main></div></div>`;
    this.shadowRoot.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => { this._active = button.dataset.page; this._render(); }));
    this.shadowRoot.querySelector(".refresh")?.addEventListener("click", () => this._refresh());
    this.shadowRoot.querySelector(".search")?.addEventListener("input", (event) => { this._search = event.target.value; this._render(); const input = this.shadowRoot.querySelector(".search"); input?.focus(); input?.setSelectionRange(this._search.length, this._search.length); });
    this._restoreScroll(scroll);
  }
}

if (!customElements.get("energy-command-centre-panel")) customElements.define("energy-command-centre-panel", EnergyCommandCentrePanel);
