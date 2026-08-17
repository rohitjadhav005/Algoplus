import React, { useCallback, useState } from 'react';
import { Upload, FileText, CheckCircle, X } from 'lucide-react';

export default function FileUpload({ accept, onFile, title, desc, formats, id }) {
  const [dragging, setDragging] = useState(false);
  const [loaded, setLoaded] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setError(null);
    setLoaded(file.name);
    try {
      await onFile(file);
    } catch (e) {
      setError(e.message || 'Failed to parse file');
      setLoaded(null);
    }
  }, [onFile]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  if (loaded) {
    return (
      <div className="file-upload-zone" style={{ borderStyle: 'solid', borderColor: 'var(--green)' }}>
        <div className="file-upload-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--green)' }}>
          <CheckCircle size={28} />
        </div>
        <div className="file-upload-text">
          <h3 style={{ color: 'var(--green)' }}>File loaded!</h3>
          <p>{loaded}</p>
          <button className="btn btn-secondary btn-sm" onClick={() => { setLoaded(null); setError(null); }}>
            <X size={13} /> Load different file
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`file-upload-zone ${dragging ? 'drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => document.getElementById(id).click()}
    >
      <input
        id={id}
        type="file"
        accept={accept}
        onChange={onInputChange}
        style={{ display: 'none' }}
      />
      <div className="file-upload-icon">
        <Upload size={28} />
      </div>
      <div className="file-upload-text">
        <h3>{title || 'Drop your file here'}</h3>
        <p>{desc || 'or click to browse'}</p>
        {error && (
          <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8 }}>
            ⚠ {error}
          </div>
        )}
        <div className="formats">
          {(formats || []).map((f) => (
            <span key={f} className="badge badge-accent">
              <FileText size={10} /> {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
