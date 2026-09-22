import React, { useEffect, useState } from 'react';
import { AnalysisResult } from '../types';

interface ResultScreenProps {
  result: AnalysisResult;
  onNewCheck: () => void;
  onGoHome: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  onNewCheck,
  onGoHome,
}) => {
  const [meterWidth, setMeterWidth] = useState<string>('0%');

  useEffect(() => {
    // Smooth meter animation
    const timer = setTimeout(() => {
      setMeterWidth(`${result.riskScore}%`);
    }, 150);
    return () => clearTimeout(timer);
  }, [result.riskScore]);

  // Risk styling mapping
  const isHigh = result.riskLevel === 'High Risk';
  const isMedium = result.riskLevel === 'Medium Risk';
  const isSafe = result.riskLevel === 'Safe' || result.riskLevel === 'Low Risk';

  const riskClass = isHigh ? 'high' : isMedium ? 'medium' : 'safe';
  const riskColor = isHigh
    ? 'var(--red)'
    : isMedium
    ? 'var(--amber)'
    : 'var(--green)';

  return (
    <section className="page active" id="page-result">
      <button className="backbtn" id="result-back-btn" onClick={onNewCheck}>
        ← New Check
      </button>
      <div style={{ height: '18px' }} />

      <p className="h1">Analysis Result</p>
      <p className="sub" style={{ margin: '4px 0 18px' }}>
        Our AI analyzed the {result.inputType === 'qr' ? 'QR payload' : result.inputType === 'link' ? 'URL link' : 'input'} in real time.
      </p>

      <div className="result-grid">
        {/* Left Column: Risk Score & Meter */}
        <div className={`riskcard ${riskClass}`} id="result-risk-card">
          <div className={`risk-badge ${riskClass}`}>
            {isSafe ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
                <path d="M12 8v5M12 16.5h.01" />
                <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
              </svg>
            )}
          </div>

          <div style={{ fontSize: '20px', fontWeight: 800, color: riskColor }}>
            {result.riskLevel}
          </div>
          <div className="sub">{result.summary}</div>

          <div className={`bigpct ${riskClass}`} style={{ marginTop: '12px' }}>
            {result.riskScore}%
          </div>
          <div className="sub">Fraud Risk</div>

          <div className="meter">
            <i
              id="riskMeter"
              style={{
                width: meterWidth,
                background: riskColor,
              }}
            />
          </div>
        </div>

        {/* Right Column: Category & Key Warnings */}
        <div className="card" id="result-category-card">
          <div className="row">
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '13px',
                background: 'var(--accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: '0 0 auto',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
                <path
                  d="M24 4 8 10v12c0 10.5 6.8 18.6 16 22 9.2-3.4 16-11.5 16-22V10L24 4z"
                  fill="#1C1F1C"
                />
                <path
                  d="M17 24.5l5 5 9.5-10"
                  stroke="#63C74D"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div className="sub">Detected Category</div>
              <div style={{ fontSize: '15px', fontWeight: 700 }} id="detected-category-text">
                {result.category}
              </div>
            </div>
          </div>

          <div style={{ height: '16px' }} />

          <div className="row" style={{ marginBottom: '4px' }}>
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke={riskColor}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isSafe ? (
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              ) : (
                <>
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </>
              )}
            </svg>
            <b style={{ fontSize: '14.5px' }}>{isSafe ? 'Security Observations' : 'Key Warnings'}</b>
          </div>

          {result.keyWarnings.map((warning, index) => (
            <div key={index} className="warn-item">
              <span className="dot" style={{ background: riskColor }} />
              <span>{warning}</span>
            </div>
          ))}
        </div>

        {/* Wide Card: Detailed Factors */}
        <div className="card wide" id="result-factors-card">
          <div className="sec" style={{ marginTop: 0 }}>
            {isSafe ? 'Why is this considered safe?' : 'Why is this suspicious?'}
          </div>
          <div className="factor-stack">
            {result.factors.map((factor, index) => (
              <div key={index} className="factor">
                <div className={`fi ${factor.isPositive ? 'pos' : 'neg'}`}>
                  {factor.isPositive ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <path d="M12 9v4M12 17h.01" />
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="row">
                    <span className="ft">{factor.title}</span>
                    <span className="spacer" />
                    <span className={`fp ${factor.isPositive ? 'pos' : 'neg'}`}>
                      {factor.isPositive ? '✓ Safe' : `+${factor.percentage}%`}
                    </span>
                  </div>
                  <div className="fs">{factor.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Card: Recommended Guidance */}
        <div
          className={`actioncard wide ${result.recommendedAction.type}`}
          id="result-action-card"
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '13px',
              background:
                result.recommendedAction.type === 'safe'
                  ? 'var(--green)'
                  : result.recommendedAction.type === 'warning'
                  ? 'var(--amber)'
                  : 'var(--red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '0 0 auto',
            }}
          >
            {result.recommendedAction.type === 'safe' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <div>
            <b
              style={{
                fontSize: '14px',
                color:
                  result.recommendedAction.type === 'safe'
                    ? 'var(--green)'
                    : result.recommendedAction.type === 'warning'
                    ? 'var(--amber)'
                    : 'var(--red)',
              }}
            >
              Recommended Action: {result.recommendedAction.title}
            </b>
            <p className="sub" style={{ marginTop: '4px' }}>
              {result.recommendedAction.description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="result-actions wide" id="result-action-buttons">
          <button className="btn" id="btn-check-another" onClick={onNewCheck}>
            Check Another {result.inputType === 'qr' ? 'QR Code' : result.inputType === 'link' ? 'Link' : 'Message'}
          </button>
          <button className="btn ghost" id="btn-back-home" onClick={onGoHome}>
            Back to Home
          </button>
        </div>
      </div>
    </section>
  );
};
