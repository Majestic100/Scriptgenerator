import React from 'react';

/**
 * Små inline SVG-flag til sprogvælgeren.
 * SVG frem for emoji, så de ser ens ud på alle styresystemer (Windows viser ikke emoji-flag).
 */

const flagCls = 'w-[18px] h-[13px] rounded-[2px] shrink-0 ring-1 ring-ink/15';

/** Dannebrog */
export const FlagDK: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 37 28" className={`${flagCls} ${className}`} aria-hidden="true" focusable="false">
    <rect width="37" height="28" fill="#C8102E" />
    <rect x="12" width="4" height="28" fill="#fff" />
    <rect y="12" width="37" height="4" fill="#fff" />
  </svg>
);

/** Union Jack (forenklet) */
export const FlagGB: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 60 30" className={`${flagCls} ${className}`} aria-hidden="true" focusable="false">
    <clipPath id="gb-clip">
      <rect width="60" height="30" />
    </clipPath>
    <g clipPath="url(#gb-clip)">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="3" />
      <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
    </g>
  </svg>
);
