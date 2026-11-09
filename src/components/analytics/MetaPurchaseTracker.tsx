'use client';

import { useEffect, useRef } from 'react';
import { Order } from '@/types';
import { trackMetaDualEvent } from '@/lib/meta/meta-pixel';

interface MetaPurchaseTrackerProps {
  order: Order;
}

export function MetaPurchaseTracker({ order }: MetaPurchaseTrackerProps) {
  const trackedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!order || trackedRef.current) return;

    // Check payment status: only track confirmed, successful payments
    const isPaid =
      order.payment_status === 'successful' ||
      order.payment_status === 'paid' ||
      order.order_status === 'processing' ||
      order.order_status === 'shipped' ||
      order.order_status === 'delivered';

    if (!isPaid) return;

    const storageKey = `meta_purchase_tracked_${order.order_number}`;

    // Prevent duplicate Purchase events when customer refreshes the confirmation page
    try {
      if (typeof window !== 'undefined' && window.sessionStorage.getItem(storageKey)) {
        return;
      }
    } catch {
      // Ignore storage errors
    }

    trackedRef.current = true;
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(storageKey, 'true');
      }
    } catch {
      // Ignore storage errors
    }

    // Split customer name into first and last name
    const nameParts = (order.customer_name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Deterministic deduplication ID shared identically with server CAPI
    const purchaseEventId = `purchase_${order.order_number}`;

    const contentIds = order.items.map(it => it.product_id);
    const contents = order.items.map(it => ({
      id: it.product_id,
      quantity: it.quantity,
      item_price: it.unit_price,
    }));
    const totalQuantity = order.items.reduce((acc, it) => acc + it.quantity, 0);

    trackMetaDualEvent({
      eventName: 'Purchase',
      eventId: purchaseEventId,
      customData: {
        currency: 'NGN',
        value: Number(order.total_amount),
        content_type: 'product',
        content_ids: contentIds,
        contents,
        num_items: totalQuantity,
        order_id: order.order_number,
      },
      userData: {
        email: order.customer_email || undefined,
        phone: order.customer_phone || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        city: order.shipping_address?.city || undefined,
        state: order.shipping_address?.state || undefined,
        country: 'ng',
        externalId: order.customer_id || order.customer_email || undefined,
      },
    });
  }, [order]);

  return null;
}
