export const entityValue = (entity) => {
  if (!entity || entity.available === false) return null;
  const value = Number.parseFloat(entity.state);
  return Number.isFinite(value) ? value : null;
};

export const watts = (entity) => {
  const value = entityValue(entity);
  if (value === null) return null;
  const unit = String(entity?.unit || 'W').toLowerCase();
  return unit === 'kw' ? value * 1000 : value;
};

export const formatPower = (entity, fallback = 'Unavailable') => {
  const value = watts(entity);
  if (value === null) return fallback;
  const abs = Math.abs(value);
  if (abs < 1000) return `${Math.round(abs)} W`;
  const kw = abs / 1000;
  return `${Number(kw.toFixed(2)).toString()} kW`;
};

export const direction = (value, positiveName, negativeName) => {
  if (!Number.isFinite(value) || Math.abs(value) < 1) return 'idle';
  return value > 0 ? positiveName : negativeName;
};

export const windMph = (value, unit = 'mph') => {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  const normal = String(unit).toLowerCase().replace('kph', 'km/h');
  if (normal === 'mph') return number;
  if (normal === 'km/h' || normal === 'kmh') return number * 0.621371;
  if (normal === 'm/s' || normal === 'mps') return number * 2.23694;
  if (normal === 'kn' || normal === 'knot' || normal === 'knots') return number * 1.15078;
  return null;
};
