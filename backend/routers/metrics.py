"""
ML Metrics Router — Python 3.13
Replaces: src/utils/mlMetrics.js

Endpoints:
  POST /api/metrics/classification  — confusion matrix + per-class + macro metrics
  POST /api/metrics/regression      — MSE, MAE, RMSE, R²
  POST /api/metrics/roc             — ROC curve points + AUC (binary)
  POST /api/metrics/pr_curve        — Precision-Recall curve points (binary)
"""
from __future__ import annotations

from typing import Any
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator
from sklearn.metrics import (
    confusion_matrix,
    classification_report,
    accuracy_score,
    roc_curve,
    auc,
    precision_recall_curve,
    mean_squared_error,
    mean_absolute_error,
    r2_score,
)

router = APIRouter()


# ─── Request / Response Models ────────────────────────────────────────────────

class ClassificationRequest(BaseModel):
    y_true: list[Any]
    y_pred: list[Any]

    @field_validator("y_true", "y_pred")
    @classmethod
    def must_not_be_empty(cls, v: list) -> list:
        if not v:
            raise ValueError("Array must not be empty")
        return v


class ROCRequest(BaseModel):
    y_true: list[Any]
    y_prob: list[float]
    positive_label: str | int | float | None = None


class PRRequest(BaseModel):
    y_true: list[Any]
    y_prob: list[float]
    positive_label: str | int | float | None = None


class RegressionRequest(BaseModel):
    y_true: list[float]
    y_pred: list[float]

    @field_validator("y_true", "y_pred")
    @classmethod
    def must_not_be_empty(cls, v: list) -> list:
        if not v:
            raise ValueError("Array must not be empty")
        return v


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/classification")
async def classification_metrics(req: ClassificationRequest) -> dict:
    """
    Compute confusion matrix + per-class + macro metrics.
    Uses sklearn under the hood for accuracy and robustness.
    """
    try:
        y_true = [str(v) for v in req.y_true]
        y_pred = [str(v) for v in req.y_pred]

        if len(y_true) != len(y_pred):
            raise HTTPException(status_code=400, detail="y_true and y_pred must have the same length")

        labels = sorted(set(y_true) | set(y_pred))

        # Confusion matrix
        cm = confusion_matrix(y_true, y_pred, labels=labels)

        # Per-class report
        report = classification_report(y_true, y_pred, labels=labels, output_dict=True, zero_division=0)

        per_class: dict[str, dict] = {}
        for label in labels:
            r = report.get(label, {})
            # Compute TP / FP / FN from confusion matrix
            idx = labels.index(label)
            tp = int(cm[idx, idx])
            fp = int(cm[:, idx].sum() - tp)
            fn = int(cm[idx, :].sum() - tp)
            per_class[label] = {
                "tp": tp,
                "fp": fp,
                "fn": fn,
                "precision": round(r.get("precision", 0), 4),
                "recall": round(r.get("recall", 0), 4),
                "f1": round(r.get("f1-score", 0), 4),
            }

        macro = report.get("macro avg", {})
        accuracy = round(accuracy_score(y_true, y_pred), 4)

        return {
            "labels": labels,
            "matrix": cm.tolist(),
            "perClass": per_class,
            "accuracy": accuracy,
            "macroPrecision": round(macro.get("precision", 0), 4),
            "macroRecall": round(macro.get("recall", 0), 4),
            "macroF1": round(macro.get("f1-score", 0), 4),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/regression")
async def regression_metrics(req: RegressionRequest) -> dict:
    """Compute MSE, MAE, RMSE, R²."""
    try:
        y_true = np.array(req.y_true, dtype=float)
        y_pred = np.array(req.y_pred, dtype=float)

        if len(y_true) != len(y_pred):
            raise HTTPException(status_code=400, detail="y_true and y_pred must have the same length")

        mse = float(mean_squared_error(y_true, y_pred))
        mae = float(mean_absolute_error(y_true, y_pred))
        rmse = float(np.sqrt(mse))
        r2 = float(r2_score(y_true, y_pred))

        return {
            "mse": round(mse, 4),
            "mae": round(mae, 4),
            "rmse": round(rmse, 4),
            "r2": round(r2, 4),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/roc")
async def roc_curve_endpoint(req: ROCRequest) -> dict:
    """
    Compute ROC curve and AUC for binary classification.
    Returns {points: [{fpr, tpr}], auc}.
    """
    try:
        y_prob = np.array(req.y_prob, dtype=float)

        # Determine binary labels
        if req.positive_label is not None:
            pos = str(req.positive_label)
            y_bin = np.array([1 if str(v) == pos else 0 for v in req.y_true])
        else:
            unique = sorted(set(str(v) for v in req.y_true))
            if len(unique) != 2:
                raise HTTPException(status_code=400, detail="ROC requires binary classification or explicit positive_label")
            pos = unique[1]
            y_bin = np.array([1 if str(v) == pos else 0 for v in req.y_true])

        if y_bin.sum() == 0 or (1 - y_bin).sum() == 0:
            return {"points": [], "auc": 0}

        fpr, tpr, _ = roc_curve(y_bin, y_prob)
        roc_auc = float(auc(fpr, tpr))

        points = [
            {"fpr": round(float(f), 4), "tpr": round(float(t), 4)}
            for f, t in zip(fpr, tpr)
        ]

        return {"points": points, "auc": round(roc_auc, 4)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/pr_curve")
async def pr_curve_endpoint(req: PRRequest) -> dict:
    """
    Compute Precision-Recall curve for binary classification.
    Returns {points: [{precision, recall}]}.
    """
    try:
        y_prob = np.array(req.y_prob, dtype=float)

        if req.positive_label is not None:
            pos = str(req.positive_label)
            y_bin = np.array([1 if str(v) == pos else 0 for v in req.y_true])
        else:
            unique = sorted(set(str(v) for v in req.y_true))
            if len(unique) != 2:
                raise HTTPException(status_code=400, detail="PR curve requires binary classification or explicit positive_label")
            pos = unique[1]
            y_bin = np.array([1 if str(v) == pos else 0 for v in req.y_true])

        if y_bin.sum() == 0:
            return {"points": []}

        precision, recall, _ = precision_recall_curve(y_bin, y_prob)

        points = [
            {"precision": round(float(p), 4), "recall": round(float(r), 4)}
            for p, r in zip(precision, recall)
        ]

        return {"points": points}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
