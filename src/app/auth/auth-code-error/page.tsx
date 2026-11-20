'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, RefreshCw, Mail, MessageCircle, ArrowLeft, ShieldAlert } from 'lucide-react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'unknown';
  const refId = searchParams.get('ref');

  let title = 'Unable to Complete Sign-In';
  let description =
    'We could not verify your Google authentication session securely. This usually happens if the link expired, cookies were blocked by private browsing, or the sign-in took too long.';

  if (reason === 'missing_code') {
    title = 'Missing Sign-In Information';
    description =
      'The authentication callback was opened without a valid authorization code. Please return to the login page and start the sign-in process again.';
  } else if (reason === 'access_denied' || reason === 'provider_cancelled') {
    title = 'Sign-In Cancelled';
    description =
      'You cancelled Google sign-in or authorization was denied. No changes have been made to your account. You can sign in anytime you are ready.';
  } else if (reason === 'pkce_verification_failed' || reason === 'session_expired') {
    title = 'Sign-In Session Expired';
    description =
      'Your browser verification session could not be confirmed. This commonly happens if you are using Private/Incognito browsing, an in-app browser (such as Instagram or Facebook), or if third-party cookies are blocked.';
  } else if (reason === 'sync_failed') {
    title = 'Account Synchronization Notice';
    description =
      'We authenticated your Google Account, but were unable to synchronize your customer profile. Please try again or reach out to our concierge.';
  }

  return (
    <div className="w-[88%] max-w-lg mx-auto py-12 sm:py-20">
      <div className="bg-surface rounded-3xl p-8 sm:p-10 border border-border shadow-elevated space-y-6 text-center">
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Authentication Notice
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            {title}
          </h1>
          <p className="text-xs text-text-muted leading-relaxed max-w-md mx-auto">
            {description}
          </p>
        </div>

        {/* Helpful Tips Box */}
        <div className="bg-surface-muted/60 border border-border rounded-2xl p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-text-main font-semibold text-xs">
            <AlertCircle className="w-4 h-4 text-brand flex-shrink-0" />
            <span>Helpful Tips for Mobile & Private Browsing</span>
          </div>
          <ul className="text-[11px] text-text-muted space-y-1.5 list-disc pl-5">
            <li>If you are using Private Browsing or Incognito, try using a normal browser tab.</li>
            <li>If you opened this inside Instagram, TikTok, or Facebook, tap the menu (•••) and choose <strong>Open in Safari / Chrome</strong>.</li>
            <li>You can also sign in directly using your email and password.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <Link
            href="/account/login"
            className="w-full py-3 px-4 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Signing In Again</span>
          </Link>

          <Link
            href="/account/login"
            className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-text-main font-semibold text-xs rounded-xl border border-border flex items-center justify-center gap-2 transition-all shadow-subtle"
          >
            <Mail className="w-4 h-4 text-text-muted" />
            <span>Sign In with Email & Password</span>
          </Link>

          <a
            href="https://wa.me/2348103641002"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-xl border border-emerald-200 flex items-center justify-center gap-2 transition-all"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Need Help? Chat with Concierge on WhatsApp</span>
          </a>
        </div>

        {/* Support Reference / Return */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-muted">
          <Link href="/" className="inline-flex items-center gap-1.5 hover:text-text-main transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Store</span>
          </Link>
          {refId && (
            <span className="text-[10px] text-text-muted/80 font-mono">
              Reference: {refId}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCodeErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
