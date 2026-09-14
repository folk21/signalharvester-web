import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { SourcesPage } from './features/sources/SourcesPage';
import { MonitoringProfilesPage } from './features/profiles/MonitoringProfilesPage';
import { CollectionRunsPage } from './features/runs/CollectionRunsPage';
import { AnalysisItemsPage } from './features/analysis/AnalysisItemsPage';
import { ResultsPage } from './features/results/ResultsPage';
import { EventExplorerPage } from './features/events/EventExplorerPage';

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
