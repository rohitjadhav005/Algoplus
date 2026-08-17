import React, { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import FileUpload from '../components/ui/FileUpload';
import { parseJSON } from '../utils/dataParser';
import {
  buildConfusionMatrix, computeClassificationMetrics,
  computeROC, computePRCurve, computeRegressionMetrics
} from '../utils/mlMetrics';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ReferenceLine
} from 'recharts';
import { BarChart3, Target, Percent, AlertTriangle, TrendingUp, CheckCircle, Plus } from 'lucide-react';

export default function ModelPerformance() {
  const { state, dispatch } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [activeModelIdx, setActiveModelIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('metrics');
  const [error, setError] = useState(null);

  const handleFile = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    try {
      const data = await parseJSON(file);
      if (!data.y_true || !data.y_pred) throw new Error('JSON must contain y_true and y_pred arrays');
      dispatch({ type: 'ADD_MODEL_RESULT', payload: { ...data, fileName: file.name, name: data.name || file.name } });
      setActiveModelIdx(state.modelResults.length);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [dispatch, state.modelResults.length]);

  if (state.modelResults.length === 0) {
    return (
      <div className="page-content animate-in">
        <div className="page-title">
          <h1>Model Performance</h1>
          <p>Upload a model results JSON to evaluate performance metrics</p>
        </div>
        <div className="notification notification-info" style={{ maxWidth: 600 }}>
          <AlertTriangle size={16} />
          <div>
            <strong>Expected JSON format:</strong>
            <pre style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
{`{
  "name": "My Model",
  "type": "classification",
  "y_true": ["cat","dog","cat",...],
  "y_pred": ["cat","cat","dog",...],
  "y_prob": [0.9, 0.6, 0.4,...],
  "positive_label": "cat"
}`}
            </pre>
          </div>
        </div>
        <div style={{ maxWidth: 600, marginTop: 20 }}>
          <FileUpload
            id="model-upload-main"
            accept=".json"
            onFile={handleFile}
            title="Upload model results"
            desc="Drop a JSON file with y_true, y_pred, and optionally y_prob"
            formats={['JSON']}
          />
          {error && <div className="notification notification-warning" style={{ marginTop: 12 }}><AlertTriangle size={14} />{error}</div>}
        </div>
      </div>
    );
  }

  const model = state.modelResults[activeModelIdx] || state.modelResults[0];
  const isClassification = !model.type || model.type === 'classification';

  let classMetrics = null, confMatrix = null, rocData = null, prData = null, regMetrics = null;

  if (isClassification) {
    const { matrix, labels } = buildConfusionMatrix(model.y_true, model.y_pred);
    confMatrix = { matrix, labels };
    classMetrics = computeClassificationMetrics(model.y_true, model.y_pred, labels);
    if (model.y_prob && labels.length === 2) {
      const posLabel = model.positive_label || labels[1];
      rocData = computeROC(model.y_true, model.y_prob, posLabel);
      prData = computePRCurve(model.y_true, model.y_prob, posLabel);
    }
  } else {
    regMetrics = computeRegressionMetrics(
      model.y_true.map(Number),
      model.y_pred.map(Number)
    );
  }

  const maxCell = confMatrix ? Math.max(...confMatrix.matrix.flat()) : 1;

  return (
    <div className="page-content animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>
          <h1>Model Performance</h1>
          <p>{state.modelResults.length} model{state.modelResults.length > 1 ? 's' : ''} loaded</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {state.modelResults.map((m, i) => (
            <button key={i} className={`btn ${activeModelIdx === i ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setActiveModelIdx(i)}>
              {m.name || `Model ${i + 1}`}
            </button>
          ))}
          <div style={{ position: 'relative' }}>
            <FileUpload id="model-upload-add" accept=".json" onFile={handleFile} title="" desc="" formats={[]} />
          </div>
          <label htmlFor="model-upload-add-btn" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
            <Plus size={13} /> Add Model
          </label>
          <input id="model-upload-add-btn" type="file" accept=".json" style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
        </div>
      </div>

      {/* Key Metrics */}
      {isClassification && classMetrics && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.15)' }}><CheckCircle size={20} color="var(--green)" /></div>
            <div className="stat-card-value" style={{ color: 'var(--green)' }}>{(classMetrics.accuracy * 100).toFixed(2)}%</div>
            <div className="stat-card-label">Accuracy</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.15)' }}><Target size={20} color="var(--accent-light)" /></div>
            <div className="stat-card-value">{(classMetrics.macroPrecision * 100).toFixed(2)}%</div>
            <div className="stat-card-label">Macro Precision</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(34,211,238,0.15)' }}><Percent size={20} color="var(--cyan)" /></div>
            <div className="stat-card-value">{(classMetrics.macroRecall * 100).toFixed(2)}%</div>
            <div className="stat-card-label">Macro Recall</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'rgba(167,139,250,0.15)' }}><TrendingUp size={20} color="var(--purple)" /></div>
            <div className="stat-card-value">{(classMetrics.macroF1 * 100).toFixed(2)}%</div>
            <div className="stat-card-label">Macro F1</div>
          </div>
        </div>
      )}

      {!isClassification && regMetrics && (
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-card-value">{regMetrics.r2}</div><div className="stat-card-label">R² Score</div></div>
          <div className="stat-card"><div className="stat-card-value">{regMetrics.rmse}</div><div className="stat-card-label">RMSE</div></div>
          <div className="stat-card"><div className="stat-card-value">{regMetrics.mae}</div><div className="stat-card-label">MAE</div></div>
          <div className="stat-card"><div className="stat-card-value">{regMetrics.mse}</div><div className="stat-card-label">MSE</div></div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`} onClick={() => setActiveTab('metrics')}>Metrics</button>
        {isClassification && <button className={`tab-btn ${activeTab === 'confusion' ? 'active' : ''}`} onClick={() => setActiveTab('confusion')}>Confusion Matrix</button>}
        {rocData && <button className={`tab-btn ${activeTab === 'roc' ? 'active' : ''}`} onClick={() => setActiveTab('roc')}>ROC Curve</button>}
        {prData && <button className={`tab-btn ${activeTab === 'pr' ? 'active' : ''}`} onClick={() => setActiveTab('pr')}>Precision-Recall</button>}
        {!isClassification && <button className={`tab-btn ${activeTab === 'scatter' ? 'active' : ''}`} onClick={() => setActiveTab('scatter')}>Actual vs Predicted</button>}
      </div>

      {/* Metrics Tab */}
      {activeTab === 'metrics' && isClassification && classMetrics && (
        <div className="animate-in">
          <div className="card">
            <div className="card-header"><div className="card-title"><BarChart3 size={16} /> Per-Class Metrics</div></div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead><tr><th>Class</th><th>TP</th><th>FP</th><th>FN</th><th>Precision</th><th>Recall</th><th>F1 Score</th></tr></thead>
                <tbody>
                  {Object.entries(classMetrics.perClass).map(([label, m]) => (
                    <tr key={label}>
                      <td style={{ fontFamily: 'inherit', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</td>
                      <td style={{ color: 'var(--green)' }}>{m.tp}</td>
                      <td style={{ color: 'var(--red)' }}>{m.fp}</td>
                      <td style={{ color: 'var(--yellow)' }}>{m.fn}</td>
                      <td>{(m.precision * 100).toFixed(2)}%</td>
                      <td>{(m.recall * 100).toFixed(2)}%</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar-outer" style={{ flex: 1 }}>
                            <div className="progress-bar-inner" style={{ width: `${m.f1 * 100}%` }} />
                          </div>
                          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)', minWidth: 42 }}>
                            {(m.f1 * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Confusion Matrix */}
      {activeTab === 'confusion' && confMatrix && (
        <div className="animate-in">
          <div className="card" style={{ overflowX: 'auto' }}>
            <div className="card-header">
              <div className="card-title"><Target size={16} /> Confusion Matrix</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="badge badge-green">True Pos diagonal</span>
                <span className="badge badge-red">Misclassifications off-diagonal</span>
              </div>
            </div>
            <div style={{ display: 'inline-block' }}>
              <div style={{ display: 'flex', marginBottom: 4, paddingLeft: 80 }}>
                {confMatrix.labels.map((l) => (
                  <div key={l} style={{ width: 72, textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                    {l}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', paddingLeft: 80, marginBottom: 8 }}>
                Predicted →
              </div>
              {confMatrix.matrix.map((row, ri) => (
                <div key={ri} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ width: 80, fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right', paddingRight: 8 }}>
                    {confMatrix.labels[ri]}
                  </div>
                  {row.map((val, ci) => {
                    const isDiag = ri === ci;
                    const intensity = maxCell > 0 ? val / maxCell : 0;
                    return (
                      <div
                        key={ci}
                        style={{
                          width: 72, height: 56,
                          background: isDiag
                            ? `rgba(16,185,129,${0.15 + intensity * 0.7})`
                            : val > 0 ? `rgba(239,68,68,${0.15 + intensity * 0.7})` : 'rgba(255,255,255,0.02)',
                          border: isDiag ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                          borderRadius: 6, fontSize: 18, fontWeight: 700,
                          color: isDiag ? 'var(--green)' : val > 0 ? 'var(--red)' : 'var(--text-muted)',
                          transition: 'transform 0.15s',
                          cursor: 'default',
                        }}
                        title={`Actual: ${confMatrix.labels[ri]}, Predicted: ${confMatrix.labels[ci]}: ${val}`}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        {val}
                        <span style={{ fontSize: 9, opacity: 0.7 }}>
                          {maxCell > 0 ? `${(val / (row.reduce((a, b) => a + b, 0)) * 100).toFixed(0)}%` : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div style={{ paddingLeft: 80, fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                ← Actual
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROC Curve */}
      {activeTab === 'roc' && rocData && (
        <div className="animate-in">
          <div className="card">
            <div className="card-header">
              <div className="card-title"><TrendingUp size={16} /> ROC Curve</div>
              <span className="badge badge-cyan">AUC = {rocData.auc}</span>
            </div>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={rocData.points}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="fpr" type="number" domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} label={{ value: 'FPR', fill: 'var(--text-muted)', position: 'insideBottom', offset: -5 }} />
                <YAxis type="number" domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} label={{ value: 'TPR', fill: 'var(--text-muted)', angle: -90, position: 'insideLeft' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [v.toFixed(3)]} />
                <ReferenceLine stroke="var(--border)" strokeDasharray="4 4" segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} />
                <Line type="monotone" dataKey="tpr" stroke="var(--accent)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* PR Curve */}
      {activeTab === 'pr' && prData && (
        <div className="animate-in">
          <div className="card">
            <div className="card-header"><div className="card-title"><Percent size={16} /> Precision-Recall Curve</div></div>
            <ResponsiveContainer width="100%" height={380}>
              <LineChart data={prData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="recall" type="number" domain={[0, 1]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} label={{ value: 'Recall', fill: 'var(--text-muted)', position: 'insideBottom', offset: -5 }} />
                <YAxis dataKey="precision" type="number" domain={[0, 1]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} label={{ value: 'Precision', fill: 'var(--text-muted)', angle: -90, position: 'insideLeft' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [v.toFixed(3)]} />
                <Line type="monotone" dataKey="precision" stroke="var(--cyan)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Actual vs Predicted Scatter */}
      {activeTab === 'scatter' && !isClassification && (
        <div className="animate-in">
          <div className="card">
            <div className="card-header"><div className="card-title"><BarChart3 size={16} /> Actual vs Predicted</div></div>
            <ResponsiveContainer width="100%" height={380}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="actual" name="Actual" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} label={{ value: 'Actual', fill: 'var(--text-muted)', position: 'insideBottom', offset: -5 }} />
                <YAxis dataKey="predicted" name="Predicted" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} label={{ value: 'Predicted', fill: 'var(--text-muted)', angle: -90, position: 'insideLeft' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Scatter
                  data={model.y_true.map((v, i) => ({ actual: Number(v), predicted: Number(model.y_pred[i]) }))}
                  fill="var(--accent)"
                  fillOpacity={0.6}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
