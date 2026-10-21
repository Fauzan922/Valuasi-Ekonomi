import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      <div className="empty-body">{children}</div>
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}
