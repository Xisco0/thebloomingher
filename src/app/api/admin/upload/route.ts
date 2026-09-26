import { NextRequest, NextResponse } from 'next/server';
import { r2Storage, UploadOptions } from '@/lib/storage/r2';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as UploadOptions['folder']) || 'uploads';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file was provided for upload.' },
        { status: 400 }
      );
    }

    // 1. Validate file format and size
    const validation = r2Storage.validateFile({
      size: file.size,
      type: file.type,
    });

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 422 }
      );
    }

    // 2. Read arrayBuffer and upload to R2
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await r2Storage.upload(buffer, {
      folder,
      filename: file.name,
      contentType: file.type,
    });

    return NextResponse.json({
      success: true,
      key: result.key,
      url: result.url,
      size: result.size,
      contentType: result.contentType,
      filename: file.name,
    });
  } catch (error: any) {
    console.error('[Upload to R2 Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An unexpected error occurred during image upload.',
      },
      { status: 500 }
    );
  }
}
