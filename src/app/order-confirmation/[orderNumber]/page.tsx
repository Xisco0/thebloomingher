import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  Package,
  MapPin,
  Truck,
  MessageCircle,
  ShoppingBag,
  CreditCard,
  Building2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { orderService } from '@/services';
import { formatNaira } from '@/lib/utils/currency';
import { generateWhatsAppOrderLink } from '@/lib/utils/whatsapp';
import { STORE_PICKUP_LOCATION } from '@/lib/utils/nigeria-data';

interface OrderConfirmationPageProps {
  params: {
    orderNumber: string;
  };
  searchParams?: {
    status?: string;
    token?: string;
  };
}

export async function generateMetadata({ params }: OrderConfirmationPageProps): Promise<Metadata> {
  return {
    title: `Order Confirmation #${params.orderNumber} | TheBloomingHer`,
    description: `Order confirmation and delivery tracking for order #${params.orderNumber}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: OrderConfirmationPageProps) {
  const order = await orderService.getOrderByNumber(params.orderNumber);

  if (!order) {
    notFound();
  }

  const isPaid = order.payment_status === 'paid' || searchParams?.status === 'paid';
  const isFailed = order.payment_status === 'payment_failed';
  const isPickup = order.delivery_type === 'pickup';

  const whatsappUrl = generateWhatsAppOrderLink(
    `Order #${order.order_number} (${order.customer_name}) - ${isPaid ? 'Payment Verified' : 'Confirm Payment'}`,
    order.total_amount
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Header Status Card */}
      <div className="bg-surface rounded-3xl p-6 sm:p-10 border border-border/80 shadow-subtle text-center space-y-4 mb-8">
        {isPaid ? (
          <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        ) : isFailed ? (
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-10 h-10" />
          </div>
        ) : (
          <div className="w-20 h-20 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <Clock className="w-10 h-10" />
          </div>
        )}

        <div>
          <span className="text-xs uppercase tracking-wider text-brand font-bold block mb-1">
            {isPaid ? 'Payment Confirmed & Verified' : isFailed ? 'Payment Failed' : 'Order Received'}
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            {isPaid
              ? `Thank you for your order, ${order.customer_name.split(' ')[0]}!`
              : isFailed
              ? 'Payment Could Not Be Completed'
              : `Order Placed: #${order.order_number}`}
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1.5 max-w-md mx-auto">
            Order Reference:{' '}
            <strong className="text-brand font-mono font-bold text-sm sm:text-base">
              {order.order_number}
            </strong>
          </p>
        </div>

        {/* Dynamic Status Badge */}
        <div className="pt-1">
          {isPaid ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Payment Verified via Paystack • Fulfilment in Progress</span>
            </span>
          ) : isFailed ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-800 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Payment Unsuccessful • Order not charged</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Awaiting Payment / Bank Transfer Verification</span>
            </span>
          )}
        </div>
      </div>

      {/* Direct Bank Transfer Instructions (If payment pending) */}
      {!isPaid && !isFailed && (
        <div className="bg-brand-light/50 rounded-3xl p-6 sm:p-8 border border-brand/20 space-y-4 mb-8">
          <div className="flex items-center gap-2 font-bold text-base text-brand">
            <Building2 className="w-5 h-5 text-brand" />
            <span>Direct Bank Transfer Payment Instructions</span>
          </div>
          <p className="text-xs sm:text-sm text-text-body leading-relaxed">
            Please transfer exactly{' '}
            <strong className="text-brand text-sm sm:text-base font-sans font-bold">
              {formatNaira(order.total_amount)}
            </strong>{' '}
            to our verified account below and send proof of payment on WhatsApp:
          </p>
          <div className="bg-surface rounded-2xl p-4 border border-border space-y-1.5 text-xs sm:text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-text-muted">Bank Name:</span>
              <span className="font-bold text-text-main">Zenith Bank / GTBank</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Account Name:</span>
              <span className="font-bold text-text-main">TheBloomingHer Care & Wellness</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Account Number:</span>
              <span className="font-bold text-brand text-base">1018273948</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border">
              <span className="text-text-muted">Reference / Narration:</span>
              <span className="font-bold text-brand">{order.order_number}</span>
            </div>
          </div>
        </div>
      )}

      {/* Failed Payment Action Bar */}
      {isFailed && (
        <div className="bg-red-50 rounded-3xl p-6 border border-red-200 text-center space-y-3 mb-8">
          <p className="text-xs sm:text-sm text-red-800">
            You can retry paying for this order with a different card or instant bank transfer.
          </p>
          <Link
            href="/checkout"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-hover text-white rounded-full font-semibold text-xs sm:text-sm transition-colors shadow-sm"
          >
            <span>Try Payment Again</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 2-Column Details Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-8">
        {/* Left: Delivery & Concierge Support (5 Cols) */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-surface rounded-3xl p-6 border border-border/80 shadow-subtle space-y-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60 font-bold text-text-main">
              {isPickup ? (
                <>
                  <MapPin className="w-4 h-4 text-brand" />
                  <span>Store Pickup Location</span>
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4 text-brand" />
                  <span>Delivery Destination</span>
                </>
              )}
            </div>

            {isPickup ? (
              <div className="space-y-1 text-text-body">
                <p className="font-semibold text-text-main">{STORE_PICKUP_LOCATION.name}</p>
                <p>{STORE_PICKUP_LOCATION.address}</p>
                <p>{STORE_PICKUP_LOCATION.city}, {STORE_PICKUP_LOCATION.state}</p>
                <p className="text-xs text-text-muted pt-1">Pickup Hours: {STORE_PICKUP_LOCATION.hours}</p>
              </div>
            ) : (
              <div className="space-y-1 text-text-body">
                <p className="font-semibold text-text-main">{order.shipping_address.fullName}</p>
                <p>{order.shipping_address.street}</p>
                <p>
                  {order.shipping_address.lga ? `${order.shipping_address.lga}, ` : ''}
                  {order.shipping_address.state}, {order.shipping_address.country}
                </p>
                {order.shipping_address.phone && (
                  <p className="text-xs text-text-muted pt-1">Recipient Phone: {order.shipping_address.phone}</p>
                )}
              </div>
            )}
          </div>

          {/* WhatsApp Support Box */}
          <div className="bg-surface rounded-3xl p-6 border border-border/80 shadow-subtle space-y-3 text-xs sm:text-sm">
            <h3 className="font-bold text-text-main">Need Help With Your Order?</h3>
            <p className="text-text-muted text-xs leading-relaxed">
              Chat directly with our Lagos support team on WhatsApp for fast answers, delivery updates, or bank transfer verification.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-full font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-white text-transparent" />
              <span>Chat with Us on WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Right: Ordered Items (7 Cols) */}
        <div className="md:col-span-7 bg-surface rounded-3xl p-6 sm:p-8 border border-border/80 shadow-subtle space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <h3 className="font-display font-bold text-base text-text-main flex items-center gap-2">
              <Package className="w-4 h-4 text-brand" />
              <span>Items in this Order ({order.items.length})</span>
            </h3>
          </div>

          {/* Items List */}
          <div className="divide-y divide-border/60 space-y-3">
            {order.items.map(item => (
              <div key={item.id || item.product_id} className="flex items-center gap-3 pt-3 first:pt-0">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-surface-muted border border-border flex-shrink-0">
                  <Image
                    src={item.image_url || 'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789332798/uxz1r1aohkuxqqxxcw9x.jpg'}
                    alt={item.product_name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs sm:text-sm text-text-main truncate">
                    {item.product_name}
                  </h4>
                  {item.sku && (
                    <p className="text-[10px] text-text-muted font-mono">SKU: {item.sku}</p>
                  )}
                  <p className="text-xs text-text-muted">
                    Qty: {item.quantity} × {formatNaira(item.unit_price)}
                  </p>
                </div>

                <span className="font-bold text-xs sm:text-sm text-brand font-sans">
                  {formatNaira(item.total_price)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals Breakdown */}
          <div className="space-y-2 pt-4 border-t border-border/60 text-xs sm:text-sm">
            <div className="flex justify-between text-text-body">
              <span>Items Subtotal</span>
              <span className="font-semibold font-sans">{formatNaira(order.subtotal_amount)}</span>
            </div>

            <div className="flex justify-between text-text-body">
              <span>Delivery Fee ({isPickup ? 'Store Pickup' : order.shipping_address.state})</span>
              <span className="font-semibold font-sans">
                {order.delivery_fee === 0 ? (
                  <span className="text-emerald-700 font-bold uppercase text-xs">Free</span>
                ) : (
                  formatNaira(order.delivery_fee)
                )}
              </span>
            </div>

            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount Applied</span>
                <span className="font-sans">-{formatNaira(order.discount_amount)}</span>
              </div>
            )}

            <div className="pt-3 border-t border-border flex justify-between items-baseline">
              <span className="font-display font-bold text-base text-text-main">
                Total Amount
              </span>
              <span className="font-display font-bold text-xl text-brand font-sans">
                {formatNaira(order.total_amount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Shopping Button */}
      <div className="text-center pt-4">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand hover:bg-brand-hover text-white rounded-full font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-95"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>
    </div>
  );
}
