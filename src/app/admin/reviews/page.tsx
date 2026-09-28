'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  Plus,
  Trash2,
  CheckCircle2,
  ThumbsUp,
  RefreshCw,
  Search,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { ProductReview, Product } from '@/types';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  const [newReview, setNewReview] = useState({
    product_id: '',
    author_name: '',
    rating: 5,
    title: '',
    comment: '',
    is_verified_purchase: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [revRes, prodRes] = await Promise.all([
        fetch('/api/admin/reviews'),
        fetch('/api/admin/products'),
      ]);
      const revData = await revRes.json();
      const prodData = await prodRes.json();

      if (revData.success) setReviews(revData.reviews || []);
      if (prodData.success) {
        setProducts(prodData.products || []);
        if (prodData.products.length > 0 && !newReview.product_id) {
          setNewReview(prev => ({ ...prev, product_id: prodData.products[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this review?')) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setReviews(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview),
      });
      const data = await res.json();
      if (data.success) {
        setReviews(prev => [data.review, ...prev]);
        setShowNewModal(false);
        setNewReview({
          product_id: products[0]?.id || '',
          author_name: '',
          rating: 5,
          title: '',
          comment: '',
          is_verified_purchase: true,
        });
      }
    } catch (err) {
      console.error('Failed to create review:', err);
    }
  };

  const filteredReviews = reviews.filter(r => {
    const matchesRating = filterRating === 'all' || r.rating === filterRating;
    const matchesSearch =
      r.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRating && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Reviews
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Customer feedback and ratings displayed across your store products.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 bg-surface hover:bg-surface-muted text-text-muted hover:text-brand border border-border rounded-xl transition-colors"
            title="Refresh reviews"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Review</span>
          </button>
        </div>
      </div>

      {/* New Review Modal */}
      {showNewModal && (
        <div className="bg-surface p-6 rounded-2xl border-2 border-brand/30 shadow-md space-y-4 max-w-2xl">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="font-display font-bold text-base text-text-main">
              Add Verified Customer Feedback
            </h2>
            <button
              onClick={() => setShowNewModal(false)}
              className="text-xs text-text-muted hover:text-text-main font-semibold"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateReview} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-body mb-1">Target Product *</label>
              <select
                value={newReview.product_id}
                onChange={e => setNewReview({ ...newReview, product_id: e.target.value })}
                className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-body mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chioma A. (Ikeja, Lagos)"
                  value={newReview.author_name}
                  onChange={e => setNewReview({ ...newReview, author_name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-body mb-1">Star Rating (1-5)</label>
                <select
                  value={newReview.rating}
                  onChange={e => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand font-bold"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ 5 Stars (Outstanding)</option>
                  <option value={4}>⭐⭐⭐⭐ 4 Stars (Very Good)</option>
                  <option value={3}>⭐⭐⭐ 3 Stars (Average)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-body mb-1">Review Headline *</label>
              <input
                type="text"
                required
                placeholder="e.g. Super fast delivery in Ikeja & amazing quality!"
                value={newReview.title}
                onChange={e => setNewReview({ ...newReview, title: e.target.value })}
                className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-body mb-1">Review Details *</label>
              <textarea
                rows={3}
                required
                placeholder="Details on comfort, delivery speed, discreet packaging, or product results..."
                value={newReview.comment}
                onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-text-body"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-brand text-white font-bold text-xs rounded-xl hover:bg-brand-dark"
              >
                Publish Review
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-surface p-4 rounded-2xl border border-border/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main placeholder:text-text-muted focus:outline-brand"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {(['all', 5, 4, 3] as const).map(stars => (
            <button
              key={String(stars)}
              onClick={() => setFilterRating(stars)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                filterRating === stars
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-surface-muted/60 text-text-body hover:bg-surface-muted'
              }`}
            >
              {stars === 'all' ? 'All Ratings' : `${stars} ★ Reviews`}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReviews.length === 0 ? (
          <div className="col-span-2 py-16 text-center text-text-muted bg-surface rounded-2xl border border-border">
            <div className="max-w-sm mx-auto space-y-2">
              <div className="w-12 h-12 rounded-full bg-brand-light/50 text-brand flex items-center justify-center mx-auto">
                <Star className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-text-main">
                {searchQuery || filterRating !== 'all' ? 'No matching reviews' : 'No reviews yet'}
              </p>
              <p className="text-xs text-text-muted">
                {searchQuery || filterRating !== 'all'
                  ? 'Try clearing your search or rating filter.'
                  : 'Customer product reviews will appear here.'}
              </p>
            </div>
          </div>
        ) : (
          filteredReviews.map(review => {
            const product = products.find(p => p.id === review.product_id);

            return (
              <div
                key={review.id}
                className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`w-3.5 h-3.5 ${
                            idx < review.rating ? 'fill-amber-400 text-amber-400' : 'text-border'
                          }`}
                        />
                      ))}
                    </div>
                    {review.is_verified_purchase && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified Buyer
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-bold text-sm text-text-main">{review.title}</h3>
                  <p className="text-xs text-text-body leading-relaxed">{review.comment}</p>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-text-main">{review.author_name}</p>
                    {product && (
                      <p className="text-[10px] text-brand font-medium truncate max-w-[200px]">
                        {product.name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted">
                      {review.helpful_votes} helpful
                    </span>
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="p-1 text-text-muted hover:text-rose-600 rounded transition-colors"
                      title="Delete review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
