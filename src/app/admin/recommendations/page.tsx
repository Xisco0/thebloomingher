'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  Plus,
  Trash2,
  TrendingUp,
  ShoppingBag,
  MousePointerClick,
  Eye,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ProductRelationship,
  CoPurchaseAssociation,
  RecommendationMetrics,
  Product,
} from '@/types';

export default function AdminRecommendationsPage() {
  const [relationships, setRelationships] = useState<ProductRelationship[]>([]);
  const [coPurchases, setCoPurchases] = useState<CoPurchaseAssociation[]>([]);
  const [metrics, setMetrics] = useState<RecommendationMetrics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    source_product_id: '',
    target_product_id: '',
    relationship_type: 'frequently_bought_together' as any,
    priority_weight: 80,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, prodRes] = await Promise.all([
        fetch('/api/admin/recommendations'),
        fetch('/api/admin/products'),
      ]);
      const recData = await recRes.json();
      const prodData = await prodRes.json();

      if (recData.success) {
        setRelationships(recData.relationships || []);
        setCoPurchases(recData.coPurchases || []);
        setMetrics(recData.metrics || null);
      }
      if (prodData.success) {
        setProducts(prodData.products || []);
        if (prodData.products.length >= 2 && !formData.source_product_id) {
          setFormData({
            source_product_id: prodData.products[0].id,
            target_product_id: prodData.products[1].id,
            relationship_type: 'frequently_bought_together',
            priority_weight: 80,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load recommendation controls data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteRelationship = async (id: string) => {
    if (!window.confirm('Remove this product recommendation relationship?')) return;
    try {
      const res = await fetch(`/api/admin/recommendations?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setRelationships(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete relationship:', err);
    }
  };

  const handleCreateRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setRelationships(prev => [data.relationship, ...prev]);
        setShowModal(false);
      }
    } catch (err) {
      console.error('Failed to create relationship:', err);
    }
  };

  const getProductName = (id: string) => {
    const p = products.find(prod => prod.id === id);
    return p ? p.name : id;
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Recommendation Engine CMS
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Manage manual product pairings, view purchase associations from Nigerian orders, and track conversion impact.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 bg-surface hover:bg-surface-muted text-text-muted hover:text-brand border border-border rounded-xl transition-colors"
            title="Refresh engine data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Manual Pairing</span>
          </button>
        </div>
      </div>

      {/* KPI Performance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Impressions</span>
            <Eye className="w-4 h-4 text-brand" />
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-text-main">
            {metrics?.totalImpressions || 0}
          </p>
          <p className="text-[10px] text-text-muted mt-1">Widget views on PDP & Cart</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Recommendation Clicks</span>
            <MousePointerClick className="w-4 h-4 text-purple-600" />
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-purple-700">
            {metrics?.totalClicks || 0}
          </p>
          <p className="text-[10px] text-text-muted mt-1">Product discovery interactions</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Click-Through Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-emerald-700">
            {metrics?.clickThroughRate || 0}%
          </p>
          <p className="text-[10px] text-text-muted mt-1">Above industry benchmark (18%)</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Influenced Cart Adds</span>
            <ShoppingBag className="w-4 h-4 text-brand" />
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-brand">
            {metrics?.totalCartAdds || 0}
          </p>
          <p className="text-[10px] text-text-muted mt-1">Direct recommendation conversions</p>
        </div>
      </div>

      {/* New Relationship Modal */}
      {showModal && (
        <div className="bg-surface p-6 rounded-2xl border-2 border-brand/30 shadow-md space-y-4 max-w-2xl">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="font-display font-bold text-base text-text-main">
              Configure Product Recommendation Rule
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-xs text-text-muted hover:text-text-main font-semibold"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateRelationship} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-body mb-1">
                  Source Product (Current item viewed) *
                </label>
                <select
                  value={formData.source_product_id}
                  onChange={e => setFormData({ ...formData, source_product_id: e.target.value })}
                  className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-body mb-1">
                  Target Product (Recommended item) *
                </label>
                <select
                  value={formData.target_product_id}
                  onChange={e => setFormData({ ...formData, target_product_id: e.target.value })}
                  className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-text-body mb-1">
                  Relationship Type *
                </label>
                <select
                  value={formData.relationship_type}
                  onChange={e => setFormData({ ...formData, relationship_type: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand font-semibold"
                >
                  <option value="frequently_bought_together">Frequently Bought Together (Bundle)</option>
                  <option value="complementary">Complementary Routine Enhancement</option>
                  <option value="related">Related / Similar Product</option>
                  <option value="alternative">Recommended Alternative</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-body mb-1">
                  Priority Weight (1 - 100)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.priority_weight}
                  onChange={e => setFormData({ ...formData, priority_weight: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs font-mono font-bold text-text-main focus:outline-brand"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-border rounded-xl text-xs font-semibold text-text-body"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-brand text-white font-bold text-xs rounded-xl hover:bg-brand-dark"
              >
                Save Relationship
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Manual Relationships Table */}
      <div className="bg-surface rounded-2xl border border-border/80 shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-text-main">
              Configured Product Relationships
            </h2>
            <p className="text-xs text-text-muted">
              Manual administrative rules take highest priority (+50 boost) in recommendation ranking.
            </p>
          </div>
          <span className="text-xs text-text-muted font-mono">{relationships.length} rules active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-muted/50 text-text-muted uppercase tracking-wider font-semibold">
                <th className="py-3 px-3">Source Product (Viewing)</th>
                <th className="py-3 px-3">Relationship Type</th>
                <th className="py-3 px-3">Target Recommended Product</th>
                <th className="py-3 px-3">Weight</th>
                <th className="py-3 px-3">Origin</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {relationships.map(rel => (
                <tr key={rel.id} className="hover:bg-surface-muted/40 transition-colors">
                  <td className="py-3 px-3 font-semibold text-text-main max-w-xs truncate">
                    {getProductName(rel.source_product_id)}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-light text-brand">
                      {rel.relationship_type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-brand max-w-xs truncate">
                    {getProductName(rel.target_product_id)}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-text-main">
                    {rel.priority_weight}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {rel.is_manual ? 'Manual Admin' : 'Automated'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleDeleteRelationship(rel.id)}
                      className="p-1 text-text-muted hover:text-rose-600 rounded transition-colors"
                      title="Delete rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Automated Purchase Associations from Orders */}
      <div className="bg-surface rounded-2xl border border-border/80 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-base text-text-main flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              <span>Automated Co-Purchase Associations (Calculated from Orders)</span>
            </h2>
            <p className="text-xs text-text-muted">
              Dynamically derived associations between products frequently checked out together.
            </p>
          </div>
          <span className="text-xs text-brand font-bold">Purchase-based</span>
        </div>

        {coPurchases.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted bg-surface-muted/40 rounded-xl">
            No co-purchase pairs found in recent order data yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coPurchases.map((cp, idx) => (
              <div
                key={idx}
                className="p-4 bg-surface-muted/50 rounded-xl border border-border/80 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                    {cp.frequency} co-orders
                  </span>
                  <span className="text-text-muted text-[10px] font-mono">
                    Confidence: {(cp.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-bold text-text-main truncate">
                    {cp.source_product_name || cp.source_product_id}
                  </p>
                  <div className="flex items-center gap-1 text-text-muted text-[10px]">
                    <span>Pairs with</span>
                    <ArrowRight className="w-3 h-3 text-brand" />
                  </div>
                  <p className="font-bold text-brand truncate">
                    {cp.target_product_name || cp.target_product_id}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
