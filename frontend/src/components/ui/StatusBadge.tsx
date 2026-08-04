'use client';

interface StatusBadgeProps {
  status: 'fatal' | 'serious' | 'slight' | 'damage';
  label?: string;
  className?: string;
}

export default function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const styles = {
    fatal: 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(255,107,107,0.3)]',
    serious: 'bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.3)]',
    slight: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.3)]',
    damage: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-bold rounded-md border uppercase tracking-wider ${styles[status]} ${className}`}>
      {label || status}
    </span>
  );
}
