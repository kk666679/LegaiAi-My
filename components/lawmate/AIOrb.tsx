'use client';
import * as React from 'react';

export interface AIOrbProps {
  size?: number;
  className?: string;
}

export function AIOrb({ size = 48, className = '' }: AIOrbProps) {
  return (
    <div
      className={`rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

export default AIOrb;
