import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { seedDatabase } from './services/db';
import { useThemeStore } from './store/themeStore';

import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import StudentProfilePage from './pages/StudentProfilePage';
import StudentPrintPage from './pages/StudentPrintPage';
import IncidentsPage from './pages/IncidentsPage';
import IncidentsPrintPage from './pages/IncidentsPrintPage';
import { Toaster } from 'sonner';

function App() {
  useEffect(() => {
    // Seed database on app load
    seedDatabase().catch(console.error);
    // Initialize theme
    useThemeStore.getState();
  }, []);

  return (
    <>
      <Toaster position="top-center" />
      <HashRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="students/:id" element={<StudentProfilePage />} />
            <Route path="incidents" element={<IncidentsPage />} />
          </Route>
          <Route path="/students/:id/print" element={<StudentPrintPage />} />
          <Route path="/incidents/print" element={<IncidentsPrintPage />} />
        </Routes>
      </HashRouter>
    </>
  );
}

export default App;
