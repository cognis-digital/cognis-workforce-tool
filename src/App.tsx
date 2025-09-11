import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletProvider } from './contexts/WalletContext';
import { rbacLoggingService, initializeRBACLoggingSchema, InteractionType } from './services/rbacLogging';
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

// AppContent class component to eliminate hook usage
class AppContent extends React.Component {
  state = {
    useArchitecturalDesign: true
  };

  componentDidMount() {
    // Initialize any data or tracking here
    this.trackPageView();
    this.trackComponentMount();
  }

  trackPageView() {
    // Track page view logic using available methods
    const path = window.location.pathname;
    
    // Use the proper InteractionType
    rbacLoggingService.log({
      interaction_type: InteractionType.PAGE_VIEW,
      component: 'AppContent',
      action: 'view',
      page: path
    });
  }

  trackComponentMount() {
    // Track component mounting as a button click event type
    rbacLoggingService.log({
      interaction_type: InteractionType.BUTTON_CLICK, // Use an existing type
      component: 'AppContent',
      action: 'mount',
      target: 'AppContentComponent'
    });
  }

  render() {
    const { useArchitecturalDesign } = this.state;
    
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
}

// Convert App to class component to avoid useState errors in production build
class App extends React.Component {
  componentDidMount() {
    // Initialize RBAC logging schema
    initializeRBACLoggingSchema();
    console.log('RBAC Logging System Initialized');
  }

  componentWillUnmount() {
    // Clean up logging on unmount
    rbacLoggingService.flush();
  }

  render() {
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
}

export default App;