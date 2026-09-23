import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { seedDatabase } from './services/db';
import { useThemeStore } from './store/themeStore';

import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import StudentProfilePage from './pages/StudentProfilePage';
import StudentPrintPage from './pages/StudentPrintPage';
import IncidentsPage from './pages/IncidentsPage';
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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="students/:id" element={<StudentProfilePage />} />
            <Route path="incidents" element={<IncidentsPage />} />
          </Route>
          <Route path="/students/:id/print" element={<StudentPrintPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
