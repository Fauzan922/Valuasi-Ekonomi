import { HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AppStateProvider } from './state/AppState';
import { OverviewPage } from './pages/OverviewPage';
import { IdentificationPage } from './pages/IdentificationPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ReferencePage } from './pages/ReferencePage';
import { MethodologyPage } from './pages/MethodologyPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <HashRouter>
      <AppStateProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<OverviewPage />} />
            <Route path="identifikasi" element={<IdentificationPage />} />
            <Route path="kalkulator" element={<CalculatorPage />} />
            <Route path="analisis" element={<AnalysisPage />} />
            <Route path="referensi" element={<ReferencePage />} />
            <Route path="metodologi" element={<MethodologyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AppStateProvider>
    </HashRouter>
  );
}
