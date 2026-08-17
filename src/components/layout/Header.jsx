import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Database, BarChart3, Layers, Trash2 } from 'lucide-react';

const pageMeta = {
  '/': { title: 'Dashboard', desc: 'Overview of your ML workspace' },
  '/dataset': { title: 'Dataset Explorer', desc: 'Explore and analyze your data' },
  '/performance': { title: 'Model Performance', desc: 'Evaluate classification & regression results' },
  '/training': { title: 'Training History', desc: 'Visualize training curves and metrics' },
  '/preprocessing': { title: 'Preprocessing Lab', desc: 'Transform and clean your features' },
  '/inference': { title: 'Inference Tester', desc: 'Test predictions with manual input' },
  '/comparison': { title: 'Model Comparison', desc: 'Compare multiple models side-by-side' },
};

export default function Header() {
  const location = useLocation();
  const meta = pageMeta[location.pathname] || { title: 'AlgoPulse', desc: '' };
  const { state, dispatch } = useAppContext();

  return (
    <header className="header">
      <div className="header-left">
        <h2>{meta.title}</h2>
        <p>{meta.desc}</p>
      </div>
      <div className="header-right">
        {state.dataset && (
          <div className="badge badge-green" style={{ gap: 6 }}>
            <Database size={11} />
            {state.dataset.fileName}
          </div>
        )}
        {state.modelResults.length > 0 && (
          <div className="badge badge-accent" style={{ gap: 6 }}>
            <BarChart3 size={11} />
            {state.modelResults.length} model{state.modelResults.length > 1 ? 's' : ''}
          </div>
        )}
        {state.trainingLogs && (
          <div className="badge badge-cyan" style={{ gap: 6 }}>
            <Layers size={11} />
            Training logs
          </div>
        )}
        {(state.dataset || state.modelResults.length > 0 || state.trainingLogs) && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => dispatch({ type: 'CLEAR_ALL' })}
            title="Clear all data"
          >
            <Trash2 size={13} />
            Clear
          </button>
        )}
      </div>
    </header>
  );
}
