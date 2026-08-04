'use client';

import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverEffect?: boolean;
}

export default function GlassCard({ children, className = '', hoverEffect = false, ...props }: GlassCardProps) {
  const baseClasses = 'bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl';
  const hoverClasses = hoverEffect ? 'hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,212,255,0.15)]' : '';
  
  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`} {...props}>
      {children}
    </div>
  );
}
