import { NavLink, Outlet } from 'react-router-dom';

const navigation = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/sources', label: 'Sources', end: false },
  { to: '/profiles', label: 'Monitoring Profiles', end: false },
  { to: '/runs', label: 'Collection Runs', end: false },
  { to: '/analysis', label: 'Analysis Items', end: false },
  { to: '/results', label: 'Results', end: false },
  { to: '/events', label: 'Event Explorer', end: false },
  { to: '/flows', label: 'Processing Flow', end: false },
];

export function AppShell() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__mark">SH</div>
          <div>
            <strong>SignalHarvester</strong>
            <span>Operations</span>
          </div>
        </div>
        <nav className="navigation" aria-label="Main navigation">
          {navigation.map((item) => (
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
          <span className="sidebar__status-dot" aria-hidden="true" />
          <span>No authentication</span>
        </div>
      </aside>
      <main className="content" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
