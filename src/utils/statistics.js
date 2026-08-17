/**
 * Pearson correlation between two numeric arrays
 */
export function pearsonCorrelation(x, y) {
  const n = x.length;
  if (n === 0) return 0;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  const num = x.reduce((acc, xi, i) => acc + (xi - meanX) * (y[i] - meanY), 0);
  const denX = Math.sqrt(x.reduce((acc, xi) => acc + (xi - meanX) ** 2, 0));
  const denY = Math.sqrt(y.reduce((acc, yi) => acc + (yi - meanY) ** 2, 0));
  if (denX === 0 || denY === 0) return 0;
  return +(num / (denX * denY)).toFixed(4);
}

/**
 * Compute full correlation matrix for numeric columns
 */
export function computeCorrelationMatrix(rows, numericColumns) {
  const data = {};
  numericColumns.forEach((col) => {
    data[col] = rows.map((r) => r[col]).filter((v) => typeof v === 'number' && !isNaN(v));
  });

  const matrix = [];
  for (const colA of numericColumns) {
    const row = [];
    for (const colB of numericColumns) {
      const a = rows.map((r) => r[colA]);
      const b = rows.map((r) => r[colB]);
      const pairs = a.map((v, i) => [v, b[i]]).filter(([va, vb]) => typeof va === 'number' && typeof vb === 'number');
      row.push(pearsonCorrelation(pairs.map((p) => p[0]), pairs.map((p) => p[1])));
    }
    matrix.push(row);
  }
  return matrix;
}

/**
 * Get missing value map: array of { col, rowIndex, isMissing }
 */
export function getMissingValueMap(rows, columns, sampleSize = 100) {
  const sampled = rows.slice(0, sampleSize);
  const result = [];
  sampled.forEach((row, rowIdx) => {
    columns.forEach((col) => {
      const v = row[col];
      result.push({
        col,
        rowIdx,
        isMissing: v === null || v === undefined || v === '',
      });
    });
  });
  return result;
}
