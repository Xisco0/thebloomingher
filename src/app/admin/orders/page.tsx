'use client';

import React, { useState, useEffect } from 'react';
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs uppercase tracking-wider text-brand font-bold block mb-1">
            TheBloomingHer Management Console
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Orders & Payment Fulfilment
          </h1>
        </div>

        <button
          onClick={fetchOrders}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-surface hover:bg-surface-muted border border-border rounded-full text-xs font-semibold text-text-main shadow-subtle transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand' : ''}`} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface rounded-2xl p-5 border border-border/80 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            ₦
          </div>
          <div>
            <span className="text-xs text-text-muted">Total Verified Revenue</span>
            <div className="font-display font-bold text-xl text-text-main font-sans">
              {formatNaira(totalRevenue)}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-border/80 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-light text-brand flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-text-muted">Paid Orders</span>
            <div className="font-display font-bold text-xl text-brand font-sans">
              {paidCount} orders
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl p-5 border border-border/80 shadow-subtle flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-text-muted">Pending Verification</span>
            <div className="font-display font-bold text-xl text-amber-800 font-sans">
              {pendingCount} orders
            </div>
          </div>
        </div>
      </div>

      {/* Search & Status Filter Bar */}
      <div className="bg-surface rounded-2xl p-4 border border-border/80 shadow-subtle mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by order #, name, phone, ref..."
            className="w-full pl-9 pr-4 py-2 bg-surface-muted rounded-full border border-border text-xs text-text-main focus:outline-none focus:border-brand"
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
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.value
                  ? 'bg-brand text-white'
                  : 'bg-surface-muted text-text-body hover:bg-brand-light'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface rounded-3xl border border-border/80 shadow-subtle overflow-hidden">
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
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted">
                    No orders matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
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
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-border shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-main rounded-full hover:bg-surface-muted transition-colors"
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
                <span className="text-text-main block">{selectedOrder.customer_email}</span>
                <span className="text-text-main font-mono">{selectedOrder.customer_phone}</span>
              </div>
              <div>
                <span className="text-text-muted block">Payment Reference</span>
                <span className="font-mono font-bold text-brand block truncate">
                  {selectedOrder.paystack_reference || 'N/A (Direct Transfer)'}
                </span>
                <span className="text-text-muted block mt-2">Delivery Type & Address</span>
                <span className="text-text-main block">
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
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white border border-border flex-shrink-0">
                        <Image
                          src={item.image_url || ''}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-text-main">{item.product_name}</div>
                        {item.sku && <div className="text-[10px] text-text-muted font-mono">SKU: {item.sku}</div>}
                        <div className="text-[11px] text-text-muted">
                          Qty: {item.quantity} × {formatNaira(item.unit_price)}
                        </div>
                      </div>
                    </div>
                    <span className="font-bold font-sans text-brand">
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
        </div>
      )}
    </div>
  );
}
