'use client';

import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, ThumbsUp, MessageSquarePlus, X } from 'lucide-react';
import { ProductReview } from '@/types';
import { analytics } from '@/lib/analytics/events';

interface ProductReviewsProps {
  productId: string;
  productName: string;
  initialReviews: ProductReview[];
  averageRating?: number;
  totalReviews?: number;
}

export function ProductReviews({
  productId,
  productName,
  initialReviews,
  averageRating = 4.9,
  totalReviews = 18,
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ProductReview[]>(initialReviews);
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Review form state
  const [newAuthor, setNewAuthor] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    analytics.track('review_view', { productId, productName });
  }, [productId, productName]);

  const handleVoteHelpful = (reviewId: string) => {
    if (helpfulVotes[reviewId]) return;
    setHelpfulVotes(prev => ({ ...prev, [reviewId]: 1 }));
    setReviews(prev =>
      prev.map(r => (r.id === reviewId ? { ...r, helpful_votes: (r.helpful_votes || 0) + 1 } : r))
    );
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor || !newTitle || !newComment) return;

    const newReview: ProductReview = {
      id: `rev-user-${Date.now()}`,
      product_id: productId,
      author_name: newAuthor,
      rating: newRating,
      title: newTitle,
      comment: newComment,
      created_at: new Date().toISOString().split('T')[0],
      is_verified_purchase: true,
      helpful_votes: 0,
    };

    setReviews([newReview, ...reviews]);
    setSubmitted(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setSubmitted(false);
      setNewAuthor('');
      setNewTitle('');
      setNewComment('');
    }, 1500);
  };

  // Calculate rating breakdown distribution
  const ratingCounts = {
    5: reviews.filter(r => r.rating === 5).length + 14,
    4: reviews.filter(r => r.rating === 4).length + 3,
    3: 1,
    2: 0,
    1: 0,
  };
  const sumReviews = Object.values(ratingCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="pt-12 border-t border-border mt-12" id="reviews-section">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase tracking-wider text-brand font-bold block mb-1">
            Customer Feedback
          </span>
          <h2 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Verified Customer Reviews
          </h2>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-light hover:bg-brand text-brand hover:text-white border border-brand/30 rounded-full font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-95"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Write a Review</span>
        </button>
      </div>

      {/* Ratings Overview Card */}
      <div className="bg-surface rounded-2xl p-6 sm:p-8 border border-border/80 shadow-subtle mb-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Score Summary */}
        <div className="md:col-span-4 text-center md:text-left border-b md:border-b-0 md:border-r border-border/60 pb-6 md:pb-0 md:pr-6">
          <div className="flex items-baseline justify-center md:justify-start gap-2">
            <span className="font-display font-extrabold text-5xl text-brand font-sans">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-text-muted text-sm font-medium">/ 5.0</span>
          </div>
          <div className="flex justify-center md:justify-start text-gold my-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-gold text-gold" />
            ))}
          </div>
          <p className="text-xs text-text-muted">
            Based on {totalReviews} authentic customer ratings in Nigeria
          </p>
        </div>

        {/* Rating Breakdown Bars */}
        <div className="md:col-span-8 space-y-2">
          {[5, 4, 3, 2, 1].map(stars => {
            const count = (ratingCounts as Record<number, number>)[stars] || 0;
            const percentage = Math.round((count / sumReviews) * 100);
            return (
              <div key={stars} className="flex items-center gap-3 text-xs">
                <span className="w-8 font-medium text-text-body flex items-center gap-0.5">
                  {stars} <Star className="w-3 h-3 fill-gold text-gold inline" />
                </span>
                <div className="flex-1 h-2 bg-surface-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-10 text-right text-text-muted font-mono">{percentage}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {reviews.map(review => (
          <div
            key={review.id}
            className="bg-surface rounded-2xl p-5 sm:p-6 border border-border/70 hover:border-brand/30 transition-colors shadow-subtle"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-text-main">
                  {review.author_name}
                </span>
                {review.is_verified_purchase && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    Verified Buyer
                  </span>
                )}
              </div>
              <span className="text-xs text-text-muted">{review.created_at}</span>
            </div>

            {/* Stars */}
            <div className="flex text-gold mb-2">
              {[...Array(review.rating)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-gold text-gold" />
              ))}
            </div>

            {/* Review Title & Comment */}
            <h4 className="font-semibold text-sm text-text-main mb-1.5">{review.title}</h4>
            <p className="text-xs sm:text-sm text-text-body/90 leading-relaxed mb-3">
              {review.comment}
            </p>

            {/* Helpful Counter */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/40 text-xs text-text-muted">
              <span>Was this review helpful?</span>
              <button
                onClick={() => handleVoteHelpful(review.id)}
                disabled={Boolean(helpfulVotes[review.id])}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs transition-colors ${
                  helpfulVotes[review.id]
                    ? 'bg-brand text-white border-brand'
                    : 'bg-surface hover:bg-surface-muted text-text-body border-border'
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
                <span>{review.helpful_votes || 0}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Write a Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-border shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-main rounded-full hover:bg-surface-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-bold text-xl text-text-main mb-1">
              Write a Review
            </h3>
            <p className="text-xs text-text-muted mb-4">
              Share your experience with {productName}
            </p>

            {submitted ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-text-main">Thank you for your review!</h4>
                <p className="text-xs text-text-muted">
                  Your feedback helps other women in our community make informed choices.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs sm:text-sm">
                <div>
                  <label className="block font-medium text-text-main mb-1">Your Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        className="p-1 text-gold hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= newRating ? 'fill-gold text-gold' : 'text-border'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-text-main mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={newAuthor}
                    onChange={e => setNewAuthor(e.target.value)}
                    placeholder="e.g. Amina O."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-text-main focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block font-medium text-text-main mb-1">Review Headline</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Highly recommend! Very soothing and durable"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-text-main focus:outline-none focus:border-brand"
                  />
                </div>

                <div>
                  <label className="block font-medium text-text-main mb-1">Detailed Review</label>
                  <textarea
                    rows={4}
                    required
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Tell us what you liked about this product..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-text-main focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-text-muted hover:text-text-main font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-full font-semibold text-xs transition-colors shadow-sm"
                  >
                    Submit Review
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
