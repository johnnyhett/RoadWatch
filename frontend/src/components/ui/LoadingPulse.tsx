'use client';

export default function LoadingPulse({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-white/[0.02] border border-white/[0.05] rounded-xl ${className}`}>
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent animate-[shimmer_1.5s_infinite]" />
    </div>
  );
}
