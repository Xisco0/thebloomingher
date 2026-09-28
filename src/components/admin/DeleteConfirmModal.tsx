'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  itemTitle?: string;
  itemSubtitle?: string;
  itemImage?: string;
  message?: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Product?',
  itemTitle,
  itemSubtitle,
  itemImage,
  message,
  confirmLabel = 'Yes, Delete',
  loading = false,
}: DeleteConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto p-4 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={e => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        className="bg-surface w-full max-w-md rounded-2xl border border-border/80 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto flex-shrink-0"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Close button */}
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <div className="flex items-center gap-2.5 text-rose-600">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-display font-bold text-base text-text-main">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-text-muted hover:text-text-main hover:bg-surface-muted rounded-xl transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs sm:text-sm text-text-body leading-relaxed">
            {message || (
              <>
                Are you sure you want to delete this product? It will be immediately removed from your store catalog.
              </>
            )}
          </p>

          {/* Item Preview Card (if details supplied) */}
          {itemTitle && (
            <div className="flex items-center gap-3 p-3 bg-surface-muted/60 border border-border/70 rounded-xl">
              {itemImage && (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-surface border border-border flex-shrink-0">
                  <Image
                    src={itemImage}
                    alt={itemTitle}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-text-main truncate">
                  {itemTitle}
                </p>
                {itemSubtitle && (
                  <p className="text-[11px] text-text-muted font-mono truncate mt-0.5">
                    {itemSubtitle}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="p-3 bg-rose-50 border border-rose-200/70 rounded-xl text-rose-800 text-[11px] leading-relaxed">
            <span className="font-bold">Note:</span> This action cannot be undone. Customers will no longer be able to view or purchase this item.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 p-4 bg-surface-muted/30 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-text-body bg-surface hover:bg-surface-muted border border-border rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
