import React from 'react';
import { InputCategory } from '../types';

interface HomeScreenProps {
  onSelectCategory: (category: InputCategory) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectCategory }) => {
  const FEATS: Array<{
    id: InputCategory;
    title: string;
    sub: string;
    bg: string;
    color: string;
    iconSvg: React.ReactNode;
  }> = [
    {
      id: 'message',
      title: 'Message',
      sub: 'Check text/SMS',
      bg: 'var(--accent-soft)',
      color: 'var(--accent-d)',
      iconSvg: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      id: 'link',
      title: 'Link',
      sub: 'Analyze URL',
      bg: 'var(--ink)',
      color: '#fff',
      iconSvg: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
    },
    {
      id: 'qr',
      title: 'QR Code',
      sub: 'Scan & verify',
      bg: 'var(--ink)',
      color: '#fff',
      iconSvg: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3v3h-3zM20 14h1M14 20h1M20 20h1" />
        </svg>
      ),
    },
    {
      id: 'job',
      title: 'Job Offer',
      sub: 'Check job posting',
      bg: 'var(--ink)',
      color: '#fff',
      iconSvg: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      id: 'trading',
      title: 'Trading Message',
      sub: 'Investment / Trading',
      bg: 'var(--ink)',
      color: '#fff',
      iconSvg: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 7l-8.5 8.5-5-5L2 17" />
          <path d="M16 7h6v6" />
        </svg>
      ),
    },
    {
      id: 'image',
      title: 'Screenshot',
      sub: 'Scan image/OCR',
      bg: 'var(--ink)',
      color: '#fff',
      iconSvg: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      ),
    },
  ];

  return (
    <section className="page active" id="page-home">
      <p className="greet">Welcome 👋</p>
      <p className="sub" style={{ margin: '4px 0 20px' }}>
        What do you want to check today?
      </p>

      <div className="promo" id="promo-banner" onClick={() => onSelectCategory('message')}>
        <div className="pi">
          <svg width="30" height="30" viewBox="0 0 48 48" fill="none">
            <path
              d="M24 4 8 10v12c0 10.5 6.8 18.6 16 22 9.2-3.4 16-11.5 16-22V10L24 4z"
              fill="#fff"
            />
            <path
              d="M17 24.5l5 5 9.5-10"
              stroke="#3FA33A"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <div className="pt">PURGE</div>
          <div className="ps">Scan. Analyze. Stay Safe.</div>
        </div>
        <span className="spacer"></span>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#8B948D"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>

      <div className="sec">Choose an option</div>
      <div className="grid6" id="featGrid">
        {FEATS.map((f) => (
          <div
            key={f.id}
            className="feat"
            id={`feat-card-${f.id}`}
            onClick={() => onSelectCategory(f.id)}
          >
            <div className="fi" style={{ background: f.bg, color: f.color }}>
              {f.iconSvg}
            </div>
            <div className="ft">{f.title}</div>
            <div className="fs">{f.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
};
