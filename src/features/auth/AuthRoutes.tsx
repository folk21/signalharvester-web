import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { UserRole } from '../../api/types';
import { ErrorState, LoadingState } from '../../components/AsyncState';
import { PageHeader } from '../../components/PageHeader';
import {
  canOpenOperationalResults,
  hasRole,
  useAuthSession,
} from './AuthSession';

export function RequireAuthentication() {
  const auth = useAuthSession();
  const location = useLocation();

  if (auth.status === 'loading') {
    return <main className="auth-page"><LoadingState label="Checking authentication…" /></main>;
  }

  if (auth.status === 'error') {
    return (
      <main className="auth-page">
        <ErrorState
          error={auth.error}
          action={<button className="button button--ghost" type="button" onClick={() => void auth.refresh()}>Retry</button>}
        />
      </main>
    );
  }

  if (!auth.principal) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  return <Outlet />;
}

export function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const { principal } = useAuthSession();
  if (!hasRole(principal, role)) {
    return <AccessDenied requiredRole={role} />;
  }
  return children;
}

export function HomeRoute({ adminHome }: { adminHome: ReactNode }) {
  const { principal } = useAuthSession();

  if (hasRole(principal, 'ADMIN')) {
    return adminHome;
  }
  if (hasRole(principal, 'VIEWER')) {
    return <Navigate to="/results" replace />;
  }
  return <NoBrowserCapability />;
}

export function ResultsRoute({
  operationalResults,
  viewerResults,
}: {
  operationalResults: ReactNode;
  viewerResults: ReactNode;
}) {
  const { principal } = useAuthSession();

  if (!hasRole(principal, 'VIEWER')) {
    return <AccessDenied requiredRole="VIEWER" />;
  }
  if (!canOpenOperationalResults(principal)) {
    return viewerResults;
  }
  return operationalResults;
}

export function AccessDenied({ requiredRole }: { requiredRole: UserRole }) {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Authorization"
        title="Access denied"
        description={`This screen requires the explicit ${requiredRole} role. Frontend routing does not replace backend authorization.`}
      />
      <section className="state-card state-card--error" role="alert">
        Your authenticated identity does not have access to this browser capability.
      </section>
    </div>
  );
}

function NoBrowserCapability() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Authorization"
        title="No browser capability assigned"
        description="The identity is authenticated, but its explicit roles do not grant an implemented browser workflow."
      />
    </div>
  );
}

