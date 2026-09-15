interface StatusBadgeProps {
  value: string;
}

function statusTone(value: string): string {
  const normalized = value.toUpperCase();
  if (
    normalized.includes('SUCCEEDED')
    || normalized === 'PUBLISHED'
    || normalized === 'ENABLED'
    || normalized === 'COMPLETED'
    || normalized === 'PASSED'
    || normalized === 'REACHED'
    || normalized === 'TERMINAL_EVENT_REACHED'
  ) {
    return 'status-badge status-badge--success';
  }
  if (normalized.includes('PARTIAL') || normalized === 'UNKNOWN' || normalized === 'SKIPPED' || normalized === 'IN_PROGRESS') {
    return 'status-badge status-badge--warning';
  }
  if (normalized.includes('FAILED') || normalized.includes('REJECTED') || normalized === 'DISABLED') {
    return 'status-badge status-badge--danger';
  }
  return 'status-badge';
}

export function StatusBadge({ value }: StatusBadgeProps) {
  return <span className={statusTone(value)}>{value.replaceAll('_', ' ')}</span>;
}
