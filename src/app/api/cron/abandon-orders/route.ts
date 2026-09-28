import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { orderRepository } from '@/repositories';

export const dynamic = 'force-dynamic';

/**
 * Scheduled background job to automatically transition pending payments older than 30 minutes to 'abandoned'.
 *
 * Can be triggered via:
 * - Vercel Cron (`cron.json`)
 * - GitHub Actions
 * - Supabase pg_cron
 * - External monitoring webhook
 *
 * Security: Verifies `CRON_SECRET` or Bearer header if configured.
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const urlKey = req.nextUrl.searchParams.get('key');
      if (urlKey !== cronSecret) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized cron request.' },
          { status: 401 }
        );
      }
    }

    const minutesOld = parseInt(req.nextUrl.searchParams.get('minutes') || '30', 10);

    // Run safe abandonment transition
    const result = await orderRepository.markAbandonedOrders(minutesOld);

    // Invalidate Admin and Account caches if orders changed
    if (result.count > 0) {
      try {
        revalidatePath('/admin/orders');
        revalidatePath('/admin');
        revalidatePath('/admin/analytics');
        revalidatePath('/account');
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      message: `Processed abandoned payments. ${result.count} order(s) updated to 'abandoned'.`,
      abandonedCount: result.count,
      abandonedOrderIds: result.orderIds,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Cron Abandon Orders Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error processing abandoned orders.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
