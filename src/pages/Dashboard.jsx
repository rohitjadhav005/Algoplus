import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import {
  Database, BarChart3, TrendingUp, FlaskConical, Zap, GitCompare,
  ArrowRight, Upload, Activity, Cpu, Brain, ChevronRight
} from 'lucide-react';

const features = [
  {
    path: '/dataset',
    icon: Database,
    color: 'var(--accent)',
    bg: 'rgba(99,102,241,0.12)',
    title: 'Dataset Explorer',
    desc: 'Upload CSV/JSON to auto-compute statistics, distributions, correlations, and missing value maps.',
  },
  {
    path: '/performance',
    icon: BarChart3,
    color: 'var(--cyan)',
    bg: 'rgba(34,211,238,0.12)',
    title: 'Model Performance',
    desc: 'Evaluate classification & regression models with confusion matrices, ROC curves, and F1 scores.',
  },
  {
    path: '/training',
    icon: TrendingUp,
    color: 'var(--green)',
    bg: 'rgba(16,185,129,0.12)',
    title: 'Training History',
    desc: 'Visualize loss and accuracy curves, detect overfitting, and review learning rate schedules.',
  },
  {
    path: '/preprocessing',
    icon: FlaskConical,
    color: 'var(--purple)',
    bg: 'rgba(167,139,250,0.12)',
    title: 'Preprocessing Lab',
    desc: 'Normalize, standardize, log-scale or bin columns. Compare before/after distributions live.',
  },
  {
    path: '/inference',
    icon: Zap,
    color: 'var(--yellow)',
    bg: 'rgba(245,158,11,0.12)',
    title: 'Inference Tester',
    desc: 'Enter feature values manually and run a client-side k-NN or linear regression prediction.',
  },
  {
    path: '/comparison',
    icon: GitCompare,
    color: 'var(--orange)',
    bg: 'rgba(249,115,22,0.12)',
    title: 'Model Comparison',
    desc: 'Load multiple result JSONs to compare accuracy, F1, RMSE side-by-side with overlapping ROC curves.',
  },
];

const quickStartSteps = [
  { icon: Upload, label: 'Upload a CSV dataset', link: '/dataset', badge: 'Step 1' },
  { icon: BarChart3, label: 'Load model results JSON', link: '/performance', badge: 'Step 2' },
  { icon: TrendingUp, label: 'Add training history', link: '/training', badge: 'Step 3' },
  { icon: GitCompare, label: 'Compare your models', link: '/comparison', badge: 'Step 4' },
];

export default function Dashboard() {
  const { state } = useAppContext();

  const hasDataset = !!state.dataset;
  const hasModels = state.modelResults.length > 0;
  const hasTraining = !!state.trainingLogs;

  return (
    <div className="page-content animate-in">
      {/* Hero */}
      <div
        className="card hero-gradient"
        style={{
          marginBottom: 32,
          padding: '48px 40px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(34,211,238,0.07) 100%)',
          borderColor: 'rgba(99,102,241,0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -40, right: -40, opacity: 0.06 }}>
          <Brain size={280} color="white" />
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              background: 'var(--gradient-primary)',
              borderRadius: 10,
              width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(99,102,241,0.5)',
            }}>
              <Activity size={22} color="white" />
            </div>
            <span className="badge badge-accent">v1.0 — Client-side ML Analytics</span>
          </div>
          <h1 style={{
            fontSize: 38, fontWeight: 800,
            background: 'linear-gradient(135deg, #f1f5f9 0%, #818cf8 50%, #22d3ee 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: 12, lineHeight: 1.2,
          }}>
            AlgoPulse
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', maxWidth: 520, marginBottom: 28, lineHeight: 1.7 }}>
            Your all-in-one platform for exploring datasets, evaluating AI/ML models, and visualizing
            training history — entirely in the browser. No backend required.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/dataset" className="btn btn-primary btn-lg">
              <Upload size={16} /> Upload Dataset
            </Link>
            <Link to="/performance" className="btn btn-secondary btn-lg">
              <BarChart3 size={16} /> Load Model Results
            </Link>
          </div>
        </div>
      </div>

      {/* Status Overview */}
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <div className="stat-card animate-in animate-in-delay-1">
          <div className="stat-card-icon" style={{ background: hasDataset ? 'rgba(99,102,241,0.15)' : 'var(--bg-input)' }}>
            <Database size={20} color={hasDataset ? 'var(--accent-light)' : 'var(--text-muted)'} />
          </div>
          <div className="stat-card-value">{hasDataset ? state.dataset.rows.length.toLocaleString() : '—'}</div>
          <div className="stat-card-label">Dataset Rows</div>
          {hasDataset && <div className="stat-card-change" style={{ color: 'var(--green)' }}>✓ {state.dataset.columns.length} columns loaded</div>}
        </div>
        <div className="stat-card animate-in animate-in-delay-2">
          <div className="stat-card-icon" style={{ background: hasModels ? 'rgba(34,211,238,0.15)' : 'var(--bg-input)' }}>
            <BarChart3 size={20} color={hasModels ? 'var(--cyan)' : 'var(--text-muted)'} />
          </div>
          <div className="stat-card-value">{state.modelResults.length}</div>
          <div className="stat-card-label">Models Loaded</div>
          {hasModels && <div className="stat-card-change" style={{ color: 'var(--cyan)' }}>✓ Ready to evaluate</div>}
        </div>
        <div className="stat-card animate-in animate-in-delay-3">
          <div className="stat-card-icon" style={{ background: hasTraining ? 'rgba(16,185,129,0.15)' : 'var(--bg-input)' }}>
            <TrendingUp size={20} color={hasTraining ? 'var(--green)' : 'var(--text-muted)'} />
          </div>
          <div className="stat-card-value">
            {hasTraining ? (state.trainingLogs.loss?.length || 0) : '—'}
          </div>
          <div className="stat-card-label">Training Epochs</div>
          {hasTraining && <div className="stat-card-change" style={{ color: 'var(--green)' }}>✓ Training logs loaded</div>}
        </div>
        <div className="stat-card animate-in animate-in-delay-1">
          <div className="stat-card-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>
            <Cpu size={20} color="var(--yellow)" />
          </div>
          <div className="stat-card-value" style={{ fontSize: 20 }}>100%</div>
          <div className="stat-card-label">Client-side Processing</div>
          <div className="stat-card-change" style={{ color: 'var(--yellow)' }}>No data leaves your browser</div>
        </div>
      </div>

      {/* Quick Start */}
      <div className="card" style={{ marginBottom: 32 }}>
        <div className="card-header">
          <div className="card-title"><ChevronRight size={16} /> Quick Start Guide</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {quickStartSteps.map(({ icon: Icon, label, link, badge }) => (
            <Link key={link} to={link} style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <Icon size={18} color="var(--accent-light)" />
                  <span className="badge badge-accent">{badge}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--accent-light)' }}>
                  Get started <ArrowRight size={11} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="card-header" style={{ marginBottom: 16 }}>
        <div className="card-title"><Activity size={16} /> Platform Features</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 32 }}>
        {features.map(({ path, icon: Icon, color, bg, title, desc }) => (
          <Link key={path} to={path} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ height: '100%', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={22} color={color} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: color }}>
                Open <ArrowRight size={12} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Sample Data Notice */}
      <div className="notification notification-info">
        <Brain size={16} />
        <span>
          <strong>New here?</strong> Download our{' '}
          <a href="#" style={{ color: 'var(--cyan)', textDecoration: 'underline' }} onClick={(e) => { e.preventDefault(); generateSampleCSV(); }}>
            sample dataset
          </a>{' '}
          and{' '}
          <a href="#" style={{ color: 'var(--cyan)', textDecoration: 'underline' }} onClick={(e) => { e.preventDefault(); generateSampleModel(); }}>
            sample model results
          </a>{' '}
          to explore the platform instantly.
        </span>
      </div>
    </div>
  );
}

function generateSampleCSV() {
  const headers = 'age,salary,experience,department,score,passed\n';
  let rows = '';
  const depts = ['Engineering','Marketing','Sales','HR','Finance'];
  for (let i = 0; i < 200; i++) {
    const age = Math.floor(22 + Math.random() * 40);
    const exp = Math.floor(Math.random() * (age - 21));
    const sal = 30000 + exp * 3500 + Math.random() * 20000;
    const dept = depts[Math.floor(Math.random() * depts.length)];
    const score = +(40 + Math.random() * 60).toFixed(1);
    const passed = score >= 60 ? 1 : 0;
    rows += `${age},${sal.toFixed(0)},${exp},${dept},${score},${passed}\n`;
  }
  const blob = new Blob([headers + rows], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sample_dataset.csv';
  a.click();
}

function generateSampleModel() {
  const n = 150;
  const yTrue = [];
  const yPred = [];
  const yProb = [];
  for (let i = 0; i < n; i++) {
    const label = Math.random() > 0.5 ? '1' : '0';
    yTrue.push(label);
    const prob = label === '1' ? 0.5 + Math.random() * 0.5 : Math.random() * 0.5;
    yProb.push(+prob.toFixed(3));
    yPred.push(prob >= 0.5 ? '1' : '0');
  }
  const data = {
    name: 'Sample Classifier',
    type: 'classification',
    y_true: yTrue,
    y_pred: yPred,
    y_prob: yProb,
    positive_label: '1',
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sample_model_results.json';
  a.click();
}
