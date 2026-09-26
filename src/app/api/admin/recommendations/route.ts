import { NextRequest, NextResponse } from 'next/server';
import { recommendationService } from '@/services';
import { orderRepository } from '@/repositories';
import { cmsStore } from '@/lib/cms-store';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId') || undefined;

    // Recalculate co-purchases from live orders
    const orders = await orderRepository.getAllOrders();
    cmsStore.recalculateCoPurchasesFromOrders(orders);

    const [relationships, coPurchases, metrics] = await Promise.all([
      recommendationService.getProductRelationships(productId),
      recommendationService.getCoPurchases(20),
      recommendationService.getRecommendationMetrics(),
    ]);

    return NextResponse.json({
      success: true,
      relationships,
      coPurchases,
      metrics,
    });
  } catch (error: any) {
    console.error('[Admin Recommendations GET Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source_product_id, target_product_id, relationship_type, priority_weight, is_active } = body;

    if (!source_product_id || !target_product_id || !relationship_type) {
      return NextResponse.json(
        { success: false, error: 'source_product_id, target_product_id and relationship_type are required' },
        { status: 400 }
      );
    }

    if (source_product_id === target_product_id) {
      return NextResponse.json(
        { success: false, error: 'A product cannot have a recommendation relationship with itself' },
        { status: 400 }
      );
    }

    const saved = await recommendationService.saveProductRelationship({
      id: body.id,
      source_product_id,
      target_product_id,
      relationship_type,
      priority_weight: Number(priority_weight) || 50,
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      is_manual: true,
    });

    return NextResponse.json({ success: true, relationship: saved });
  } catch (error: any) {
    console.error('[Admin Recommendations POST Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Relationship ID required' }, { status: 400 });
    }

    await recommendationService.deleteProductRelationship(id);
    return NextResponse.json({ success: true, message: 'Relationship deleted' });
  } catch (error: any) {
    console.error('[Admin Recommendations DELETE Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
