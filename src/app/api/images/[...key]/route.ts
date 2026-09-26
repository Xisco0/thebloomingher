import { NextRequest, NextResponse } from 'next/server';
import { r2Storage } from '@/lib/storage/r2';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string[] } }
) {
  try {
    const key = (params.key || []).join('/');

    if (!key) {
      return NextResponse.json({ error: 'Missing image key' }, { status: 400 });
    }

    const object = await r2Storage.getObject(key);

    if (!object || !object.body) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Convert AWS SDK Stream to web Response
    const stream = object.body as any;

    const headers = new Headers();
    headers.set('Content-Type', object.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    if (object.contentLength) {
      headers.set('Content-Length', object.contentLength.toString());
    }
    if (object.eTag) {
      headers.set('ETag', object.eTag);
    }

    return new Response(stream.transformToWebStream ? stream.transformToWebStream() : stream, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('[R2 Image Proxy Error]:', error);
    return NextResponse.json({ error: 'Failed to retrieve image' }, { status: 500 });
  }
}
