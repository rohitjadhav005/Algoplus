import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getHistogramData } from '../utils/dataParser';
import { applyTransformToDataset } from '../utils/transforms';
import { FlaskConical, Download, Hash, RefreshCw } from 'lucide-react';

const TRANSFORMS = [
  { value: 'normalize', label: 'Min-Max Normalize (0–1)', desc: 'Scales values to [0, 1] range' },
  { value: 'standardize', label: 'Standardize (Z-score)', desc: 'Mean=0, Std=1 transformation' },
  { value: 'log', label: 'Log Transform (ln)', desc: 'Natural log — good for skewed data (must be > 0)' },
  { value: 'sqrt', label: 'Square Root', desc: 'Mild compression of large values (must be ≥ 0)' },
  { value: 'bin', label: 'Equal-Width Binning', desc: 'Converts numeric to 5 categorical bins' },
];

export default function PreprocessingLab() {
  const { state } = useAppContext();
  const dataset = state.dataset;
  const [selectedCol, setSelectedCol] = useState('');
  const [selectedTransform, setSelectedTransform] = useState('normalize');
  const [transformedRows, setTransformedRows] = useState(null);
  const [transformedCol, setTransformedCol] = useState('');

  if (!dataset) {
    return (
      <div className="page-content animate-in">
        <div className="page-title"><h1>Preprocessing Lab</h1><p>Load a dataset first from the Dataset Explorer</p></div>
        <div className="empty-state">
          <div className="empty-state-icon"><FlaskConical size={32} /></div>
          <h3>No Dataset Loaded</h3>
          <p>Go to the Dataset Explorer and upload a CSV file first. Then return here to apply preprocessing transformations.</p>
        </div>
      </div>
    );
  }

  const { columns, rows, types } = dataset;
  const numericCols = columns.filter((c) => types[c] === 'numeric');
  const col = selectedCol || numericCols[0] || '';
  const transformInfo = TRANSFORMS.find((t) => t.value === selectedTransform);

  const handleApply = () => {
    if (!col) return;
    const newRows = applyTransformToDataset(rows, col, selectedTransform);
    setTransformedRows(newRows);
    setTransformedCol(`${col}_${selectedTransform}`);
  };

  const beforeData = col ? getHistogramData(rows, col) : [];
  const afterData = transformedRows && transformedCol && selectedTransform !== 'bin'
    ? getHistogramData(transformedRows, transformedCol)
    : [];

  // For bin transform, show value counts
  const binCounts = transformedRows && selectedTransform === 'bin' ? (() => {
    const counts = {};
    transformedRows.forEach((r) => {
      const v = r[transformedCol];
      if (v) counts[v] = (counts[v] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }));
  })() : [];

  const handleExport = () => {
    if (!transformedRows) return;
    const exportCols = [...columns, transformedCol];
    const header = exportCols.join(',');
    const csv = [header, ...transformedRows.map((r) => exportCols.map((c) => r[c] ?? '').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${dataset.fileName.replace('.csv', '')}_preprocessed.csv`;
    a.click();
  };

  return (
    <div className="page-content animate-in">
      <div className="page-title">
        <h1>Preprocessing Lab</h1>
        <p>Apply transformations to numeric columns and compare before/after distributions</p>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><div className="card-title"><FlaskConical size={16} /> Transform Configuration</div></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Select Column</label>
            <select className="form-select" value={col} onChange={(e) => { setSelectedCol(e.target.value); setTransformedRows(null); }}>
              {numericCols.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Transform</label>
            <select className="form-select" value={selectedTransform} onChange={(e) => { setSelectedTransform(e.target.value); setTransformedRows(null); }}>
              {TRANSFORMS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleApply} disabled={!col}>
            <RefreshCw size={14} /> Apply
          </button>
        </div>
        {transformInfo && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '8px 12px', borderRadius: 6 }}>
            ℹ {transformInfo.desc}
          </div>
        )}
      </div>

      {/* Column Quick Stats */}
      {col && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {['min', 'max', 'mean', 'std'].map((k) => (
            <div key={k} className="stat-card">
              <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>
                <Hash size={18} color="var(--accent-light)" />
              </div>
              <div className="stat-card-value" style={{ fontSize: 22 }}>{dataset.stats[col]?.[k] ?? '—'}</div>
              <div className="stat-card-label">{k.toUpperCase()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Before/After Distributions */}
      <div className="two-col" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Hash size={16} /> Before — {col}</div>
            <span className="badge badge-cyan">Original</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={beforeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="x" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="var(--text-muted)" radius={[3, 3, 0, 0]} fillOpacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title"><FlaskConical size={16} /> After — {col}_{selectedTransform}</div>
            <span className="badge badge-accent">Transformed</span>
          </div>
          {!transformedRows ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <p>Click <strong>Apply</strong> to see the transformed distribution</p>
            </div>
          ) : selectedTransform === 'bin' ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={binCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 9 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--purple)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={afterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="x" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--accent)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Overlay Comparison */}
      {transformedRows && selectedTransform !== 'bin' && afterData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <div className="card-title"><RefreshCw size={16} /> Overlay Comparison</div>
          </div>
          <div className="notification notification-info" style={{ marginBottom: 16 }}>
            <Hash size={14} />
            <span>Gray = original distribution · Blue = transformed distribution (normalized to same scale)</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={beforeData.map((b, i) => ({ ...b, after: afterData[i]?.count || 0 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="x" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              <Bar dataKey="count" name="Before" fill="var(--text-muted)" radius={[3, 3, 0, 0]} fillOpacity={0.4} />
              <Bar dataKey="after" name="After" fill="var(--accent)" radius={[3, 3, 0, 0]} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Export */}
      {transformedRows && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Download size={16} /> Export Transformed Dataset</div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            Downloads the original dataset with the new <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{transformedCol}</code> column appended.
          </p>
          <button className="btn btn-primary" onClick={handleExport}>
            <Download size={14} /> Download CSV
          </button>
        </div>
      )}
    </div>
  );
}
