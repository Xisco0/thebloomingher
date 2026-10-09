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
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { orderService } from '@/services';
import { formatNaira } from '@/lib/utils/currency';
import { generateWhatsAppOrderLink } from '@/lib/utils/whatsapp';
import { STORE_PICKUP_LOCATION } from '@/lib/utils/nigeria-data';
import ClearCartHandler from '../ClearCartHandler';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  let order = await orderService.getOrderByNumber(params.orderNumber);
  if (!order) {
    order = await orderService.getOrderById(params.orderNumber);
  }
  if (!order) {
    order = await orderService.getOrderByReference(params.orderNumber);
  }

  if (!order) {
    notFound();
  }

  const isPaid = order.payment_status === 'paid' || searchParams?.status === 'paid';
  const isFailed = order.payment_status === 'payment_failed';
  const isPickup = order.delivery_type === 'pickup';
  const orderStatus = (order.order_status || 'pending').toLowerCase();
  const paymentProviderName = order.payment_provider === 'paystack' ? 'Paystack' : 'Flutterwave';

  // Dynamic status details matching exact backend fulfillment state
  let headerTitle = `Order Placed: #${order.order_number}`;
  let headerSubtitle = 'Order Received';
  let badgeText = 'Awaiting Payment / Bank Transfer Verification';
  let badgeColor = 'bg-amber-50 border-amber-200 text-amber-900';
  let IconComponent = Clock;
  let iconBgColor = 'bg-amber-100 text-amber-700';

  if (isFailed) {
    headerTitle = 'Payment Could Not Be Completed';
    headerSubtitle = 'Payment Failed';
    badgeText = 'Payment Unsuccessful • Order not charged';
    badgeColor = 'bg-red-50 border-red-200 text-red-800';
    IconComponent = AlertTriangle;
    iconBgColor = 'bg-red-100 text-red-600';
  } else if (orderStatus === 'delivered') {
    headerTitle = isPickup
      ? `Order Picked Up, ${order.customer_name.split(' ')[0]}!`
      : `Order Delivered, ${order.customer_name.split(' ')[0]}!`;
    headerSubtitle = isPickup ? 'Order Picked Up at Store' : 'Order Delivered Successfully';
    badgeText = isPickup
      ? `Picked Up at Store • Payment Verified via ${paymentProviderName}`
      : `Delivered to Destination • Payment Verified via ${paymentProviderName}`;
    badgeColor = 'bg-emerald-50 border-emerald-200 text-emerald-800';
    IconComponent = CheckCircle2;
    iconBgColor = 'bg-emerald-100 text-emerald-700';
  } else if (orderStatus === 'shipped') {
    headerTitle = isPickup
      ? `Order Ready for Pickup, ${order.customer_name.split(' ')[0]}!`
      : `Order Dispatched, ${order.customer_name.split(' ')[0]}!`;
    headerSubtitle = isPickup ? 'Ready for Store Pickup' : 'Dispatched / Out for Delivery';
    badgeText = isPickup
      ? `Ready for Store Pickup • Payment Verified via ${paymentProviderName}`
      : `Dispatched / In Transit • Payment Verified via ${paymentProviderName}`;
    badgeColor = 'bg-blue-50 border-blue-200 text-blue-800';
    IconComponent = Truck;
    iconBgColor = 'bg-blue-100 text-blue-700';
  } else if (orderStatus === 'processing' || isPaid) {
    headerTitle = `Thank you for your order, ${order.customer_name.split(' ')[0]}!`;
    headerSubtitle = 'Payment Confirmed & Verified';
    badgeText = `Payment Verified via ${paymentProviderName} • Packaging & Processing Order`;
    badgeColor = 'bg-emerald-50 border-emerald-200 text-emerald-800';
    IconComponent = CheckCircle2;
    iconBgColor = 'bg-emerald-100 text-emerald-700';
  } else if (orderStatus === 'cancelled') {
    headerTitle = `Order Cancelled: #${order.order_number}`;
    headerSubtitle = 'Order Cancelled';
    badgeText = 'Order Cancelled';
    badgeColor = 'bg-rose-50 border-rose-200 text-rose-800';
    IconComponent = AlertTriangle;
    iconBgColor = 'bg-rose-100 text-rose-600';
  }

  const whatsappUrl = generateWhatsAppOrderLink(
    `Order #${order.order_number} (${order.customer_name}) - Status: ${order.order_status?.toUpperCase() || 'PENDING'}`,
    order.total_amount
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <ClearCartHandler />
      {/* Header Status Card */}
      <div className="bg-surface rounded-3xl p-6 sm:p-10 border border-border/80 shadow-subtle text-center space-y-4 mb-8">
        <div className={`w-20 h-20 ${iconBgColor} rounded-full flex items-center justify-center mx-auto shadow-xs`}>
          <IconComponent className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs uppercase tracking-wider text-brand font-bold block mb-1">
            {headerSubtitle}
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-text-main">
            {headerTitle}
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
          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-xs font-semibold ${badgeColor}`}>
            <IconComponent className="w-4 h-4" />
            <span>{badgeText}</span>
          </span>
        </div>

        {/* Fulfillment Stage Progress Bar (for active orders) */}
        {orderStatus !== 'cancelled' && !isFailed && (
          <div className="pt-6 border-t border-border/60 max-w-2xl mx-auto">
            <div className="grid grid-cols-4 gap-2 text-center">
              {/* Step 1: Placed */}
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xs font-bold shadow-xs">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-[11px] font-semibold text-text-main">Order Placed</p>
              </div>

              {/* Step 2: Payment */}
              <div className="space-y-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold shadow-xs ${
                  isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {isPaid ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <p className={`text-[11px] font-semibold ${isPaid ? 'text-text-main' : 'text-text-muted'}`}>
                  {isPaid ? 'Payment Confirmed' : 'Payment Pending'}
                </p>
              </div>

              {/* Step 3: Packing / Processing */}
              <div className="space-y-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold shadow-xs ${
                  orderStatus === 'delivered' || orderStatus === 'shipped'
                    ? 'bg-emerald-100 text-emerald-700'
                    : orderStatus === 'processing' || isPaid
                    ? 'bg-blue-100 text-blue-700 animate-pulse'
                    : 'bg-surface-muted text-text-muted border border-border'
                }`}>
                  {orderStatus === 'delivered' || orderStatus === 'shipped' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Package className="w-4 h-4" />
                  )}
                </div>
                <p className={`text-[11px] font-semibold ${
                  orderStatus === 'processing' || orderStatus === 'shipped' || orderStatus === 'delivered' || isPaid
                    ? 'text-text-main'
                    : 'text-text-muted'
                }`}>
                  {isPickup ? 'Store Preparing' : 'Packaging'}
                </p>
              </div>

              {/* Step 4: Dispatched / Delivered */}
              <div className="space-y-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold shadow-xs ${
                  orderStatus === 'delivered'
                    ? 'bg-emerald-100 text-emerald-700'
                    : orderStatus === 'shipped'
                    ? 'bg-blue-100 text-blue-700 animate-pulse'
                    : 'bg-surface-muted text-text-muted border border-border'
                }`}>
                  {orderStatus === 'delivered' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isPickup ? (
                    <MapPin className="w-4 h-4" />
                  ) : (
                    <Truck className="w-4 h-4" />
                  )}
                </div>
                <p className={`text-[11px] font-semibold ${
                  orderStatus === 'delivered'
                    ? 'text-emerald-700 font-bold'
                    : orderStatus === 'shipped'
                    ? 'text-blue-700 font-bold'
                    : 'text-text-muted'
                }`}>
                  {orderStatus === 'delivered'
                    ? isPickup ? 'Picked Up' : 'Delivered'
                    : orderStatus === 'shipped'
                    ? isPickup ? 'Ready for Pickup' : 'Dispatched'
                    : isPickup ? 'Pickup' : 'Delivery'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pending Payment Notice (If payment pending) */}
      {!isPaid && !isFailed && (
        <div className="bg-amber-50/80 rounded-3xl p-6 sm:p-8 border border-amber-200/80 space-y-3 mb-8 text-center">
          <div className="flex items-center justify-center gap-2 font-bold text-base text-amber-900">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>Awaiting Payment Confirmation</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-800 max-w-lg mx-auto leading-relaxed">
            Your order has been recorded. If you just initiated payment through Flutterwave, our system will automatically confirm it within a few moments.
          </p>
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
