import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
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
import ImageGenerator from './pages/ImageGenerator';
import Pricing from './pages/Pricing';
import SubscriptionAnalytics from './pages/SubscriptionAnalytics';
import UsageDashboard from './pages/UsageDashboard';
import SubscriptionManagement from './pages/SubscriptionManagement';
import AdminSubscriptionDashboard from './pages/AdminSubscriptionDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ArchitecturalLayout from './components/ArchitecturalLayout';
import { Toaster } from './components/ui/Toaster';
import ErrorBoundary from './components/ErrorBoundary';

const queryClient = new QueryClient();

function AppContent() {
  useInitializeApp();
  const [useArchitecturalDesign, setUseArchitecturalDesign] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-primary">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            {useArchitecturalDesign ? <ArchitecturalLayout /> : <Layout />}
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="tasks" element={<TaskCenter />} />
          <Route path="job-roles" element={<JobRoles />} />
          <Route path="knowledge" element={<KnowledgeStack />} />
          <Route path="agents" element={<AgentBuilder />} />
          <Route path="leads" element={<LeadGeneration />} />
          <Route path="image-generator" element={<ImageGenerator />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="subscription-analytics" element={<SubscriptionAnalytics />} />
          <Route path="usage" element={<UsageDashboard />} />
          <Route path="subscription" element={<SubscriptionManagement />} />
          <Route path="admin-subscription" element={<AdminSubscriptionDashboard />} />
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
          <Router basename="/">
            <AppContent />
          </Router>
        </WalletProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;