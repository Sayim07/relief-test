'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { ParticleCard } from '../MagicBento';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  children?: ReactNode;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  className = '',
  children,
}: MetricCardProps) {
  // Using ParticleCard styles
  const cardStyle = {
    backgroundColor: '#060010', // MagicBento dark background
    borderColor: '#392e4e',
    color: 'white',
    // These css variables are needed for the glow effect if not provided by a parent wrapper,
    // but ParticleCard usually manages them or expects them in a context.
    // However, ParticleCard isolates its particle logic. The glow effect needs GlobalSpotlight or local handling.
    // We will set them just in case.
    '--glow-x': '50%',
    '--glow-y': '50%',
    '--glow-intensity': '0',
    '--glow-radius': '200px',
  } as React.CSSProperties;

  return (
    <ParticleCard
      className={`
        flex flex-col justify-between relative 
        p-6 rounded-[20px] border border-solid font-light overflow-hidden 
        transition-all duration-300 ease-in-out 
        hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)]
        card 
        ${className}
      `}
      style={cardStyle}
      glowColor="132, 0, 255"
      enableTilt={true}
      particleCount={8}
      clickEffect={true}
    >
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-white">{value}</p>
            {trend && (
              <span className={`
                text-xs font-medium px-2 py-0.5 rounded-full
                ${trend.isPositive
                  ? 'bg-green-900/30 text-green-400'
                  : 'bg-red-900/30 text-red-400'
                }
              `}>
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className="p-3 bg-blue-600/10 rounded-lg border border-blue-500/20">
          <Icon className="w-6 h-6 text-blue-400" />
        </div>
      </div>
      {children && (
        <div className="mt-4 pt-4 border-t border-gray-800 relative z-10">
          {children}
        </div>
      )}
    </ParticleCard>
  );
}
