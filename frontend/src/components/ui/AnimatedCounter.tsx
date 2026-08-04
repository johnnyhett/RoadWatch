'use client';

import { useAnimatedValue } from '@/hooks/useAnimatedValue';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  format?: (val: number) => string;
  className?: string;
}

export default function AnimatedCounter({ value, duration = 1500, format = (v) => v.toString(), className = '' }: AnimatedCounterProps) {
  const animatedValue = useAnimatedValue(value, duration);

  return <span className={className}>{format(animatedValue)}</span>;
}
