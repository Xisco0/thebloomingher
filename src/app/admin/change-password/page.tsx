'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Info,
  LogOut,
} from 'lucide-react';

import { SignOutConfirmModal } from '@/components/admin/SignOutConfirmModal';

export default function AdminChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [adminUser, setAdminUser] = useState<{ full_name?: string; email?: string; role_name?: string; must_change_password?: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/auth/admin/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.admin) {
          setAdminUser(data.admin);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/admin/logout', { method: 'POST' });
      setShowSignOutModal(false);
      router.push('/admin/login');
      router.refresh();
    } catch {} finally {
      setLoggingOut(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('Your new password cannot be the same as your current temporary password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update password.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating your password.');
    } finally {
      setLoading(false);
    }
  };

  const hasLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
  const isStrong = hasLength && hasLetter && hasNumber;

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Container Card */}
      <div className="w-full max-w-md bg-surface border border-border rounded-3xl shadow-elevated p-8 sm:p-10 relative overflow-hidden">
        {/* Top Glow Accent */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-brand/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-brand-accent/10 rounded-full blur-2xl pointer-events-none" />

        {/* Logo & Header */}
        <div className="text-center mb-8 relative">
          <div className="relative w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden border-2 border-brand/20 shadow-md">
            <Image
              src="/images/logo.jpg"
              alt="TheBloomingHer Logo"
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Security Verification</span>
          </div>

          <h1 className="font-display font-bold text-2xl text-text-main">
            Update Your Password
          </h1>
          <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
            {adminUser?.must_change_password
              ? 'Welcome to TheBloomingHer! For your security, you must set a new confidential password before accessing the admin dashboard.'
              : 'Set a new secure password for your administrator account.'}
          </p>

          {adminUser && (
            <div className="mt-4 p-3 bg-surface-muted border border-border rounded-2xl flex items-center justify-between text-left">
              <div>
                <p className="text-xs font-bold text-text-main">{adminUser.full_name || 'Admin User'}</p>
                <p className="text-[11px] text-text-muted">{adminUser.email}</p>
              </div>
              <span className="px-2.5 py-1 bg-brand-light text-brand text-[10px] font-bold rounded-lg uppercase tracking-wider">
                {adminUser.role_name || 'Admin'}
              </span>
            </div>
          )}
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="font-semibold">Password updated successfully! Redirecting to dashboard...</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-text-main mb-1.5">
              Current / Temporary Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Enter temporary password"
                required
                className="w-full pl-10 pr-10 py-3 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all placeholder:text-text-muted/60"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text-main"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-text-main mb-1.5">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                className="w-full pl-10 pr-10 py-3 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all placeholder:text-text-muted/60"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text-main"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Criteria indicators */}
            {newPassword && (
              <div className="mt-2.5 p-3 bg-surface-muted border border-border/70 rounded-xl space-y-1.5">
                <p className="text-[11px] font-bold text-text-main mb-1">Password Requirements:</p>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <span className={`flex items-center gap-1.5 ${hasLength ? 'text-emerald-700 font-semibold' : 'text-text-muted'}`}>
                    <CheckCircle2 className={`w-3 h-3 ${hasLength ? 'text-emerald-600' : 'text-text-muted/50'}`} />
                    8+ Characters
                  </span>
                  <span className={`flex items-center gap-1.5 ${hasLetter ? 'text-emerald-700 font-semibold' : 'text-text-muted'}`}>
                    <CheckCircle2 className={`w-3 h-3 ${hasLetter ? 'text-emerald-600' : 'text-text-muted/50'}`} />
                    Letters
                  </span>
                  <span className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-semibold' : 'text-text-muted'}`}>
                    <CheckCircle2 className={`w-3 h-3 ${hasNumber ? 'text-emerald-600' : 'text-text-muted/50'}`} />
                    Numbers
                  </span>
                  <span className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700 font-semibold' : 'text-text-muted'}`}>
                    <CheckCircle2 className={`w-3 h-3 ${hasSpecial ? 'text-emerald-600' : 'text-text-muted/50'}`} />
                    Special Symbol
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-bold text-text-main mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="w-full pl-10 pr-10 py-3 bg-surface border border-border rounded-xl text-xs text-text-main focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all placeholder:text-text-muted/60"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text-main"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[11px] text-rose-600 font-medium mt-1">Passwords do not match.</p>
            )}
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading || success || !isStrong || newPassword !== confirmPassword}
            className="w-full mt-2 py-3.5 px-4 bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Save Password & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Logout Option */}
        <div className="mt-8 pt-5 border-t border-border flex items-center justify-between text-xs text-text-muted">
          <span>Need help logging in?</span>
          <button
            type="button"
            onClick={() => setShowSignOutModal(true)}
            className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Sign Out Confirmation Modal */}
      <SignOutConfirmModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleLogout}
        loading={loggingOut}
        adminEmail={adminUser?.email}
        adminName={adminUser?.full_name}
      />
    </div>
  );
}
