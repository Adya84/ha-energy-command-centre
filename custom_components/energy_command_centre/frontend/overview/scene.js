import { formatWindMph, solarProgress } from "./formatters.js";

const esc = (value) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

const active = (flow) => flow?.available && flow.direction !== "idle" && flow.direction !== "unknown";
const flowClass = (name, flow) => `flow-path flow-${name}${active(flow) ? " flow-active" : ""} direction-${flow?.direction || "unknown"}`;

function hoursRemaining(ms) {
  if (ms === null) return "Timing unavailable";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.round((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m remaining`;
}

function detailOverlay(model, selected) {
  if (!selected) return "";
  const battery = model.batteries.find((item) => `battery-${item.id}` === selected);
  const content = battery
    ? `<p>${esc(battery.power.display)} · ${battery.soc === null ? "SOC unavailable" : `${esc(battery.soc)}% charged`}</p>`
    : selected === "ev"
      ? `<p>${esc(model.ev.display)} · ${esc(model.ev.direction.replaceAll("_", " "))}</p>`
      : `<p>${esc(model[selected]?.display || "Live details unavailable")}</p>`;
  const title = battery?.name || ({ solar: "Solar array", home: "Home", grid: "Grid", inverter: "Inverter", ev: "EV charger" }[selected] || "Equipment");
  return `<aside class="equipment-detail" aria-live="polite"><button class="detail-close" data-close-equipment aria-label="Close details">×</button><span>Live equipment</span><h2>${esc(title)}</h2>${content}</aside>`;
}

export function renderEnergyScene(model, options = {}) {
  const now = options.now || new Date();
  const solarDay = solarProgress(model.environment, now);
  const isNight = solarDay.mode === "night";
  const celestialLeft = Math.round(7 + solarDay.progress * 86);
  const celestialTop = Math.round(68 - Math.sin(Math.PI * solarDay.progress) * 54);
  const wind = model.environment?.wind || {};
  const windDisplay = formatWindMph(wind.value, wind.unit);
  const windBearing = Number.isFinite(Number(wind.bearing)) ? Number(wind.bearing) : 0;
  const forecast = model.environment?.solar_forecast_remaining_kwh;
  const batteries = model.batteries.length ? model.batteries : [
    { id: "1", name: "Battery 1", soc: null, power: model.battery },
    { id: "2", name: "Battery 2", soc: null, power: model.battery },
  ];
  return `<section class="energy-scene scene-${solarDay.mode}" aria-label="Live home energy overview">
    <div class="sky-layer" aria-hidden="true">
      <div class="star-field">${Array.from({ length: 28 }, (_, index) => `<i style="--x:${(index * 37) % 97}%;--y:${(index * 19) % 58}%;--d:${(index % 5) * .5}s"></i>`).join("")}</div>
      <i class="shooting-star"></i><i class="bird bird-one">⌁</i><i class="bird bird-two">⌁</i>
      <div class="aircraft"><i></i><b></b><span>✈</span></div>
      <div class="celestial-arc"><span class="arc-line"></span><i class="celestial ${isNight ? "moon" : "sun"}" style="left:${celestialLeft}%;top:${celestialTop}%">${isNight ? "◐" : "☀"}</i></div>
      <div class="solar-clock"><strong>${isNight ? "Night cycle" : "Solar day"}</strong><span>${hoursRemaining(solarDay.remainingMs)}</span><small>${forecast == null ? "Solar forecast unavailable" : `${Number(forecast).toFixed(1)} kWh forecast remaining`}</small></div>
    </div>
    <div class="property-stage">
      <img class="house-art" src="/energy_command_centre_static/assets/overview/house-day.svg" alt="Modern UK home with solar panels, inverter, batteries and an electric car">
      <svg class="energy-flow-layer" viewBox="0 0 1200 680" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs><filter id="glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        <path class="${flowClass("solar", model.solar)}" pathLength="1" d="M525 188 C528 248 570 300 575 365"/>
        <path class="${flowClass("grid", model.grid)}" pathLength="1" d="M88 388 C235 388 338 388 500 390"/>
        <path class="${flowClass("battery", model.battery)}" pathLength="1" d="M580 397 C720 410 825 430 913 478"/>
        <path class="${flowClass("ev", model.ev)}" pathLength="1" d="M585 406 C742 468 846 548 1014 552"/>
      </svg>
      <button class="equipment-hit solar-hit" role="button" aria-label="Open solar array details" data-equipment="solar"><span>${esc(model.solar.display)}</span><small>Solar</small></button>
      <button class="equipment-hit grid-hit" role="button" aria-label="Open grid details" data-equipment="grid"><span>${esc(model.grid.display)}</span><small>${esc(model.grid.direction === "out" ? "Exporting" : "Grid")}</small></button>
      <button class="equipment-hit home-hit" role="button" aria-label="Open home consumption details" data-equipment="home"><span>${esc(model.load.display)}</span><small>Home</small></button>
      <button class="equipment-hit inverter-hit" role="button" aria-label="Open inverter details" data-equipment="inverter"><span>${esc(model.battery.display)}</span><small>Inverter</small></button>
      ${batteries.slice(0, 2).map((battery, index) => `<button class="equipment-hit battery-hit battery-${index + 1}" role="button" aria-label="Open ${esc(battery.name)} details" data-equipment="battery-${esc(battery.id)}"><span>${battery.soc === null ? "—" : `${esc(battery.soc)}%`}</span><small>${esc(battery.name)}</small></button>`).join("")}
      <button class="equipment-hit ev-hit" role="button" aria-label="Open EV charger details" data-equipment="ev">${model.ev.available ? `<span>EV · ${esc(model.ev.display)}</span>` : ""}<small>EV charger</small></button>
      <div class="vehicle-shell" aria-hidden="true"></div>
      <div class="wind-instrument"><div class="wind-compass"><i style="transform:rotate(${windBearing}deg)">➤</i></div><strong>${esc(windDisplay)}</strong><span>Wind</span></div>
    </div>
    <footer class="summary-strip">
      <div><span>Solar</span><strong>${esc(model.solar.display)}</strong></div>
      <div><span>Home</span><strong>${esc(model.load.display)}</strong></div>
      <div><span>Battery</span><strong>${esc(model.battery.display)}</strong></div>
      <div><span>Grid</span><strong>${esc(model.grid.display)}</strong></div>
      <div><span>EV</span><strong>${esc(model.ev.display)}</strong></div>
    </footer>
    ${detailOverlay(model, options.selected)}
  </section>`;
}
