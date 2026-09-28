import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cmsStore } from '@/lib/cms-store';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const duplicated = cmsStore.duplicateBanner(id);
    if (!duplicated) {
      return NextResponse.json(
        { success: false, error: 'Banner not found' },
        { status: 404 }
      );
    }

    // Insert duplicated banner in Supabase
    try {
      await supabaseAdmin.from('marketing_banners').upsert({
        id: duplicated.id,
        title: duplicated.title,
        highlighted_title: duplicated.highlighted_title || null,
        subtitle: duplicated.subtitle || null,
        badge_text: duplicated.badge_text || null,
        banner_type: duplicated.banner_type || 'custom',
        placement: duplicated.placement || 'homepage_hero',
        primary_cta: duplicated.primary_cta || null,
        secondary_cta: duplicated.secondary_cta || null,
        desktop_image_url: duplicated.desktop_image_url,
        mobile_image_url: duplicated.mobile_image_url || null,
        alt_text: duplicated.alt_text || null,
        priority_order: duplicated.priority_order || 1,
        status: duplicated.status || 'draft',
        internal_name: duplicated.internal_name || null,
        created_at: duplicated.created_at,
        updated_at: duplicated.updated_at,
      });
    } catch (dbErr) {
      console.warn('[Admin Banners Duplicate] Supabase duplicate error:', dbErr);
    }

    // Invalidate cache
    try {
      revalidatePath('/', 'layout');
    } catch (revErr) {
      console.warn('Cache revalidation notice:', revErr);
    }

    return NextResponse.json({ success: true, banner: duplicated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
