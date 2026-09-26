import { NextRequest, NextResponse } from 'next/server';
import { recommendationService } from '@/services';
import { RecommendationContext } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const context = (searchParams.get('context') || 'homepage') as RecommendationContext;
    const productId = searchParams.get('productId') || undefined;
    const categoryIds = searchParams.get('categoryIds')?.split(',').filter(Boolean) || undefined;
    const userId = searchParams.get('userId') || undefined;
    const sessionId = searchParams.get('sessionId') || undefined;
    const limit = Number(searchParams.get('limit')) || 4;
    const exclude = searchParams.get('exclude')?.split(',').filter(Boolean) || undefined;

    // Special handler for recently-viewed context
    if (context === 'recently_viewed') {
      const productIds = searchParams.get('productIds')?.split(',').filter(Boolean) || [];
      const products = await recommendationService.getRecentlyViewed(productIds, limit);
      return NextResponse.json({
        success: true,
        recommendations: products.map(p => ({
          product: p,
          score: 100,
          reason: 'Recently viewed by you',
          algorithm: 'personalized_affinity',
        })),
        total: products.length,
      });
    }

    const recommendations = await recommendationService.getRecommendations({
      context,
      productId,
      categoryIds,
      userId,
      sessionId,
      limit,
      excludeProductIds: exclude,
    });

    return NextResponse.json({
      success: true,
      recommendations,
      total: recommendations.length,
    });
  } catch (error: any) {
    console.error('[Recommendations API Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
