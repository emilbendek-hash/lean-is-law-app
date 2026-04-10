import { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface WidgetProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'high' | 'low';
}

export default function Widget({ title, subtitle, children, className, variant = 'default' }: WidgetProps) {
  return (
    <div
      className={cn(
        "p-6 rounded-[18px] border border-border-clinical/10 transition-all duration-300",
        variant === 'default' && "bg-card shadow-sm",
        variant === 'high' && "bg-accent-primary text-background",
        variant === 'low' && "bg-card/50 backdrop-blur-sm",
        className
      )}
    >
      {title && (
        <div className="mb-4">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-60 font-sans">
            {title}
          </p>
          {subtitle && (
            <p className="text-[11px] font-medium opacity-40 uppercase tracking-widest mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
