import React from 'react';

interface HeaderProps {
  onGoHome: () => void;
  showLiveTag?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onGoHome }) => {
  return (
    <header className="topbar" id="app-topbar">
      <div className="brand" id="brand-logo" onClick={onGoHome}>
        <svg viewBox="0 0 48 48" fill="none">
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
        <b>PURGE</b>
      </div>
      <span className="spacer"></span>
    </header>
  );
};
