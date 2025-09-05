import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore, useAuthActions } from '../store/authStore';

export default function Login() {
  const user = useAuthStore(state => state.user);
  const { signIn, signUp } = useAuthActions();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    orgName: ''
  });

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          alert('Passwords do not match');
          setLoading(false);
          return;
        }
        await signUp(formData.email, formData.password, formData.orgName);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await signIn('demo@cognis.digital', 'demo123');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-text-heading mb-2">Welcome to Cognis Digital</h1>
          <p className="text-text-body">
            {isLogin ? 'Sign in to your AI workforce platform' : 'Create your account to get started'}
          </p>
        </div>

        {/* Demo Button */}
        <button
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-2xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 mb-6 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Try Demo Account
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-background-primary text-text-muted">or continue with email</span>
          </div>
        </div>

        {/* Form */}
        <div className="glass-panel p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-text-muted text-sm mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-subtle" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full input-field pl-10"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Organization Name (Sign Up Only) */}
            {!isLogin && (
              <div>
                <label className="block text-text-muted text-sm mb-2">Organization Name</label>
                <input
                  type="text"
                  value={formData.orgName}
                  onChange={(e) => setFormData(prev => ({ ...prev, orgName: e.target.value }))}
                  className="w-full input-field"
                  placeholder="Enter your organization name"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-text-muted text-sm mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-subtle" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full input-field pl-10 pr-12"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-subtle hover:text-text-muted transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign Up Only) */}
            {!isLogin && (
              <div>
                <label className="block text-text-muted text-sm mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-subtle" />
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full input-field pl-10"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full primary-button px-6 py-3 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  {isLogin ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center mt-6">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary-400 hover:text-primary-300 transition-colors text-sm"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/40 text-sm">
          <p className="text-text-subtle">Powered by Cognis Digital AI Technology</p>
        </div>
      </div>
    </div>
  );
}