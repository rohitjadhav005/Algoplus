/**
 * statistics.js — API wrappers for the Python FastAPI backend.
 * Pearson correlation and correlation matrix now computed by Python (pandas, scipy).
 *
 * Original JS implementations replaced by: backend/routers/data.py
 */
import { apiFetch } from './api.js';

/**
 * Compute Pearson correlation between two numeric arrays.
 * For single pair use, sends a minimal dataset to the backend.
 * @param {number[]} x
 * @param {number[]} y
 * @returns {Promise<number>} correlation coefficient in [-1, 1]
 */
export async function pearsonCorrelation(x, y) {
  const rows = x.map((xi, i) => ({ __x: xi, __y: y[i] }));
  const result = await apiFetch('/api/data/correlation', {
    rows,
    numericColumns: ['__x', '__y'],
  });
  // matrix[0][1] is the cross-correlation between __x and __y
  return result.matrix?.[0]?.[1] ?? 0;
}

/**
 * Compute full Pearson correlation matrix for numeric columns using pandas.
 * @param {object[]} rows
 * @param {string[]} numericColumns
 * @returns {Promise<number[][]>} NxN matrix
 */
export async function computeCorrelationMatrix(rows, numericColumns) {
  const result = await apiFetch('/api/data/correlation', { rows, numericColumns });
  return result.matrix;
}

/**
 * Get missing value map for a sample of rows using the backend.
 * Returns array of { col, rowIdx, isMissing }.
 * @param {object[]} rows
 * @param {string[]} columns
 * @param {number} sampleSize
 * @returns {Promise<Array<{ col: string, rowIdx: number, isMissing: boolean }>>}
 */
export async function getMissingValueMap(rows, columns, sampleSize = 100) {
  const result = await apiFetch('/api/data/missing_map', { rows, columns, sampleSize });
  return result.map;
}
