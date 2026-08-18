/**
 * mlMetrics.js — API wrappers for the Python FastAPI backend.
 * All ML computation is now handled by Python (scikit-learn, numpy).
 *
 * Original JS implementations replaced by: backend/routers/metrics.py
 */
import { apiFetch } from './api.js';

/**
 * Build confusion matrix and compute all classification metrics.
 * @param {Array} yTrue
 * @param {Array} yPred
 * @returns {Promise<{ labels, matrix, perClass, accuracy, macroPrecision, macroRecall, macroF1 }>}
 */
export async function buildConfusionMatrixAndMetrics(yTrue, yPred) {
  return apiFetch('/api/metrics/classification', { y_true: yTrue, y_pred: yPred });
}

/**
 * Compute per-class and macro classification metrics.
 * Returns the same shape as the old computeClassificationMetrics().
 * @param {Array} yTrue
 * @param {Array} yPred
 * @param {Array} _labels  - ignored (backend determines labels)
 */
export async function computeClassificationMetrics(yTrue, yPred, _labels) {
  return apiFetch('/api/metrics/classification', { y_true: yTrue, y_pred: yPred });
}

/**
 * Build confusion matrix (returns { matrix, labels }).
 * NOTE: For efficiency, prefer buildConfusionMatrixAndMetrics() which returns both.
 */
export async function buildConfusionMatrix(yTrue, yPred) {
  const result = await apiFetch('/api/metrics/classification', { y_true: yTrue, y_pred: yPred });
  return { matrix: result.matrix, labels: result.labels };
}

/**
 * Compute ROC curve and AUC (binary classification).
 * @param {Array} yTrue
 * @param {Array} yProb        - probability of positive class
 * @param {string} positiveLabel
 * @returns {Promise<{ points: [{fpr, tpr}], auc }>}
 */
export async function computeROC(yTrue, yProb, positiveLabel) {
  return apiFetch('/api/metrics/roc', {
    y_true: yTrue,
    y_prob: yProb,
    positive_label: positiveLabel,
  });
}

/**
 * Compute Precision-Recall curve (binary classification).
 * @param {Array} yTrue
 * @param {Array} yProb
 * @param {string} positiveLabel
 * @returns {Promise<{ points: [{precision, recall}] }>}
 */
export async function computePRCurve(yTrue, yProb, positiveLabel) {
  const result = await apiFetch('/api/metrics/pr_curve', {
    y_true: yTrue,
    y_prob: yProb,
    positive_label: positiveLabel,
  });
  // Return points array directly to maintain backward compat with old API
  return result.points;
}

/**
 * Compute regression metrics (MSE, MAE, RMSE, R²).
 * @param {number[]} yTrue
 * @param {number[]} yPred
 * @returns {Promise<{ mse, mae, rmse, r2 }>}
 */
export async function computeRegressionMetrics(yTrue, yPred) {
  return apiFetch('/api/metrics/regression', { y_true: yTrue, y_pred: yPred });
}
