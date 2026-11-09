import { NextRequest, NextResponse } from 'next/server';
import { sendMetaCapiEvent, MetaCapiEventInput } from '@/lib/meta/meta-capi';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventName, eventId, eventSourceUrl, customData, userData } = body;

    if (!eventName || !eventId) {
      return NextResponse.json(
        { success: false, error: 'eventName and eventId are required' },
        { status: 400 }
      );
    }

    // Extract client IP and User Agent securely from request headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIpAddress = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : req.headers.get('x-real-ip') || null;

    const clientUserAgent = req.headers.get('user-agent') || null;

    // Cookie fallback for _fbp and _fbc
    const fbp = userData?.fbp || req.cookies.get('_fbp')?.value || null;
    const fbc = userData?.fbc || req.cookies.get('_fbc')?.value || null;

    const capiInput: MetaCapiEventInput = {
      eventName,
      eventId,
      eventSourceUrl: eventSourceUrl || req.headers.get('referer') || undefined,
      userData: {
        ...(userData || {}),
        clientIpAddress,
        clientUserAgent,
        fbp,
        fbc,
      },
      customData: customData || {},
      actionSource: 'website',
    };

    const result = await sendMetaCapiEvent(capiInput);

    return NextResponse.json({
      success: result.success,
      skipped: result.skipped,
      error: result.error,
    });
  } catch (err: any) {
    console.error('[Meta CAPI Route Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal CAPI route error' },
      { status: 500 }
    );
  }
}
