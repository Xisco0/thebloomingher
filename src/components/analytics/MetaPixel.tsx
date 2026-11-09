'use client';

import React, { useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { trackMetaDualEvent, generateEventId } from '@/lib/meta/meta-pixel';
import { analytics } from '@/lib/analytics/events';

interface MetaPixelInnerProps {
  pixelId: string;
}

function MetaPixelInner({ pixelId }: MetaPixelInnerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedUrl = useRef<string | null>(null);
  const isInitialized = useRef<boolean>(false);
  const lastAtcTime = useRef<number>(0);
  const lastAtcProductId = useRef<string>('');
  const lastVcProductId = useRef<string>('');
  const lastVcTime = useRef<number>(0);

  // Single-Page Application (SPA) Route Change & Initial PageView Tracking
  useEffect(() => {
    if (!pixelId) return;

    const queryString = searchParams?.toString();
    const currentUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // Prevent duplicate PageView events on the same URL
    if (lastTrackedUrl.current === currentUrl) {
      return;
    }

    lastTrackedUrl.current = currentUrl;
    const eventId = generateEventId('pv');

    // Dual-track PageView to browser Pixel and Conversions API with identical eventID
    trackMetaDualEvent({
      eventName: 'PageView',
      eventId,
    });
  }, [pathname, searchParams, pixelId]);

  // Connect Meta Pixel to existing application analytics events
  useEffect(() => {
    if (isInitialized.current || !pixelId) return;
    isInitialized.current = true;

    // Register adapter for seamless e-commerce tracking across the store
    analytics.registerAdapter({
      track: (event, payload) => {
        try {
          const now = Date.now();

          if (event === 'product_view') {
            const price = Number(payload.productPrice || payload.price || 0);
            const productId = String(payload.productId || payload.id || '');

            // 500ms duplicate guard for product view
            if (productId && productId === lastVcProductId.current && now - lastVcTime.current < 500) {
              return;
            }
            lastVcProductId.current = productId;
            lastVcTime.current = now;

            const eventId = generateEventId('vc');

            trackMetaDualEvent({
              eventName: 'ViewContent',
              eventId,
              customData: {
                content_name: payload.productName || payload.name,
                content_category: payload.categoryName || payload.category,
                content_ids: productId ? [productId] : undefined,
                content_type: 'product',
                value: price > 0 ? price : undefined,
                currency: 'NGN',
                contents: productId ? [{ id: productId, quantity: 1, item_price: price }] : undefined,
              },
            });
          } else if (event === 'add_to_cart' || event === 'buy_now') {
            const price = Number(payload.productPrice || payload.unitPrice || payload.price || 0);
            const quantity = Number(payload.quantity || 1);
            const productId = String(payload.productId || payload.id || '');

            // 500ms duplicate click guard for add to cart
            if (productId && productId === lastAtcProductId.current && now - lastAtcTime.current < 500) {
              return;
            }
            lastAtcProductId.current = productId;
            lastAtcTime.current = now;

            const eventId = generateEventId('atc');

            trackMetaDualEvent({
              eventName: 'AddToCart',
              eventId,
              customData: {
                content_name: payload.productName || payload.name,
                content_category: payload.categoryName,
                content_ids: productId ? [productId] : undefined,
                content_type: 'product',
                value: price * quantity,
                currency: 'NGN',
                num_items: quantity,
                contents: productId ? [{ id: productId, quantity, item_price: price }] : undefined,
              },
            });
          } else if (event === 'begin_checkout') {
            const eventId = generateEventId('ic');
            const subtotal = Number(payload.subtotal || 0);
            const itemCount = Number(payload.itemCount || 1);

            trackMetaDualEvent({
              eventName: 'InitiateCheckout',
              eventId,
              customData: {
                value: subtotal > 0 ? subtotal : undefined,
                currency: 'NGN',
                num_items: itemCount,
                content_type: 'product',
              },
            });
          } else if (event === 'order_created') {
            const eventId = generateEventId('api');
            const total = Number(payload.totalAmount || 0);

            trackMetaDualEvent({
              eventName: 'AddPaymentInfo',
              eventId,
              customData: {
                value: total > 0 ? total : undefined,
                currency: 'NGN',
                content_type: 'product',
                order_id: payload.orderNumber,
              },
            });
          }
        } catch (err) {
          console.warn('[Meta Analytics Adapter Notice]:', err);
        }
      },
    });
  }, [pixelId]);

  return null;
}

export function MetaPixel() {
  const pixelId = (
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    process.env.META_PIXEL_ID ||
    ''
  ).trim();

  if (!pixelId) {
    return null;
  }

  return (
    <>
      {/* Official Meta Pixel Base Code (Loaded once globally) */}
      <Script
        id="meta-pixel-base"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>

      <Suspense fallback={null}>
        <MetaPixelInner pixelId={pixelId} />
      </Suspense>
    </>
  );
}
