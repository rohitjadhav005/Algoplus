"""
Transforms Router — Python 3.13
Replaces: src/utils/transforms.js

Endpoints:
  POST /api/transforms/apply  — apply normalize/standardize/log/sqrt/bin to a column
"""
from __future__ import annotations

from typing import Any, Literal

import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sklearn.preprocessing import MinMaxScaler, StandardScaler

router = APIRouter()

TransformType = Literal["normalize", "standardize", "log", "sqrt", "bin"]


class TransformRequest(BaseModel):
    rows: list[dict[str, Any]]
    col: str
    transform: TransformType
    bins: int = 5


@router.post("/apply")
async def apply_transform(req: TransformRequest) -> dict:
    """
    Apply a preprocessing transform to a numeric column.
    Returns new rows with an additional column `{col}_{transform}`.
    """
    try:
        import pandas as pd

        df = pd.DataFrame(req.rows)
        if req.col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column '{req.col}' not found")

        raw = df[req.col].copy()
        numeric_mask = pd.to_numeric(raw, errors="coerce").notna()
        nums = pd.to_numeric(raw[numeric_mask], errors="coerce").values.reshape(-1, 1)

        result_col = f"{req.col}_{req.transform}"

        match req.transform:
            case "normalize":
                scaler = MinMaxScaler()
                transformed = scaler.fit_transform(nums).flatten()
                transformed = np.round(transformed, 6)

            case "standardize":
                scaler = StandardScaler()
                transformed = scaler.fit_transform(nums).flatten()
                transformed = np.round(transformed, 6)

            case "log":
                flat = nums.flatten()
                transformed = np.where(flat > 0, np.round(np.log(flat), 6), np.nan)

            case "sqrt":
                flat = nums.flatten()
                transformed = np.where(flat >= 0, np.round(np.sqrt(flat), 6), np.nan)

            case "bin":
                flat = nums.flatten()
                min_v, max_v = flat.min(), flat.max()
                if min_v == max_v:
                    transformed = np.zeros(len(flat))
                else:
                    bin_size = (max_v - min_v) / req.bins
                    bin_indices = np.minimum(
                        np.floor((flat - min_v) / bin_size).astype(int),
                        req.bins - 1,
                    )
                    transformed = np.array([
                        f"[{round(min_v + i * bin_size, 3)}, {round(min_v + (i + 1) * bin_size, 3)})"
                        for i in bin_indices
                    ])

        # Build output column (None for non-numeric rows)
        output_col: list[Any] = []
        tr_idx = 0
        for mask_val in numeric_mask:
            if mask_val:
                val = transformed[tr_idx]
                output_col.append(None if (isinstance(val, float) and np.isnan(val)) else val)
                tr_idx += 1
            else:
                output_col.append(None)

        df[result_col] = output_col

        # Return rows as list of dicts (JSON-safe)
        import json
        rows = json.loads(df.to_json(orient="records"))

        return {
            "rows": rows,
            "newColumn": result_col,
            "transform": req.transform,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.get("/available")
async def list_transforms() -> dict:
    """List all available transforms."""
    return {
        "transforms": [
            {"id": "normalize", "label": "Min-Max Normalize", "description": "Scale values to [0, 1]"},
            {"id": "standardize", "label": "Standardize (Z-score)", "description": "Mean=0, Std=1"},
            {"id": "log", "label": "Log Transform", "description": "Natural log (values > 0 only)"},
            {"id": "sqrt", "label": "Square Root", "description": "Square root (values ≥ 0 only)"},
            {"id": "bin", "label": "Bin Values", "description": "Discretize into equal-width bins"},
        ]
    }
