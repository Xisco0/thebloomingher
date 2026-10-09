'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FolderTree,
  Plus,
  Edit,
  Save,
  Trash2,
  ExternalLink,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Category } from '@/types';
import catalogData from '@/lib/data/catalog.json';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { ProductSubNav } from '@/components/admin/subnav/ProductSubNav';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenNew = () => {
    setEditingCategory({
      id: `cat-${Date.now()}`,
      name: '',
      slug: '',
      description: '',
      image_url: '/images/logo.jpg',
      total_products: 0,
      display_order: categories.length + 1,
      is_active: true,
    });
    setIsNew(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCategory),
      });
      const data = await res.json();
      if (data.success) {
        if (isNew) {
          setCategories(prev => [...prev, data.category]);
        } else {
          setCategories(prev => prev.map(c => (c.id === data.category.id ? data.category : c)));
        }
        setEditingCategory(null);
        setIsNew(false);
      }
    } catch (err) {
      console.error('Failed to save category:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories?id=${categoryToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
        if (editingCategory && editingCategory.id === categoryToDelete.id) {
          setEditingCategory(null);
        }
        setCategoryToDelete(null);
      } else {
        alert(data.error || 'Failed to delete category.');
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ProductSubNav />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Store Categories
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Organize products into customer-facing departments, SEO navigation, and collection filters.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Editor Modal / Drawer */}
      {editingCategory && (
        <div className="bg-surface p-6 rounded-2xl border-2 border-brand/30 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="font-display font-bold text-base text-text-main">
              {isNew ? 'Create New Category' : `Edit Category: ${editingCategory.name}`}
            </h2>
            <button
              onClick={() => {
                setEditingCategory(null);
                setIsNew(false);
              }}
              className="text-xs text-text-muted hover:text-text-main font-semibold"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-body mb-1">Category Name *</label>
              <input
                type="text"
                required
                value={editingCategory.name}
                onChange={e => {
                  const name = e.target.value;
                  const slug = isNew
                    ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                    : editingCategory.slug;
                  setEditingCategory({ ...editingCategory, name, slug });
                }}
                className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-body mb-1">URL Slug *</label>
              <input
                type="text"
                required
                value={editingCategory.slug}
                onChange={e => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono text-text-main focus:outline-brand"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-text-body mb-1">Description</label>
              <textarea
                rows={2}
                value={editingCategory.description || ''}
                onChange={e => setEditingCategory({ ...editingCategory, description: e.target.value })}
                className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
              />
            </div>

            <div className="sm:col-span-2">
              <ImageUploader
                value={editingCategory.image_url ? [editingCategory.image_url] : []}
                onChange={urls => setEditingCategory({ ...editingCategory, image_url: urls[0] || '' })}
                folder="categories"
                maxFiles={1}
                label="Category Cover Image"
                description="Upload a high-quality cover image for this category."
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between pt-2">
              {!isNew ? (
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(editingCategory)}
                  className="px-3.5 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Category</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setIsNew(false);
                  }}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-text-body"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand text-white font-bold text-xs rounded-xl hover:bg-brand-dark flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Category</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map(category => (
          <div
            key={category.id}
            className="bg-surface rounded-2xl border border-border/80 shadow-xs overflow-hidden flex flex-col justify-between hover:border-brand/40 transition-all group"
          >
            <div>
              <div className="relative h-36 w-full bg-surface-muted">
                <Image
                  src={category.image_url || '/images/logo.jpg'}
                  alt={category.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-display font-bold text-base drop-shadow-sm">{category.name}</h3>
                  <span className="text-[10px] text-white/80 font-mono">/categories/{category.slug}</span>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <p className="text-xs text-text-body line-clamp-2 leading-relaxed">
                  {category.description || 'Feminine wellness and comfort essentials designed for your daily peace of mind.'}
                </p>
              </div>
            </div>

            <div className="p-4 pt-0 flex items-center justify-between border-t border-border/50 mt-3 pt-3">
              <Link
                href={`/categories/${category.slug}`}
                target="_blank"
                className="text-xs text-brand font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>View in Store</span>
                <ExternalLink className="w-3 h-3" />
              </Link>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingCategory(category);
                    setIsNew(false);
                  }}
                  className="p-1.5 text-text-muted hover:text-brand hover:bg-surface-muted rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setCategoryToDelete(category)}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!categoryToDelete}
        onClose={() => {
          if (!deleting) setCategoryToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Delete Category?"
        itemTitle={categoryToDelete?.name || ''}
        itemSubtitle={categoryToDelete?.slug ? `/categories/${categoryToDelete.slug}` : undefined}
        itemImage={categoryToDelete?.image_url || '/images/logo.jpg'}
        message={`Are you sure you want to delete "${categoryToDelete?.name}"? It will be removed from your store and admin categories list.`}
        confirmLabel="Yes, Delete Category"
      />
    </div>
  );
}
