'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, MessageCircle, ArrowRight, Truck, MapPin } from 'lucide-react';
import { orderService } from '@/services';
import { Order } from '@/types';
import { formatNaira } from '@/lib/utils/currency';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order_id');
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function loadOrder() {
      if (orderNumber) {
        const found = await orderService.getOrderByNumber(orderNumber);
        setOrder(found);
      }
    }
    loadOrder();
  }, [orderNumber]);

  const whatsappMessage = order
    ? `Hello TheBloomingHer! 🌸\nI just placed an order:\n\n*Order Number:* ${order.order_number}\n*Name:* ${order.customer_name}\n*Total:* ₦${order.total_amount.toLocaleString()}\n*Delivery:* ${order.delivery_type === 'pickup' ? 'Store Pickup (30 Clem Rd)' : order.shipping_address.street}\n\nPlease confirm my order. Thank you!`
    : `Hello TheBloomingHer! 🌸 I just placed an order #${orderNumber}. Please confirm my details.`;

  const whatsappUrl = `https://wa.me/2348103641002?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="bg-surface rounded-3xl p-8 sm:p-12 border border-border shadow-elevated space-y-6">
      {/* Animated Checkmark Badge */}
      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div>
        <span className="text-xs uppercase tracking-wider text-brand font-bold block mb-1">
          Order Confirmed!
        </span>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
          Thank you, {order?.customer_name || 'Valued Customer'}!
        </h1>
        <p className="text-sm text-text-muted mt-2 max-w-md mx-auto">
          Your order has been received and is being prepared with intention and care.
        </p>
      </div>

      {/* Order Reference Card */}
      <div className="bg-brand-light/50 rounded-2xl p-4 sm:p-6 border border-brand/20 text-left max-w-lg mx-auto space-y-3">
        <div className="flex justify-between items-center text-xs pb-3 border-b border-brand/20">
          <span className="text-text-muted">Order Number</span>
          <span className="font-mono font-bold text-sm text-brand">{orderNumber || 'TBH-2609-XXXX'}</span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="text-text-muted">Payment Status</span>
          <span className="font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            Received & Processing
          </span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="text-text-muted">Delivery Type</span>
          <span className="font-medium text-text-main flex items-center gap-1">
            {order?.delivery_type === 'pickup' ? (
              <>
                <MapPin className="w-3.5 h-3.5 text-brand" />
                <span>Pickup: 30 Clem Rd, Ifako-Ijaiye</span>
              </>
            ) : (
              <>
                <Truck className="w-3.5 h-3.5 text-brand" />
                <span>Home Delivery (Same-day before 12pm / 24–48 hrs)</span>
              </>
            )}
          </span>
        </div>

        {order && (
          <div className="flex justify-between items-center text-sm font-bold text-text-main pt-2 border-t border-brand/20">
            <span>Total Paid</span>
            <span className="text-brand font-sans">{formatNaira(order.total_amount)}</span>
          </div>
        )}
      </div>

      {/* WhatsApp Fast Confirmation CTA */}
      <div className="pt-2 max-w-lg mx-auto space-y-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <MessageCircle className="w-5 h-5 fill-white text-transparent" />
          <span>Chat on WhatsApp to Track Order</span>
        </a>

        <Link
          href="/products"
          className="w-full py-3.5 px-6 bg-surface hover:bg-brand-light text-brand border border-brand/30 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 text-center">
      <Suspense fallback={<div className="p-12 text-center text-sm text-text-muted">Loading order details...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
