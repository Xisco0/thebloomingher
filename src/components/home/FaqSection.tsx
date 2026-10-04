'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, HelpCircle, ChevronDown, MessageCircle, Truck, Heart, ShieldCheck, CreditCard } from 'lucide-react';
import { FAQ, FAQCategory } from '@/types/faq.types';

const CATEGORIES = [
  { id: 'all', label: 'All Questions', icon: HelpCircle },
  { id: 'delivery', label: 'Delivery & Shipping', icon: Truck },
  { id: 'products', label: 'Period Care & Quality', icon: Heart },
  { id: 'orders', label: 'Orders & Payments', icon: CreditCard },
  { id: 'returns', label: 'Hygiene & Returns', icon: ShieldCheck },
  { id: 'general', label: 'General Care', icon: HelpCircle },
];

interface FaqSectionProps {
  showTitle?: boolean;
  initialFaqs?: FAQ[];
}

export function FaqSection({ showTitle = true, initialFaqs }: FaqSectionProps) {
  const [faqs, setFaqs] = useState<FAQ[]>(initialFaqs || []);
  const [loading, setLoading] = useState<boolean>(!initialFaqs || initialFaqs.length === 0);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  useEffect(() => {
    if (initialFaqs && initialFaqs.length > 0) {
      setFaqs(initialFaqs);
      setOpenFaqId(initialFaqs[0]?.id || null);
      setLoading(false);
    } else {
      fetchPublicFaqs();
    }
  }, [initialFaqs]);

  const fetchPublicFaqs = async () => {
    try {
      const res = await fetch('/api/faqs');
      const data = await res.json();
      if (data.success && Array.isArray(data.faqs)) {
        setFaqs(data.faqs);
        if (data.faqs.length > 0) {
          setOpenFaqId(data.faqs[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load database FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      // Exclude inactive or unpublished FAQs on public component
      if (!faq.is_active || !faq.is_published) return false;

      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [faqs, activeCategory, searchQuery]);

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  // Structured Data JSON-LD Schema generated dynamically from the exact DB FAQs displayed on page
  const faqSchema = useMemo(() => {
    const publicDisplayedFaqs = faqs.filter(f => f.is_active && f.is_published);
    if (publicDisplayedFaqs.length === 0) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: publicDisplayedFaqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }, [faqs]);

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-surface via-surface-muted/40 to-surface">
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto space-y-8">
        {/* Section Header */}
        {showTitle && (
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-light text-brand tracking-wider uppercase">
              <HelpCircle className="w-3.5 h-3.5" />
              Frequently Asked Questions
            </span>
            <h2 className="font-display font-bold text-2xl sm:text-4xl text-text-main">
              Got Questions? We Have Answers.
            </h2>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Everything you need to know about Lagos same-day delivery, organic period care, discreet packaging, and payment methods.
            </p>
          </div>
        )}

        {/* Search Bar & Category Filter Bar */}
        <div className="space-y-4 max-w-3xl mx-auto">
          {/* Instant Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search questions (e.g., 'same-day delivery', 'discreet', 'returns', 'payment')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-surface rounded-2xl border border-border/80 text-xs sm:text-sm text-text-main placeholder:text-text-muted focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-text-muted hover:text-brand"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-brand text-white shadow-xs'
                      : 'bg-surface text-text-muted hover:text-text-main border border-border/70 hover:border-border'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accordion List */}
        <div className="max-w-3xl mx-auto space-y-3">
          {loading ? (
            <div className="text-center py-12 bg-surface rounded-2xl border border-border text-xs text-text-muted">
              Loading FAQs from database...
            </div>
          ) : filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen
                      ? 'bg-surface border-brand/40 shadow-xs'
                      : 'bg-surface border-border/70 hover:border-border'
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="font-display font-semibold text-xs sm:text-sm text-text-main leading-snug">
                      {faq.question}
                    </span>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'bg-brand-light text-brand rotate-180' : 'bg-surface-muted text-text-muted'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-text-body/90 leading-relaxed border-t border-border/40 whitespace-pre-line">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 bg-surface rounded-2xl border border-dashed border-border space-y-2">
              <p className="text-sm font-medium text-text-main">No matching questions found</p>
              <p className="text-xs text-text-muted">
                Try searching with different keywords or contact our WhatsApp concierge team.
              </p>
            </div>
          )}
        </div>

        {/* VIP WhatsApp Concierge Support Banner */}
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-emerald-900 via-brand-dark to-brand-dark text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md border border-emerald-500/20">
          <div className="space-y-1.5 text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <MessageCircle className="w-3.5 h-3.5" />
              Lagos Customer Concierge
            </span>
            <h3 className="font-display font-bold text-lg sm:text-xl text-white">
              Still Have Questions About Cycle Care or Your Order?
            </h3>
            <p className="text-xs sm:text-sm text-gray-300">
              Speak directly with our friendly Lagos wellness team on WhatsApp for instant guidance.
            </p>
          </div>

          <a
            href="https://wa.me/2348103641002"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-[1.02]"
          >
            <MessageCircle className="w-4 h-4" />
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
