import Papa from 'papaparse';

/**
 * Parse a CSV file and return { columns, rows, rawData }
 */
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const rows = results.data;
        const columns = results.meta.fields || [];
        resolve({ columns, rows, rawData: rows });
      },
      error: (err) => reject(err),
    });
  });
}

/**
 * Parse a JSON file
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
 * Auto-detect column type: 'numeric' | 'categorical' | 'datetime'
 */
export function detectColumnTypes(columns, rows) {
  const types = {};
  for (const col of columns) {
    const values = rows.map((r) => r[col]).filter((v) => v !== null && v !== undefined && v !== '');
    const numericCount = values.filter((v) => typeof v === 'number' && !isNaN(v)).length;
    if (numericCount / values.length > 0.8) {
      types[col] = 'numeric';
    } else {
      types[col] = 'categorical';
    }
  }
  return types;
}

/**
 * Compute column-level stats
 */
export function computeColumnStats(columns, rows, types) {
  const stats = {};
  for (const col of columns) {
    const allValues = rows.map((r) => r[col]);
    const nonNull = allValues.filter((v) => v !== null && v !== undefined && v !== '');
    const nullCount = allValues.length - nonNull.length;
    const uniqueValues = [...new Set(nonNull)];

    stats[col] = {
      type: types[col],
      count: nonNull.length,
      nullCount,
      nullPct: ((nullCount / allValues.length) * 100).toFixed(1),
      unique: uniqueValues.length,
    };

    if (types[col] === 'numeric') {
      const nums = nonNull.filter((v) => typeof v === 'number');
      if (nums.length > 0) {
        const sorted = [...nums].sort((a, b) => a - b);
        const sum = nums.reduce((a, b) => a + b, 0);
        const mean = sum / nums.length;
        const variance = nums.reduce((acc, v) => acc + (v - mean) ** 2, 0) / nums.length;
        stats[col] = {
          ...stats[col],
          min: sorted[0],
          max: sorted[sorted.length - 1],
          mean: mean.toFixed(4),
          median: sorted[Math.floor(sorted.length / 2)],
          std: Math.sqrt(variance).toFixed(4),
          q1: sorted[Math.floor(sorted.length * 0.25)],
          q3: sorted[Math.floor(sorted.length * 0.75)],
        };
      }
    }
  }
  return stats;
}

/**
 * Get histogram bins for a numeric column
 */
export function getHistogramData(rows, col, bins = 20) {
  const values = rows.map((r) => r[col]).filter((v) => typeof v === 'number' && !isNaN(v));
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binSize = (max - min) / bins;
  const counts = Array(bins).fill(0);
  values.forEach((v) => {
    const idx = Math.min(Math.floor((v - min) / binSize), bins - 1);
    counts[idx]++;
  });
  return counts.map((count, i) => ({
    x: +(min + i * binSize + binSize / 2).toFixed(3),
    count,
  }));
}

/**
 * Get value counts for a categorical column
 */
export function getValueCounts(rows, col, topN = 15) {
  const counts = {};
  rows.forEach((r) => {
    const v = String(r[col] ?? 'null');
    counts[v] = (counts[v] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, count]) => ({ name, count }));
}
