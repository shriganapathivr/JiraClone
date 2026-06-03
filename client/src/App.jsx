import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/authStore.js';
import { useThemeStore } from './store/themeStore.js';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Projects from './pages/Projects.jsx';
import Board from './pages/Board.jsx';
import Backlog from './pages/Backlog.jsx';
import Sprints from './pages/Sprints.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ProjectSettings from './pages/ProjectSettings.jsx';

import AppLayout from './components/layout/AppLayout.jsx';
import Toaster from './components/ui/Toaster.jsx';
import Spinner from './components/ui/Spinner.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner size={32} />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function PublicOnly({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return null;
  return user ? <Navigate to="/projects" replace /> : children;
}

export default function App() {
  const initAuth = useAuthStore((s) => s.init);
  const initTheme = useThemeStore((s) => s.initTheme);
  const location = useLocation();

  useEffect(() => {
    initTheme();
    initAuth();
  }, [initAuth, initTheme]);

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId/board" element={<Board />} />
            <Route path="/projects/:projectId/backlog" element={<Backlog />} />
            <Route path="/projects/:projectId/sprints" element={<Sprints />} />
            <Route path="/projects/:projectId/dashboard" element={<Dashboard />} />
            <Route path="/projects/:projectId/settings" element={<ProjectSettings />} />
          </Route>

          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </AnimatePresence>
      <Toaster />
    </>
  );
}
