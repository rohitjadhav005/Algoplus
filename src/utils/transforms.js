/**
 * transforms.js — API wrappers for the Python FastAPI backend.
 * All preprocessing transforms now handled by Python (sklearn, numpy).
 *
 * Original JS implementations replaced by: backend/routers/transforms.py
 */
import { apiFetch } from './api.js';

/**
 * Normalize values to [0, 1] using sklearn MinMaxScaler.
 * NOTE: For column transforms on a full dataset, prefer applyTransformToDataset().
 * @param {number[]} values
 * @returns {Promise<number[]>}
 */
export async function normalize(values) {
  const rows = values.map((v, i) => ({ __v: v, __i: i }));
  const result = await apiFetch('/api/transforms/apply', { rows, col: '__v', transform: 'normalize' });
  return result.rows.map((r) => r['__v_normalize']);
}

/**
 * Standardize values (Z-score, mean=0 std=1) using sklearn StandardScaler.
 * @param {number[]} values
 * @returns {Promise<number[]>}
 */
export async function standardize(values) {
  const rows = values.map((v) => ({ __v: v }));
  const result = await apiFetch('/api/transforms/apply', { rows, col: '__v', transform: 'standardize' });
  return result.rows.map((r) => r['__v_standardize']);
}

/**
 * Natural log transform (values > 0).
 * @param {number[]} values
 * @returns {Promise<(number|null)[]>}
 */
export async function logTransform(values) {
  const rows = values.map((v) => ({ __v: v }));
  const result = await apiFetch('/api/transforms/apply', { rows, col: '__v', transform: 'log' });
  return result.rows.map((r) => r['__v_log']);
}

/**
 * Square-root transform (values >= 0).
 * @param {number[]} values
 * @returns {Promise<(number|null)[]>}
 */
export async function squareRootTransform(values) {
  const rows = values.map((v) => ({ __v: v }));
  const result = await apiFetch('/api/transforms/apply', { rows, col: '__v', transform: 'sqrt' });
  return result.rows.map((r) => r['__v_sqrt']);
}

/**
 * Bin values into equal-width bins.
 * @param {number[]} values
 * @param {number} bins
 * @returns {Promise<string[]>}
 */
export async function binValues(values, bins = 5) {
  const rows = values.map((v) => ({ __v: v }));
  const result = await apiFetch('/api/transforms/apply', { rows, col: '__v', transform: 'bin', bins });
  return result.rows.map((r) => r['__v_bin']);
}

/**
 * Apply a named transform to an array of values.
 * @param {number[]} values
 * @param {'normalize'|'standardize'|'log'|'sqrt'|'bin'} transform
 * @returns {Promise<any[]>}
 */
export async function applyTransform(values, transform) {
  const rows = values.map((v) => ({ __v: v }));
  const result = await apiFetch('/api/transforms/apply', { rows, col: '__v', transform });
  return result.rows.map((r) => r[`__v_${transform}`]);
}

/**
 * Apply a transform to a specific column in a full dataset.
 * Returns new rows with an additional column `{col}_{transform}`.
 * @param {object[]} rows
 * @param {string} col
 * @param {'normalize'|'standardize'|'log'|'sqrt'|'bin'} transform
 * @param {number} bins  - number of bins (only used when transform='bin')
 * @returns {Promise<{ rows: object[], newColumn: string }>}
 */
export async function applyTransformToDataset(rows, col, transform, bins = 5) {
  return apiFetch('/api/transforms/apply', { rows, col, transform, bins });
}
