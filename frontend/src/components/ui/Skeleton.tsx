import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export default function Skeleton({ className = '', width, height, borderRadius }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse ${className}`}
      style={{
        background: 'linear-gradient(90deg, var(--card-border) 25%, var(--surface-color) 37%, var(--card-border) 63%)',
        backgroundSize: '400% 100%',
        animation: 'pulse 1.5s ease-in-out infinite',
        width: width || '100%',
        height: height || '1rem',
        borderRadius: borderRadius || 'var(--border-radius-sm)',
        display: 'inline-block'
      }}
    />
  );
}
