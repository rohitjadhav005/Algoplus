/**
 * Preprocessing transforms for numeric columns
 */

export function normalize(values) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0);
  return values.map((v) => +((v - min) / (max - min)).toFixed(6));
}

export function standardize(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length);
  if (std === 0) return values.map(() => 0);
  return values.map((v) => +((v - mean) / std).toFixed(6));
}

export function logTransform(values) {
  return values.map((v) => (v > 0 ? +Math.log(v).toFixed(6) : null));
}

export function squareRootTransform(values) {
  return values.map((v) => (v >= 0 ? +Math.sqrt(v).toFixed(6) : null));
}

export function binValues(values, bins = 5) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binSize = (max - min) / bins;
  return values.map((v) => {
    const bin = Math.min(Math.floor((v - min) / binSize), bins - 1);
    const lo = +(min + bin * binSize).toFixed(3);
    const hi = +(lo + binSize).toFixed(3);
    return `[${lo}, ${hi})`;
  });
}

export function applyTransform(values, transform) {
  switch (transform) {
    case 'normalize': return normalize(values);
    case 'standardize': return standardize(values);
    case 'log': return logTransform(values);
    case 'sqrt': return squareRootTransform(values);
    case 'bin': return binValues(values);
    default: return values;
  }
}

/**
 * Apply transform to a full dataset and return new rows
 */
export function applyTransformToDataset(rows, col, transform) {
  const values = rows.map((r) => r[col]);
  const numericValues = values.map((v) => (typeof v === 'number' && !isNaN(v) ? v : null));

  if (transform === 'bin') {
    const nums = numericValues.filter((v) => v !== null);
    const binned = binValues(nums, 5);
    let binIdx = 0;
    const transformed = numericValues.map((v) => (v !== null ? binned[binIdx++] : null));
    return rows.map((r, i) => ({ ...r, [`${col}_${transform}`]: transformed[i] }));
  }

  const nums = numericValues.filter((v) => v !== null);
  const result = applyTransform(nums, transform);
  let resIdx = 0;
  const transformed = numericValues.map((v) => (v !== null ? result[resIdx++] : null));
  return rows.map((r, i) => ({ ...r, [`${col}_${transform}`]: transformed[i] }));
}
