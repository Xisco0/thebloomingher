import { NextRequest, NextResponse } from 'next/server';
import { cmsStore } from '@/lib/cms-store';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, newStock, delta } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    const product = cmsStore.getProductById(productId);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    let finalStock = 0;
    if (typeof newStock === 'number') {
      finalStock = newStock;
    } else if (typeof delta === 'number') {
      finalStock = product.stock_quantity + delta;
    }

    const updated = cmsStore.updateProductStock(productId, finalStock);
    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
