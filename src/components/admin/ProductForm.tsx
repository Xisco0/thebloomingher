'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Save,
  ArrowLeft,
  Trash2,
  Plus,
  Image as ImageIcon,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { Product } from '@/types';
import catalogData from '@/lib/data/catalog.json';
import { ImageUploader } from '@/components/admin/ImageUploader';

interface ProductFormProps {
  initialProduct?: Partial<Product>;
  isEdit?: boolean;
}

export function ProductForm({ initialProduct, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
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
    category_id: initialProduct?.category_id || 'cat-menstrual-care',
    category_name: initialProduct?.category_name || 'Menstrual Care',
    images: initialProduct?.images && initialProduct.images.length > 0
      ? initialProduct.images.map((img: any) => (typeof img === 'string' ? img : img.url))
      : ['/images/logo.jpg'],
    is_featured: initialProduct?.is_featured ?? false,
    is_bestseller: initialProduct?.is_bestseller ?? false,
    is_new_arrival: initialProduct?.is_new_arrival ?? false,
    tags: initialProduct?.tags ? initialProduct.tags.join(', ') : '',
  });

  const [imageUrlInput, setImageUrlInput] = useState('');

  // Handle auto-slug generation when name changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!isEdit && !formData.slug) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, name, slug: generatedSlug }));
    } else {
      setFormData(prev => ({ ...prev, name }));
    }
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

  const handleAddImage = () => {
    if (!imageUrlInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrlInput.trim()],
    }));
    setImageUrlInput('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
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
        throw new Error(data.error || 'Failed to save product');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the product');
    } finally {
      setSubmitting(false);
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
              {isEdit ? `Edit Product: ${initialProduct?.name}` : 'Add New Product'}
            </h1>
            <p className="text-xs text-text-muted">
              Configure product details, pricing in Nigerian Naira (₦), stock levels, and media.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="px-4 py-2 border border-border bg-surface hover:bg-surface-muted text-text-body font-semibold text-xs rounded-xl transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : isEdit ? 'Update Product' : 'Publish Product'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main 2 Cols: Basic Info, Descriptions & Media */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Information Card */}
          <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
            <h2 className="font-display font-bold text-base text-text-main">Product Information</h2>

            <div>
              <label className="block text-xs font-bold text-text-body mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g. Electric Heating Pad & Menstrual Cramp Relief Belt"
                className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-sans text-text-main focus:outline-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-body mb-1">
                URL Slug *
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2.5 bg-surface-muted border border-r-0 border-border rounded-l-xl text-xs text-text-muted font-mono">
                  /products/
                </span>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="electric-heating-pad-cramp-relief-belt"
                  className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-r-xl text-xs font-mono text-text-main focus:outline-brand"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-body mb-1">
                Short Tagline / Summary
              </label>
              <input
                type="text"
                value={formData.short_description}
                onChange={e => setFormData({ ...formData, short_description: e.target.value })}
                placeholder="Fast, drug-free menstrual cramp relief with 3 soothing thermal levels"
                className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-sans text-text-main focus:outline-brand"
              />
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
                placeholder="Detailed description of features, benefits, usage instructions, and safety information..."
                className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-sans text-text-main focus:outline-brand"
              />
            </div>
          </div>

          {/* Media Images Card (Cloudflare R2 Integrated) */}
          <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
            <ImageUploader
              value={formData.images}
              onChange={urls => setFormData(prev => ({ ...prev, images: urls }))}
              folder="products"
              maxFiles={8}
              label="Product Gallery & Cover Image"
              description="Uploaded images are stored directly in Cloudflare R2 and served globally. Drag & drop to add up to 8 images."
            />
          </div>

          {/* Pricing & Stock Card */}
          <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
            <h2 className="font-display font-bold text-base text-text-main">Pricing & Inventory</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono font-bold text-text-main focus:outline-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-body mb-1">
                  Compare at Price (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.compare_at_price}
                  onChange={e => setFormData({ ...formData, compare_at_price: e.target.value })}
                  placeholder="e.g. 18500"
                  className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono text-text-main focus:outline-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-body mb-1">
                  Cost Price (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.cost_price}
                  onChange={e => setFormData({ ...formData, cost_price: e.target.value })}
                  placeholder="e.g. 8000"
                  className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono text-text-main focus:outline-brand"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-text-body mb-1">
                  SKU Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono text-text-main focus:outline-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-body mb-1">
                  Stock Units *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.stock_quantity}
                  onChange={e => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono font-bold text-text-main focus:outline-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-body mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.low_stock_threshold}
                  onChange={e => setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono text-text-main focus:outline-brand"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Category & Organization */}
        <div className="space-y-6">
          {/* Organization Card */}
          <div className="bg-surface p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
            <h2 className="font-display font-bold text-base text-text-main">Category & Status</h2>

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

            <div>
              <label className="block text-xs font-bold text-text-body mb-1">
                Search Tags (comma separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                placeholder="cramp, period, heating, thermal, lagos"
                className="w-full px-3.5 py-2.5 bg-surface-muted/40 border border-border rounded-xl text-xs font-sans text-text-main focus:outline-brand"
              />
            </div>

            <div className="pt-3 border-t border-border/60 space-y-3">
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
          </div>

          {/* Quick Guidance Box */}
          <div className="bg-brand/5 border border-brand/20 rounded-2xl p-5 space-y-2">
            <h3 className="font-display font-bold text-xs text-brand flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Catalog Best Practices</span>
            </h3>
            <p className="text-[11px] text-text-body leading-relaxed">
              Ensure accurate pricing in Naira (₦). High-resolution image URLs with square 1:1 aspect ratios will render best across mobile and desktop customer viewports.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}
