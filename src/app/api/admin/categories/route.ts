import { NextRequest, NextResponse } from 'next/server';
import { cmsStore } from '@/lib/cms-store';
import { Category } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = cmsStore.getCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const category: Category = {
      id: body.id || `cat-${body.slug || Date.now()}`,
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: body.description || '',
      image_url: body.image_url || '/images/logo.jpg',
      total_products: body.total_products || 0,
      display_order: body.display_order || 1,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
    };

    const saved = cmsStore.saveCategory(category);
    return NextResponse.json({ success: true, category: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
