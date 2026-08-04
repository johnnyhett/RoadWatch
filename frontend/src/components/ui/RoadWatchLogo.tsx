'use client';

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Custom bespoke logo mark for RoadWatch.
 * Features an overlapping geometric highway vector converging into a safety shield node.
 */
export default function RoadWatchLogo({ className = '', size = 32 }: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="rwShieldGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="rwRoadGrad" x1="22" y1="12" x2="22" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <filter id="rwGlowEffect" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Shield Boundary */}
        <path
          d="M22 3L37 10V22C37 31 29.5 37.5 22 41C14.5 37.5 7 31 7 22V10L22 3Z"
          fill="rgba(0, 212, 255, 0.08)"
          stroke="url(#rwShieldGrad)"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Converging Curved Road Lanes */}
        <path
          d="M13 32C17 24 20 18 22 14C24 18 27 24 31 32"
          stroke="url(#rwRoadGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Lane Center Dashes */}
        <path
          d="M22 32V20"
          stroke="#ffffff"
          strokeWidth="2"
          strokeDasharray="2.5 2.5"
          strokeLinecap="round"
        />

        {/* Central Safety Radar Node */}
        <circle
          cx="22"
          cy="14"
          r="4"
          fill="#00d4ff"
          filter="url(#rwGlowEffect)"
        />
        <circle
          cx="22"
          cy="14"
          r="1.8"
          fill="#ffffff"
        />
      </svg>
    </div>
  );
}
