'use client';

import React from 'react';

interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'cyan' | 'emerald' | 'amber' | 'danger';
  className?: string;
}

export default function GlowButton({
  children,
  variant = 'cyan',
  className = '',
  disabled,
  ...props
}: GlowButtonProps) {
  const variantStyles = {
    cyan: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40 hover:bg-cyan-500/30 hover:border-cyan-400 shadow-[0_0_15px_rgba(0,212,255,0.25)] hover:shadow-[0_0_20px_rgba(0,212,255,0.4)]',
    emerald: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 hover:bg-emerald-500/30 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]',
    amber: 'bg-amber-500/20 text-amber-200 border-amber-500/40 hover:bg-amber-500/30 hover:border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]',
    danger: 'bg-red-500/20 text-red-200 border-red-500/40 hover:bg-red-500/30 hover:border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.25)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]',
  };

  return (
    <button
      disabled={disabled}
      className={`relative inline-flex items-center justify-center gap-2 font-mono font-bold text-xs rounded-xl px-4 py-2.5 border transition-all duration-300 backdrop-blur-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {/* Shimmer Overlay Highlight */}
      <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
      {children}
    </button>
  );
}
