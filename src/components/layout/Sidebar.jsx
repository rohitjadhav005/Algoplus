import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Database, BarChart3, TrendingUp,
  FlaskConical, Zap, GitCompare, Activity, Cpu
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/dataset', label: 'Dataset Explorer', icon: Database },
  { path: '/performance', label: 'Model Performance', icon: BarChart3 },
  { path: '/training', label: 'Training History', icon: TrendingUp },
  { path: '/preprocessing', label: 'Preprocessing Lab', icon: FlaskConical },
  { path: '/inference', label: 'Inference Tester', icon: Zap },
  { path: '/comparison', label: 'Model Comparison', icon: GitCompare },
];

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Activity size={20} color="white" />
        </div>
        <div className="sidebar-logo-text">
          <h1>AlgoPulse</h1>
          <span>ML Analytics Platform</span>
        </div>
      </div>

      <div className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-badge">
          <Cpu size={16} color="var(--accent-light)" />
          <span>Client-side processing</span>
        </div>
      </div>
    </nav>
  );
}
