import { NextRequest, NextResponse } from 'next/server';
import { r2Storage } from '@/lib/storage/r2';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, url } = body;

    const targetKeyOrUrl = key || url;
    if (!targetKeyOrUrl) {
      return NextResponse.json(
        { success: false, error: 'Key or URL is required for deletion.' },
        { status: 400 }
      );
    }

    const deleted = await r2Storage.delete(targetKeyOrUrl);

    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Image successfully removed from R2.' : 'Failed to remove image.',
    });
  } catch (error: any) {
    console.error('[Delete from R2 Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete image.' },
      { status: 500 }
    );
  }
}
