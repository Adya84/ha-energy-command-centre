import { formatPower } from "./formatters.js";

const numeric = (entity) => {
  if (!entity?.available) return null;
  const value = Number.parseFloat(entity.state);
  if (!Number.isFinite(value)) return null;
  return String(entity.unit || "").toLowerCase() === "kw" ? value * 1000 : value;
};

const text = (entity) => `${entity?.entity_id || ""} ${entity?.name || ""}`.toLowerCase();
const isPower = (entity) => ["w", "kw"].includes(String(entity?.unit || "").toLowerCase());

function best(entities, category, terms = []) {
  return entities
    .filter((entity) => entity.category === category && isPower(entity))
    .map((entity) => ({
      entity,
      score: terms.reduce((score, term) => score + (text(entity).includes(term) ? 2 : 0), 0)
        + (text(entity).includes("power") ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)[0]?.entity || null;
}

function directionFor(role, entity, watts) {
  if (watts === null) return "unknown";
  if (Math.abs(watts) < 1) return "idle";
  const label = text(entity);
  if (role === "solar" || role === "load") return "in";
  if (role === "ev") return "to_ev";
  if (role === "grid") {
    if (label.includes("export")) return "out";
    if (label.includes("import")) return "in";
    return watts < 0 ? "out" : "in";
  }
  if (role === "battery") {
    if (label.includes("discharge")) return "discharge";
    if (label.includes("charge")) return "charge";
    return watts < 0 ? "charge" : "discharge";
  }
  return "unknown";
}

function flow(role, entity, overrideWatts = undefined) {
  const watts = overrideWatts === undefined ? numeric(entity) : overrideWatts;
  return {
    watts,
    display: formatPower(watts),
    direction: directionFor(role, entity, watts),
    available: watts !== null,
    entityId: entity?.entity_id || null,
  };
}

function batteryPacks(entities) {
  const groups = new Map();
  for (const entity of entities.filter((item) => item.category === "battery")) {
    const key = entity.device_id || entity.device_name || text(entity).match(/battery\s*\d+/)?.[0];
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entity);
  }
  return [...groups.entries()].map(([key, items], index) => {
    const socEntity = items.find((item) => String(item.unit || "") === "%" && text(item).includes("soc"));
    const powerEntity = items.find(isPower);
    const socValue = socEntity?.available ? Number.parseFloat(socEntity.state) : null;
    return {
      id: String(key),
      name: items[0]?.device_name || `Battery ${index + 1}`,
      soc: Number.isFinite(socValue) ? socValue : null,
      power: flow("battery", powerEntity),
      entityIds: items.map((item) => item.entity_id),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

export function buildOverviewModel(snapshot = {}) {
  const entities = snapshot.entities || [];
  const batteries = batteryPacks(entities);
  const packPowers = batteries.map((pack) => pack.power.watts).filter(Number.isFinite);
  const batteryEntity = best(entities, "battery", ["battery", "power"]);
  const combinedBatteryWatts = packPowers.length
    ? packPowers.reduce((sum, value) => sum + value, 0)
    : numeric(batteryEntity);
  return {
    solar: flow("solar", best(entities, "solar", ["pv", "solar", "power"])),
    load: flow("load", best(entities, "load", ["house", "load", "power"])),
    grid: flow("grid", best(entities, "grid", ["grid", "power"])),
    battery: flow("battery", batteryEntity, combinedBatteryWatts),
    batteries,
    ev: flow("ev", best(entities, "ev", ["ev", "charge", "power"])),
    environment: snapshot.environment || {},
    summary: snapshot.summary || {},
    warnings: entities.filter((entity) => !entity.available || entity.stale_seconds > 900),
  };
}
