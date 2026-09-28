'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Clock, LogOut, CheckCircle2 } from 'lucide-react';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 Minutes
const WARNING_THRESHOLD_MS = 27.5 * 60 * 1000; // Show warning 2.5 minutes before 30m
const SILENT_REFRESH_INTERVAL_MS = 10 * 60 * 1000; // Refresh server session every 10 min if active

export function AdminSessionGuard() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(150);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const lastServerRefreshRef = useRef<number>(Date.now());
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Broadcast authentication state to all other tabs
  const broadcast = useCallback((type: 'LOGOUT' | 'REFRESH' | 'ACTIVITY') => {
    try {
      if (channelRef.current) {
        channelRef.current.postMessage({ type, timestamp: Date.now() });
      }
      // Also update localStorage for browsers with BroadcastChannel constraints
      localStorage.setItem('tbh_admin_sync', JSON.stringify({ type, timestamp: Date.now() }));
    } catch (e) {}
  }, []);

  // Logout action
  const handleLogout = useCallback(
    async (reason = 'user_logout') => {
      broadcast('LOGOUT');
      try {
        await fetch('/api/auth/admin/logout', { method: 'POST' });
      } catch (e) {}
      router.push(`/admin/login?reason=${encodeURIComponent(reason)}`);
    },
    [broadcast, router]
  );

  // Refresh session action (Stay Logged In)
  const handleStayLoggedIn = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/auth/admin/refresh', { method: 'POST' });
      const data = await res.json();

      if (res.ok && data.success) {
        lastActivityRef.current = Date.now();
        lastServerRefreshRef.current = Date.now();
        setShowWarning(false);
        setSecondsRemaining(150);
        broadcast('REFRESH');
      } else {
        handleLogout('session_expired');
      }
    } catch (e) {
      handleLogout('network_error');
    } finally {
      setIsRefreshing(false);
    }
  }, [broadcast, handleLogout]);

  // Track user activity
  const recordActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    // If warning was showing and user interacts, or silent refresh interval passed
    if (now - lastServerRefreshRef.current > SILENT_REFRESH_INTERVAL_MS) {
      lastServerRefreshRef.current = now;
      fetch('/api/auth/admin/refresh', { method: 'POST' })
        .then(r => r.json())
        .then(d => {
          if (!d.success) {
            handleLogout('session_expired');
          }
        })
        .catch(() => {});
    }
  }, [handleLogout]);

  // Set up BroadcastChannel & multi-tab listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      channelRef.current = new BroadcastChannel('tbh_admin_auth_sync');
      channelRef.current.onmessage = event => {
        if (event.data?.type === 'LOGOUT') {
          router.push('/admin/login?reason=session_expired');
        } else if (event.data?.type === 'REFRESH') {
          lastActivityRef.current = Date.now();
          lastServerRefreshRef.current = Date.now();
          setShowWarning(false);
          setSecondsRemaining(150);
        }
      };
    } catch (e) {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'tbh_admin_sync' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.type === 'LOGOUT') {
            router.push('/admin/login?reason=session_expired');
          } else if (parsed.type === 'REFRESH') {
            lastActivityRef.current = Date.now();
            setShowWarning(false);
          }
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorage);

    // Activity event listeners
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(ev => window.addEventListener(ev, recordActivity, { passive: true }));

    // Heartbeat check interval (checks idle timer every 1 second)
    const interval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActivityRef.current;

      if (idleTime >= IDLE_TIMEOUT_MS) {
        clearInterval(interval);
        handleLogout('idle_timeout');
      } else if (idleTime >= WARNING_THRESHOLD_MS) {
        const remaining = Math.max(0, Math.ceil((IDLE_TIMEOUT_MS - idleTime) / 1000));
        setSecondsRemaining(remaining);
        setShowWarning(true);
      } else {
        if (showWarning) {
          setShowWarning(false);
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      events.forEach(ev => window.removeEventListener(ev, recordActivity));
      window.removeEventListener('storage', handleStorage);
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, [handleLogout, recordActivity, router, showWarning]);

  if (!showWarning) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface rounded-3xl max-w-md w-full p-6 sm:p-8 border border-border shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Security Idle Alert
          </span>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-text-main">
            Your Session Is About to Expire
          </h2>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            You have been inactive for over 27 minutes. For your security, you will be automatically
            logged out in:
          </p>
          <div className="text-3xl font-mono font-bold text-brand pt-2">
            {formattedTime}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleStayLoggedIn}
            disabled={isRefreshing}
            className="w-full sm:flex-1 py-3 px-4 bg-brand hover:bg-brand-hover text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isRefreshing ? 'Renewing Session...' : 'Stay Logged In'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleLogout('idle_timeout')}
            className="w-full sm:w-auto py-3 px-4 bg-surface-muted hover:bg-surface border border-border text-text-muted hover:text-text-main rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
