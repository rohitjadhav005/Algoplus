import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import DatasetExplorer from './pages/DatasetExplorer';
import ModelPerformance from './pages/ModelPerformance';
import TrainingHistory from './pages/TrainingHistory';
import PreprocessingLab from './pages/PreprocessingLab';
import InferenceTester from './pages/InferenceTester';
import ModelComparison from './pages/ModelComparison';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Sidebar />
          <div className="main-content">
            <Header />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dataset" element={<DatasetExplorer />} />
              <Route path="/performance" element={<ModelPerformance />} />
              <Route path="/training" element={<TrainingHistory />} />
              <Route path="/preprocessing" element={<PreprocessingLab />} />
              <Route path="/inference" element={<InferenceTester />} />
              <Route path="/comparison" element={<ModelComparison />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
