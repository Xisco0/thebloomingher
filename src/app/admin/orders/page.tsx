'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  Eye,
  X,
  Search,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Building2,
  DollarSign,
  RotateCcw,
  Ban,
  FileText,
} from 'lucide-react';
import { Order, OrderStatus, PaymentStatus, PaymentRecord } from '@/types';
import { formatNaira } from '@/lib/utils/currency';

export default function AdminOrdersPage() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Refund Modal State
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
        if (data.payments) {
          setPayments(data.payments);
        }
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, orderStatus: newStatus }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setOrders(prev => prev.map(o => (o.id === orderId ? data.order : o)));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order);
        }
      }
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setRefundLoading(true);
    setRefundError('');
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          action: 'refund',
          refundAmount: refundAmount ? parseFloat(refundAmount) : selectedOrder.total_amount,
          reason: refundReason || 'Customer requested refund',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.order) {
        setOrders(prev => prev.map(o => (o.id === selectedOrder.id ? data.order : o)));
        setSelectedOrder(data.order);
        setIsRefunding(false);
        setRefundAmount('');
        setRefundReason('');
      } else {
        setRefundError(data.error || 'Failed to record refund.');
      }
    } catch (err: any) {
      setRefundError(err.message || 'Error processing refund.');
    } finally {
      setRefundLoading(false);
    }
  };

  // Metrics Calculations
  const successfulOrders = orders.filter(
    o => o.payment_status === 'successful' || o.payment_status === 'paid'
  );
  const totalRevenue = successfulOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const pendingOrders = orders.filter(
    o => o.payment_status === 'pending' || o.payment_status === 'payment_pending'
  );
  const abandonedOrders = orders.filter(o => o.payment_status === 'abandoned');
  const refundedOrders = orders.filter(o => o.payment_status === 'refunded');
  const failedOrders = orders.filter(
    o => o.payment_status === 'failed' || o.payment_status === 'payment_failed'
  );

  // Filtered List
  const filteredOrders = orders.filter(order => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      order.order_number.toLowerCase().includes(s) ||
      order.customer_name.toLowerCase().includes(s) ||
      order.customer_phone.includes(searchTerm) ||
      order.customer_email.toLowerCase().includes(s) ||
      (order.payment_reference && order.payment_reference.toLowerCase().includes(s)) ||
      (order.flutterwave_reference && order.flutterwave_reference.toLowerCase().includes(s)) ||
      (order.paystack_reference && order.paystack_reference.toLowerCase().includes(s));

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'successful')
      return order.payment_status === 'successful' || order.payment_status === 'paid';
    if (statusFilter === 'pending')
      return order.payment_status === 'pending' || order.payment_status === 'payment_pending';
    if (statusFilter === 'abandoned') return order.payment_status === 'abandoned';
    if (statusFilter === 'failed')
      return order.payment_status === 'failed' || order.payment_status === 'payment_failed';
    if (statusFilter === 'refunded') return order.payment_status === 'refunded';
    if (statusFilter === 'processing') return order.order_status === 'processing';
    if (statusFilter === 'shipped') return order.order_status === 'shipped';
    if (statusFilter === 'delivered') return order.order_status === 'delivered';
    return true;
  });

  const getPaymentStatusBadge = (status: PaymentStatus | string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'successful':
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-[11px] border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Successful</span>
          </span>
        );
      case 'pending':
      case 'payment_pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 font-semibold text-[11px] border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Pending</span>
          </span>
        );
      case 'abandoned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-semibold text-[11px] border border-slate-300">
            <AlertCircle className="w-3 h-3 text-slate-500" />
            <span>Abandoned</span>
          </span>
        );
      case 'failed':
      case 'payment_failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 font-semibold text-[11px] border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Failed</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 font-semibold text-[11px] border border-purple-200">
            <RotateCcw className="w-3 h-3 text-purple-600" />
            <span>Refunded</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 font-semibold text-[11px] border border-gray-300">
            <Ban className="w-3 h-3 text-gray-500" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-muted text-text-muted font-semibold text-[11px] border border-border">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Orders & Payments
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Real-time transaction lifecycle, gateway verifications, and order fulfillment.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-surface hover:bg-surface-muted border border-border rounded-full text-xs font-semibold text-text-main shadow-subtle transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Metrics Cards: Real-Time Payment Lifecycle Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Verified Revenue */}
        <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border/80 shadow-subtle flex items-center gap-3.5 col-span-2 lg:col-span-1">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg shrink-0">
            ₦
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-text-muted block truncate">Verified Revenue</span>
            <div className="font-display font-bold text-base sm:text-lg text-text-main font-sans truncate">
              {formatNaira(totalRevenue)}
            </div>
          </div>
        </div>

        {/* Successful */}
        <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border/80 shadow-subtle flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-text-muted block truncate">Successful</span>
            <div className="font-display font-bold text-base sm:text-lg text-emerald-800 font-sans truncate">
              {successfulOrders.length}
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border/80 shadow-subtle flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-text-muted block truncate">Pending</span>
            <div className="font-display font-bold text-base sm:text-lg text-amber-800 font-sans truncate">
              {pendingOrders.length}
            </div>
          </div>
        </div>

        {/* Abandoned */}
        <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border/80 shadow-subtle flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-text-muted block truncate">Abandoned</span>
            <div className="font-display font-bold text-base sm:text-lg text-slate-700 font-sans truncate">
              {abandonedOrders.length}
            </div>
          </div>
        </div>

        {/* Refunded */}
        <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border/80 shadow-subtle flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-text-muted block truncate">Refunded</span>
            <div className="font-display font-bold text-base sm:text-lg text-purple-800 font-sans truncate">
              {refundedOrders.length}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="bg-surface rounded-2xl p-3 sm:p-4 border border-border/80 shadow-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search order #, customer, reference..."
            className="w-full pl-9 pr-4 py-2.5 bg-surface-muted rounded-full border border-border text-xs text-text-main focus:outline-none focus:border-brand min-h-[44px]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
          {[
            { label: 'All', value: 'all' },
            { label: `Successful (${successfulOrders.length})`, value: 'successful' },
            { label: `Pending (${pendingOrders.length})`, value: 'pending' },
            { label: `Abandoned (${abandonedOrders.length})`, value: 'abandoned' },
            { label: `Failed (${failedOrders.length})`, value: 'failed' },
            { label: `Refunded (${refundedOrders.length})`, value: 'refunded' },
            { label: 'Delivered', value: 'delivered' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-2 min-h-[38px] rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.value
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-surface-muted text-text-body hover:bg-brand-light'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-border/80 p-8 sm:p-16 text-center shadow-subtle">
          <div className="max-w-sm mx-auto space-y-2">
            <div className="w-12 h-12 rounded-full bg-brand-light/50 text-brand flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-text-main">
              {searchTerm || statusFilter !== 'all' ? 'No matching orders found' : 'No orders recorded yet'}
            </p>
            <p className="text-xs text-text-muted">
              {searchTerm || statusFilter !== 'all'
                ? 'Try clearing your search keyword or selected status filter.'
                : 'Customer transactions and order history will automatically stream here in real time.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Orders Table */}
          <div className="bg-surface rounded-3xl border border-border/80 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted border-b border-border/80 text-text-muted uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Order & Ref #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Payment Status</th>
                    <th className="py-3.5 px-4">Fulfillment Status</th>
                    <th className="py-3.5 px-4">Gateway</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-brand-light/20 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-brand block">
                          {order.order_number}
                        </span>
                        <span className="font-mono text-[10px] text-text-muted truncate max-w-[140px] block">
                          {order.payment_reference || '—'}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-text-main">{order.customer_name}</div>
                        <div className="text-[11px] text-text-muted">{order.customer_phone}</div>
                      </td>

                      <td className="py-4 px-4 font-bold text-text-main font-sans">
                        {formatNaira(order.total_amount)}
                      </td>

                      <td className="py-4 px-4">
                        {getPaymentStatusBadge(order.payment_status)}
                      </td>

                      <td className="py-4 px-4">
                        <select
                          value={order.order_status}
                          onChange={e =>
                            handleStatusChange(order.id, e.target.value as OrderStatus)
                          }
                          disabled={updatingId === order.id}
                          className="px-2.5 py-1 rounded-lg border border-border bg-surface text-text-main text-xs focus:outline-none focus:border-brand cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-surface-muted text-text-body font-medium text-[10px] uppercase border border-border">
                          {order.payment_provider || 'Flutterwave'}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-text-muted whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsRefunding(false);
                          }}
                          className="p-2 rounded-xl text-brand bg-brand-light/40 hover:bg-brand hover:text-white transition-all cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                          title="Inspect Payment and Order Audit"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Comprehensive Order & Payment Audit Inspection Modal */}
      {mounted && selectedOrder && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 flex flex-col items-center justify-start sm:justify-center">
          <div className="bg-surface rounded-3xl p-5 sm:p-8 max-w-2xl w-full border border-border shadow-2xl relative max-h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-4rem)] overflow-y-auto my-auto space-y-5 sm:space-y-6 animate-in fade-in zoom-in-95 duration-200 shrink-0">
            <button
              onClick={() => {
                setSelectedOrder(null);
                setIsRefunding(false);
              }}
              className="absolute top-4 right-4 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-text-main rounded-full hover:bg-surface-muted transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-brand font-bold">
                  Transaction Audit & Order Details
                </span>
                {getPaymentStatusBadge(selectedOrder.payment_status)}
              </div>
              <h3 className="font-display font-bold text-xl sm:text-2xl text-text-main mt-0.5">
                {selectedOrder.order_number}
              </h3>
              <p className="text-xs text-text-muted">
                Initiated: {new Date(selectedOrder.created_at).toLocaleString()}
              </p>
            </div>

            {/* Payment Lifecycle Information Grid */}
            <div className="bg-surface-muted/60 p-4 sm:p-5 rounded-2xl border border-border space-y-3 text-xs">
              <h4 className="font-bold text-text-main flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <ShieldCheck className="w-4 h-4 text-brand" />
                Payment Gateway & Security Audit
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-text-muted block text-[11px]">Payment Reference</span>
                  <span className="font-mono font-bold text-brand break-all">
                    {selectedOrder.payment_reference || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px]">Payment Provider</span>
                  <span className="font-semibold text-text-main capitalize">
                    {selectedOrder.payment_provider || 'Flutterwave'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px]">Gateway Transaction ID</span>
                  <span className="font-mono text-text-main">
                    {selectedOrder.flutterwave_transaction_id || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted block text-[11px]">Payment Channel</span>
                  <span className="text-text-main capitalize">
                    {selectedOrder.payment_channel || 'Card / Webhook'}
                  </span>
                </div>
                {selectedOrder.paid_at && (
                  <div>
                    <span className="text-text-muted block text-[11px]">Confirmed Paid At</span>
                    <span className="text-emerald-700 font-medium">
                      {new Date(selectedOrder.paid_at).toLocaleString()}
                    </span>
                  </div>
                )}
                {selectedOrder.abandoned_at && (
                  <div>
                    <span className="text-text-muted block text-[11px]">Marked Abandoned At</span>
                    <span className="text-slate-600 font-medium">
                      {new Date(selectedOrder.abandoned_at).toLocaleString()}
                    </span>
                  </div>
                )}
                {selectedOrder.refunded_at && (
                  <div className="col-span-2 bg-purple-50 p-3 rounded-xl border border-purple-200">
                    <span className="text-purple-900 font-bold block text-xs">
                      Refund Information
                    </span>
                    <p className="text-purple-800 text-[11px] mt-0.5">
                      Refunded: {formatNaira(selectedOrder.refund_amount || selectedOrder.total_amount)} on {new Date(selectedOrder.refunded_at).toLocaleString()}
                    </p>
                    {selectedOrder.refund_reason && (
                      <p className="text-purple-700 text-[10px] italic mt-0.5">
                        Reason: {selectedOrder.refund_reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Customer & Delivery Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-surface p-4 rounded-2xl border border-border">
              <div>
                <span className="text-text-muted block text-[11px]">Customer Contact</span>
                <span className="font-bold text-text-main block">{selectedOrder.customer_name}</span>
                <span className="text-text-muted block mt-1">{selectedOrder.customer_email}</span>
                <span className="font-mono text-text-main block">{selectedOrder.customer_phone}</span>
              </div>
              <div>
                <span className="text-text-muted block text-[11px]">Delivery Destination</span>
                <span className="text-text-main font-medium block">
                  {selectedOrder.delivery_type === 'pickup'
                    ? 'Store Pickup: 30 Clem Rd, Ifako-Ijaiye, Lagos'
                    : `${selectedOrder.shipping_address.street}, ${selectedOrder.shipping_address.city || ''}, ${selectedOrder.shipping_address.state}`}
                </span>
                {selectedOrder.shipping_address.deliveryInstructions && (
                  <p className="text-text-muted text-[10px] mt-1 italic">
                    Note: {selectedOrder.shipping_address.deliveryInstructions}
                  </p>
                )}
              </div>
            </div>

            {/* Purchased Items List */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-text-main">
                Order Items ({selectedOrder.items.length})
              </h4>
              <div className="divide-y divide-border/60 max-h-48 overflow-y-auto pr-1">
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="py-2 flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white border border-border shrink-0">
                        <Image
                          src={item.image_url || '/images/logo.jpg'}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-text-main truncate">{item.product_name}</div>
                        <div className="text-[10px] text-text-muted">
                          Qty: {item.quantity} × {formatNaira(item.unit_price)}
                        </div>
                      </div>
                    </div>
                    <span className="font-bold font-sans text-brand shrink-0">
                      {formatNaira(item.total_price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="pt-3 border-t border-border text-xs space-y-1">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal:</span>
                <span>{formatNaira(selectedOrder.subtotal_amount)}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Delivery Fee:</span>
                <span>{formatNaira(selectedOrder.delivery_fee)}</span>
              </div>
              {selectedOrder.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount:</span>
                  <span>-{formatNaira(selectedOrder.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-text-main pt-1.5 border-t border-border">
                <span>Order Total:</span>
                <span className="text-brand text-base">{formatNaira(selectedOrder.total_amount)}</span>
              </div>
            </div>

            {/* Admin Refund Drawer (If order is successful and not yet refunded) */}
            {(selectedOrder.payment_status === 'successful' || selectedOrder.payment_status === 'paid') && (
              <div className="pt-2 border-t border-border">
                {!isRefunding ? (
                  <button
                    type="button"
                    onClick={() => setIsRefunding(true)}
                    className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Record Order Refund</span>
                  </button>
                ) : (
                  <form onSubmit={handleProcessRefund} className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-900">Record Transaction Refund</span>
                      <button
                        type="button"
                        onClick={() => setIsRefunding(false)}
                        className="text-text-muted hover:text-text-main text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>

                    {refundError && (
                      <p className="text-red-700 text-[11px] font-medium">{refundError}</p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block font-medium text-purple-950 mb-1">Refund Amount (₦)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder={selectedOrder.total_amount.toString()}
                          value={refundAmount}
                          onChange={e => setRefundAmount(e.target.value)}
                          className="w-full px-3 py-2 bg-surface rounded-xl border border-purple-200 text-xs text-text-main"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-purple-950 mb-1">Refund Reason</label>
                        <input
                          type="text"
                          placeholder="e.g. Customer return, stock adjustment"
                          value={refundReason}
                          onChange={e => setRefundReason(e.target.value)}
                          className="w-full px-3 py-2 bg-surface rounded-xl border border-purple-200 text-xs text-text-main"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={refundLoading}
                      className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
                    >
                      {refundLoading ? 'Recording Refund...' : 'Confirm and Mark Refunded'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
