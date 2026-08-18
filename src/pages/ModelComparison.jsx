import React, { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import FileUpload from '../components/ui/FileUpload';
import { parseJSON } from '../utils/dataParser';
import {
  buildConfusionMatrix, computeClassificationMetrics, computeROC
} from '../utils/mlMetrics';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line
} from 'recharts';
import { GitCompare, Plus, Trash2, BarChart3, Target, TrendingUp } from 'lucide-react';

const COLORS = ['var(--accent)', 'var(--cyan)', 'var(--green)', 'var(--purple)', 'var(--orange)', 'var(--yellow)'];

export default function ModelComparison() {
  const { state, dispatch } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    try {
      const data = await parseJSON(file);
      if (!data.y_true || !data.y_pred) throw new Error('JSON must contain y_true and y_pred arrays');
      dispatch({ type: 'ADD_MODEL_RESULT', payload: { ...data, fileName: file.name, name: data.name || file.name } });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const models = state.modelResults;

  // Compute metrics for each model
  const modelMetrics = models.map((m, i) => {
    try {
      const { matrix, labels } = buildConfusionMatrix(m.y_true, m.y_pred);
      const metrics = computeClassificationMetrics(m.y_true, m.y_pred, labels);
      const roc = m.y_prob && labels.length === 2
        ? computeROC(m.y_true, m.y_prob, m.positive_label || labels[1])
        : null;
      return {
        name: m.name || `Model ${i + 1}`,
        accuracy: +(metrics.accuracy * 100).toFixed(2),
        f1: +(metrics.macroF1 * 100).toFixed(2),
        precision: +(metrics.macroPrecision * 100).toFixed(2),
        recall: +(metrics.macroRecall * 100).toFixed(2),
        auc: roc ? +(roc.auc * 100).toFixed(2) : null,
        rocPoints: roc?.points || [],
        color: COLORS[i % COLORS.length],
        index: i,
      };
    } catch {
      return { name: m.name || `Model ${i + 1}`, accuracy: 0, f1: 0, precision: 0, recall: 0, auc: null, rocPoints: [], color: COLORS[i % COLORS.length], index: i };
    }
  });

  const barData = ['accuracy', 'f1', 'precision', 'recall'].map((metric) => ({
    metric: metric.charAt(0).toUpperCase() + metric.slice(1),
    ...modelMetrics.reduce((acc, m) => ({ ...acc, [m.name]: m[metric] }), {}),
  }));

  const radarData = ['accuracy', 'f1', 'precision', 'recall'].map((metric) => ({
    metric: metric.charAt(0).toUpperCase() + metric.slice(1),
    ...modelMetrics.reduce((acc, m) => ({ ...acc, [m.name]: m[metric] }), {}),
  }));

  const bestModel = modelMetrics.reduce((best, m) => (!best || m.f1 > best.f1 ? m : best), null);

  return (
    <div className="page-content animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>
          <h1>Model Comparison</h1>
          <p>{models.length} model{models.length !== 1 ? 's' : ''} loaded</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label htmlFor="comparison-upload" className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
            <Plus size={13} /> Add Model
          </label>
          <input id="comparison-upload" type="file" accept=".json" style={{ display: 'none' }}
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
          {models.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={() => { models.forEach((_, i) => dispatch({ type: 'REMOVE_MODEL_RESULT', payload: 0 })); }}>
              <Trash2 size={13} /> Clear All
            </button>
          )}
        </div>
      </div>

      {models.length === 0 && (
        <div>
          <div className="notification notification-info" style={{ maxWidth: 600, marginBottom: 20 }}>
            <GitCompare size={16} />
            <span>Load 2 or more model result JSON files to compare them side-by-side.</span>
          </div>
          <div style={{ maxWidth: 500 }}>
            <FileUpload id="comparison-upload-main" accept=".json" onFile={handleFile}
              title="Upload first model" desc="Then add more via the + Add Model button" formats={['JSON']} />
            {error && <div className="notification notification-warning" style={{ marginTop: 12 }}><span>{error}</span></div>}
          </div>
        </div>
      )}

      {models.length === 1 && (
        <div className="notification notification-info" style={{ maxWidth: 600 }}>
          <GitCompare size={16} />
          <span>Add at least one more model to enable comparison charts.</span>
        </div>
      )}

      {models.length > 0 && (
        <>
          {/* Model Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
            {modelMetrics.map((m) => (
              <div key={m.index} className="stat-card" style={{ borderColor: m.color.includes('var') ? undefined : m.color }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{m.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {bestModel?.name === m.name && models.length > 1 && (
                      <span className="badge badge-green" style={{ fontSize: 10 }}>🏆 Best F1</span>
                    )}
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ padding: '2px 6px', fontSize: 10 }}
                      onClick={() => dispatch({ type: 'REMOVE_MODEL_RESULT', payload: m.index })}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
                {[['Accuracy', m.accuracy], ['F1 Score', m.f1], ['Precision', m.precision], ['Recall', m.recall], ...(m.auc !== null ? [['AUC', m.auc]] : [])].map(([label, val]) => (
                  <div key={label} className="metric-row" style={{ padding: '6px 0' }}>
                    <span className="metric-row-label">{label}</span>
                    <span className="metric-row-value" style={{ color: val >= 80 ? 'var(--green)' : val >= 60 ? 'var(--yellow)' : 'var(--red)' }}>{val}%</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {models.length >= 2 && (
            <>
              {/* Bar Chart Comparison */}
              <div className="two-col" style={{ marginBottom: 24 }}>
                <div className="card">
                  <div className="card-header"><div className="card-title"><BarChart3 size={16} /> Metrics Comparison</div></div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="metric" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                        formatter={(v) => [`${v}%`]} />
                      <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
                      {modelMetrics.map((m) => (
                        <Bar key={m.name} dataKey={m.name} fill={m.color} radius={[3, 3, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Radar Chart */}
                <div className="card">
                  <div className="card-header"><div className="card-title"><Target size={16} /> Radar Overview</div></div>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 9 }} />
                      {modelMetrics.map((m) => (
                        <Radar key={m.name} name={m.name} dataKey={m.name} stroke={m.color} fill={m.color} fillOpacity={0.15} strokeWidth={2} />
                      ))}
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Overlapping ROC Curves */}
              {modelMetrics.some((m) => m.rocPoints.length > 0) && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title"><TrendingUp size={16} /> Overlapping ROC Curves</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {modelMetrics.filter((m) => m.auc !== null).map((m) => (
                        <span key={m.name} className="badge" style={{ background: `${m.color}22`, color: m.color }}>
                          {m.name}: {m.auc}%
                        </span>
                      ))}
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={380}>
                    <LineChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="fpr" type="number" domain={[0, 1]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        label={{ value: 'FPR', fill: 'var(--text-muted)', position: 'insideBottom', offset: -5 }} />
                      <YAxis type="number" domain={[0, 1]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        label={{ value: 'TPR', fill: 'var(--text-muted)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      {modelMetrics.filter((m) => m.rocPoints.length > 0).map((m) => (
                        <Line key={m.name} data={m.rocPoints} type="monotone" dataKey="tpr" name={`${m.name} (AUC: ${m.auc}%)`} stroke={m.color} strokeWidth={2} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Comparison Table */}
              <div className="card" style={{ marginTop: 24 }}>
                <div className="card-header"><div className="card-title"><BarChart3 size={16} /> Summary Table</div></div>
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Model</th><th>Accuracy</th><th>F1 Score</th><th>Precision</th><th>Recall</th><th>AUC</th><th>Rank</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...modelMetrics].sort((a, b) => b.f1 - a.f1).map((m, rank) => (
                        <tr key={m.name}>
                          <td style={{ fontFamily: 'inherit' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{m.name}</span>
                            </div>
                          </td>
                          <td>{m.accuracy}%</td>
                          <td style={{ color: rank === 0 ? 'var(--green)' : 'var(--text-secondary)' }}>{m.f1}%</td>
                          <td>{m.precision}%</td>
                          <td>{m.recall}%</td>
                          <td>{m.auc !== null ? `${m.auc}%` : '—'}</td>
                          <td>
                            {rank === 0 ? <span className="badge badge-green">🏆 #1</span>
                              : rank === 1 ? <span className="badge badge-yellow">#2</span>
                              : <span className="badge badge-accent">#{rank + 1}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
