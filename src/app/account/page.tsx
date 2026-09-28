'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  ShoppingBag,
  Package,
  MapPin,
  Phone,
  Mail,
  LogOut,
  Calendar,
  ChevronRight,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import { formatNaira } from '@/lib/utils';
import { Order } from '@/types';

interface SafeCustomer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: string;
  created_at: string;
}

export default function CustomerAccountDashboard() {
  const router = useRouter();
  const [customer, setCustomer] = useState<SafeCustomer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/customer/me');
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 401 || data.error === 'Unauthorized') {
          router.push('/account/login?redirect=/account');
          return;
        }
        throw new Error(data.error || 'Failed to load account information.');
      }

      setCustomer(data.customer);
      setOrders(data.orders || []);
      setEditForm({
        firstName: data.customer.first_name || '',
        lastName: data.customer.last_name || '',
        phone: data.customer.phone || '',
      });
    } catch (err: any) {
      if (err.message === 'Unauthorized') {
        router.push('/account/login?redirect=/account');
        return;
      }
      setError(err.message || 'Error loading account.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/customer/logout', { method: 'POST' });
      router.push('/account/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(null);

    try {
      const res = await fetch('/api/auth/customer/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: editForm.firstName,
          last_name: editForm.lastName,
          phone: editForm.phone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      setCustomer(data.customer);
      setIsEditing(false);
      setProfileSuccess('Your profile has been updated.');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Error updating profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const getStatusBadge = (status: string, isPayment = false) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'successful':
      case 'paid':
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {isPayment ? 'Payment Confirmed' : 'Delivered'}
          </span>
        );
      case 'processing':
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" /> {s === 'shipped' ? 'Dispatched' : 'Processing'}
          </span>
        );
      case 'pending':
      case 'payment_pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> {isPayment ? 'Payment Pending' : 'Order Placed'}
          </span>
        );
      case 'abandoned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <AlertCircle className="w-3 h-3 text-slate-500" /> Incomplete / Abandoned
          </span>
        );
      case 'failed':
      case 'payment_failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" /> {isPayment ? 'Payment Failed' : 'Failed'}
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <CheckCircle2 className="w-3 h-3 text-purple-600" /> Refunded
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-300">
            <AlertCircle className="w-3 h-3 text-gray-500" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-muted text-text-muted border border-border">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="text-xs text-text-muted">Loading your wellness dashboard...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border border-rose-200 text-xs">
          {error || 'Unable to load profile.'}
        </div>
        <Link
          href="/account/login"
          className="inline-block px-5 py-2.5 bg-brand text-white font-bold text-xs rounded-xl"
        >
          Return to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="w-[94%] sm:w-[90%] md:w-[85%] max-w-[85%] mx-auto py-10 sm:py-16 space-y-8">
      {/* Profile Header */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-light text-brand flex items-center justify-center font-display font-bold text-2xl">
            {customer.first_name?.[0] || 'T'}{customer.last_name?.[0] || 'B'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-xl sm:text-2xl text-text-main">
                {customer.first_name} {customer.last_name}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-light text-brand">
                Member
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> {customer.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href="/shop"
            className="flex-1 sm:flex-none px-4 py-2.5 bg-brand-light hover:bg-brand-light/80 text-brand font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" /> Shop Remedies
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-surface-muted hover:bg-surface-muted/80 text-text-muted hover:text-text-main font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-border"
          >
            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Sign Out
          </button>
        </div>
      </div>

      {profileSuccess && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{profileSuccess}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Account Details & Edit */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface rounded-3xl p-6 border border-border shadow-card space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-base text-text-main flex items-center gap-2">
                <User className="w-4 h-4 text-brand" /> Personal Info
              </h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.firstName}
                    onChange={e => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.lastName}
                    onChange={e => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-text-muted uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+234..."
                    className="w-full px-3 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main focus:outline-brand"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="flex-1 py-2 bg-brand text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                  >
                    {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-2 bg-surface-muted border border-border text-text-muted text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs divide-y divide-border">
                <div className="pt-2">
                  <span className="text-text-muted block text-[11px]">Full Name</span>
                  <span className="font-semibold text-text-main mt-0.5 block">
                    {customer.first_name} {customer.last_name}
                  </span>
                </div>
                <div className="pt-2">
                  <span className="text-text-muted block text-[11px]">Email Address</span>
                  <span className="font-semibold text-text-main mt-0.5 block">{customer.email}</span>
                </div>
                <div className="pt-2">
                  <span className="text-text-muted block text-[11px]">Phone Number</span>
                  <span className="font-semibold text-text-main mt-0.5 block">
                    {customer.phone || 'No phone number added'}
                  </span>
                </div>
                <div className="pt-2">
                  <span className="text-text-muted block text-[11px]">Member Since</span>
                  <span className="font-semibold text-text-main mt-0.5 block">
                    {new Date(customer.created_at).toLocaleDateString('en-NG', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-brand-light/40 rounded-3xl p-6 border border-brand/20 space-y-3">
            <h3 className="font-display font-bold text-sm text-brand">
              Need Wellness Guidance?
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Have questions about herbs, dosage, or cycle regularity? Our care consultants are ready to assist you.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand hover:underline pt-1"
            >
              Contact Care Team <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column: Order History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border shadow-card space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold text-lg text-text-main flex items-center gap-2">
                  <Package className="w-5 h-5 text-brand" /> Order History
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Track and review all your wellness remedies and delivery statuses.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-surface-muted text-text-muted font-bold text-xs rounded-full border border-border">
                {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-border rounded-2xl space-y-3">
                <ShoppingBag className="w-10 h-10 text-brand/40 mx-auto" />
                <h3 className="font-display font-bold text-sm text-text-main">No orders placed yet</h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  Explore our curated botanical remedies for hormonal balance, period ease, and vitality.
                </p>
                <Link
                  href="/shop"
                  className="inline-block mt-2 px-5 py-2.5 bg-brand hover:bg-brand-dark text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl border border-border hover:border-brand/30 transition-all bg-surface-muted/20 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
                      <div>
                        <span className="font-mono font-bold text-xs text-text-main">
                          Order #{order.order_number || order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-text-muted mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleDateString('en-NG', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.order_status, false)}
                        {order.payment_status && getStatusBadge(order.payment_status, true)}
                      </div>
                    </div>

                    {/* Items Summary */}
                    <div className="space-y-1.5">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-text-main truncate max-w-[280px]">
                            {item.quantity}x {item.product_name || 'Botanical Remedy'}
                          </span>
                          <span className="text-text-muted font-medium">
                            {formatNaira((item.unit_price || 0) * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                      <div>
                        <span className="text-text-muted text-[11px]">Total Paid: </span>
                        <span className="font-bold text-text-main">{formatNaira(order.total_amount)}</span>
                      </div>
                      <Link
                        href={`/order-confirmation/${order.order_number || order.id}`}
                        className="text-brand font-bold hover:underline flex items-center gap-1 text-xs"
                      >
                        View Order Details <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
