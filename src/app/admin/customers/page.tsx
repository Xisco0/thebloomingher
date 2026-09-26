'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  ShoppingBag,
  TrendingUp,
  RefreshCw,
  Award,
} from 'lucide-react';
import { CustomerProfile } from '@/types/cms.types';
import { formatNaira } from '@/lib/utils/currency';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const totalSpentAll = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalOrdersAll = customers.reduce((sum, c) => sum + c.ordersCount, 0);

  const filteredCustomers = customers.filter(c =>
    c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            Customer Directory
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Buyer profiles, cumulative order history, and direct WhatsApp / email customer support.
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          disabled={loading}
          className="self-start sm:self-auto p-2.5 bg-surface hover:bg-surface-muted text-text-muted hover:text-brand border border-border rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Customers</span>
            <Users className="w-4 h-4 text-brand" />
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-text-main">
            {customers.length} Shoppers
          </p>
          <p className="text-[10px] text-text-muted mt-1">Across Nigeria</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Customer Lifetime Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-emerald-700">
            {formatNaira(totalSpentAll)}
          </p>
          <p className="text-[10px] text-text-muted mt-1">Total revenue generated</p>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-border/80 shadow-xs">
          <div className="flex items-center justify-between text-text-muted mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-purple-600" />
          </div>
          <p className="font-display font-bold text-xl sm:text-2xl text-text-main">
            {totalOrdersAll} Orders
          </p>
          <p className="text-[10px] text-text-muted mt-1">
            Avg {customers.length > 0 ? (totalOrdersAll / customers.length).toFixed(1) : 0} orders / buyer
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-border/80 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search customer by name, email, or phone number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-muted/40 border border-border rounded-xl text-xs text-text-main placeholder:text-text-muted focus:outline-brand"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-surface rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-muted/50 text-text-muted uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Total Orders</th>
                <th className="py-3.5 px-4">Lifetime Spend</th>
                <th className="py-3.5 px-4">Last Order Date</th>
                <th className="py-3.5 px-4 text-right">Quick Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => {
                  const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
                  const waNumber = cleanPhone.startsWith('0')
                    ? `234${cleanPhone.slice(1)}`
                    : cleanPhone;

                  return (
                    <tr key={customer.id} className="hover:bg-surface-muted/40 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-light text-brand font-bold text-xs flex items-center justify-center">
                            {customer.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-text-main">{customer.fullName}</p>
                            {customer.totalSpent > 30000 && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                <Award className="w-2.5 h-2.5" /> VIP Buyer
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-text-body font-mono">
                            <Mail className="w-3 h-3 text-text-muted" />
                            <span>{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-text-muted font-mono text-[10px]">
                            <Phone className="w-3 h-3 text-text-muted" />
                            <span>{customer.phone}</span>
                          </div>
                        </div>
                      </td>

                      {/* Orders Count */}
                      <td className="py-3.5 px-4 font-bold text-text-main">
                        {customer.ordersCount} {customer.ordersCount === 1 ? 'order' : 'orders'}
                      </td>

                      {/* Lifetime Spend */}
                      <td className="py-3.5 px-4 font-display font-bold text-emerald-700">
                        {formatNaira(customer.totalSpent)}
                      </td>

                      {/* Last Order Date */}
                      <td className="py-3.5 px-4 text-text-muted text-[11px]">
                        {customer.lastOrderDate
                          ? new Date(customer.lastOrderDate).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <a
                            href={`https://wa.me/${waNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors border border-emerald-200"
                            title="Message on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`mailto:${customer.email}`}
                            className="p-1.5 bg-surface hover:bg-surface-muted text-text-body rounded-lg transition-colors border border-border"
                            title="Send Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
