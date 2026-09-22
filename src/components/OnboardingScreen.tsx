import React from 'react';

interface OnboardingScreenProps {
  onStart: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onStart }) => {
  return (
    <section className="page active" id="page-onboarding">
      <div className="onb">
        <div className="logo-big" id="onb-logo">
          <svg width="76" height="76" viewBox="0 0 48 48" fill="none">
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
        <h1>
          PURGE
        </h1>
        <p className="tagline">Check before you trust.</p>

        <svg className="illu" viewBox="0 0 440 250" fill="none" id="onb-illu">
          <circle cx="220" cy="132" r="96" fill="#E2F0E6" />
          <g>
            <circle cx="118" cy="62" r="26" fill="#fff" stroke="#1C1F1C" strokeWidth="2.5" />
            <path
              d="M108 62h20M118 52l-10 10 10 10M128 52l10 10-10 10"
              stroke="#63C74D"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <g>
            <rect
              x="288"
              y="36"
              width="50"
              height="50"
              rx="12"
              fill="#fff"
              stroke="#1C1F1C"
              strokeWidth="2.5"
            />
            <rect x="298" y="46" width="12" height="12" fill="#1C1F1C" />
            <rect x="317" y="46" width="12" height="12" fill="#1C1F1C" />
            <rect x="298" y="65" width="12" height="12" fill="#1C1F1C" />
            <rect x="317" y="65" width="5" height="5" fill="#1C1F1C" />
            <rect x="324" y="72" width="5" height="5" fill="#1C1F1C" />
          </g>
          <g>
            <circle cx="366" cy="118" r="24" fill="#fff" stroke="#1C1F1C" strokeWidth="2.5" />
            <path
              d="M366 104l13 22h-26z"
              fill="#FCEBEA"
              stroke="#E5453C"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M366 114v6M366 124h.01"
              stroke="#E5453C"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </g>
          <g>
            <circle cx="74" cy="128" r="21" fill="#fff" stroke="#1C1F1C" strokeWidth="2.5" />
            <path
              d="M64 121h20M64 128h15M64 135h11"
              stroke="#8B948D"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </g>
          <rect x="172" y="70" width="96" height="140" rx="18" fill="#1C1F1C" />
          <rect x="180" y="80" width="80" height="120" rx="11" fill="#fff" />
          <rect x="189" y="90" width="44" height="7" rx="3.5" fill="#DDEAE1" />
          <rect x="189" y="104" width="62" height="7" rx="3.5" fill="#DDEAE1" />
          <rect x="189" y="118" width="36" height="7" rx="3.5" fill="#F6D4D2" />
          <rect x="189" y="136" width="62" height="18" rx="9" fill="#E4F6DD" />
          <path
            d="M197 145l3.5 3.5 6.5-7"
            stroke="#3FA33A"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="215" y="141" width="30" height="8" rx="4" fill="#BFE6B2" />
          <circle cx="252" cy="70" r="17" fill="#63C74D" />
          <path
            d="M245 70l5 5 9-9.5"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M74 88 60 74M366 152l12 12M220 226v14M120 202l-12 12M322 204l12 12"
            stroke="#63C74D"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>

        <div className="pills">
          <span className="pill">🛡 Scam detection</span>
          <span className="pill">🔗 Link analysis</span>
          <span className="pill">▦ QR verification</span>
          <span className="pill">✦ AI-powered</span>
        </div>

        <button className="btn green" id="onb-get-started" onClick={onStart}>
          Get Started
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </section>
  );
};
