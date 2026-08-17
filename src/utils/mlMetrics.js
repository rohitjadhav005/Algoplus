/**
 * Build confusion matrix from y_true and y_pred
 */
export function buildConfusionMatrix(yTrue, yPred) {
  const labels = [...new Set([...yTrue, ...yPred])].sort();
  const matrix = labels.map(() => labels.map(() => 0));
  yTrue.forEach((actual, i) => {
    const r = labels.indexOf(String(actual));
    const c = labels.indexOf(String(yPred[i]));
    if (r >= 0 && c >= 0) matrix[r][c]++;
  });
  return { matrix, labels };
}

/**
 * Compute per-class and macro metrics
 */
export function computeClassificationMetrics(yTrue, yPred, labels) {
  const metrics = {};
  labels.forEach((label) => {
    const tp = yTrue.filter((v, i) => String(v) === label && String(yPred[i]) === label).length;
    const fp = yTrue.filter((v, i) => String(v) !== label && String(yPred[i]) === label).length;
    const fn = yTrue.filter((v, i) => String(v) === label && String(yPred[i]) !== label).length;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    metrics[label] = { tp, fp, fn, precision: +precision.toFixed(4), recall: +recall.toFixed(4), f1: +f1.toFixed(4) };
  });

  const accuracy = yTrue.filter((v, i) => String(v) === String(yPred[i])).length / yTrue.length;
  const macroF1 = labels.reduce((acc, l) => acc + metrics[l].f1, 0) / labels.length;
  const macroPrecision = labels.reduce((acc, l) => acc + metrics[l].precision, 0) / labels.length;
  const macroRecall = labels.reduce((acc, l) => acc + metrics[l].recall, 0) / labels.length;

  return {
    perClass: metrics,
    accuracy: +accuracy.toFixed(4),
    macroF1: +macroF1.toFixed(4),
    macroPrecision: +macroPrecision.toFixed(4),
    macroRecall: +macroRecall.toFixed(4),
  };
}

/**
 * Compute ROC curve points (binary classification)
 * yProb: probability of positive class
 */
export function computeROC(yTrue, yProb, positiveLabel) {
  const pairs = yTrue.map((v, i) => ({ label: String(v) === String(positiveLabel) ? 1 : 0, prob: yProb[i] }));
  pairs.sort((a, b) => b.prob - a.prob);

  const totalPos = pairs.filter((p) => p.label === 1).length;
  const totalNeg = pairs.length - totalPos;
  if (totalPos === 0 || totalNeg === 0) return { points: [], auc: 0 };

  let tp = 0, fp = 0;
  const points = [{ fpr: 0, tpr: 0 }];

  pairs.forEach((p) => {
    if (p.label === 1) tp++;
    else fp++;
    points.push({ fpr: +(fp / totalNeg).toFixed(4), tpr: +(tp / totalPos).toFixed(4) });
  });

  // Trapezoidal AUC
  let auc = 0;
  for (let i = 1; i < points.length; i++) {
    auc += (points[i].fpr - points[i - 1].fpr) * ((points[i].tpr + points[i - 1].tpr) / 2);
  }

  return { points, auc: +auc.toFixed(4) };
}

/**
 * Compute regression metrics
 */
export function computeRegressionMetrics(yTrue, yPred) {
  const n = yTrue.length;
  const mse = yTrue.reduce((acc, v, i) => acc + (v - yPred[i]) ** 2, 0) / n;
  const mae = yTrue.reduce((acc, v, i) => acc + Math.abs(v - yPred[i]), 0) / n;
  const rmse = Math.sqrt(mse);
  const meanTrue = yTrue.reduce((a, b) => a + b, 0) / n;
  const ss_res = yTrue.reduce((acc, v, i) => acc + (v - yPred[i]) ** 2, 0);
  const ss_tot = yTrue.reduce((acc, v) => acc + (v - meanTrue) ** 2, 0);
  const r2 = ss_tot === 0 ? 1 : 1 - ss_res / ss_tot;

  return { mse: +mse.toFixed(4), mae: +mae.toFixed(4), rmse: +rmse.toFixed(4), r2: +r2.toFixed(4) };
}

/**
 * Precision-Recall curve (binary)
 */
export function computePRCurve(yTrue, yProb, positiveLabel) {
  const pairs = yTrue.map((v, i) => ({ label: String(v) === String(positiveLabel) ? 1 : 0, prob: yProb[i] }));
  pairs.sort((a, b) => b.prob - a.prob);
  const totalPos = pairs.filter((p) => p.label === 1).length;
  if (totalPos === 0) return [];

  let tp = 0, fp = 0;
  const points = [];
  pairs.forEach((p, i) => {
    if (p.label === 1) tp++;
    else fp++;
    const precision = tp / (tp + fp);
    const recall = tp / totalPos;
    points.push({ precision: +precision.toFixed(4), recall: +recall.toFixed(4) });
  });
  return points;
}
