import type { ReactNode } from 'react';

type AlertTone = 'info' | 'warning' | 'error' | 'success';

interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
}

export function Alert({ tone = 'info', title, children }: AlertProps) {
  return (
    <div className={`alert alert-${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      {title ? <p className="alert-title">{title}</p> : null}
      <div className="alert-body">{children}</div>
    </div>
  );
}
