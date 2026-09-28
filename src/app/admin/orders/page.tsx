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
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { formatNaira } from '@/lib/utils/currency';

export default function AdminOrdersPage() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  // Metrics
  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + o.total_amount, 0);
  const paidCount = orders.filter(o => o.payment_status === 'paid').length;
  const pendingCount = orders.filter(o => o.payment_status === 'payment_pending').length;

  // Filtered list
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm) ||
      (order.paystack_reference && order.paystack_reference.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'paid') return matchesSearch && order.payment_status === 'paid';
    if (statusFilter === 'pending') return matchesSearch && order.payment_status === 'payment_pending';
    if (statusFilter === 'processing') return matchesSearch && order.order_status === 'processing';
    if (statusFilter === 'shipped') return matchesSearch && order.order_status === 'shipped';
    if (statusFilter === 'delivered') return matchesSearch && order.order_status === 'delivered';
    return matchesSearch;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Orders
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            View customer purchases, payment details, and update delivery status.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-surface hover:bg-surface-muted border border-border rounded-full text-xs font-semibold text-text-main shadow-subtle transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border/80 shadow-subtle flex items-center gap-3.5 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
            ₦
          </div>
          <div className="min-w-0">
            <span className="text-xs text-text-muted block truncate">Total Verified Revenue</span>
            <div className="font-display font-bold text-lg sm:text-xl text-text-main font-sans truncate">
              {formatNaira(totalRevenue)}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border/80 shadow-subtle flex items-center gap-3.5 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-brand-light text-brand flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-text-muted block truncate">Paid Orders</span>
            <div className="font-display font-bold text-lg sm:text-xl text-brand font-sans truncate">
              {paidCount} orders
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border/80 shadow-subtle flex items-center gap-3.5 sm:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-text-muted block truncate">Pending Verification</span>
            <div className="font-display font-bold text-lg sm:text-xl text-amber-800 font-sans truncate">
              {pendingCount} orders
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
            placeholder="Search by order # or customer..."
            className="w-full pl-9 pr-4 py-2.5 bg-surface-muted rounded-full border border-border text-xs text-text-main focus:outline-none focus:border-brand min-h-[44px]"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
          {[
            { label: 'All', value: 'all' },
            { label: 'Paid', value: 'paid' },
            { label: 'Pending', value: 'pending' },
            { label: 'Processing', value: 'processing' },
            { label: 'Shipped', value: 'shipped' },
            { label: 'Delivered', value: 'delivered' },
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-2 min-h-[38px] rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
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
              {searchTerm || statusFilter !== 'all' ? 'No matching orders' : 'No orders yet'}
            </p>
            <p className="text-xs text-text-muted">
              {searchTerm || statusFilter !== 'all'
                ? 'Try clearing your search or status filter.'
                : 'When customers place orders on your store, they will appear here.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Cards List (< md) */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map(order => (
              <div
                key={order.id}
                className="bg-surface rounded-2xl p-4 border border-border/80 shadow-subtle space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono font-bold text-xs text-brand">
                      {order.order_number}
                    </div>
                    <div className="font-semibold text-sm text-text-main mt-0.5">
                      {order.customer_name}
                    </div>
                    <div className="text-[11px] text-text-muted">{order.customer_phone}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-sans text-sm text-text-main">
                      {formatNaira(order.total_amount)}
                    </div>
                    <div className="text-[10px] text-text-muted mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {order.payment_status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-[10px]">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Paid</span>
                      </span>
                    ) : order.payment_status === 'payment_failed' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-800 font-semibold text-[10px]">
                        <AlertCircle className="w-2.5 h-2.5 text-red-600" />
                        <span>Failed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold text-[10px]">
                        <Clock className="w-2.5 h-2.5 text-amber-600" />
                        <span>Pending</span>
                      </span>
                    )}

                    <span className="text-[11px] text-text-muted">
                      {order.delivery_type === 'pickup' ? 'Pickup' : order.shipping_address.state}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={order.order_status}
                      onChange={e =>
                        handleStatusChange(order.id, e.target.value as OrderStatus)
                      }
                      disabled={updatingId === order.id}
                      className="px-2 py-1 rounded-lg border border-border bg-surface text-text-main text-[11px] focus:outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-text-muted hover:text-brand hover:bg-brand-light transition-colors"
                      title="View order details"
                      aria-label={`View order ${order.order_number}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Orders Table (md+) */}
          <div className="hidden md:block bg-surface rounded-3xl border border-border/80 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted border-b border-border/80 text-text-muted uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Destination</th>
                    <th className="py-3.5 px-4">Total Amount</th>
                    <th className="py-3.5 px-4">Payment Status</th>
                    <th className="py-3.5 px-4">Fulfilment Status</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-brand-light/20 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-brand">
                        {order.order_number}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-text-main">{order.customer_name}</div>
                        <div className="text-[11px] text-text-muted">{order.customer_phone}</div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-medium text-text-body">
                          {order.delivery_type === 'pickup' ? 'Store Pickup (Ifako-Ijaiye)' : order.shipping_address.state}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-bold text-text-main font-sans">
                        {formatNaira(order.total_amount)}
                      </td>

                      <td className="py-4 px-4">
                        {order.payment_status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Paid</span>
                          </span>
                        ) : order.payment_status === 'payment_failed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-800 font-semibold text-[11px]">
                            <AlertCircle className="w-3 h-3 text-red-600" />
                            <span>Failed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 font-semibold text-[11px]">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending</span>
                          </span>
                        )}
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
                        </select>
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
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-brand hover:bg-brand-light transition-colors"
                          title="View order details"
                          aria-label={`View order ${order.order_number}`}
                        >
                          <Eye className="w-4 h-4" />
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

      {/* Order Detail Modal */}
      {mounted && selectedOrder && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 flex flex-col items-center justify-start sm:justify-center">
          <div className="bg-surface rounded-3xl p-5 sm:p-8 max-w-2xl w-full border border-border shadow-2xl relative max-h-[calc(100dvh-2.5rem)] sm:max-h-[calc(100dvh-4rem)] overflow-y-auto my-auto space-y-5 sm:space-y-6 animate-in fade-in zoom-in-95 duration-200 flex-shrink-0">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-text-muted hover:text-text-main rounded-full hover:bg-surface-muted transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs uppercase tracking-wider text-brand font-bold block">
                Order Snapshot
              </span>
              <h3 className="font-display font-bold text-xl text-text-main">
                {selectedOrder.order_number}
              </h3>
              <p className="text-xs text-text-muted">
                Placed on {new Date(selectedOrder.created_at).toLocaleString()}
              </p>
            </div>

            {/* Customer & Payment Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-surface-muted p-4 rounded-2xl border border-border">
              <div>
                <span className="text-text-muted block">Customer Name</span>
                <span className="font-bold text-text-main">{selectedOrder.customer_name}</span>
                <span className="text-text-muted block mt-2">Email & Phone</span>
                <span className="text-text-main block break-all">{selectedOrder.customer_email}</span>
                <span className="text-text-main font-mono">{selectedOrder.customer_phone}</span>
              </div>
              <div>
                <span className="text-text-muted block">Payment Reference</span>
                <span className="font-mono font-bold text-brand block truncate">
                  {selectedOrder.paystack_reference || 'N/A (Direct Transfer)'}
                </span>
                <span className="text-text-muted block mt-2">Delivery Type & Address</span>
                <span className="text-text-main block break-words">
                  {selectedOrder.delivery_type === 'pickup'
                    ? 'Store Pickup: 30 Clem Rd, Ifako-Ijaiye'
                    : `${selectedOrder.shipping_address.street}, ${selectedOrder.shipping_address.state}`}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-text-main">
                Purchased Items ({selectedOrder.items.length})
              </h4>
              <div className="divide-y divide-border/60">
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white border border-border flex-shrink-0">
                        <Image
                          src={item.image_url || ''}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-text-main truncate">{item.product_name}</div>
                        {item.sku && <div className="text-[10px] text-text-muted font-mono truncate">SKU: {item.sku}</div>}
                        <div className="text-[11px] text-text-muted">
                          Qty: {item.quantity} × {formatNaira(item.unit_price)}
                        </div>
                      </div>
                    </div>
                    <span className="font-bold font-sans text-brand flex-shrink-0">
                      {formatNaira(item.total_price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Math */}
            <div className="pt-3 border-t border-border text-xs space-y-1.5">
              <div className="flex justify-between text-text-muted">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatNaira(selectedOrder.subtotal_amount)}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Delivery Fee:</span>
                <span className="font-semibold">{formatNaira(selectedOrder.delivery_fee)}</span>
              </div>
              {selectedOrder.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount:</span>
                  <span>-{formatNaira(selectedOrder.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-text-main pt-1 border-t border-border">
                <span>Grand Total:</span>
                <span className="text-brand text-base">{formatNaira(selectedOrder.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
