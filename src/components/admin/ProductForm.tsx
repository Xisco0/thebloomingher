'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Save,
  ArrowLeft,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Product } from '@/types';
import catalogData from '@/lib/data/catalog.json';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { generateProfessionalSlug } from '@/lib/utils/slug';
import { DeleteConfirmModal } from '@/components/admin/DeleteConfirmModal';

interface ProductFormProps {
  initialProduct?: Partial<Product>;
  isEdit?: boolean;
}

export function ProductForm({ initialProduct, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: initialProduct?.id || '',
    name: initialProduct?.name || '',
    slug: initialProduct?.slug || '',
    short_description: initialProduct?.short_description || '',
    description: initialProduct?.description || '',
    price: initialProduct?.price || 0,
    compare_at_price: initialProduct?.compare_at_price || '',
    cost_price: initialProduct?.cost_price || '',
    sku: initialProduct?.sku || `TBH-${Math.floor(1000 + Math.random() * 9000)}`,
    stock_quantity: initialProduct?.stock_quantity ?? 25,
    low_stock_threshold: initialProduct?.low_stock_threshold ?? 10,
    category_id: initialProduct?.category_id || catalogData.categories[0]?.id || 'cat-18130',
    category_name: initialProduct?.category_name || catalogData.categories[0]?.name || 'Feminine Care',
    subcategory: initialProduct?.subcategory || '',
    status: initialProduct?.status || 'active',
    seo_title: initialProduct?.seo_title || '',
    seo_description: initialProduct?.seo_description || '',
    images: initialProduct?.images && initialProduct.images.length > 0
      ? initialProduct.images.map((img: any) => (typeof img === 'string' ? img : img.url))
      : ['/images/logo.jpg'],
    is_featured: initialProduct?.is_featured ?? false,
    is_bestseller: initialProduct?.is_bestseller ?? false,
    is_new_arrival: initialProduct?.is_new_arrival ?? false,
    tags: initialProduct?.tags ? initialProduct.tags.join(', ') : '',
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateProfessionalSlug(name),
    }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value;
    const cat = catalogData.categories.find(c => c.id === catId);
    setFormData(prev => ({
      ...prev,
      category_id: catId,
      category_name: cat ? cat.name : prev.category_name,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const endpoint = '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        price: Number(formData.price),
        compare_at_price: formData.compare_at_price ? Number(formData.compare_at_price) : undefined,
        cost_price: formData.cost_price ? Number(formData.cost_price) : undefined,
        stock_quantity: Number(formData.stock_quantity),
        low_stock_threshold: Number(formData.low_stock_threshold),
        tags: formData.tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean),
      };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Something went wrong. Please check your information and try again.');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!formData.id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products?id=${formData.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        router.push('/admin/products');
        router.refresh();
      } else {
        setError(data.error || 'Failed to delete product.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete product.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 bg-surface hover:bg-surface-muted text-text-muted hover:text-text-main border border-border rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-text-main">
              {isEdit ? `Edit Product: ${initialProduct?.name}` : 'Add Product'}
            </h1>
            <p className="text-xs text-text-muted">
              Fill in the details below to {isEdit ? 'update' : 'add'} this product in your store.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEdit && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-3.5 py-2 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Product</span>
            </button>
          )}
          <Link
            href="/admin/products"
            className="px-4 py-2 border border-border bg-surface hover:bg-surface-muted text-text-body font-semibold text-xs rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="hidden sm:inline-flex px-5 py-2.5 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Product'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main 2 Columns: Basic Info, Images, Price & Stock */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Basic Information */}
          <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
            <h2 className="font-display font-bold text-base text-text-main">
              1. Basic Information
            </h2>

            <div>
              <label className="block text-xs font-bold text-text-body mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g. Electric Heating Pad & Menstrual Cramp Relief Belt"
                className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-sans text-text-main focus:outline-brand"
              />
              <span className="text-[11px] text-text-muted mt-1 block">
                The name your customers will see in your store.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-body mb-1">
                Category *
              </label>
              <select
                value={formData.category_id}
                onChange={handleCategoryChange}
                className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-sans text-text-main focus:outline-brand"
              >
                {catalogData.categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-body mb-1">
                  Subcategory (Optional)
                </label>
                <input
                  type="text"
                  value={formData.subcategory}
                  onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                  placeholder="e.g. Drinkware, Bags, Accessories, Gift Ideas"
                  className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-sans text-text-main focus:outline-brand"
                />
                <span className="text-[11px] text-text-muted mt-1 block">
                  e.g. Drinkware, Electronics Accessories, Bags, Stationery, Personal Accessories
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-body mb-1">
                  Product Visibility Status *
                </label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-sans text-text-main focus:outline-brand"
                >
                  <option value="active">Active (Visible on public store)</option>
                  <option value="draft">Draft (Hidden from public store)</option>
                  <option value="archived">Archived (Discontinued)</option>
                </select>
                <span className="text-[11px] text-text-muted mt-1 block">
                  Draft products remain in database but disappear from shop.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-body mb-1">
                Short Summary
              </label>
              <input
                type="text"
                value={formData.short_description}
                onChange={e => setFormData({ ...formData, short_description: e.target.value })}
                placeholder="Fast, drug-free menstrual cramp relief with 3 soothing heat levels"
                className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-sans text-text-main focus:outline-brand"
              />
              <span className="text-[11px] text-text-muted mt-1 block">
                A one-sentence summary shown on product cards and previews.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-body mb-1">
                Full Description *
              </label>
              <textarea
                rows={6}
                required
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe features, benefits, how to use, and care instructions..."
                className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-sans text-text-main focus:outline-brand"
              />
            </div>
          </div>

          {/* Section 2: Images */}
          <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
            <h2 className="font-display font-bold text-base text-text-main">
              2. Product Images
            </h2>
            <ImageUploader
              value={formData.images}
              onChange={urls => setFormData(prev => ({ ...prev, images: urls }))}
              folder="products"
              maxFiles={8}
              label="Upload Images"
              description="Add clear photos of your product. The first photo is the main cover photo."
            />
          </div>

          {/* Section 3: Price */}
          <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
            <h2 className="font-display font-bold text-base text-text-main">
              3. Price
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-body mb-1">
                  Selling Price (₦) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                  placeholder="e.g. 15000"
                  className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono font-bold text-text-main focus:outline-brand"
                />
                <span className="text-[11px] text-text-muted mt-1 block">
                  Amount the customer pays.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-body mb-1">
                  Discount Price / Original Price (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.compare_at_price}
                  onChange={e => setFormData({ ...formData, compare_at_price: e.target.value })}
                  placeholder="e.g. 18500"
                  className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono text-text-main focus:outline-brand"
                />
                <span className="text-[11px] text-text-muted mt-1 block">
                  Optional. Shows crossed-out original price if on sale.
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Stock */}
          <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
            <h2 className="font-display font-bold text-base text-text-main">
              4. Stock & Availability
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-body mb-1">
                  Stock Units (Quantity) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.stock_quantity}
                  onChange={e => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono font-bold text-text-main focus:outline-brand"
                />
                <span className="text-[11px] text-text-muted mt-1 block">
                  How many units are available to sell.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-body mb-1">
                  Low Stock Warning Level
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.low_stock_threshold}
                  onChange={e => setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono text-text-main focus:outline-brand"
                />
                <span className="text-[11px] text-text-muted mt-1 block">
                  Warn me when stock drops below this number (e.g. 5).
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Badges & Tags */}
        <div className="space-y-6">
          {/* Badges Card */}
          <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
            <h2 className="font-display font-bold text-base text-text-main">
              Storefront Badges
            </h2>
            <p className="text-xs text-text-muted">
              Choose special tags to highlight this product on your store.
            </p>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_bestseller}
                  onChange={e => setFormData({ ...formData, is_bestseller: e.target.checked })}
                  className="w-4 h-4 text-brand rounded border-border focus:ring-brand"
                />
                <span className="text-xs font-semibold text-text-main">Mark as Best Seller</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={e => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 text-brand rounded border-border focus:ring-brand"
                />
                <span className="text-xs font-semibold text-text-main">Showcase in Featured Selection</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_new_arrival}
                  onChange={e => setFormData({ ...formData, is_new_arrival: e.target.checked })}
                  className="w-4 h-4 text-brand rounded border-border focus:ring-brand"
                />
                <span className="text-xs font-semibold text-text-main">Badge as New Arrival</span>
              </label>
            </div>

            <div className="pt-4 border-t border-border/60">
              <label className="block text-xs font-bold text-text-body mb-1">
                Search Tags (comma separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                placeholder="coffee mug, coffee mug Lagos, drinkware"
                className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-sans text-text-main focus:outline-brand"
              />
              <span className="text-[11px] text-text-muted mt-1 block">
                Helps customers find this product in search.
              </span>
            </div>
          </div>



          {/* Quick Helpful Tip */}
          <div className="bg-brand/5 border border-brand/20 rounded-2xl p-5 space-y-2">
            <h3 className="font-display font-bold text-xs text-brand flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Helpful Tip</span>
            </h3>
            <p className="text-[11px] text-text-body leading-relaxed">
              Clear product names and friendly descriptions help customers feel confident when making a purchase.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action Section (Mobile view only: shown when user scrolls downward) */}
      <div className="block sm:hidden pt-4">
        <div className="bg-surface p-4 rounded-2xl border border-border/80 shadow-sm flex flex-col gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Product'}</span>
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="w-full py-2.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Product</span>
            </button>
          )}
          <Link
            href="/admin/products"
            className="w-full text-center py-2.5 border border-border bg-surface hover:bg-surface-muted text-text-body font-semibold text-xs rounded-xl transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          if (!deleting) setShowDeleteModal(false);
        }}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
        title="Delete Product?"
        itemTitle={formData.name || 'Untitled Product'}
        itemSubtitle={formData.sku ? `SKU: ${formData.sku}` : undefined}
        itemImage={
          formData.images && formData.images.length > 0
            ? formData.images[0]
            : '/images/logo.jpg'
        }
        message={`Are you sure you want to delete "${formData.name || 'this product'}"? This product will be permanently removed from your catalog and store.`}
        confirmLabel="Yes, Delete Product"
      />
    </form>
  );
}
