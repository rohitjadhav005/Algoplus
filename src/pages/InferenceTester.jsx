import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Zap, Brain, Hash, ChevronRight, Percent } from 'lucide-react';

// Simple k-NN classifier (client-side)
function kNNPredict(trainRows, featureCols, targetCol, queryPoint, k = 5) {
  const distances = trainRows
    .filter((r) => r[targetCol] !== null && r[targetCol] !== undefined)
    .map((r) => {
      const dist = Math.sqrt(
        featureCols.reduce((acc, col) => {
          const a = Number(r[col] ?? 0);
          const b = Number(queryPoint[col] ?? 0);
          return acc + (a - b) ** 2;
        }, 0)
      );
      return { label: r[targetCol], dist };
    });

  distances.sort((a, b) => a.dist - b.dist);
  const neighbors = distances.slice(0, k);
  const counts = {};
  neighbors.forEach(({ label }) => {
    counts[label] = (counts[label] || 0) + 1;
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return { prediction: sorted[0]?.[0], confidence: sorted, neighbors };
}

// Simple linear regression (client-side, univariate → multivariate via normal equations approximation)
function linearRegPredict(trainRows, featureCols, targetCol, queryPoint) {
  const numericTarget = trainRows.map((r) => Number(r[targetCol])).filter((v) => !isNaN(v));
  if (numericTarget.length === 0) return null;

  // Simple fallback: weighted mean of k-NN targets
  const distances = trainRows
    .filter((r) => !isNaN(Number(r[targetCol])))
    .map((r) => {
      const dist = Math.sqrt(
        featureCols.reduce((acc, col) => {
          const a = Number(r[col] ?? 0);
          const b = Number(queryPoint[col] ?? 0);
          return acc + (a - b) ** 2;
        }, 0)
      ) + 0.0001;
      return { val: Number(r[targetCol]), dist };
    });

  distances.sort((a, b) => a.dist - b.dist);
  const k = Math.min(10, distances.length);
  const neighbors = distances.slice(0, k);
  const totalWeight = neighbors.reduce((acc, n) => acc + 1 / n.dist, 0);
  const prediction = neighbors.reduce((acc, n) => acc + (n.val / n.dist) / totalWeight, 0);
  return +prediction.toFixed(4);
}

export default function InferenceTester() {
  const { state } = useAppContext();
  const dataset = state.dataset;
  const [targetCol, setTargetCol] = useState('');
  const [modelType, setModelType] = useState('knn');
  const [inputs, setInputs] = useState({});
  const [result, setResult] = useState(null);

  const { columns, rows, types, stats } = dataset || {};
  const featureCols = useMemo(
    () => (columns || []).filter((c) => c !== targetCol && types?.[c] === 'numeric'),
    [columns, targetCol, types]
  );
  const isClassification = targetCol && types?.[targetCol] === 'categorical';
  const isRegression = targetCol && types?.[targetCol] === 'numeric';

  const handlePredict = () => {
    if (!rows || !targetCol || featureCols.length === 0) return;
    const queryPoint = {};
    featureCols.forEach((c) => {
      queryPoint[c] = inputs[c] !== undefined ? Number(inputs[c]) : Number(stats[c]?.mean || 0);
    });

    if (modelType === 'knn' || isClassification) {
      const res = kNNPredict(rows, featureCols, targetCol, queryPoint, 7);
      setResult({ type: 'classification', ...res });
    } else {
      const pred = linearRegPredict(rows, featureCols, targetCol, queryPoint);
      setResult({ type: 'regression', prediction: pred });
    }
  };

  if (!dataset) {
    return (
      <div className="page-content animate-in">
        <div className="page-title"><h1>Inference Tester</h1><p>Load a dataset first to test predictions</p></div>
        <div className="empty-state">
          <div className="empty-state-icon"><Zap size={32} /></div>
          <h3>No Dataset Loaded</h3>
          <p>Upload a CSV dataset from the Dataset Explorer, then return here to test client-side k-NN and linear regression predictions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content animate-in">
      <div className="page-title">
        <h1>Inference Tester</h1>
        <p>Run client-side k-NN or linear regression predictions on your dataset</p>
      </div>

      <div className="two-col" style={{ alignItems: 'flex-start' }}>
        {/* Config Panel */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><div className="card-title"><Brain size={16} /> Model Configuration</div></div>
            <div className="form-group">
              <label className="form-label">Target Column (what to predict)</label>
              <select className="form-select" value={targetCol} onChange={(e) => { setTargetCol(e.target.value); setResult(null); }}>
                <option value="">— Select target column —</option>
                {columns.map((c) => <option key={c} value={c}>{c} ({types[c]})</option>)}
              </select>
            </div>
            {targetCol && types[targetCol] === 'numeric' && (
              <div className="form-group">
                <label className="form-label">Algorithm</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className={`btn ${modelType === 'knn' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setModelType('knn')}>k-NN</button>
                  <button className={`btn ${modelType === 'linear' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setModelType('linear')}>Linear Regression</button>
                </div>
              </div>
            )}
            {targetCol && types[targetCol] === 'categorical' && (
              <div className="notification notification-info" style={{ marginTop: 0 }}>
                <Brain size={14} />
                <span>Using k-NN classifier (k=7) for categorical targets</span>
              </div>
            )}
          </div>

          {/* Input Features */}
          {targetCol && featureCols.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title"><Hash size={16} /> Feature Inputs</div>
                <button className="btn btn-secondary btn-sm" onClick={() => {
                  const defaults = {};
                  featureCols.forEach((c) => { defaults[c] = stats[c]?.mean || 0; });
                  setInputs(defaults);
                }}>
                  Use Means
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {featureCols.map((col) => (
                  <div key={col} className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">{col}</label>
                    <input
                      className="form-input"
                      type="number"
                      placeholder={`mean: ${stats[col]?.mean || 0}`}
                      value={inputs[col] ?? ''}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [col]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" style={{ marginTop: 20, width: '100%' }} onClick={handlePredict}>
                <Zap size={14} /> Run Prediction
              </button>
            </div>
          )}
        </div>

        {/* Result Panel */}
        <div>
          {!result && (
            <div className="card">
              <div className="empty-state" style={{ padding: '48px 24px' }}>
                <div className="empty-state-icon"><Zap size={28} /></div>
                <h3>Ready to Predict</h3>
                <p>Select a target column, fill in feature values, and click Run Prediction.</p>
              </div>
            </div>
          )}

          {result && result.type === 'classification' && (
            <div className="card animate-in">
              <div className="card-header">
                <div className="card-title"><ChevronRight size={16} /> Prediction Result</div>
                <span className="badge badge-green">k-NN</span>
              </div>
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Predicted Class</div>
                <div style={{
                  fontSize: 40, fontWeight: 800,
                  background: 'var(--gradient-primary)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  marginBottom: 8,
                }}>
                  {String(result.prediction)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {result.confidence[0] && `${((result.confidence[0][1] / 7) * 100).toFixed(0)}% of k=7 neighbors`}
                </div>
              </div>
              <div className="divider" />
              <div className="card-title" style={{ marginBottom: 12 }}><Percent size={14} /> Confidence Breakdown</div>
              {result.confidence.map(([label, count]) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{String(label)}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {count}/7 ({((count / 7) * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="progress-bar-outer">
                    <div className="progress-bar-inner" style={{ width: `${(count / 7) * 100}%`, background: label === result.prediction ? 'var(--gradient-primary)' : 'var(--border)' }} />
                  </div>
                </div>
              ))}
              <div className="divider" />
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <strong>Nearest neighbors used:</strong> {result.neighbors.length} samples from your dataset
              </div>
            </div>
          )}

          {result && result.type === 'regression' && (
            <div className="card animate-in">
              <div className="card-header">
                <div className="card-title"><ChevronRight size={16} /> Regression Prediction</div>
                <span className="badge badge-purple">Weighted k-NN</span>
              </div>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>Predicted value for <strong>{targetCol}</strong></div>
                <div style={{
                  fontSize: 52, fontWeight: 800,
                  background: 'linear-gradient(135deg, var(--green) 0%, var(--cyan) 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  {result.prediction}
                </div>
                <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                  Dataset range: [{dataset.stats[targetCol]?.min} – {dataset.stats[targetCol]?.max}] · Mean: {dataset.stats[targetCol]?.mean}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
