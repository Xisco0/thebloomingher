'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
      }

      // Success -> navigate to admin dashboard
      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted/60 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8 bg-surface p-8 sm:p-10 rounded-3xl border border-border shadow-elevated">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-brand/20 shadow-sm mx-auto">
            <Image
              src="/images/logo.jpg"
              alt="TheBloomingHer Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-text-main">
              Admin Portal
            </h1>
            <p className="text-xs text-text-muted mt-1">
              TheBloomingHer Care & Wellness Management System
            </p>
          </div>
        </div>

        {/* Contextual Reason Notification */}
        {searchParams.get('reason') === 'idle_timeout' && (
          <div className="p-3.5 bg-amber-50 text-amber-900 text-xs rounded-xl border border-amber-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>Your session expired due to 30 minutes of inactivity. Please log in again.</span>
          </div>
        )}

        {searchParams.get('reason') === 'session_expired' && (
          <div className="p-3.5 bg-amber-50 text-amber-900 text-xs rounded-xl border border-amber-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span>Your 8-hour maximum session lifetime has ended. Please log in again.</span>
          </div>
        )}

        {searchParams.get('reason') === 'user_logout' && (
          <div className="p-3.5 bg-blue-50 text-blue-900 text-xs rounded-xl border border-blue-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-blue-600" />
            <span>You have been securely logged out.</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-text-main uppercase tracking-wider mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@email.com"
                className="w-full pl-10 pr-4 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main placeholder:text-text-muted focus:outline-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-main uppercase tracking-wider mb-1.5">
              Master Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main placeholder:text-text-muted focus:outline-brand"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Admin...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-border text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted Session • Rate-Limited Access</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
