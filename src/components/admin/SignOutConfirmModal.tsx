'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, X, AlertCircle } from 'lucide-react';

interface SignOutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  adminEmail?: string;
  adminName?: string;
}

export function SignOutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  adminEmail,
  adminName,
}: SignOutConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto p-4 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={() => !loading && onClose()} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-surface border border-border rounded-3xl p-6 shadow-elevated z-10 animate-in zoom-in-95 duration-200 my-auto flex-shrink-0">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-1.5 text-text-muted hover:text-text-main hover:bg-surface-muted rounded-xl transition-colors disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex-shrink-0">
            <LogOut className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-text-main">
              Sign Out of Admin Portal?
            </h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Are you sure you want to end your current administrator session?
            </p>
          </div>
        </div>

        {/* User context card if available */}
        {(adminEmail || adminName) && (
          <div className="mb-6 p-3.5 bg-surface-muted rounded-2xl border border-border/70 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-light text-brand font-bold text-xs flex items-center justify-center border border-brand/20 flex-shrink-0">
              {adminName?.[0] || adminEmail?.[0] || 'A'}
            </div>
            <div className="truncate">
              {adminName && (
                <span className="text-xs font-bold text-text-main block truncate">
                  {adminName}
                </span>
              )}
              {adminEmail && (
                <span className="text-[11px] text-text-muted block truncate">
                  {adminEmail}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/80">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 bg-surface hover:bg-surface-muted text-text-main border border-border rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing Out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>Yes, Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
