import { NextRequest, NextResponse } from 'next/server';
import { cmsService } from '@/services/cms.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;

    const faqs = await cmsService.getPublicFaqs(category);

    return NextResponse.json({
      success: true,
      count: faqs.length,
      faqs,
    });
  } catch (error: any) {
    console.error('Error fetching public FAQs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch public FAQs' },
      { status: 500 }
    );
  }
}
