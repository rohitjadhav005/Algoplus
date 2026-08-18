/**
 * dataParser.js — API wrappers for the Python FastAPI backend.
 * File reading (parseCSV, parseJSON) stays in the browser.
 * All statistical computation now handled by Python (pandas, numpy).
 *
 * Original JS implementations replaced by: backend/routers/data.py
 */
import Papa from 'papaparse';
import { apiFetch, apiUpload } from './api.js';

/**
 * Parse a CSV file using PapaParse (browser-side) and then send to Python
 * backend for column type detection and statistics computation.
 * @param {File} file
 * @returns {Promise<{ columns, rows, rawData, columnStats, columnTypes }>}
 */
export async function parseCSV(file) {
  // Use the backend for full parsing + stats in one shot
  const result = await apiUpload(file);
  return {
    columns: result.columns,
    rows: result.rows,
    rawData: result.rows,
    columnStats: result.columnStats,
    columnTypes: result.columnTypes,
    rowCount: result.rowCount,
  };
}

/**
 * Parse a JSON file (browser-side FileReader) and return the parsed object.
 * For model-results JSON (y_true / y_pred), this stays browser-side.
 * @param {File} file
 * @returns {Promise<any>}
 */
export function parseJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsText(file);
  });
}

/**
 * Auto-detect column types using the Python backend.
 * @param {string[]} columns
 * @param {object[]} rows
 * @returns {Promise<{ [col]: 'numeric'|'categorical'|'datetime' }>}
 */
export async function detectColumnTypes(columns, rows) {
  const result = await apiFetch('/api/data/column_stats', { columns, rows });
  return result.columnTypes;
}

/**
 * Compute column-level statistics using the Python backend.
 * @param {string[]} columns
 * @param {object[]} rows
 * @param {object} _types - ignored; backend detects types automatically
 * @returns {Promise<{ [col]: { type, count, nullCount, nullPct, unique, min?, max?, mean?, ... } }>}
 */
export async function computeColumnStats(columns, rows, _types) {
  const result = await apiFetch('/api/data/column_stats', { columns, rows });
  return result.columnStats;
}

/**
 * Get histogram bins for a numeric column using numpy.
 * @param {object[]} rows
 * @param {string} col
 * @param {number} bins
 * @returns {Promise<[{ x, count }]>}
 */
export async function getHistogramData(rows, col, bins = 20) {
  const result = await apiFetch('/api/data/histogram', { rows, col, bins });
  return result.bins;
}

/**
 * Get value counts for a categorical column using pandas.
 * @param {object[]} rows
 * @param {string} col
 * @param {number} topN
 * @returns {Promise<[{ name, count }]>}
 */
export async function getValueCounts(rows, col, topN = 15) {
  const result = await apiFetch('/api/data/value_counts', { rows, col, topN });
  return result.valueCounts;
}
