import type { ReactNode } from 'react';

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return <div className="state-card state-card--loading">{label}</div>;
}

export function ErrorState({ error, action }: { error: unknown; action?: ReactNode }) {
  const message = error instanceof Error ? error.message : 'Unexpected request failure.';
  return (
    <div className="state-card state-card--error">
      <strong>Request failed</strong>
      <span>{message}</span>
      {action}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="state-card">{children}</div>;
}
