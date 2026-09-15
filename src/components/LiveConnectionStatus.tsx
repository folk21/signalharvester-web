import type { LiveConnectionStatus as LiveConnectionStatusValue } from '../lib/use-live-list';

const labels: Record<LiveConnectionStatusValue, string> = {
  connecting: 'Connecting live updates',
  live: 'Live',
  reconnecting: 'Reconnecting',
  offline: 'Live updates unavailable',
};

export function LiveConnectionStatus({ status }: { status: LiveConnectionStatusValue }) {
  return <span className={`live-status live-status--${status}`} role="status" aria-live="polite" aria-atomic="true">{labels[status]}</span>;
}
