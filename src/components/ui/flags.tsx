import React from 'react';

/**
 * Små inline SVG-flag til sprogvælgeren.
 * SVG frem for emoji, så de ser ens ud på alle styresystemer (Windows viser ikke emoji-flag).
 *
 * Begge flag tegnes på det samme lærred (36x26), så de fylder lige meget i
 * sprogvælgeren. De rigtige flag har hver sit forhold - Dannebrog 37:28 og
 * Union Jack 2:1 - så i stedet for at klemme dem skævt ind er korsenes bredder
 * regnet ud fra HØJDEN, og den overskydende bredde lægges i den yderste bane.
 * Det er samme fremgangsmåde som i rigtige flag-ikonsæt.
 */

const flagCls = 'w-[18px] h-[13px] rounded-[2px] shrink-0 ring-1 ring-ink/15';

/** Dannebrog. Korsbanen er 4/28 af højden, og korset sidder 12/28 fra top og venstre. */
export const FlagDK: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 36 26" className={`${flagCls} ${className}`} aria-hidden="true" focusable="false">
    <rect width="36" height="26" fill="#C8102E" />
    <rect x="11.14" width="3.72" height="26" fill="#fff" />
    <rect y="11.14" width="36" height="3.72" fill="#fff" />
  </svg>
);

/**
 * Union Jack. De røde skrå kors er FORSKUDT i forhold til de hvide (counterchange),
 * ikke centreret oven i dem: det er netop forskydningen, der gør flaget genkendeligt.
 * Forskydningen laves med en clip-path af fire halve kvadranter.
 */
export const FlagGB: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 36 26" className={`${flagCls} ${className}`} aria-hidden="true" focusable="false">
    <clipPath id="uj-frame">
      <rect width="36" height="26" />
    </clipPath>
    {/* Fire halve kvadranter, roteret om midten: giver de røde skråkors deres forskydning */}
    <clipPath id="uj-counterchange">
      <path d="M18,13 h18 v13 z v13 h-18 z h-18 v-13 z v-13 h18 z" />
    </clipPath>
    <g clipPath="url(#uj-frame)">
      <rect width="36" height="26" fill="#012169" />
      {/* Skt. Andreas-korset: hvidt, hele bredden */}
      <path d="M0,0 L36,26 M36,0 L0,26" stroke="#fff" strokeWidth="5.2" />
      {/* Skt. Patricks-korset: rødt og forskudt */}
      <path
        d="M0,0 L36,26 M36,0 L0,26"
        stroke="#C8102E"
        strokeWidth="3.47"
        clipPath="url(#uj-counterchange)"
      />
      {/* Skt. Georgs-korset: rødt med hvid kant */}
      <path d="M18,0 V26 M0,13 H36" stroke="#fff" strokeWidth="8.67" />
      <path d="M18,0 V26 M0,13 H36" stroke="#C8102E" strokeWidth="5.2" />
    </g>
  </svg>
);
