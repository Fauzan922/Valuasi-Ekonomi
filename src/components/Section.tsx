import type { ReactNode } from 'react';

interface SectionProps {
  id?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Section({ id, title, description, actions, children, className }: SectionProps) {
  return (
    <section id={id} tabIndex={id ? -1 : undefined} className={`section ${className ?? ''}`.trim()}>
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          {description ? <div className="section-description">{description}</div> : null}
        </div>
        {actions ? <div className="section-actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
