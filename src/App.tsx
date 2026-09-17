import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import {
  HomeRoute,
  RequireAuthentication,
  RequireRole,
  ResultsRoute,
} from './features/auth/AuthRoutes';
import { LoginPage } from './features/auth/LoginPage';

const DashboardPage = lazy(async () => {
  const module = await import('./features/dashboard/DashboardPage');
  return { default: module.DashboardPage };
});
const SourcesPage = lazy(async () => {
  const module = await import('./features/sources/SourcesPage');
  return { default: module.SourcesPage };
});
const MonitoringProfilesPage = lazy(async () => {
  const module = await import('./features/profiles/MonitoringProfilesPage');
  return { default: module.MonitoringProfilesPage };
});
const CollectionRunsPage = lazy(async () => {
  const module = await import('./features/runs/CollectionRunsPage');
  return { default: module.CollectionRunsPage };
});
const AnalysisItemsPage = lazy(async () => {
  const module = await import('./features/analysis/AnalysisItemsPage');
  return { default: module.AnalysisItemsPage };
});
const ResultsPage = lazy(async () => {
  const module = await import('./features/results/ResultsPage');
  return { default: module.ResultsPage };
});
const ViewerResultsPage = lazy(async () => {
  const module = await import('./features/results/ViewerResultsPage');
  return { default: module.ViewerResultsPage };
});
const EventExplorerPage = lazy(async () => {
  const module = await import('./features/events/EventExplorerPage');
  return { default: module.EventExplorerPage };
});
const ProcessingFlowPage = lazy(async () => {
  const module = await import('./features/flows/ProcessingFlowPage');
  return { default: module.ProcessingFlowPage };
});
const UserAdministrationPage = lazy(async () => {
  const module = await import('./features/users/UserAdministrationPage');
  return { default: module.UserAdministrationPage };
});

export function App() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<RequireAuthentication />}>
        <Route element={<AppShell />}>
          <Route index element={<HomeRoute adminHome={<DashboardPage />} />} />
          <Route path="sources" element={<RequireRole role="ADMIN"><SourcesPage /></RequireRole>} />
          <Route path="profiles" element={<RequireRole role="ADMIN"><MonitoringProfilesPage /></RequireRole>} />
          <Route path="runs" element={<RequireRole role="ADMIN"><CollectionRunsPage /></RequireRole>} />
          <Route path="analysis" element={<RequireRole role="ADMIN"><AnalysisItemsPage /></RequireRole>} />
          <Route
            path="results"
            element={<ResultsRoute operationalResults={<ResultsPage />} viewerResults={<ViewerResultsPage />} />}
          />
          <Route path="events" element={<RequireRole role="ADMIN"><EventExplorerPage /></RequireRole>} />
          <Route path="flows" element={<RequireRole role="ADMIN"><ProcessingFlowPage /></RequireRole>} />
          <Route path="users" element={<RequireRole role="ADMIN"><UserAdministrationPage /></RequireRole>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
