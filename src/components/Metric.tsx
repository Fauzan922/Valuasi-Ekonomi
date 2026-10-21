import type { ReactNode } from 'react';

interface MetricProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'accent' | 'muted';
}

export function Metric({ label, value, hint, tone = 'default' }: MetricProps) {
  return (
    <div className={`metric metric-${tone}`}>
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      {hint ? <p className="metric-hint">{hint}</p> : null}
    </div>
  );
}
