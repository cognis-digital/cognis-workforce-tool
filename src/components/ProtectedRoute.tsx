import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser, useAuthLoading } from '../store/authStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user = useUser();
  const loading = useAuthLoading();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
          <span className="text-text-heading">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}