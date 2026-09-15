import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';

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
const EventExplorerPage = lazy(async () => {
  const module = await import('./features/events/EventExplorerPage');
  return { default: module.EventExplorerPage };
});
const ProcessingFlowPage = lazy(async () => {
  const module = await import('./features/flows/ProcessingFlowPage');
  return { default: module.ProcessingFlowPage };
});

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="sources" element={<SourcesPage />} />
        <Route path="profiles" element={<MonitoringProfilesPage />} />
        <Route path="runs" element={<CollectionRunsPage />} />
        <Route path="analysis" element={<AnalysisItemsPage />} />
        <Route path="results" element={<ResultsPage />} />
        <Route path="events" element={<EventExplorerPage />} />
        <Route path="flows" element={<ProcessingFlowPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
