import { NextRequest, NextResponse } from 'next/server';
import { cmsStore } from '@/lib/cms-store';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, newStock, delta } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    const product = cmsStore.getProductById(productId);
    let currentStock = product?.stock_quantity ?? 0;

    let finalStock = 0;
    if (typeof newStock === 'number') {
      finalStock = Math.max(0, newStock);
    } else if (typeof delta === 'number') {
      finalStock = Math.max(0, currentStock + delta);
    }

    // 1. Update memory store
    const updated = cmsStore.updateProductStock(productId, finalStock);

    // 2. Update Supabase inventory table
    try {
      await supabaseAdmin
        .from('inventory')
        .upsert(
          {
            product_id: productId,
            stock_quantity: finalStock,
            sku: product?.sku || `SKU-${productId}`,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'product_id' }
        );
    } catch (dbErr) {
      console.warn('[Admin Inventory PATCH] Supabase inventory update error:', dbErr);
    }

    return NextResponse.json({ success: true, product: updated || { id: productId, stock_quantity: finalStock } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

