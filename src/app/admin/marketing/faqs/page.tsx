'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  HelpCircle,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ArrowUpDown,
  Filter,
  Save,
  X,
  Truck,
  Heart,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { FAQ, FAQCategory } from '@/types/faq.types';
import { MarketingSubNav } from '@/components/admin/subnav/MarketingSubNav';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';

const CATEGORIES: { id: FAQCategory | 'all'; label: string; icon: any }[] = [
  { id: 'all', label: 'All Categories', icon: HelpCircle },
  { id: 'delivery', label: 'Delivery & Shipping', icon: Truck },
  { id: 'products', label: 'Period Care & Quality', icon: Heart },
  { id: 'orders', label: 'Orders & Payments', icon: CreditCard },
  { id: 'returns', label: 'Hygiene & Returns', icon: ShieldCheck },
  { id: 'general', label: 'General Care', icon: HelpCircle },
];

export default function AdminFaqsPage() {
  const [mounted, setMounted] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Modal State for Add / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    question: string;
    answer: string;
    category: FAQCategory;
    is_active: boolean;
    is_published: boolean;
    sort_order: number;
  }>({
    question: '',
    answer: '',
    category: 'general',
    is_active: true,
    is_published: true,
    sort_order: 1,
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<FAQ | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/marketing/faqs');
      const data = await res.json();
      if (data.success) {
        setFaqs(data.faqs || []);
      }
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingFaq(null);
    setFormData({
      question: '',
      answer: '',
      category: 'delivery',
      is_active: true,
      is_published: true,
      sort_order: faqs.length + 1,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      is_active: faq.is_active,
      is_published: faq.is_published,
      sort_order: faq.sort_order,
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim()) {
      setFormError('Question is required.');
      return;
    }
    if (!formData.answer.trim()) {
      setFormError('Answer is required.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const isEdit = Boolean(editingFaq);
      const url = isEdit
        ? `/api/admin/marketing/faqs/${editingFaq!.id}`
        : '/api/admin/marketing/faqs';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setShowModal(false);
        fetchFaqs();
      } else {
        setFormError(data.error || 'Failed to save FAQ.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (faq: FAQ) => {
    try {
      const res = await fetch(`/api/admin/marketing/faqs/${faq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_active', is_active: !faq.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        setFaqs(prev =>
          prev.map(f => (f.id === faq.id ? { ...f, is_active: !f.is_active } : f))
        );
      }
    } catch (err) {
      console.error('Failed to toggle active:', err);
    }
  };

  const handleTogglePublished = async (faq: FAQ) => {
    try {
      const res = await fetch(`/api/admin/marketing/faqs/${faq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_published', is_published: !faq.is_published }),
      });
      const data = await res.json();
      if (data.success) {
        setFaqs(prev =>
          prev.map(f => (f.id === faq.id ? { ...f, is_published: !f.is_published } : f))
        );
      }
    } catch (err) {
      console.error('Failed to toggle published:', err);
    }
  };

  const handleDeleteFaq = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/marketing/faqs/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setFaqs(prev => prev.filter(f => f.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error('Failed to delete FAQ:', err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalCount = faqs.length;
  const publishedCount = faqs.filter(f => f.is_published && f.is_active).length;
  const draftCount = faqs.filter(f => !f.is_published).length;
  const inactiveCount = faqs.filter(f => !f.is_active).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <MarketingSubNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand">
            Database-Driven FAQ Management
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Create, edit, order, publish, and manage store FAQs that render dynamically on the storefront.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/faq"
            target="_blank"
            className="px-4 py-2.5 bg-surface hover:bg-surface-muted border border-border rounded-xl text-xs font-semibold text-text-main flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Live FAQ Page</span>
          </Link>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New FAQ</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface rounded-2xl p-4 border border-border/80 shadow-subtle">
          <span className="text-xs text-text-muted font-medium block">Total Database FAQs</span>
          <span className="text-2xl font-bold font-display text-text-main block mt-1">
            {loading ? '...' : totalCount}
          </span>
        </div>
        <div className="bg-surface rounded-2xl p-4 border border-border/80 shadow-subtle">
          <span className="text-xs text-emerald-700 font-medium block">Published & Active</span>
          <span className="text-2xl font-bold font-display text-emerald-700 block mt-1">
            {loading ? '...' : publishedCount}
          </span>
        </div>
        <div className="bg-surface rounded-2xl p-4 border border-border/80 shadow-subtle">
          <span className="text-xs text-amber-700 font-medium block">Unpublished Drafts</span>
          <span className="text-2xl font-bold font-display text-amber-700 block mt-1">
            {loading ? '...' : draftCount}
          </span>
        </div>
        <div className="bg-surface rounded-2xl p-4 border border-border/80 shadow-subtle">
          <span className="text-xs text-rose-700 font-medium block">Disabled / Inactive</span>
          <span className="text-2xl font-bold font-display text-rose-700 block mt-1">
            {loading ? '...' : inactiveCount}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-surface rounded-2xl p-4 border border-border/80 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search FAQs by question or answer..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-muted/60 rounded-xl border border-border text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-brand"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand text-white shadow-xs'
                    : 'bg-surface-muted text-text-muted hover:text-text-main border border-border/60'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQs Table / List */}
      <div className="bg-surface rounded-2xl border border-border shadow-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-text-muted">Loading FAQs from database...</div>
        ) : filteredFaqs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <HelpCircle className="w-10 h-10 text-text-muted mx-auto" />
            <h3 className="text-sm font-bold text-text-main">No FAQs Found</h3>
            <p className="text-xs text-text-muted">
              {searchQuery || selectedCategory !== 'all'
                ? 'No FAQs match your search or filter options.'
                : 'Click "Add New FAQ" to create your first database entry.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredFaqs.map((faq, idx) => (
              <div
                key={faq.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-muted/30 transition-colors"
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-light text-brand font-bold text-xs flex items-center justify-center">
                      #{faq.sort_order || idx + 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-surface-muted border border-border text-[10px] font-bold uppercase tracking-wider text-text-muted capitalize">
                      {faq.category}
                    </span>
                    {faq.is_published ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Published
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Draft / Unpublished
                      </span>
                    )}
                    {!faq.is_active && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wider">
                        Disabled
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-bold text-sm text-text-main leading-snug">
                    {faq.question}
                  </h3>
                  <p className="text-xs text-text-body/80 leading-relaxed line-clamp-2">
                    {faq.answer}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40 justify-end">
                  {/* Active Toggle */}
                  <button
                    onClick={() => handleToggleActive(faq)}
                    title={faq.is_active ? 'Disable FAQ' : 'Enable FAQ'}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      faq.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    {faq.is_active ? 'Active' : 'Disabled'}
                  </button>

                  {/* Published Toggle */}
                  <button
                    onClick={() => handleTogglePublished(faq)}
                    title={faq.is_published ? 'Unpublish FAQ' : 'Publish FAQ'}
                    className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      faq.is_published
                        ? 'bg-brand-light text-brand border-brand/20 hover:bg-brand-light/80'
                        : 'bg-surface-muted text-text-muted border-border hover:bg-surface'
                    }`}
                  >
                    {faq.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEditModal(faq)}
                    className="p-2 bg-surface hover:bg-surface-muted border border-border text-text-main rounded-xl transition-colors cursor-pointer"
                    title="Edit FAQ"
                  >
                    <Edit2 className="w-4 h-4 text-brand" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteTarget(faq)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl transition-colors cursor-pointer"
                    title="Delete FAQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit FAQ Modal */}
      {mounted && showModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={e => {
            if (e.target === e.currentTarget && !saving) setShowModal(false);
          }}
        >
          <div className="bg-surface rounded-3xl border border-border max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto my-auto flex-shrink-0">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-brand" />
                <h3 className="font-display font-bold text-lg text-text-main">
                  {editingFaq ? 'Edit FAQ Entry' : 'Create New Database FAQ'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-text-muted hover:text-text-main hover:bg-surface-muted rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveFaq} className="space-y-4">
              {/* Question */}
              <div>
                <label className="block text-xs font-bold text-text-main mb-1">
                  Question <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Where can I buy feminine care products in Lagos?"
                  value={formData.question}
                  onChange={e => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-border text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-brand"
                  required
                />
              </div>

              {/* Answer */}
              <div>
                <label className="block text-xs font-bold text-text-main mb-1">
                  Answer Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Enter detailed answer content. Public website will render this directly from database."
                  value={formData.answer}
                  onChange={e => setFormData({ ...formData, answer: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-border text-xs text-text-main placeholder:text-text-muted focus:outline-none focus:border-brand"
                  required
                />
              </div>

              {/* Category & Sort Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-main mb-1">
                    FAQ Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={e =>
                      setFormData({ ...formData, category: e.target.value as FAQCategory })
                    }
                    className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand capitalize"
                  >
                    <option value="delivery">Delivery & Shipping</option>
                    <option value="products">Period Care & Quality</option>
                    <option value="orders">Orders & Payments</option>
                    <option value="returns">Hygiene & Returns</option>
                    <option value="general">General Care</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-main mb-1">
                    Sort Order Priority
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.sort_order}
                    onChange={e =>
                      setFormData({ ...formData, sort_order: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3.5 py-2.5 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Checkboxes: Active & Published */}
              <div className="pt-2 flex flex-wrap items-center gap-6 bg-surface-muted/50 p-4 rounded-xl border border-border/60">
                <label className="flex items-center gap-2 text-xs font-medium text-text-main cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 accent-brand rounded"
                  />
                  <span>Is Active (Enabled)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-text-main cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4 accent-brand rounded"
                  />
                  <span>Is Published (Visible to Visitors)</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-surface hover:bg-surface-muted border border-border text-text-muted rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : editingFaq ? 'Update FAQ' : 'Create FAQ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteFaq}
        title="Delete FAQ Entry"
        message={`Are you sure you want to delete "${deleteTarget?.question}"? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}
