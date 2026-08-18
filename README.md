# AlgoPulse 🚀

A full-stack **ML Analytics Dashboard** built with React + Python FastAPI. Upload datasets and model outputs to visualize performance metrics, explore data distributions, apply preprocessing transforms, and compare models — all from a modern dark-mode UI.

---

## Architecture

```
React Frontend (Vite, :5173)  ◄──── REST API ────►  Python FastAPI Backend (:8000)
  React 19 · Recharts · Plotly          numpy · pandas · scikit-learn · scipy
```

---

## Features

| Page | Description |
|------|-------------|
| **Dashboard** | Overview of loaded data and models |
| **Dataset Explorer** | Upload CSV/JSON → schema, distributions, correlation heatmap, missing values, data table |
| **Model Performance** | Confusion matrix, ROC curve, Precision-Recall, per-class metrics |
| **Training History** | Loss and accuracy curves over epochs |
| **Preprocessing Lab** | Apply normalize / standardize / log / sqrt / bin transforms |
| **Inference Tester** | Test model predictions with manual input |
| **Model Comparison** | Side-by-side comparison of multiple models |

---

## Tech Stack

### Frontend
- **React 19** + **Vite 8**
- **Recharts** + **Plotly.js** — charting
- **react-router-dom 7** — routing
- **Lucide React** — icons

### Backend
- **Python 3.13** + **FastAPI 0.141**
- **pandas 3** — CSV parsing, column stats, correlation
- **NumPy 2** — histograms, array math
- **scikit-learn 1.9** — metrics, preprocessing (MinMaxScaler, StandardScaler)
- **Uvicorn** — ASGI server

---

## Project Structure

```
AlgoPulse/
├── .env                        ← VITE_API_URL=http://localhost:8000
├── src/
│   ├── context/AppContext.jsx  ← Global state (useReducer)
│   ├── pages/                  ← 7 page components
│   ├── components/             ← Sidebar, Header, FileUpload
│   └── utils/
│       ├── api.js              ← Base fetch() helper
│       ├── mlMetrics.js        ← → /api/metrics/*  (sklearn)
│       ├── dataParser.js       ← → /api/data/*     (pandas)
│       ├── statistics.js       ← → /api/data/correlation
│       └── transforms.js       ← → /api/transforms/*
│
└── backend/
    ├── main.py                 ← FastAPI app + CORS
    ├── requirements.txt        ← Python dependencies
    ├── start.ps1               ← PowerShell start script
    └── routers/
        ├── metrics.py          ← Classification + regression metrics
        ├── data.py             ← CSV parsing, stats, histogram, correlation
        └── transforms.py       ← Normalize, standardize, log, sqrt, bin
```

---

## Getting Started

### Prerequisites
- **Node.js** 18+
- **Python 3.13+**

### 1. Install frontend dependencies
```powershell
npm install
```

### 2. Set up Python backend
```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Run both servers

**Terminal 1 — Backend:**
```powershell
cd backend
.venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```powershell
npm run dev
```

Open **http://localhost:5173** — API docs at **http://localhost:8000/docs**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/metrics/classification` | Confusion matrix + accuracy/F1/precision/recall |
| `POST` | `/api/metrics/regression` | MSE, MAE, RMSE, R² |
| `POST` | `/api/metrics/roc` | ROC curve + AUC |
| `POST` | `/api/metrics/pr_curve` | Precision-Recall curve |
| `POST` | `/api/data/upload` | Parse CSV/JSON → columns, rows, stats |
| `POST` | `/api/data/histogram` | Histogram bins (numpy) |
| `POST` | `/api/data/value_counts` | Categorical value counts (pandas) |
| `POST` | `/api/data/correlation` | Pearson correlation matrix (pandas) |
| `POST` | `/api/transforms/apply` | Apply preprocessing transform to a column |

---

## Model Results JSON Format

```json
{
  "name": "My Model",
  "type": "classification",
  "y_true": ["cat", "dog", "cat"],
  "y_pred": ["cat", "cat", "dog"],
  "y_prob": [0.9, 0.6, 0.4],
  "positive_label": "cat"
}
```

For regression, use `"type": "regression"` with numeric arrays.
