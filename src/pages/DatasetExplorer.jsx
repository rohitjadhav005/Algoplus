import React, { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import FileUpload from '../components/ui/FileUpload';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { parseCSV, getHistogramData, getValueCounts } from '../utils/dataParser';
import { computeCorrelationMatrix } from '../utils/statistics';
import {
  Database, TrendingUp, AlertCircle, Layers, Hash, Type,
  BarChart2, Grid, Table, ChevronLeft, ChevronRight
} from 'lucide-react';

const PAGE_SIZE = 15;

export default function DatasetExplorer() {
  const { state, dispatch } = useAppContext();
  const dataset = state.dataset;
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCol, setSelectedCol] = useState(null);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(async (file) => {
    setLoading(true);
    try {
      // parseCSV now calls the Python backend — returns columns, rows, columnStats, columnTypes
      const { columns, rows, columnStats, columnTypes, rowCount } = await parseCSV(file);
      const types = columnTypes;
      const stats = columnStats;
      const numCols = columns.filter((c) => types[c] === 'numeric');
      // Fetch correlation matrix from Python backend
      const corrMatrix = numCols.length > 1
        ? await computeCorrelationMatrix(rows, numCols)
        : [];
      dispatch({
        type: 'SET_DATASET',
        payload: { columns, rows, types, stats, corrMatrix, numericColumns: numCols, fileName: file.name, rowCount },
      });
      setSelectedCol(columns[0]);
      setActiveTab('overview');
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  if (!dataset) {
    return (
      <div className="page-content animate-in">
        <div className="page-title">
          <h1>Dataset Explorer</h1>
          <p>Upload a CSV or JSON file to start exploring your data</p>
        </div>
        <div style={{ maxWidth: 600 }}>
          <FileUpload
            id="dataset-upload"
            accept=".csv,.json"
            onFile={handleFile}
            title="Upload your dataset"
            desc="Drag & drop a CSV file or click to browse"
            formats={['CSV', 'JSON']}
          />
          {loading && <div style={{ textAlign: 'center', marginTop: 20 }}><div className="loading-spinner" style={{ margin: '0 auto' }} /></div>}
        </div>
      </div>
    );
  }

  const { columns, rows, types, stats, corrMatrix, numericColumns } = dataset;
  const numericCols = numericColumns || columns.filter((c) => types[c] === 'numeric');

  // Table data
  let filtered = rows.filter((r) =>
    searchTerm === '' || columns.some((c) => String(r[c] ?? '').toLowerCase().includes(searchTerm.toLowerCase()))
  );
  if (sortCol) {
    filtered = [...filtered].sort((a, b) => {
      const va = a[sortCol], vb = b[sortCol];
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
  }
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const nullPctData = columns.map((c) => ({ name: c, pct: parseFloat(stats[c]?.nullPct || 0) }));
  const selectedStats = selectedCol ? stats[selectedCol] : null;

  // Async chart data — fetched from Python backend when selected column changes
  const [histData, setHistData] = useState([]);
  const [catData, setCatData] = useState([]);

  useEffect(() => {
    if (!selectedCol || !rows) return;
    if (types[selectedCol] === 'numeric') {
      getHistogramData(rows, selectedCol).then(setHistData).catch(() => setHistData([]));
      setCatData([]);
    } else if (types[selectedCol] === 'categorical') {
      getValueCounts(rows, selectedCol).then(setCatData).catch(() => setCatData([]));
      setHistData([]);
    }
  }, [selectedCol, rows, types]);

  const getCorrelationColor = (val) => {
    const abs = Math.abs(val);
    const r = val > 0 ? Math.round(34 + abs * 88) : Math.round(34 + abs * 80);
    const g = val > 0 ? Math.round(211 * (1 - abs)) : Math.round(100 * (1 - abs));
    const b = val > 0 ? Math.round(238 * (1 - abs * 0.5)) : Math.round(238 * (1 - abs * 0.3));
    if (val > 0.1) return `rgba(34,211,238,${0.2 + abs * 0.8})`;
    if (val < -0.1) return `rgba(239,68,68,${0.2 + abs * 0.8})`;
    return 'rgba(255,255,255,0.04)';
  };

  return (
    <div className="page-content animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>
          <h1>Dataset Explorer</h1>
          <p>{rows.length.toLocaleString()} rows · {columns.length} columns · {dataset.fileName}</p>
        </div>
        <FileUpload
          id="dataset-reload"
          accept=".csv,.json"
          onFile={handleFile}
          title=""
          desc=""
          formats={[]}
        />
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.15)' }}>
            <Database size={20} color="var(--accent-light)" />
          </div>
          <div className="stat-card-value">{rows.length.toLocaleString()}</div>
          <div className="stat-card-label">Total Rows</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(34,211,238,0.15)' }}>
            <Layers size={20} color="var(--cyan)" />
          </div>
          <div className="stat-card-value">{columns.length}</div>
          <div className="stat-card-label">Columns</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <Hash size={20} color="var(--green)" />
          </div>
          <div className="stat-card-value">{numericCols.length}</div>
          <div className="stat-card-label">Numeric Columns</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>
            <AlertCircle size={20} color="var(--red)" />
          </div>
          <div className="stat-card-value">
            {columns.reduce((acc, c) => acc + parseInt(stats[c]?.nullCount || 0), 0)}
          </div>
          <div className="stat-card-label">Missing Values</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart2 },
          { key: 'distributions', label: 'Distributions', icon: TrendingUp },
          { key: 'correlation', label: 'Correlation', icon: Grid },
          { key: 'missing', label: 'Missing Values', icon: AlertCircle },
          { key: 'table', label: 'Data Table', icon: Table },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} className={`tab-btn ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="animate-in">
          <div className="card">
            <div className="card-header"><div className="card-title"><Layers size={16} /> Schema & Statistics</div></div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Column</th><th>Type</th><th>Count</th><th>Null %</th>
                    <th>Unique</th><th>Min</th><th>Max</th><th>Mean</th><th>Std Dev</th>
                  </tr>
                </thead>
                <tbody>
                  {columns.map((col) => {
                    const s = stats[col];
                    return (
                      <tr key={col} onClick={() => { setSelectedCol(col); setActiveTab('distributions'); }} style={{ cursor: 'pointer' }}>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500, fontFamily: 'inherit' }}>{col}</td>
                        <td>
                          <span className={`badge ${s.type === 'numeric' ? 'badge-cyan' : 'badge-purple'}`}>
                            {s.type === 'numeric' ? <Hash size={10} /> : <Type size={10} />}
                            {s.type}
                          </span>
                        </td>
                        <td>{s.count}</td>
                        <td style={{ color: parseFloat(s.nullPct) > 10 ? 'var(--red)' : 'var(--text-secondary)' }}>{s.nullPct}%</td>
                        <td>{s.unique}</td>
                        <td>{s.min ?? '—'}</td>
                        <td>{s.max ?? '—'}</td>
                        <td>{s.mean ?? '—'}</td>
                        <td>{s.std ?? '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Distributions Tab */}
      {activeTab === 'distributions' && (
        <div className="animate-in">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {columns.map((c) => (
              <button key={c} className={`chip ${selectedCol === c ? 'selected' : ''}`} onClick={() => setSelectedCol(c)}>
                {types[c] === 'numeric' ? <Hash size={11} /> : <Type size={11} />} {c}
              </button>
            ))}
          </div>
          {selectedCol && (
            <div className="two-col">
              <div className="card">
                <div className="card-header">
                  <div className="card-title"><BarChart2 size={16} /> Distribution — {selectedCol}</div>
                  <span className={`badge ${types[selectedCol] === 'numeric' ? 'badge-cyan' : 'badge-purple'}`}>
                    {types[selectedCol]}
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  {types[selectedCol] === 'numeric' ? (
                    <BarChart data={histData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="x" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" fill="var(--accent)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  ) : (
                    <BarChart data={catData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={80} />
                      <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="count" fill="var(--purple)" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
              {selectedStats && (
                <div className="card">
                  <div className="card-header"><div className="card-title"><Hash size={16} /> Statistics — {selectedCol}</div></div>
                  {[
                    ['Count', selectedStats.count],
                    ['Missing', `${selectedStats.nullCount} (${selectedStats.nullPct}%)`],
                    ['Unique Values', selectedStats.unique],
                    ...(types[selectedCol] === 'numeric' ? [
                      ['Min', selectedStats.min],
                      ['Q1 (25%)', selectedStats.q1],
                      ['Median (50%)', selectedStats.median],
                      ['Q3 (75%)', selectedStats.q3],
                      ['Max', selectedStats.max],
                      ['Mean', selectedStats.mean],
                      ['Std Dev', selectedStats.std],
                    ] : []),
                  ].map(([label, val]) => (
                    <div key={label} className="metric-row">
                      <span className="metric-row-label">{label}</span>
                      <span className="metric-row-value">{val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Correlation Tab */}
      {activeTab === 'correlation' && (
        <div className="animate-in">
          <div className="card">
            <div className="card-header">
              <div className="card-title"><Grid size={16} /> Pearson Correlation Matrix</div>
              <span className="badge badge-accent">{numericCols.length} numeric columns</span>
            </div>
            {numericCols.length < 2 ? (
              <div className="empty-state"><p>Need at least 2 numeric columns for correlation analysis.</p></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'inline-block', minWidth: '100%' }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', marginBottom: 4, paddingLeft: 80 }}>
                    {numericCols.map((c) => (
                      <div key={c} style={{ width: 64, flexShrink: 0, fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', transform: 'rotate(-30deg)', transformOrigin: 'bottom left', height: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                        {c.length > 8 ? c.slice(0, 8) + '…' : c}
                      </div>
                    ))}
                  </div>
                  {corrMatrix.map((row, ri) => (
                    <div key={numericCols[ri]} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ width: 80, flexShrink: 0, fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', paddingRight: 8 }}>
                        {numericCols[ri].length > 9 ? numericCols[ri].slice(0, 9) + '…' : numericCols[ri]}
                      </div>
                      {row.map((val, ci) => (
                        <div
                          key={ci}
                          className="heatmap-cell"
                          style={{ width: 64, height: 36, background: getCorrelationColor(val), color: Math.abs(val) > 0.5 ? 'white' : 'var(--text-muted)', flexShrink: 0, fontSize: 10, fontWeight: 600 }}
                          title={`${numericCols[ri]} × ${numericCols[ci]}: ${val}`}
                        >
                          {val.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 16, alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 14, background: 'rgba(34,211,238,0.9)', borderRadius: 3 }} /> Positive
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 14, background: 'rgba(239,68,68,0.9)', borderRadius: 3 }} /> Negative
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 3, border: '1px solid var(--border)' }} /> Near zero
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Missing Values Tab */}
      {activeTab === 'missing' && (
        <div className="animate-in">
          <div className="card">
            <div className="card-header">
              <div className="card-title"><AlertCircle size={16} /> Missing Values by Column</div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={nullPctData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${v}%`, 'Missing']} />
                <Bar dataKey="pct" fill="var(--red)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="divider" />
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead><tr><th>Column</th><th>Missing Count</th><th>Missing %</th><th>Status</th></tr></thead>
                <tbody>
                  {columns.map((c) => {
                    const s = stats[c];
                    const pct = parseFloat(s.nullPct);
                    return (
                      <tr key={c}>
                        <td style={{ fontFamily: 'inherit', fontWeight: 500, color: 'var(--text-primary)' }}>{c}</td>
                        <td>{s.nullCount}</td>
                        <td>{s.nullPct}%</td>
                        <td>
                          {pct === 0 ? <span className="badge badge-green">✓ Complete</span>
                            : pct < 5 ? <span className="badge badge-yellow">Low</span>
                            : pct < 20 ? <span className="badge badge-orange" style={{ background: 'rgba(249,115,22,0.2)', color: 'var(--orange)' }}>Moderate</span>
                            : <span className="badge badge-red">High</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Data Table Tab */}
      {activeTab === 'table' && (
        <div className="animate-in">
          <div className="card">
            <div className="card-header">
              <div className="card-title"><Table size={16} /> Data Preview</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  className="form-input"
                  style={{ width: 220 }}
                  placeholder="Search rows…"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {filtered.length} rows
                </span>
              </div>
            </div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    {columns.map((c) => (
                      <th key={c} onClick={() => { setSortCol(c); setSortDir(sortCol === c && sortDir === 'asc' ? 'desc' : 'asc'); }}>
                        {c} {sortCol === c ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageData.map((row, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--text-muted)' }}>{page * PAGE_SIZE + i + 1}</td>
                      {columns.map((c) => (
                        <td key={c} style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row[c] === null || row[c] === undefined || row[c] === ''
                            ? <span style={{ color: 'var(--red)', opacity: 0.6 }}>null</span>
                            : String(row[c])
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Page {page + 1} of {totalPages}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  <ChevronLeft size={13} />
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
