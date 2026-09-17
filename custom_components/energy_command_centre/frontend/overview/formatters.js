const finite = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function watts(entity) {
  if (entity?.available === false) return null;
  const raw = typeof entity === "object" ? entity?.state : entity;
  const value = finite(raw);
  if (value === null) return null;
  const unit = typeof entity === "object" ? String(entity?.unit || "W").toLowerCase() : "w";
  return unit === "kw" ? value * 1000 : value;
}

export function entityValue(entity) {
  if (entity?.available === false) return null;
  return typeof entity === "object" ? entity?.state : entity;
}

export function formatPower(entity, fallback = "Unavailable") {
  const value = watts(entity);
  if (value === null) return fallback;
  const magnitude = Math.abs(value);
  if (magnitude < 1000) return `${Math.round(magnitude)} W`;
  const kilowatts = magnitude / 1000;
  const decimals = kilowatts >= 10 ? 1 : 2;
  return `${kilowatts.toFixed(decimals).replace(/\.?0+$/, "")} kW`;
}

export function windToMph(value, unit) {
  const speed = finite(value);
  if (speed === null) return null;
  const normalised = String(unit || "mph").toLowerCase().replaceAll(" ", "");
  if (["km/h", "kmh", "kph"].includes(normalised)) return speed * 0.621371;
  if (["m/s", "mps", "ms-1"].includes(normalised)) return speed * 2.23694;
  if (["kn", "kt", "knot", "knots"].includes(normalised)) return speed * 1.15078;
  return speed;
}

export const windMph = windToMph;

export function direction(value, positive, negative) {
  const numeric = finite(value);
  if (numeric === null || numeric === 0) return "idle";
  return numeric > 0 ? positive : negative;
}

export function formatWindMph(value, unit) {
  const mph = windToMph(value, unit);
  return mph === null ? "Unavailable" : `${mph.toFixed(1)} mph`;
}

export function solarProgress(environment = {}, now = new Date()) {
  const sun = environment.sun || {};
  const isDay = sun.state === "above_horizon";
  const start = new Date(isDay ? sun.previous_rising : sun.previous_setting).getTime();
  const end = new Date(isDay ? sun.next_setting : sun.next_rising).getTime();
  const current = now.getTime();
  const valid = Number.isFinite(start) && Number.isFinite(end) && end > start;
  return {
    mode: isDay ? "day" : "night",
    progress: valid ? Math.min(1, Math.max(0, (current - start) / (end - start))) : 0,
    remainingMs: valid ? Math.max(0, end - current) : null,
  };
}
