'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlowButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'danger' | 'warning' | 'success';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export default function GlowButton({ 
  children, 
  variant = 'primary', 
  className = '', 
  onClick,
  disabled,
  type = 'button',
}: GlowButtonProps) {
  const variants = {
    primary: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,212,255,0.4)]',
    danger: 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30 hover:shadow-[0_0_20px_rgba(255,107,107,0.4)]',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]',
    success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`px-6 py-2 border rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </motion.button>
  );
}
