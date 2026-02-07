'use client';

import React, { useState, useCallback } from 'react';

export default function FNOLProcessor() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await fetch('http://localhost:3001/api/process-fnol', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process claim. Please try again.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const getVerdictClass = (route: string) => {
    if (route.includes('Fast-Track')) return 'verdict-Fast-Track';
    if (route.includes('Manual')) return 'verdict-Manual';
    if (route.includes('Investigation')) return 'verdict-Investigation';
    if (route.includes('Specialist')) return 'verdict-Specialist';
    return 'verdict-Standard';
  };

  return (
    <div className="container">
      <header>
        <h1>Autonomous FNOL Claims Agent</h1>
        <p className="subtitle">Automated extraction and intelligent routing for insurance claims</p>
      </header>

      <div className="card">
        <div 
          className="upload-zone"
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
          {file ? (
            <div>
              <p style={{ fontWeight: 600, color: 'var(--primary)' }}>{file.name}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Click to change file</p>
            </div>
          ) : (
            <div>
              <p style={{ fontWeight: 600 }}>Click to upload FNOL document</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Supports PDF and TXT</p>
            </div>
          )}
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleUpload}
            disabled={!file || loading}
            style={{ minWidth: '200px' }}
          >
            {loading && <div className="loading-spinner" />}
            {loading ? 'Processing...' : 'Process Claim'}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: '1rem', color: 'var(--error)', textAlign: 'center', fontWeight: 600 }}>
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="results-container animate-fade-in">
          <div className={`verdict-card ${getVerdictClass(result.recommendedRoute)}`}>
            <div className="verdict-title">{result.recommendedRoute}</div>
            <div className="verdict-reasoning">
              <strong>Reasoning:</strong> {result.reasoning}
            </div>
          </div>

          <div className="results-grid">
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Extracted Data</h3>
              {(Object.entries(result.extractedFields as Record<string, any>)).map(([key, value]) => (
                value && (
                  <div key={key} className="field-item">
                    <span className="field-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</span>
                    <span className="field-value">
                      {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                    </span>
                  </div>
                )
              ))}
              
              {result.missingFields.length > 0 && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ color: 'var(--error)', marginBottom: '0.5rem' }}>Missing Mandatory Fields</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {result.missingFields.map((field: string) => (
                      <span key={field} className="badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Raw Extraction (JSON)</h3>
              <pre>
                {JSON.stringify(result.extractedFields, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
