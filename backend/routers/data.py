"""
Data Router — Python 3.13
Replaces: src/utils/dataParser.js, src/utils/statistics.js

Endpoints:
  POST /api/data/upload         — parse CSV or JSON file, return columns + rows + stats
  POST /api/data/column_stats   — per-column stats from JSON rows payload
  POST /api/data/histogram      — histogram bins for a numeric column
  POST /api/data/value_counts   — top-N value counts for a categorical column
  POST /api/data/correlation    — Pearson correlation matrix for numeric columns
  POST /api/data/missing_map    — missing value heatmap data (sample)
"""
from __future__ import annotations

import io
import json
from typing import Any

import numpy as np
import pandas as pd
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

router = APIRouter()


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _df_to_rows(df: pd.DataFrame) -> list[dict]:
    """Convert DataFrame to list-of-dicts, replacing NaN/inf with None."""
    return json.loads(df.to_json(orient="records"))


def _detect_types(df: pd.DataFrame) -> dict[str, str]:
    types: dict[str, str] = {}
    for col in df.columns:
        if pd.api.types.is_numeric_dtype(df[col]):
            types[col] = "numeric"
        else:
            # Try to detect datetime
            try:
                pd.to_datetime(df[col].dropna().head(20), infer_datetime_format=True)
                types[col] = "datetime"
            except Exception:
                types[col] = "categorical"
    return types


def _compute_stats(df: pd.DataFrame, col_types: dict[str, str]) -> dict[str, dict]:
    stats: dict[str, dict] = {}
    for col in df.columns:
        series = df[col]
        non_null = series.dropna()
        null_count = int(series.isna().sum())
        total = len(series)

        base: dict[str, Any] = {
            "type": col_types.get(col, "categorical"),
            "count": int(len(non_null)),
            "nullCount": null_count,
            "nullPct": round(null_count / total * 100, 1) if total > 0 else 0,
            "unique": int(non_null.nunique()),
        }

        if col_types.get(col) == "numeric":
            nums = pd.to_numeric(non_null, errors="coerce").dropna()
            if len(nums) > 0:
                base.update({
                    "min": round(float(nums.min()), 4),
                    "max": round(float(nums.max()), 4),
                    "mean": round(float(nums.mean()), 4),
                    "median": round(float(nums.median()), 4),
                    "std": round(float(nums.std()), 4),
                    "q1": round(float(nums.quantile(0.25)), 4),
                    "q3": round(float(nums.quantile(0.75)), 4),
                })

        stats[col] = base
    return stats


# ─── Request Models ───────────────────────────────────────────────────────────

class RowsPayload(BaseModel):
    rows: list[dict[str, Any]]
    columns: list[str]


class HistogramRequest(BaseModel):
    rows: list[dict[str, Any]]
    col: str
    bins: int = 20


class ValueCountsRequest(BaseModel):
    rows: list[dict[str, Any]]
    col: str
    topN: int = 15


class CorrelationRequest(BaseModel):
    rows: list[dict[str, Any]]
    numericColumns: list[str]


class MissingMapRequest(BaseModel):
    rows: list[dict[str, Any]]
    columns: list[str]
    sampleSize: int = 100


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)) -> dict:
    """
    Parse an uploaded CSV or JSON file.
    Returns { columns, rows, columnStats, columnTypes }.
    """
    try:
        content = await file.read()
        filename = (file.filename or "").lower()

        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        elif filename.endswith(".json"):
            raw = json.loads(content)
            # Support both list-of-records and {y_true, y_pred, ...} style
            if isinstance(raw, list):
                df = pd.DataFrame(raw)
            elif isinstance(raw, dict):
                # It's a model-results JSON — return as-is for metrics page
                return {"type": "model_result", "data": raw}
            else:
                raise HTTPException(status_code=400, detail="Unsupported JSON structure")
        else:
            raise HTTPException(status_code=400, detail="Only CSV and JSON files are supported")

        # Limit to 10,000 rows for performance (can be changed)
        if len(df) > 10_000:
            df = df.head(10_000)

        col_types = _detect_types(df)
        stats = _compute_stats(df, col_types)
        rows = _df_to_rows(df)
        columns = list(df.columns)

        return {
            "columns": columns,
            "rows": rows,
            "columnTypes": col_types,
            "columnStats": stats,
            "rowCount": len(df),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/column_stats")
async def column_stats(payload: RowsPayload) -> dict:
    """Compute per-column stats for provided rows + columns."""
    try:
        df = pd.DataFrame(payload.rows, columns=payload.columns)
        col_types = _detect_types(df)
        stats = _compute_stats(df, col_types)
        return {"columnStats": stats, "columnTypes": col_types}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/histogram")
async def histogram(req: HistogramRequest) -> dict:
    """Return histogram bin data for a numeric column."""
    try:
        df = pd.DataFrame(req.rows)
        if req.col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column '{req.col}' not found")

        series = pd.to_numeric(df[req.col], errors="coerce").dropna()
        if len(series) == 0:
            return {"bins": []}

        counts, bin_edges = np.histogram(series, bins=req.bins)
        bins = [
            {
                "x": round(float((bin_edges[i] + bin_edges[i + 1]) / 2), 3),
                "count": int(counts[i]),
            }
            for i in range(len(counts))
        ]
        return {"bins": bins}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/value_counts")
async def value_counts(req: ValueCountsRequest) -> dict:
    """Return top-N value counts for a categorical column."""
    try:
        df = pd.DataFrame(req.rows)
        if req.col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column '{req.col}' not found")

        vc = df[req.col].fillna("null").astype(str).value_counts().head(req.topN)
        result = [{"name": k, "count": int(v)} for k, v in vc.items()]
        return {"valueCounts": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/correlation")
async def correlation_matrix(req: CorrelationRequest) -> dict:
    """
    Compute Pearson correlation matrix for numeric columns.
    Returns { columns, matrix } where matrix is a 2D list of correlation values.
    """
    try:
        df = pd.DataFrame(req.rows)
        available = [c for c in req.numericColumns if c in df.columns]
        if not available:
            return {"columns": [], "matrix": []}

        numeric_df = df[available].apply(pd.to_numeric, errors="coerce")
        corr = numeric_df.corr(method="pearson")

        matrix = [
            [round(float(v), 4) if not np.isnan(v) else 0 for v in row]
            for row in corr.values
        ]
        return {"columns": available, "matrix": matrix}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/missing_map")
async def missing_map(req: MissingMapRequest) -> dict:
    """
    Return a missing-value heatmap for a sample of rows.
    Returns list of {col, rowIdx, isMissing}.
    """
    try:
        df = pd.DataFrame(req.rows, columns=req.columns).head(req.sampleSize)
        result = []
        for row_idx, (_, row) in enumerate(df.iterrows()):
            for col in req.columns:
                val = row.get(col)
                result.append({
                    "col": col,
                    "rowIdx": row_idx,
                    "isMissing": val is None or (isinstance(val, float) and np.isnan(val)) or val == "",
                })
        return {"map": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
