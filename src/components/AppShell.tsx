import { Suspense } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import type { UserRole } from '../api/types';
import { hasRole, useAuthSession } from '../features/auth/AuthSession';
import { LoadingState } from './AsyncState';
import { RouteErrorBoundary } from './RouteErrorBoundary';

const navigation: Array<{ to: string; label: string; end: boolean; role: UserRole }> = [
  { to: '/', label: 'Dashboard', end: true, role: 'ADMIN' },
  { to: '/sources', label: 'Sources', end: false, role: 'ADMIN' },
  { to: '/profiles', label: 'Monitoring Profiles', end: false, role: 'ADMIN' },
  { to: '/runs', label: 'Collection Runs', end: false, role: 'ADMIN' },
  { to: '/analysis', label: 'Analysis Items', end: false, role: 'ADMIN' },
  { to: '/results', label: 'Results', end: false, role: 'VIEWER' },
  { to: '/events', label: 'Event Explorer', end: false, role: 'ADMIN' },
  { to: '/flows', label: 'Processing Flow', end: false, role: 'ADMIN' },
];

export function AppShell() {
  const location = useLocation();
  const auth = useAuthSession();
  const principal = auth.principal;
  const visibleNavigation = navigation.filter((item) => hasRole(principal, item.role));
  const shellLabel = hasRole(principal, 'ADMIN') ? 'Operations' : hasRole(principal, 'VIEWER') ? 'Viewer' : 'Authenticated';

  async function logout() {
    auth.clearLogoutError();
    try {
      await auth.logout();
    } catch {
      // The mutation error is rendered in the sidebar.
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__mark">SH</div>
          <div>
            <strong>SignalHarvester</strong>
            <span>{shellLabel}</span>
          </div>
        </div>
        <nav className="navigation" aria-label="Main navigation">
          {visibleNavigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? 'navigation__item navigation__item--active' : 'navigation__item'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__footer">
          <div className="sidebar__identity">
            <strong>{principal?.username}</strong>
            <span>{principal?.roles.join(' · ') || 'authenticated'}</span>
          </div>
          {auth.logoutError ? (
            <span className="sidebar__auth-error" role="alert">
              {auth.logoutError instanceof Error ? auth.logoutError.message : 'Sign out failed.'}
            </span>
          ) : null}
          <button
            className="button button--ghost sidebar__logout"
            disabled={auth.logoutPending}
            type="button"
            onClick={() => void logout()}
          >
            {auth.logoutPending ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>
      <main className="content" id="main-content" tabIndex={-1}>
        <RouteErrorBoundary key={location.pathname}>
          <Suspense fallback={<LoadingState label="Loading screen…" />}>
            <Outlet />
          </Suspense>
        </RouteErrorBoundary>
      </main>
    </div>
  );
}
