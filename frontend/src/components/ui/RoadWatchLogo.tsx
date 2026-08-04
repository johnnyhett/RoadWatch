'use client';

import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export default function RoadWatchLogo({ size = 32, className = '' }: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="filter drop-shadow-[0_0_10px_rgba(0,212,255,0.4)]"
      >
        <defs>
          <linearGradient id="shieldGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00d4ff" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          <linearGradient id="roadGrad" x1="24" y1="12" x2="24" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          <radialGradient id="glowGlow" cx="24" cy="24" r="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Glow Disk */}
        <circle cx="24" cy="24" r="22" fill="url(#glowGlow)" />

        {/* Geometric Shield Polygon Outer Frame */}
        <path
          d="M24 4L40 10V22C40 32.5 33.2 41.8 24 45C14.8 41.8 8 32.5 8 22V10L24 4Z"
          fill="#0b0f19"
          fillOpacity="0.85"
          stroke="url(#shieldGrad)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Converging Arterial Highway Lanes */}
        <path
          d="M17 38L22 16H26L31 38"
          stroke="url(#roadGrad)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Dashed Center Road Stripe */}
        <line
          x1="24"
          y1="18"
          x2="24"
          y2="36"
          stroke="#00d4ff"
          strokeWidth="2"
          strokeDasharray="2 3"
          strokeLinecap="round"
        />

        {/* Radar Pulse Center Node */}
        <circle cx="24" cy="20" r="3" fill="#ef4444" className="animate-pulse" />
        <circle cx="24" cy="20" r="1.2" fill="#ffffff" />
      </svg>
    </div>
  );
}
