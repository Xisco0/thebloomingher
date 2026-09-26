'use client';

import React, { useState, useEffect } from 'react';
import { SmartCTA, CTADestinationType } from '@/types/marketing-cms.types';
import { Category, Product } from '@/types';
import { MarketingEvent } from '@/types/marketing-cms.types';

interface SmartCTASelectorProps {
  label: string;
  cta: SmartCTA;
  onChange: (cta: SmartCTA) => void;
  required?: boolean;
}

export function SmartCTASelector({
  label,
  cta,
  onChange,
  required = true,
}: SmartCTASelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<MarketingEvent[]>([]);

  useEffect(() => {
    // Fetch products, categories, events for quick selection
    Promise.all([
      fetch('/api/admin/products').then(r => r.json()).catch(() => ({ products: [] })),
      fetch('/api/admin/categories').then(r => r.json()).catch(() => ({ categories: [] })),
      fetch('/api/admin/marketing/events').then(r => r.json()).catch(() => ({ events: [] })),
    ]).then(([prodData, catData, eventData]) => {
      if (prodData?.products) setProducts(prodData.products);
      if (catData?.categories) setCategories(catData.categories);
      if (eventData?.events) setEvents(eventData.events);
    });
  }, []);

  const handleTypeChange = (type: CTADestinationType) => {
    let resolvedUrl = '/shop';
    let destId = '';

    if (type === 'product' && products.length > 0) {
      destId = products[0].id;
      resolvedUrl = `/products/${products[0].slug}`;
    } else if (type === 'category' && categories.length > 0) {
      destId = categories[0].slug;
      resolvedUrl = `/categories/${categories[0].slug}`;
    } else if (type === 'collection') {
      destId = 'bloomie-care';
      resolvedUrl = `/collections/bloomie-care`;
    } else if (type === 'event' && events.length > 0) {
      destId = events[0].id;
      resolvedUrl = `/events/${events[0].slug}`;
    } else if (type === 'custom_page') {
      resolvedUrl = '/products';
    } else if (type === 'external_url') {
      resolvedUrl = 'https://';
    }

    onChange({
      ...cta,
      destinationType: type,
      destinationId: destId,
      url: resolvedUrl,
    });
  };

  const handleDestinationSelect = (val: string) => {
    let url = cta.url;
    if (cta.destinationType === 'product') {
      const p = products.find(prod => prod.id === val);
      if (p) url = `/products/${p.slug}`;
    } else if (cta.destinationType === 'category') {
      url = `/categories/${val}`;
    } else if (cta.destinationType === 'collection') {
      url = `/collections/${val}`;
    } else if (cta.destinationType === 'event') {
      const ev = events.find(e => e.id === val);
      if (ev) url = `/events/${ev.slug}`;
    }

    onChange({
      ...cta,
      destinationId: val,
      url,
    });
  };

  return (
    <div className="space-y-3 p-4 bg-surface-muted/40 rounded-xl border border-border/80">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-text-main uppercase tracking-wider">
          {label} {required && <span className="text-brand">*</span>}
        </label>
        <span className="text-[10px] text-text-muted">Smart Destination Resolver</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* CTA Button Text */}
        <div>
          <span className="text-[11px] font-semibold text-text-muted block mb-1">Button Label</span>
          <input
            type="text"
            placeholder="e.g. Shop Now, Register Now"
            value={cta.text}
            onChange={e => onChange({ ...cta, text: e.target.value })}
            className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
            required={required}
          />
        </div>

        {/* Destination Type */}
        <div>
          <span className="text-[11px] font-semibold text-text-muted block mb-1">Target Destination</span>
          <select
            value={cta.destinationType}
            onChange={e => handleTypeChange(e.target.value as CTADestinationType)}
            className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
          >
            <option value="custom_page">Store Page (e.g. /shop, /about)</option>
            <option value="product">Specific Product</option>
            <option value="category">Product Category</option>
            <option value="collection">Curated Collection</option>
            <option value="event">Community Event</option>
            <option value="external_url">External URL / WhatsApp</option>
          </select>
        </div>
      </div>

      {/* Dynamic Item Selector based on Destination Type */}
      {cta.destinationType === 'product' && (
        <div>
          <span className="text-[11px] font-semibold text-text-muted block mb-1">Choose Product</span>
          <select
            value={cta.destinationId || ''}
            onChange={e => handleDestinationSelect(e.target.value)}
            className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} (₦{p.price.toLocaleString()})
              </option>
            ))}
          </select>
        </div>
      )}

      {cta.destinationType === 'category' && (
        <div>
          <span className="text-[11px] font-semibold text-text-muted block mb-1">Choose Category</span>
          <select
            value={cta.destinationId || ''}
            onChange={e => handleDestinationSelect(e.target.value)}
            className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
          >
            {categories.map(c => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {cta.destinationType === 'collection' && (
        <div>
          <span className="text-[11px] font-semibold text-text-muted block mb-1">Choose Collection</span>
          <select
            value={cta.destinationId || 'bloomie-care'}
            onChange={e => handleDestinationSelect(e.target.value)}
            className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
          >
            <option value="bloomie-care">Bloomie Care Box</option>
            <option value="under-10k-finds">Under ₦10,000 Essentials</option>
            <option value="period-essentials">Period Care Essentials</option>
            <option value="cramp-relief">Cramp Relief & Comfort</option>
          </select>
        </div>
      )}

      {cta.destinationType === 'event' && (
        <div>
          <span className="text-[11px] font-semibold text-text-muted block mb-1">Choose Event</span>
          <select
            value={cta.destinationId || ''}
            onChange={e => handleDestinationSelect(e.target.value)}
            className="w-full px-3 py-2 bg-surface rounded-xl border border-border text-xs text-text-main focus:outline-none focus:border-brand"
          >
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.name} ({ev.event_date})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Resolved URL Preview & Custom Override */}
      <div>
        <span className="text-[11px] font-semibold text-text-muted block mb-1">
          Final Destination URL {cta.destinationType === 'custom_page' || cta.destinationType === 'external_url' ? '(Editable)' : '(Resolved)'}
        </span>
        <input
          type="text"
          value={cta.url}
          onChange={e => onChange({ ...cta, url: e.target.value })}
          placeholder="/shop or https://..."
          readOnly={cta.destinationType !== 'custom_page' && cta.destinationType !== 'external_url'}
          className={`w-full px-3 py-2 rounded-xl border border-border text-xs font-mono ${
            cta.destinationType === 'custom_page' || cta.destinationType === 'external_url'
              ? 'bg-surface text-text-main focus:outline-none focus:border-brand'
              : 'bg-surface-muted text-text-muted cursor-not-allowed'
          }`}
        />
      </div>
    </div>
  );
}
