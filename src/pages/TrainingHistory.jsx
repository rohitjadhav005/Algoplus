import React, { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import FileUpload from '../components/ui/FileUpload';
import { parseJSON } from '../utils/dataParser';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Activity, Target } from 'lucide-react';

export default function TrainingHistory() {
  const { state, dispatch } = useAppContext();
  const [error, setError] = useState(null);
  const logs = state.trainingLogs;

  const handleFile = useCallback(async (file) => {
    setError(null);
    try {
      const data = await parseJSON(file);
      const hasLoss = Array.isArray(data.loss) || Array.isArray(data.train_loss);
      if (!hasLoss) throw new Error('JSON must contain a "loss" array (and optionally val_loss, accuracy, val_accuracy)');
      const normalized = {
        loss: data.loss || data.train_loss,
        val_loss: data.val_loss || data.validation_loss,
        accuracy: data.accuracy || data.train_accuracy || data.acc,
        val_accuracy: data.val_accuracy || data.validation_accuracy || data.val_acc,
        lr: data.lr || data.learning_rate,
      };
      dispatch({ type: 'SET_TRAINING_LOGS', payload: normalized });
    } catch (e) {
      setError(e.message);
    }
  }, [dispatch]);

  if (!logs) {
    return (
      <div className="page-content animate-in">
        <div className="page-title">
          <h1>Training History</h1>
          <p>Upload a training log JSON to visualize learning curves</p>
        </div>
        <div className="notification notification-info" style={{ maxWidth: 600 }}>
          <AlertTriangle size={16} />
          <div>
            <strong>Expected JSON format:</strong>
            <pre style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
{`{
  "loss": [0.9, 0.7, 0.5, ...],
  "val_loss": [0.95, 0.72, 0.55, ...],
  "accuracy": [0.6, 0.7, 0.8, ...],
  "val_accuracy": [0.58, 0.68, 0.77, ...],
  "lr": [0.01, 0.01, 0.001, ...]
}`}
            </pre>
          </div>
        </div>
        <div style={{ maxWidth: 600, marginTop: 20 }}>
          <FileUpload
            id="training-upload"
            accept=".json"
            onFile={handleFile}
            title="Upload training logs"
            desc="Drop a JSON file with loss and accuracy arrays"
            formats={['JSON']}
          />
          {error && <div className="notification notification-warning" style={{ marginTop: 12 }}><AlertTriangle size={14} />{error}</div>}
          <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => {
            const sample = generateSampleLogs();
            dispatch({ type: 'SET_TRAINING_LOGS', payload: sample });
          }}>
            <Activity size={14} /> Use Sample Data
          </button>
        </div>
      </div>
    );
  }

  const epochs = (logs.loss || []).length;
  const epochData = Array.from({ length: epochs }, (_, i) => ({
    epoch: i + 1,
    loss: logs.loss?.[i] !== undefined ? +logs.loss[i].toFixed(4) : undefined,
    val_loss: logs.val_loss?.[i] !== undefined ? +logs.val_loss[i].toFixed(4) : undefined,
    accuracy: logs.accuracy?.[i] !== undefined ? +(logs.accuracy[i] * (logs.accuracy[i] <= 1 ? 100 : 1)).toFixed(2) : undefined,
    val_accuracy: logs.val_accuracy?.[i] !== undefined ? +(logs.val_accuracy[i] * (logs.val_accuracy[i] <= 1 ? 100 : 1)).toFixed(2) : undefined,
    lr: logs.lr?.[i],
  }));

  const finalLoss = logs.loss?.[epochs - 1];
  const finalValLoss = logs.val_loss?.[epochs - 1];
  const finalAcc = logs.accuracy?.[epochs - 1];
  const finalValAcc = logs.val_accuracy?.[epochs - 1];

  const overfit = finalValLoss !== undefined && finalLoss !== undefined && (finalValLoss - finalLoss) > 0.1;
  const bestEpoch = logs.val_loss ? logs.val_loss.indexOf(Math.min(...logs.val_loss.filter((v) => v !== undefined))) + 1 : epochs;

  const toPercent = (v) => v !== undefined ? (v <= 1 ? (v * 100).toFixed(2) : v.toFixed(2)) : '—';

  return (
    <div className="page-content animate-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div className="page-title" style={{ marginBottom: 0 }}>
          <h1>Training History</h1>
          <p>{epochs} epochs · {overfit ? '⚠ Possible overfitting detected' : '✓ Looking good'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => dispatch({ type: 'SET_TRAINING_LOGS', payload: null })}>
            Clear Logs
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => {
            dispatch({ type: 'SET_TRAINING_LOGS', payload: generateSampleLogs() });
          }}>
            <Activity size={13} /> Sample Data
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.15)' }}><Activity size={20} color="var(--accent-light)" /></div>
          <div className="stat-card-value">{epochs}</div>
          <div className="stat-card-label">Total Epochs</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.15)' }}><Target size={20} color="var(--green)" /></div>
          <div className="stat-card-value">{bestEpoch}</div>
          <div className="stat-card-label">Best Epoch (min val loss)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: overfit ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)' }}>
            {overfit ? <AlertTriangle size={20} color="var(--red)" /> : <CheckCircle size={20} color="var(--green)" />}
          </div>
          <div className="stat-card-value" style={{ fontSize: 18, color: overfit ? 'var(--red)' : 'var(--green)' }}>
            {overfit ? 'Overfitting' : 'Good Fit'}
          </div>
          <div className="stat-card-label">Generalization Status</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(34,211,238,0.15)' }}><TrendingUp size={20} color="var(--cyan)" /></div>
          <div className="stat-card-value" style={{ fontSize: 20 }}>
            {finalValAcc !== undefined ? `${toPercent(finalValAcc)}%` : finalAcc !== undefined ? `${toPercent(finalAcc)}%` : '—'}
          </div>
          <div className="stat-card-label">Final Val Accuracy</div>
        </div>
      </div>

      {overfit && (
        <div className="notification notification-warning">
          <AlertTriangle size={16} />
          <span>
            <strong>Possible overfitting detected:</strong> Validation loss ({finalValLoss?.toFixed(4)}) is significantly higher than training loss ({finalLoss?.toFixed(4)}).
            Consider adding regularization, dropout, or early stopping at epoch {bestEpoch}.
          </span>
        </div>
      )}

      {/* Loss Curve */}
      <div className="card section-gap-lg">
        <div className="card-header">
          <div className="card-title"><TrendingUp size={16} /> Loss Curves</div>
          {overfit && <span className="badge badge-red">⚠ Overfitting Gap</span>}
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={epochData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="epoch" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} label={{ value: 'Epoch', fill: 'var(--text-muted)', position: 'insideBottom', offset: -5 }} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
            {overfit && <ReferenceLine x={bestEpoch} stroke="var(--yellow)" strokeDasharray="4 4" label={{ value: 'Best', fill: 'var(--yellow)', fontSize: 11 }} />}
            <Line type="monotone" dataKey="loss" name="Train Loss" stroke="var(--accent)" strokeWidth={2} dot={false} />
            {logs.val_loss && <Line type="monotone" dataKey="val_loss" name="Val Loss" stroke="var(--red)" strokeWidth={2} dot={false} strokeDasharray="5 3" />}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Accuracy Curve */}
      {(logs.accuracy || logs.val_accuracy) && (
        <div className="card section-gap-lg">
          <div className="card-header"><div className="card-title"><CheckCircle size={16} /> Accuracy Curves</div></div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={epochData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="epoch" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} label={{ value: 'Epoch', fill: 'var(--text-muted)', position: 'insideBottom', offset: -5 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`${v}%`]} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              {overfit && <ReferenceLine x={bestEpoch} stroke="var(--yellow)" strokeDasharray="4 4" />}
              {logs.accuracy && <Line type="monotone" dataKey="accuracy" name="Train Accuracy" stroke="var(--green)" strokeWidth={2} dot={false} />}
              {logs.val_accuracy && <Line type="monotone" dataKey="val_accuracy" name="Val Accuracy" stroke="var(--cyan)" strokeWidth={2} dot={false} strokeDasharray="5 3" />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* LR Schedule */}
      {logs.lr && (
        <div className="card">
          <div className="card-header"><div className="card-title"><Activity size={16} /> Learning Rate Schedule</div></div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={epochData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="epoch" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickFormatter={(v) => v.toExponential(1)} />
              <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Line type="stepAfter" dataKey="lr" name="Learning Rate" stroke="var(--yellow)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function generateSampleLogs() {
  const epochs = 60;
  const loss = [], val_loss = [], accuracy = [], val_accuracy = [], lr = [];
  let trainLoss = 1.2, valLoss = 1.25, trainAcc = 0.4, valAcc = 0.38;
  for (let i = 0; i < epochs; i++) {
    const decay = 1 / (1 + 0.08 * i);
    trainLoss = Math.max(0.05, trainLoss * (0.92 + Math.random() * 0.04));
    if (i < 40) valLoss = Math.max(0.12, valLoss * (0.935 + Math.random() * 0.04));
    else valLoss = valLoss * (1.005 + Math.random() * 0.015); // overfitting
    trainAcc = Math.min(0.99, trainAcc + 0.018 + Math.random() * 0.008);
    if (i < 40) valAcc = Math.min(0.95, valAcc + 0.015 + Math.random() * 0.008);
    else valAcc = Math.max(0.1, valAcc - Math.random() * 0.005);
    loss.push(+trainLoss.toFixed(4));
    val_loss.push(+valLoss.toFixed(4));
    accuracy.push(+trainAcc.toFixed(4));
    val_accuracy.push(+valAcc.toFixed(4));
    lr.push(i < 20 ? 0.01 : i < 40 ? 0.001 : 0.0001);
  }
  return { loss, val_loss, accuracy, val_accuracy, lr };
}
