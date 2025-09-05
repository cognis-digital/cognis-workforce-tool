import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletProvider } from './contexts/WalletContext';
import { useInitializeApp } from './hooks/useInitializeApp';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import TaskCenter from './pages/TaskCenter';
import KnowledgeStack from './pages/KnowledgeStack';
import AgentBuilder from './pages/AgentBuilder';
import JobRoles from './pages/JobRoles';
import LeadGeneration from './pages/LeadGeneration';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Toaster } from './components/ui/Toaster';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient();

function AppContent() {
  useInitializeApp();

  return (
    <div className="min-h-screen bg-gradient-primary">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="tasks" element={<TaskCenter />} />
          <Route path="job-roles" element={<JobRoles />} />
          <Route path="knowledge" element={<KnowledgeStack />} />
          <Route path="agents" element={<AgentBuilder />} />
          <Route path="leads" element={<LeadGeneration />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <Router>
            <AppContent />
          </Router>
        </WalletProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;